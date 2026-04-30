import fs from "node:fs/promises";
import path from "node:path";

import { sourceDocuments } from "../lib/retrieval/documents";
import type { Chunk, Manifest, ManifestDoc } from "../lib/retrieval/types";
import {
  CLEANED_DIR,
  DATA_DIR,
  DB_PATH,
  MANIFEST_PATH,
  RAW_DIR
} from "../lib/retrieval/paths";
import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL, embedPassages } from "../lib/retrieval/bge";
import { insertChunks, resetStore } from "../lib/retrieval/store";
import { chunkLegalXml, chunkReportText } from "./chunking/legal-chunker";
import { fetchCellarLegalXml } from "./fetchers/eurlex";
import { fetchPdfText } from "./fetchers/pdf";

const BATCH_SIZE = 32;

function log(message: string) {
  console.log(`[ingest] ${message}`);
}

function formatDuration(start: bigint) {
  const seconds = Number(process.hrtime.bigint() - start) / 1_000_000_000;
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);
  return minutes > 0 ? `${minutes}m ${remainder}s` : `${remainder}s`;
}

async function ensureDirs() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(RAW_DIR, { recursive: true });
  await fs.mkdir(CLEANED_DIR, { recursive: true });
}

function textForEmbedding(chunk: Chunk) {
  return [
    chunk.doc_short_name,
    `${chunk.section_type} ${chunk.section_number}`,
    chunk.section_title,
    chunk.parent_chapter,
    chunk.text
  ]
    .filter(Boolean)
    .join(". ");
}

async function embedChunks(chunks: Chunk[]) {
  const embeddings: Float32Array[] = [];
  log(`embedding ${chunks.length.toLocaleString()} chunks in batches of ${BATCH_SIZE}...`);

  for (let start = 0; start < chunks.length; start += BATCH_SIZE) {
    const batch = chunks.slice(start, start + BATCH_SIZE);
    const vectors = await embedPassages(batch.map(textForEmbedding));
    embeddings.push(...vectors);
    const done = Math.min(start + BATCH_SIZE, chunks.length);
    process.stdout.write(`\r[ingest] embedded ${done}/${chunks.length}`);
  }

  process.stdout.write("\n");
  return embeddings;
}

async function writeCleanedText(docId: string, chunks: Chunk[]) {
  const text = chunks
    .map((chunk) => {
      const title = chunk.section_title ? ` — ${chunk.section_title}` : "";
      return `# ${chunk.doc_short_name} ${chunk.section_type} ${chunk.section_number}${title}\n\n${chunk.text}`;
    })
    .join("\n\n");
  await fs.writeFile(path.join(CLEANED_DIR, `${docId}.txt`), text);
}

async function main() {
  const started = process.hrtime.bigint();
  const ingestedAt = new Date().toISOString();
  const allChunks: Chunk[] = [];
  const manifestDocs: ManifestDoc[] = [];

  log("starting");
  await ensureDirs();
  log(`fetching ${sourceDocuments.length} documents...`);

  for (let index = 0; index < sourceDocuments.length; index += 1) {
    const document = sourceDocuments[index];
    const prefix = `[${index + 1}/${sourceDocuments.length}] ${document.shortName}`;
    try {
      let chunks: Chunk[];
      let sourceUrl = document.sourceUrl;
      let warning: string | undefined;

      if (document.sourceKind === "cellar-celex") {
        const result = await fetchCellarLegalXml(document);
        sourceUrl = result.sourceUrl;
        chunks = chunkLegalXml(document, result.xml, sourceUrl, ingestedAt);
      } else {
        const result = await fetchPdfText(document);
        sourceUrl = result.sourceUrl;
        warning = result.warning;
        chunks = chunkReportText(document, result.text, sourceUrl, ingestedAt);
      }

      if (chunks.length === 0) {
        throw new Error("No chunks extracted");
      }

      await writeCleanedText(document.id, chunks);
      allChunks.push(...chunks);
      const articleCount = chunks.filter((chunk) => chunk.section_type === "article").length;
      const annexCount = chunks.filter((chunk) => chunk.section_type === "annex").length;
      manifestDocs.push({
        id: document.id,
        short_name: document.shortName,
        full_title: document.fullTitle,
        celex: document.celex ?? "",
        type: document.type,
        source_url: sourceUrl,
        status: "indexed",
        chunk_count: chunks.length,
        article_count: articleCount || undefined,
        annex_count: annexCount || undefined,
        warning
      });
      const detail =
        articleCount > 0
          ? `${articleCount} articles${annexCount ? `, ${annexCount} annex chunks` : ""}`
          : `${chunks.length} sections`;
      log(`${prefix} ✓ ${detail}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      manifestDocs.push({
        id: document.id,
        short_name: document.shortName,
        full_title: document.fullTitle,
        celex: document.celex ?? "",
        type: document.type,
        source_url: document.sourceUrl,
        status: "skipped",
        chunk_count: 0,
        warning: message
      });
      log(`${prefix} WARN skipped: ${message}`);
    }
  }

  log(
    `chunking complete: ${allChunks.length.toLocaleString()} chunks across ${
      manifestDocs.filter((doc) => doc.status === "indexed").length
    } docs`
  );
  log(`loading embedding model (${EMBEDDING_MODEL})...`);
  const embeddings = await embedChunks(allChunks);

  log("indexing into sqlite-vec...");
  const db = resetStore();
  insertChunks(db, allChunks, embeddings);
  db.close();

  const dbStats = await fs.stat(DB_PATH);
  const manifest: Manifest = {
    generated_at: new Date().toISOString(),
    model: EMBEDDING_MODEL,
    embedding_dimensions: EMBEDDING_DIMENSIONS,
    store: "sqlite-vec",
    docs_attempted: sourceDocuments.length,
    docs_indexed: manifestDocs.filter((doc) => doc.status === "indexed").length,
    total_chunks: allChunks.length,
    docs: manifestDocs
  };
  await fs.writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);

  log(
    `done in ${formatDuration(started)}. db: data/lex-eu.db (${(
      dbStats.size /
      1024 /
      1024
    ).toFixed(1)} MB)`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
