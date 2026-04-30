export type DocumentType =
  | "regulation"
  | "directive"
  | "report"
  | "communication";

export type SectionType =
  | "article"
  | "recital"
  | "annex"
  | "preamble"
  | "section";

export type Chunk = {
  id: string;
  doc_id: string;
  doc_short_name: string;
  doc_full_title: string;
  doc_celex: string;
  doc_type: DocumentType;
  section_type: SectionType;
  section_number: string;
  section_title: string | null;
  text: string;
  char_count: number;
  parent_chapter: string | null;
  source_url: string;
  ingested_at: string;
};

export type SearchResult = {
  chunk: Chunk;
  score: number;
  distance?: number;
};

export type ManifestDoc = {
  id: string;
  short_name: string;
  full_title: string;
  celex: string;
  type: DocumentType;
  source_url: string;
  status: "indexed" | "skipped";
  chunk_count: number;
  article_count?: number;
  annex_count?: number;
  warning?: string;
};

export type Manifest = {
  generated_at: string | null;
  model: string;
  embedding_dimensions: number;
  store: string;
  docs_attempted: number;
  docs_indexed: number;
  total_chunks: number;
  docs: ManifestDoc[];
};
