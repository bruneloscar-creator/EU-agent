import { search } from "../lib/retrieval/store";

function excerpt(text: string, length = 240) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length > length ? `${cleaned.slice(0, length - 1)}…` : cleaned;
}

async function main() {
  const query = process.argv.slice(2).join(" ").trim();
  if (!query) {
    console.error('Usage: npm run search "high-risk AI system"');
    process.exitCode = 1;
    return;
  }

  const results = await search(query, 5);

  console.log(`Query: ${query}`);
  if (results.length === 0) {
    console.log("No results. Run `npm run ingest` first.");
    return;
  }

  results.forEach((result, index) => {
    const { chunk } = result;
    const title = chunk.section_title ? ` — ${chunk.section_title}` : "";
    console.log(
      `\n${index + 1}. [${chunk.doc_short_name}, ${chunk.section_type} ${
        chunk.section_number
      }${title}] score=${result.score.toFixed(3)}`
    );
    console.log(`   ${excerpt(chunk.text)}`);
    console.log(`   ${chunk.source_url}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
