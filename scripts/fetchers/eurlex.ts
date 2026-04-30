import fs from "node:fs/promises";
import path from "node:path";

import JSZip from "jszip";

import type { SourceDocument } from "../../lib/retrieval/documents";
import { RAW_DIR } from "../../lib/retrieval/paths";

export type LegalFetchResult = {
  xml: string;
  sourceUrl: string;
  cellarId: string;
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

async function resolveCellarId(celex: string) {
  const response = await fetch(`https://publications.europa.eu/resource/celex/${celex}`, {
    redirect: "manual",
    headers: {
      "user-agent": "LexEU/0.2 (local research prototype; oscar)"
    }
  });
  const location = response.headers.get("location");
  const match = location?.match(/\/cellar\/([^/]+)\//);

  if (!match) {
    throw new Error(`Could not resolve CELLAR id for CELEX ${celex}`);
  }

  return match[1];
}

async function extractXmlFromPayload(buffer: Buffer) {
  const startsWithZip = buffer.subarray(0, 2).toString("utf8") === "PK";

  if (!startsWithZip) {
    return buffer.toString("utf8");
  }

  const zip = await JSZip.loadAsync(buffer);
  const xmlFiles = Object.values(zip.files).filter(
    (file) => !file.dir && file.name.endsWith(".xml")
  );
  const xmlParts = await Promise.all(
    xmlFiles.map(async (file) => file.async("string"))
  );

  const articleXml = xmlParts.filter(
    (xml) => xml.includes("<ARTICLE") || xml.includes("<ANNEX")
  );

  return articleXml.join("\n");
}

export async function fetchCellarLegalXml(
  document: SourceDocument
): Promise<LegalFetchResult> {
  if (!document.celex) {
    throw new Error(`${document.shortName} is missing a CELEX id`);
  }

  await fs.mkdir(RAW_DIR, { recursive: true });
  const cachePath = path.join(RAW_DIR, `${document.id}.xml`);
  const cellarIdPath = path.join(RAW_DIR, `${document.id}.cellar.txt`);

  try {
    const cached = await fs.readFile(cachePath, "utf8");
    const cachedCellarId = await fs.readFile(cellarIdPath, "utf8").catch(() => "");
    return {
      xml: cached,
      sourceUrl: document.eurlexUrl ?? document.sourceUrl,
      cellarId: cachedCellarId.trim()
    };
  } catch {
    // Cache miss: fetch below.
  }

  const cellarId = await resolveCellarId(document.celex);
  const candidates = [
    `https://publications.europa.eu/resource/cellar/${cellarId}.0006.02/DOC_2`,
    `https://publications.europa.eu/resource/cellar/${cellarId}.0006.02/DOC_1`
  ];

  let lastError: unknown;
  for (const url of candidates) {
    try {
      const buffer = await fetchBuffer(url);
      const xml = await extractXmlFromPayload(buffer);
      if (
        !xml.includes("<ARTICLE") &&
        !xml.includes("<ANNEX") &&
        !xml.includes("oj-ti-art")
      ) {
        throw new Error(`CELLAR payload did not contain article or annex XML: ${url}`);
      }
      await fs.writeFile(cachePath, xml);
      await fs.writeFile(cellarIdPath, cellarId);
      return {
        xml,
        sourceUrl: document.eurlexUrl ?? document.sourceUrl,
        cellarId
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Could not fetch CELLAR XML for ${document.shortName}`);
}
