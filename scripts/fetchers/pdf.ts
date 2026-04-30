import fs from "node:fs/promises";
import path from "node:path";

import * as cheerio from "cheerio";
import { PDFParse } from "pdf-parse";

import type { SourceDocument } from "../../lib/retrieval/documents";
import { RAW_DIR } from "../../lib/retrieval/paths";

export type PdfFetchResult = {
  text: string;
  sourceUrl: string;
  warning?: string;
};

async function fetchBuffer(url: string) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "LexEU/0.2 (local research prototype; oscar)"
    }
  });

  if (!response.ok) {
    throw new Error(`Fetch failed ${response.status} for ${url}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function pdfToText(buffer: Buffer) {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();
  return result.text;
}

function absoluteUrl(href: string, base: string) {
  return new URL(href, base).toString();
}

async function findPdfUrl(pageUrl: string) {
  const response = await fetch(pageUrl, {
    headers: {
      "user-agent": "LexEU/0.2 (local research prototype; oscar)"
    }
  });

  if (!response.ok) {
    throw new Error(`Fetch failed ${response.status} for ${pageUrl}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const candidates = $("a")
    .map((_, element) => {
      const href = $(element).attr("href");
      const label = $(element).text().replace(/\s+/g, " ").trim();
      return href ? { href: absoluteUrl(href, pageUrl), label } : null;
    })
    .get()
    .filter(Boolean) as Array<{ href: string; label: string }>;

  const preferred = candidates.find(
    (candidate) =>
      /\.pdf($|\?)/i.test(candidate.href) &&
      !/annex|factsheet|explained|q&a/i.test(candidate.label)
  );
  const anyPdf = candidates.find((candidate) => /\.pdf($|\?)/i.test(candidate.href));

  if (preferred || anyPdf) {
    return (preferred ?? anyPdf)!.href;
  }

  const pageText = $("main, article, body").text().replace(/\s+/g, " ").trim();
  return { pageText };
}

export async function fetchPdfText(document: SourceDocument): Promise<PdfFetchResult> {
  await fs.mkdir(RAW_DIR, { recursive: true });
  const rawPath = path.join(RAW_DIR, `${document.id}.pdf`);
  const textPath = path.join(RAW_DIR, `${document.id}.txt`);
  const urlPath = path.join(RAW_DIR, `${document.id}.url.txt`);

  try {
    const text = await fs.readFile(textPath, "utf8");
    const sourceUrl = await fs.readFile(urlPath, "utf8").catch(() => document.sourceUrl);
    return { text, sourceUrl: sourceUrl.trim() };
  } catch {
    // Cache miss: fetch below.
  }

  let sourceUrl = document.sourceUrl;

  if (document.sourceKind === "web-pdf") {
    const resolved = await findPdfUrl(document.sourceUrl);
    if (typeof resolved !== "string") {
      await fs.writeFile(textPath, resolved.pageText);
      await fs.writeFile(urlPath, document.sourceUrl);
      return {
        text: resolved.pageText,
        sourceUrl: document.sourceUrl,
        warning: "No stable PDF found; scraped source page text instead."
      };
    }
    sourceUrl = resolved;
  }

  const buffer = await fetchBuffer(sourceUrl);
  await fs.writeFile(rawPath, buffer);
  const text = await pdfToText(buffer);
  await fs.writeFile(textPath, text);
  await fs.writeFile(urlPath, sourceUrl);

  return { text, sourceUrl };
}
