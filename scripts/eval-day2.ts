import fs from "node:fs/promises";
import path from "node:path";

import { DATA_DIR } from "../lib/retrieval/paths";
import { search } from "../lib/retrieval/store";

const queries = [
  "What does the AI Act say about high-risk systems?",
  "GDPR lawful basis for processing personal data",
  "Chips Act funding for European semiconductor manufacturing",
  "DSA obligations for very large online platforms",
  "compare CBAM with the Emissions Trading System",
  "What does Draghi say about EU productivity gap?",
  "DMA gatekeeper designation",
  "NIS2 incident reporting requirements",
  "Critical raw materials strategic projects",
  "MiCA stablecoin reserve requirements"
];

function excerpt(text: string) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length > 220 ? `${cleaned.slice(0, 219)}…` : cleaned;
}

async function main() {
  const lines: string[] = [];
  lines.push(`# Lex EU Day 2 retrieval eval`);
  lines.push(`Generated: ${new Date().toISOString()}`);

  for (let index = 0; index < queries.length; index += 1) {
    const query = queries[index];
    const results = await search(query, 3);
    lines.push(`\n## ${index + 1}. ${query}`);

    if (results.length === 0) {
      lines.push(`No results.`);
      continue;
    }

    results.forEach((result, resultIndex) => {
      const { chunk } = result;
      const title = chunk.section_title ? ` — ${chunk.section_title}` : "";
      lines.push(
        `${resultIndex + 1}. [${chunk.doc_short_name}, ${chunk.section_type} ${
          chunk.section_number
        }${title}] score=${result.score.toFixed(3)}`
      );
      lines.push(`   ${excerpt(chunk.text)}`);
    });
  }

  await fs.mkdir(DATA_DIR, { recursive: true });
  const outputPath = path.join(DATA_DIR, "eval-day2.txt");
  await fs.writeFile(outputPath, `${lines.join("\n")}\n`);
  console.log(lines.join("\n"));
  console.log(`\nSaved to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
