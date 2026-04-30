import type { Tool } from "@anthropic-ai/sdk/resources/messages";

import { search } from "@/lib/retrieval/store";

export const searchLegislationTool: Tool = {
  name: "search_legislation",
  description:
    "Search the indexed corpus of EU legislation and strategic documents (AI Act, GDPR, DSA, DMA, Chips Act, Draghi Report, etc.) using semantic search. Returns the most relevant passages, each with full citation metadata. Use this whenever the user asks about EU law, regulation, policy, or strategic documents. You can call this multiple times in a single turn to gather information from different angles or different documents.",
  input_schema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description:
          "A focused, well-formed search query in English. Be specific. Good: 'high-risk AI systems classification rules'. Bad: 'AI Act stuff'."
      },
      filter_doc: {
        type: "string",
        description:
          "Optional: limit search to a single document by short name (e.g., 'AI Act', 'GDPR', 'DSA', 'Draghi Report'). Omit to search across the full corpus."
      },
      k: {
        type: "integer",
        description:
          "Number of results to return. Default 5. Use 8-10 if the question is broad, 3 if very narrow.",
        default: 5
      }
    },
    required: ["query"]
  }
};

export type SearchLegislationInput = {
  query: string;
  filter_doc?: string;
  k?: number;
};

export async function runSearchLegislation(input: SearchLegislationInput) {
  const k = Math.min(Math.max(input.k ?? 5, 1), 10);
  const rawResults = await search(input.query, input.filter_doc ? Math.max(k * 4, 20) : k);
  const filtered = input.filter_doc
    ? rawResults.filter(
        (result) =>
          result.chunk.doc_short_name.toLowerCase() ===
          input.filter_doc?.toLowerCase()
      )
    : rawResults;

  return filtered.slice(0, k).map((result) => ({
    chunk_id: result.chunk.id,
    doc_short_name: result.chunk.doc_short_name,
    section_type: result.chunk.section_type,
    section_number: result.chunk.section_number,
    section_title: result.chunk.section_title,
    text:
      result.chunk.text.length > 3200
        ? `${result.chunk.text.slice(0, 3200)}…`
        : result.chunk.text,
    score: Number(result.score.toFixed(3))
  }));
}
