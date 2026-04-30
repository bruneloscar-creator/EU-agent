import Anthropic from "@anthropic-ai/sdk";

import { buildSystemPrompt, type ChatMode } from "@/lib/agent/prompts";
import {
  runSearchLegislation,
  searchLegislationTool,
  type SearchLegislationInput
} from "@/lib/agent/search-tool";
import { resolveCitations } from "@/lib/agent/citations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ClientMessage = {
  role: "user" | "assistant";
  content: string;
};

const MODEL = "claude-sonnet-4-5";
const MAX_TOOL_CALLS = 8;

function sse(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function normalizeMessages(messages: ClientMessage[]) {
  const clean = messages
    .filter(
      (message) =>
        (message.role === "user" || message.role === "assistant") &&
        message.content.trim()
    )
    .slice(-20);

  if (messages.length > clean.length) {
    return [
      {
        role: "user" as const,
        content: "[earlier conversation truncated]"
      },
      ...clean
    ];
  }

  return clean;
}

function latestUserMessage(messages: ClientMessage[]) {
  return [...messages].reverse().find((message) => message.role === "user")
    ?.content;
}

function toAnthropicMessages(messages: ClientMessage[]) {
  return messages.map((message) => ({
    role: message.role,
    content: message.content
  }));
}

function parseToolInput(input: unknown): SearchLegislationInput {
  if (!input || typeof input !== "object") {
    return { query: "" };
  }

  const value = input as Partial<SearchLegislationInput>;
  return {
    query: typeof value.query === "string" ? value.query : "",
    filter_doc: typeof value.filter_doc === "string" ? value.filter_doc : undefined,
    k: typeof value.k === "number" ? value.k : undefined
  };
}

function compactDocs(results: Awaited<ReturnType<typeof runSearchLegislation>>) {
  return Array.from(new Set(results.map((result) => result.doc_short_name)));
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        error:
          "ANTHROPIC_API_KEY is missing. Add it to .env.local to enable streamed agent answers."
      },
      { status: 500 }
    );
  }

  const body = (await request.json()) as {
    messages?: ClientMessage[];
    mode?: ChatMode;
  };
  const mode = body.mode === "Pro" ? "Pro" : "Explainer";
  const clientMessages = normalizeMessages(body.messages ?? []);
  const userText = latestUserMessage(clientMessages);

  if (!userText) {
    return Response.json({ error: "Missing user message." }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey });
  const encoder = new TextEncoder();
  const system = buildSystemPrompt(mode);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sse(event, data)));
      };

      let assistantText = "";
      let toolCallCount = 0;
      let messages: any[] = toAnthropicMessages(clientMessages);
      const retrievedSources = new Map<string, unknown>();

      async function executeSearch(input: SearchLegislationInput) {
        const query = input.query.trim();
        if (!query) {
          return [];
        }

        send("tool-start", {
          name: "search_legislation",
          query,
          filter_doc: input.filter_doc,
          k: input.k ?? 5
        });

        const results = await runSearchLegislation(input);
        results.forEach((result) => retrievedSources.set(result.chunk_id, result));
        send("tool-result", {
          name: "search_legislation",
          query,
          count: results.length,
          docs: compactDocs(results),
          results
        });
        return results;
      }

      try {
        for (let round = 0; round < MAX_TOOL_CALLS; round += 1) {
          const response: any = await anthropic.messages.create({
            model: MODEL,
            max_tokens: 1024,
            temperature: 0.2,
            system,
            messages,
            tools: [searchLegislationTool]
          });

          const toolUses = response.content.filter(
            (block: any) => block.type === "tool_use"
          );

          if (toolUses.length === 0) {
            if (toolCallCount === 0) {
              const fallbackResults = await executeSearch({
                query: userText,
                k: 8
              });
              toolCallCount += 1;
              messages.push({
                role: "user",
                content: `Retrieved source passages for the user's question:\n${JSON.stringify(
                  fallbackResults
                )}`
              });
            }
            break;
          }

          messages.push({
            role: "assistant",
            content: response.content
          });

          const toolResults = [];
          for (const toolUse of toolUses) {
            if (toolCallCount >= MAX_TOOL_CALLS) {
              throw new Error(
                "I needed to dig further than I expected for this question. Try breaking it into a more focused query — for example, ask about one regulation at a time, or one specific provision."
              );
            }

            const input = parseToolInput(toolUse.input);
            const results = await executeSearch(input);
            toolCallCount += 1;
            toolResults.push({
              type: "tool_result",
              tool_use_id: toolUse.id,
              content: JSON.stringify(results)
            });
          }

          messages.push({
            role: "user",
            content: toolResults
          });
        }

        const finalStream: any = await anthropic.messages.create({
          model: MODEL,
          max_tokens: 2048,
          temperature: mode === "Pro" ? 0.15 : 0.25,
          system: `${system}

You have already retrieved source passages above. Now answer the user's latest question using only those retrieved passages. Stream a complete answer with inline clickable citation text in square brackets.`,
          messages,
          stream: true
        });

        for await (const event of finalStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta?.type === "text_delta"
          ) {
            assistantText += event.delta.text;
            send("text", { text: event.delta.text });
          }
        }

        const citationResults = await resolveCitations(assistantText);
        send("meta", {
          sources: Array.from(retrievedSources.values()),
          tool_calls: toolCallCount,
          citation_resolution: {
            total: citationResults.length,
            resolved: citationResults.filter((result) => result.chunk).length,
            unresolved: citationResults
              .filter((result) => !result.chunk)
              .map((result) => `${result.doc}, ${result.ref}`)
          }
        });
        send("done", {});
        controller.close();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "The agent failed while generating an answer.";
        send("error", { error: message });
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
