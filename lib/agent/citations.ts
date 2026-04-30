import { findChunkByCitation } from "@/lib/retrieval/store";
import type { Chunk } from "@/lib/retrieval/types";

export type ParsedCitation = {
  raw: string;
  doc: string;
  ref: string;
};

const citationPattern =
  /\[([A-Z][A-Za-z0-9 &.'’()/-]+,\s*(?:(?:Art\.|Article)\s*[0-9]+[a-z]?(?:\([^)]+\))*|Annex\s*[A-Za-z0-9IVXLCDM .-]+|Recital\s*[0-9]+[a-z]?|Section\s*[^\]]+))\]/g;

export function extractCitations(text: string): ParsedCitation[] {
  const seen = new Set<string>();
  const citations: ParsedCitation[] = [];
  let match: RegExpExecArray | null;

  while ((match = citationPattern.exec(text)) !== null) {
    const raw = match[0];
    const [doc, ...rest] = match[1].split(",");
    const ref = rest.join(",").trim();
    const key = `${doc.trim()}|${ref}`;

    if (!seen.has(key)) {
      seen.add(key);
      citations.push({ raw, doc: doc.trim(), ref });
    }
  }

  return citations;
}

export async function resolveCitations(text: string) {
  const citations = extractCitations(text);
  const results: Array<ParsedCitation & { chunk: Chunk | null }> = [];

  for (const citation of citations) {
    const chunk = await findChunkByCitation(citation.doc, citation.ref);
    if (!chunk) {
      console.warn(
        `[agent] WARN unresolved citation: ${citation.doc}, ${citation.ref}`
      );
    }
    results.push({ ...citation, chunk });
  }

  return results;
}

export function citationToMarkdownLinks(text: string) {
  return text.replace(citationPattern, (full, inner: string) => {
    const [doc, ...rest] = inner.split(",");
    const ref = rest.join(",").trim();
    const href = `lexcite://citation?doc=${encodeURIComponent(
      doc.trim()
    )}&ref=${encodeURIComponent(ref)}`;
    return `[${inner}](${href})`;
  });
}
