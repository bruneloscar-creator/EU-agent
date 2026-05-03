import fs from "node:fs";
import { createRequire } from "node:module";

import Database from "better-sqlite3";

import { DB_PATH } from "./paths";
import type { Chunk, SearchResult } from "./types";
import { embedQuery, EMBEDDING_DIMENSIONS } from "./bge";

const require = createRequire(import.meta.url);

function loadSqliteVec(db: Database.Database, required = false) {
  try {
    const sqliteVec = require("sqlite-vec") as {
      load: (database: Database.Database) => void;
    };
    sqliteVec.load(db);
    return true;
  } catch (error) {
    if (required) {
      throw error;
    }
    console.warn("[search] sqlite-vec unavailable; using SQLite FTS only", error);
    return false;
  }
}

function vectorToBlob(vector: Float32Array) {
  return Buffer.from(vector.buffer, vector.byteOffset, vector.byteLength);
}

export function openLexDb(readonly = false) {
  const db = new Database(DB_PATH, { readonly, fileMustExist: readonly });
  loadSqliteVec(db, !readonly);
  return db;
}

export function resetStore() {
  fs.mkdirSync("data", { recursive: true });
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
  }
  if (fs.existsSync(`${DB_PATH}-shm`)) {
    fs.unlinkSync(`${DB_PATH}-shm`);
  }
  if (fs.existsSync(`${DB_PATH}-wal`)) {
    fs.unlinkSync(`${DB_PATH}-wal`);
  }

  const db = openLexDb();
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE chunks (
      rowid INTEGER PRIMARY KEY,
      id TEXT NOT NULL UNIQUE,
      doc_id TEXT NOT NULL,
      doc_short_name TEXT NOT NULL,
      section_type TEXT NOT NULL,
      section_number TEXT NOT NULL,
      text TEXT NOT NULL,
      chunk_json TEXT NOT NULL
    );

    CREATE VIRTUAL TABLE vec_chunks USING vec0(
      embedding float[${EMBEDDING_DIMENSIONS}]
    );

    CREATE VIRTUAL TABLE chunk_fts USING fts5(
      id UNINDEXED,
      text,
      tokenize = 'porter unicode61'
    );
  `);

  return db;
}

export function insertChunks(
  db: Database.Database,
  chunks: Chunk[],
  embeddings: Float32Array[]
) {
  if (chunks.length !== embeddings.length) {
    throw new Error(
      `Chunk/vector length mismatch: ${chunks.length} chunks, ${embeddings.length} vectors`
    );
  }

  const insertChunk = db.prepare(`
    INSERT INTO chunks (
      rowid, id, doc_id, doc_short_name, section_type, section_number, text, chunk_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertVector = db.prepare(`
    INSERT INTO vec_chunks(rowid, embedding) VALUES (?, ?)
  `);
  const insertFts = db.prepare(`
    INSERT INTO chunk_fts(rowid, id, text) VALUES (?, ?, ?)
  `);

  const tx = db.transaction(() => {
    const seenIds = new Map<string, number>();

    chunks.forEach((chunk, index) => {
      const rowid = BigInt(index + 1);
      const count = seenIds.get(chunk.id) ?? 0;
      seenIds.set(chunk.id, count + 1);
      const storedChunk =
        count === 0 ? chunk : { ...chunk, id: `${chunk.id}_${count + 1}` };

      insertChunk.run(
        rowid,
        storedChunk.id,
        storedChunk.doc_id,
        storedChunk.doc_short_name,
        storedChunk.section_type,
        storedChunk.section_number,
        storedChunk.text,
        JSON.stringify(storedChunk)
      );
      insertVector.run(rowid, vectorToBlob(embeddings[index]));
      insertFts.run(
        rowid,
        storedChunk.id,
        [
          storedChunk.doc_short_name,
          storedChunk.section_type,
          storedChunk.section_number,
          storedChunk.section_title,
          storedChunk.parent_chapter,
          storedChunk.text
        ]
          .filter(Boolean)
          .join(" ")
      );
    });
  });

  tx();
}

export async function search(query: string, k = 8): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed || !fs.existsSync(DB_PATH)) {
    return [];
  }

  const db = openLexDb(true);
  try {
    const chunkByRowid = db.prepare(
      "SELECT chunk_json FROM chunks WHERE rowid = ?"
    );

    const merged = new Map<
      number,
      { rowid: number; score: number; distance?: number }
    >();

    const ftsQuery = trimmed
      .toLowerCase()
      .match(/[a-z0-9-]{3,}/g)
      ?.slice(0, 8)
      .map((term) => `"${term.replace(/"/g, "")}"`)
      .join(" OR ");

    if (ftsQuery) {
      const ftsRows = db
        .prepare(
          `SELECT chunks.rowid AS rowid
           FROM chunk_fts
           JOIN chunks ON chunks.rowid = chunk_fts.rowid
           WHERE chunk_fts MATCH ?
           ORDER BY bm25(chunk_fts)
           LIMIT 20`
        )
        .all(ftsQuery) as Array<{ rowid: number }>;

      ftsRows.forEach((row, index) => {
        const existing = merged.get(row.rowid);
        const lexicalBoost = 0.55 + 0.2 * ((ftsRows.length - index) / ftsRows.length);
        merged.set(row.rowid, {
          rowid: row.rowid,
          distance: existing?.distance,
          score: (existing?.score ?? 0.45) + lexicalBoost
        });
      });
    }

    try {
      const queryVector = await embedQuery(trimmed);
      const vectorRows = db
        .prepare(
          "SELECT rowid, distance FROM vec_chunks WHERE embedding MATCH ? AND k = ?"
        )
        .all(vectorToBlob(queryVector), Math.max(k, 30)) as Array<{
        rowid: number;
        distance: number;
      }>;

      vectorRows.forEach((row) => {
        const existing = merged.get(row.rowid);
        merged.set(row.rowid, {
          rowid: row.rowid,
          distance: row.distance,
          score: (existing?.score ?? 0) + 1 / (1 + row.distance)
        });
      });
    } catch (error) {
      console.warn(
        "[search] vector search failed; falling back to SQLite FTS",
        error
      );
    }

    return Array.from(merged.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
      .map((row) => {
      const found = chunkByRowid.get(row.rowid) as
        | { chunk_json: string }
        | undefined;
      const chunk = JSON.parse(found?.chunk_json ?? "{}") as Chunk;
      return {
        chunk,
        distance: row.distance,
        score: row.score
      };
    });
  } finally {
    db.close();
  }
}

export function getChunkById(id: string): Chunk | null {
  if (!fs.existsSync(DB_PATH)) {
    return null;
  }

  const db = openLexDb(true);
  try {
    const row = db
      .prepare("SELECT chunk_json FROM chunks WHERE id = ?")
      .get(id) as { chunk_json: string } | undefined;
    return row ? (JSON.parse(row.chunk_json) as Chunk) : null;
  } finally {
    db.close();
  }
}

function parseCitationRef(ref: string) {
  const normalized = ref.trim().replace(/\s+/g, " ");
  const article = normalized.match(/^(?:Art\.|Article)\s+([0-9]+[a-z]?)/i);
  if (article) {
    return { sectionType: "article", sectionNumber: article[1] };
  }

  const annex = normalized.match(/^Annex\s+(.+)$/i);
  if (annex) {
    return { sectionType: "annex", sectionNumber: `Annex ${annex[1].trim()}` };
  }

  const recital = normalized.match(/^Recital\s+([0-9]+[a-z]?)/i);
  if (recital) {
    return { sectionType: "recital", sectionNumber: recital[1] };
  }

  const section = normalized.match(/^Section\s+(.+)$/i);
  if (section) {
    return { sectionType: "section", sectionNumber: section[1].trim() };
  }

  return null;
}

export async function findChunkByCitation(
  docShortName: string,
  ref: string
): Promise<Chunk | null> {
  if (!fs.existsSync(DB_PATH)) {
    return null;
  }

  const parsed = parseCitationRef(ref);
  const db = openLexDb(true);

  try {
    if (parsed) {
      const exact = db
        .prepare(
          `SELECT chunk_json FROM chunks
           WHERE lower(doc_short_name) = lower(?)
             AND section_type = ?
             AND section_number = ?
           LIMIT 1`
        )
        .get(docShortName, parsed.sectionType, parsed.sectionNumber) as
        | { chunk_json: string }
        | undefined;

      if (exact) {
        return JSON.parse(exact.chunk_json) as Chunk;
      }

      const fuzzyNeedle =
        parsed.sectionType === "annex"
          ? parsed.sectionNumber.replace(/\s+/g, " ")
          : `${parsed.sectionType === "article" ? "Article" : parsed.sectionType} ${
              parsed.sectionNumber
            }`;
      const fuzzy = db
        .prepare(
          `SELECT chunk_json FROM chunks
           WHERE lower(doc_short_name) = lower(?)
             AND (section_number LIKE ? OR text LIKE ?)
           LIMIT 1`
        )
        .get(docShortName, `%${fuzzyNeedle}%`, `%${fuzzyNeedle}%`) as
        | { chunk_json: string }
        | undefined;

      if (fuzzy) {
        return JSON.parse(fuzzy.chunk_json) as Chunk;
      }
    }
  } finally {
    db.close();
  }

  const fallback = await search(`${docShortName} ${ref}`, 8);
  return (
    fallback.find(
      (result) =>
        result.chunk.doc_short_name.toLowerCase() === docShortName.toLowerCase()
    )?.chunk ?? null
  );
}

export function getRandomChunk(): Chunk | null {
  if (!fs.existsSync(DB_PATH)) {
    return null;
  }

  const db = openLexDb(true);
  try {
    const row = db
      .prepare("SELECT chunk_json FROM chunks ORDER BY random() LIMIT 1")
      .get() as { chunk_json: string } | undefined;
    return row ? (JSON.parse(row.chunk_json) as Chunk) : null;
  } finally {
    db.close();
  }
}
