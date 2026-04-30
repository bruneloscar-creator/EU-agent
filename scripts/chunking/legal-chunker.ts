import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";

import type { SourceDocument } from "../../lib/retrieval/documents";
import type { Chunk, SectionType } from "../../lib/retrieval/types";

const MAX_CHARS = 8000;

function cleanText(text: string) {
  return text
    .replace(/[\u0000-\u001f]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

function splitText(text: string) {
  if (text.length <= MAX_CHARS) {
    return [text];
  }

  const parts = text.split(/(?=\s(?:\d+\.|\([a-z0-9]+\))\s)/i);
  const chunks: string[] = [];
  let current = "";

  for (const part of parts) {
    if ((current + part).length > MAX_CHARS && current) {
      chunks.push(current.trim());
      current = "";
    }
    current += part;
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks.flatMap((part) => {
    if (part.length <= MAX_CHARS) {
      return [part];
    }
    const hard: string[] = [];
    for (let i = 0; i < part.length; i += MAX_CHARS) {
      hard.push(part.slice(i, i + MAX_CHARS));
    }
    return hard;
  });
}

function makeChunk(
  document: SourceDocument,
  sectionType: SectionType,
  sectionNumber: string,
  sectionTitle: string | null,
  text: string,
  parentChapter: string | null,
  sourceUrl: string,
  ingestedAt: string,
  part?: number
): Chunk {
  const partSuffix = part ? `_part_${part}` : "";
  return {
    id: `${document.id}_${sectionType}_${slug(sectionNumber)}${partSuffix}`,
    doc_id: document.id,
    doc_short_name: document.shortName,
    doc_full_title: document.fullTitle,
    doc_celex: document.celex ?? "",
    doc_type: document.type,
    section_type: sectionType,
    section_number: sectionNumber,
    section_title: sectionTitle,
    text,
    char_count: text.length,
    parent_chapter: parentChapter,
    source_url: sourceUrl,
    ingested_at: ingestedAt
  };
}

function chapterFor($: cheerio.CheerioAPI, element: AnyNode) {
  const chapter = $(element).prevAll("CHAPTER").first();
  const label = cleanText(
    [chapter.find("TI").first().text(), chapter.find("STI").first().text()]
      .filter(Boolean)
      .join(": ")
  );
  return label || null;
}

export function chunkLegalXml(
  document: SourceDocument,
  xml: string,
  sourceUrl: string,
  ingestedAt: string
) {
  const $ = cheerio.load(xml, { xmlMode: true });
  const chunks: Chunk[] = [];

  $("ARTICLE").each((_, article) => {
    const articleNode = $(article);
    const number =
      cleanText(articleNode.children("TI\\.ART").first().text()).replace(
        /^Article\s+/i,
        ""
      ) || articleNode.attr("IDENTIFIER") || `${chunks.length + 1}`;
    const title = cleanText(articleNode.children("STI\\.ART").first().text()) || null;
    const text = cleanText(articleNode.text());

    if (!text || text.length < 80) {
      return;
    }

    splitText(text).forEach((part, index, parts) => {
      chunks.push(
        makeChunk(
          document,
          "article",
          number,
          title,
          part,
          chapterFor($, article),
          sourceUrl,
          ingestedAt,
          parts.length > 1 ? index + 1 : undefined
        )
      );
    });
  });

  $("ANNEX").each((_, annex) => {
    const annexNode = $(annex);
    const number =
      cleanText(annexNode.find("TI\\.ANNEX").first().text()) ||
      cleanText(annexNode.children("TI").first().text()) ||
      `Annex ${chunks.length + 1}`;
    const title =
      cleanText(annexNode.find("STI\\.ANNEX").first().text()) ||
      cleanText(annexNode.children("STI").first().text()) ||
      null;
    const text = cleanText(annexNode.text());

    if (!text || text.length < 80) {
      return;
    }

    splitText(text).forEach((part, index, parts) => {
      chunks.push(
        makeChunk(
          document,
          "annex",
          number,
          title,
          part,
          null,
          sourceUrl,
          ingestedAt,
          parts.length > 1 ? index + 1 : undefined
        )
      );
    });
  });

  if (chunks.length === 0 && xml.includes("oj-ti-art")) {
    const html = cheerio.load(xml);
    html("p.oj-ti-art, p.ti-art, p[class*='ti-art']").each((_, titleNode) => {
      const titleElement = html(titleNode);
      const container = titleElement.closest("div[id^='art_']");
      const number = cleanText(titleElement.text()).replace(/^Article\s+/i, "");
      const title = cleanText(container.find("p.oj-sti-art, p.sti-art").first().text()) || null;
      const text = cleanText(container.text());

      if (!number || !text || text.length < 80) {
        return;
      }

      splitText(text).forEach((part, index, parts) => {
        chunks.push(
          makeChunk(
            document,
            "article",
            number,
            title,
            part,
            null,
            sourceUrl,
            ingestedAt,
            parts.length > 1 ? index + 1 : undefined
          )
        );
      });
    });
  }

  return chunks;
}

export function chunkReportText(
  document: SourceDocument,
  text: string,
  sourceUrl: string,
  ingestedAt: string
) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => cleanText(line))
    .filter(Boolean);
  const chunks: Chunk[] = [];
  let currentTitle = "Opening section";
  let current = "";

  function flush() {
    const normalized = cleanText(current);
    if (normalized.length < 300) {
      current = "";
      return;
    }

    splitText(normalized).forEach((part, index, parts) => {
      chunks.push(
        makeChunk(
          document,
          "section",
          currentTitle,
          currentTitle,
          part,
          null,
          sourceUrl,
          ingestedAt,
          parts.length > 1 ? index + 1 : undefined
        )
      );
    });
    current = "";
  }

  for (const line of lines) {
    const headingLike =
      line.length <= 120 &&
      line.length >= 6 &&
      !/[.;:]$/.test(line) &&
      (/^[A-Z0-9][A-Z0-9 ,:()/-]+$/.test(line) || /^\d+(\.\d+)*\s+/.test(line));

    if (headingLike && current.length > 1200) {
      flush();
      currentTitle = line;
    } else {
      current += `${line}\n`;
    }
  }

  flush();
  return chunks;
}
