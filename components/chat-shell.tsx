"use client";

import { ExternalLink, Search, Send, SquarePen, X } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { exampleQuestions } from "@/lib/content";
import type { Chunk } from "@/lib/retrieval/types";
import { cn } from "@/lib/utils";

type Mode = "Pro" | "Explainer";

type ExampleQuestion = (typeof exampleQuestions)[number];

type ToolEvent = {
  id: string;
  query: string;
  filter_doc?: string;
  status: "searching" | "done";
  count?: number;
  docs?: string[];
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  tools?: ToolEvent[];
  error?: string;
  meta?: {
    tool_calls?: number;
    citation_resolution?: {
      total: number;
      resolved: number;
      unresolved: string[];
    };
  };
};

type CitationRequest = {
  doc: string;
  ref: string;
  label: string;
};

const modeDetails = {
  Pro: "Terse, technical, citation-heavy",
  Explainer: "Plain-English, contextual, accessible"
} satisfies Record<Mode, string>;

function newId() {
  return crypto.randomUUID();
}

function citationMarkdown(text: string) {
  const pattern =
    /\[([A-Z][A-Za-z0-9 &.'’()/-]+,\s*(?:(?:Art\.|Article)\s*[0-9]+[a-z]?(?:\([^)]+\))*|Annex\s*[A-Za-z0-9IVXLCDM .-]+|Recital\s*[0-9]+[a-z]?|Section\s*[^\]]+))\]/g;

  return text.replace(pattern, (_full, inner: string) => {
    const [doc, ...rest] = inner.split(",");
    const ref = rest.join(",").trim();
    const href = `lexcite://citation?doc=${encodeURIComponent(
      doc.trim()
    )}&ref=${encodeURIComponent(ref)}`;
    return `[${inner}](${href})`;
  });
}

function parseCitationHref(href: string, label: string): CitationRequest | null {
  if (!href.startsWith("lexcite://citation")) {
    return null;
  }

  const url = new URL(href);
  const doc = url.searchParams.get("doc");
  const ref = url.searchParams.get("ref");

  if (!doc || !ref) {
    return null;
  }

  return { doc, ref, label };
}

function SseMarkdown({
  content,
  onCitation
}: {
  content: string;
  onCitation: (request: CitationRequest) => void;
}) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ href = "", children }) => {
          const label = String(children);
          const citation = parseCitationHref(href, label);

          if (citation) {
            return (
              <button
                type="button"
                onClick={() => onCitation(citation)}
                className="mx-0.5 rounded bg-primary/10 px-1.5 py-0.5 font-medium text-primary transition-colors hover:bg-primary/15"
              >
                {children}
              </button>
            );
          }

          return (
            <a
              href={href}
              className="text-primary underline underline-offset-4"
              target="_blank"
              rel="noreferrer"
            >
              {children}
            </a>
          );
        },
        p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
        ul: ({ children }) => (
          <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">
            {children}
          </ol>
        ),
        h2: ({ children }) => (
          <h2 className="mb-2 mt-4 text-base font-semibold first:mt-0">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-2 mt-3 text-sm font-semibold first:mt-0">
            {children}
          </h3>
        )
      }}
    >
      {citationMarkdown(content)}
    </ReactMarkdown>
  );
}

function SourcePanel({
  request,
  onClose
}: {
  request: CitationRequest | null;
  onClose: () => void;
}) {
  const [chunk, setChunk] = useState<Chunk | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!request) {
      setChunk(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setChunk(null);

    fetch(
      `/api/chunk?doc=${encodeURIComponent(request.doc)}&ref=${encodeURIComponent(
        request.ref
      )}`
    )
      .then(async (response) => {
        const payload = (await response.json()) as {
          chunk?: Chunk | null;
          message?: string;
        };

        if (!response.ok || !payload.chunk) {
          throw new Error(payload.message ?? "Source not found.");
        }

        if (!cancelled) {
          setChunk(payload.chunk);
        }
      })
      .catch((fetchError) => {
        if (!cancelled) {
          setError(
            fetchError instanceof Error ? fetchError.message : "Source not found."
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [request]);

  return (
    <aside
      className={cn(
        "fixed bottom-0 right-0 top-0 z-30 w-full max-w-md border-l border-border bg-background shadow-lift transition-transform duration-200",
        request ? "translate-x-0" : "translate-x-full"
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-primary">
              Source
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {request?.label ?? "Citation"}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close source">
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {loading && (
            <p className="text-sm text-muted-foreground">Loading source...</p>
          )}

          {error && (
            <div className="rounded-md border border-border bg-secondary/60 p-4 text-sm text-muted-foreground">
              {error}
              {request && (
                <a
                  className="mt-3 block font-medium text-primary"
                  href={`https://eur-lex.europa.eu/search.html?text=${encodeURIComponent(
                    `${request.doc} ${request.ref}`
                  )}&scope=EURLEX&type=quick&qid=0`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Search EUR-Lex directly <ExternalLink className="ml-1 inline h-3 w-3" />
                </a>
              )}
            </div>
          )}

          {chunk && (
            <div>
              <h2 className="font-serif text-2xl font-semibold leading-tight">
                {chunk.doc_short_name}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {chunk.doc_full_title}
              </p>
              <div className="mt-5 rounded-md border border-border bg-secondary/45 p-3">
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-primary">
                  {chunk.section_type} {chunk.section_number}
                </p>
                {chunk.section_title && (
                  <p className="mt-1 text-sm font-medium">{chunk.section_title}</p>
                )}
              </div>
              <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-foreground">
                {chunk.text}
              </p>
              <a
                href={chunk.source_url}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary"
              >
                Open on EUR-Lex <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export function ChatShell() {
  const [mode, setMode] = useState<Mode>("Explainer");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<CitationRequest | null>(
    null
  );
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("lex-eu-mode");
    if (stored === "Pro" || stored === "Explainer") {
      setMode(stored);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("lex-eu-mode", mode);
  }, [mode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.getElementById("chat-input")?.focus();
      }

      if ((event.metaKey || event.ctrlKey) && event.key === "/") {
        event.preventDefault();
        setMode((current) => (current === "Pro" ? "Explainer" : "Pro"));
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const historyForApi = useMemo(
    () =>
      messages
        .filter((message) => message.content.trim())
        .map((message) => ({
          role: message.role,
          content: message.content
        })),
    [messages]
  );

  async function submitMessage(event?: FormEvent<HTMLFormElement>, text?: string) {
    event?.preventDefault();
    const trimmed = (text ?? input).trim();

    if (!trimmed || isStreaming) {
      return;
    }

    const userMessage: ChatMessage = {
      id: newId(),
      role: "user",
      content: trimmed
    };
    const assistantId = newId();
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      tools: []
    };

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setInput("");
    setIsStreaming(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          messages: [
            ...historyForApi,
            { role: "user", content: trimmed }
          ].slice(-20)
        })
      });

      if (!response.ok || !response.body) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? `Chat failed with HTTP ${response.status}`);
      }

      await readSseStream(response.body, (event, payload) => {
        setMessages((current) =>
          current.map((message) => {
            if (message.id !== assistantId) {
              return message;
            }

            if (event === "text") {
              return {
                ...message,
                content: `${message.content}${payload.text ?? ""}`
              };
            }

            if (event === "tool-start") {
              const tool: ToolEvent = {
                id: `${payload.query}-${Date.now()}`,
                query: payload.query,
                filter_doc: payload.filter_doc,
                status: "searching"
              };
              return { ...message, tools: [...(message.tools ?? []), tool] };
            }

            if (event === "tool-result") {
              const tools = [...(message.tools ?? [])];
              const lastSearching = [...tools]
                .reverse()
                .find((tool) => tool.status === "searching");
              const updatedTools = tools.map((tool) =>
                tool.id === lastSearching?.id
                  ? {
                      ...tool,
                      status: "done" as const,
                      count: payload.count,
                      docs: payload.docs
                    }
                  : tool
              );
              return { ...message, tools: updatedTools };
            }

            if (event === "meta") {
              return { ...message, meta: payload };
            }

            if (event === "error") {
              return {
                ...message,
                error: payload.error ?? "The agent failed.",
                content:
                  message.content ||
                  "The agent could not complete this answer. Check the error below."
              };
            }

            return message;
          })
        );
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "The agent failed.";
      setMessages((current) =>
        current.map((item) =>
          item.id === assistantId
            ? {
                ...item,
                content:
                  "The agent could not complete this answer. Check the error below.",
                error: message
              }
            : item
        )
      );
    } finally {
      setIsStreaming(false);
    }
  }

  function resetConversation() {
    setMessages([]);
    setInput("");
    setSelectedCitation(null);
  }

  function submitExample(question: ExampleQuestion) {
    setMode(question.mode);
    void submitMessage(undefined, question.text);
  }

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto grid h-16 w-full max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-8">
          <Link
            href="/"
            className="font-serif text-2xl font-semibold text-foreground"
          >
            Lex EU
          </Link>

          <div
            className="flex rounded-md border border-border bg-secondary p-1"
            title={modeDetails[mode]}
            aria-label={`Mode: ${mode}. ${modeDetails[mode]}`}
          >
            {(["Pro", "Explainer"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMode(option)}
                title={modeDetails[option]}
                className={cn(
                  "h-8 rounded px-3 text-sm font-medium transition-colors",
                  mode === option
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {option}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="justify-self-end"
            onClick={resetConversation}
          >
            <SquarePen className="mr-2 h-4 w-4" aria-hidden="true" />
            New conversation
          </Button>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 pb-44 pt-10 sm:px-8">
        {messages.length === 0 ? (
          <div className="m-auto flex w-full max-w-4xl flex-col items-center text-center">
            <p className="font-serif text-3xl font-semibold text-foreground sm:text-4xl">
              Ask anything about EU legislation.
            </p>
            <div className="mt-8 grid w-full gap-3 md:grid-cols-2">
              {exampleQuestions.map((question) => (
                <button
                  key={question.text}
                  type="button"
                  onClick={() => submitExample(question)}
                  disabled={isStreaming}
                  className="block min-h-32 w-full rounded-lg border border-border bg-background p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lift disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="flex items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    <span>{question.domain}</span>
                    <span>{question.mode}</span>
                  </span>
                  <span className="mt-3 block text-sm leading-6 text-foreground sm:text-base">
                    {question.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[90%] rounded-lg border px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[76%]",
                    message.role === "user"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-secondary/70 text-foreground"
                  )}
                >
                  {message.role === "assistant" && message.tools?.length ? (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {message.tools.map((tool) => (
                        <span
                          key={tool.id}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground"
                        >
                          <Search className="h-3 w-3 text-primary" aria-hidden="true" />
                          {tool.status === "searching" ? "Searching" : "Found"}:{" "}
                          {tool.query}
                          {tool.status === "done" && tool.count !== undefined
                            ? ` (${tool.count})`
                            : ""}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {message.content ? (
                    message.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none prose-p:leading-6">
                        <SseMarkdown
                          content={message.content}
                          onCitation={setSelectedCitation}
                        />
                      </div>
                    ) : (
                      message.content
                    )
                  ) : message.role === "assistant" ? (
                    <span className="text-muted-foreground">Preparing answer...</span>
                  ) : null}

                  {message.error && (
                    <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                      {message.error}
                    </p>
                  )}

                  {message.meta?.citation_resolution && (
                    <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      Citations resolved:{" "}
                      {message.meta.citation_resolution.resolved}/
                      {message.meta.citation_resolution.total}
                    </p>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </section>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 backdrop-blur">
        <form
          onSubmit={submitMessage}
          className="mx-auto w-full max-w-4xl px-4 py-4 sm:px-8"
        >
          <div className="rounded-lg border border-border bg-background p-2 shadow-lift">
            <div className="flex gap-2">
              <Textarea
                id="chat-input"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void submitMessage();
                  }
                }}
                placeholder="Ask about the AI Act, GDPR, DSA, Chips Act..."
                className="min-h-[76px] resize-none border-0 shadow-none focus-visible:ring-0"
                disabled={isStreaming}
              />
              <Button
                type="submit"
                size="icon"
                className="mt-auto h-10 w-10 shrink-0"
                aria-label="Send message"
                disabled={isStreaming || !input.trim()}
              >
                <Send className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Lex EU may make mistakes. Always verify with primary sources.
          </p>
        </form>
      </div>

      <SourcePanel
        request={selectedCitation}
        onClose={() => setSelectedCitation(null)}
      />
    </main>
  );
}

async function readSseStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: string, payload: any) => void
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";

    for (const frame of frames) {
      const eventLine = frame
        .split("\n")
        .find((line) => line.startsWith("event:"));
      const dataLine = frame
        .split("\n")
        .find((line) => line.startsWith("data:"));

      if (!eventLine || !dataLine) {
        continue;
      }

      const event = eventLine.replace(/^event:\s*/, "");
      const data = dataLine.replace(/^data:\s*/, "");
      onEvent(event, JSON.parse(data));
    }
  }
}
