# Wakeup report — Day 2 — 2026-04-30 02:49 CEST

## Ingestion summary
- Docs attempted: 20
- Docs successfully ingested: 20
- Total chunks: 1,672
- DB size: 17.6 MB reported by ingest (`data/lex-eu.db`; 28 MB on disk including SQLite allocation)
- Total ingestion time: 6m 17s on the successful full run

## Failed / skipped docs
- None in the final run.
- Note: the original Council-hosted Letta PDF returned a Cloudflare 403 in this environment, so I used the official European Commission ERA page, which resolved to `https://european-research-area.ec.europa.eu/sites/default/files/documents/2024-05/LETTA%20Report%20-%20Much%20more%20than%20a%20market_April%202024.pdf`.

## Retrieval quality (10 test queries)
Saved full output to `data/eval-day2.txt`.

- 10/10 returned a sane result in the top 3.
- Strong top-1 hits: AI Act Article 6, GDPR Article 6, Draghi productivity gap section, NIS2 Article 23, MiCA Article 36.
- Acceptable top-3 hits: DSA Article 33 appeared top 3; DMA Article 3 appeared top 3; Critical Raw Materials Act Article 6 appeared top 3.
- Weaker but usable: Chips Act query put Article 2 first, but Article 8a and Article 13 were top 3. CBAM query stayed within CBAM articles but did not explicitly retrieve ETS cross-reference language first.

## My honest assessment of retrieval quality
Good enough to wire an agent on Day 3. Article-level legal retrieval is already useful for the core demo queries, and the small FTS5 boost helps exact legal terms like “reserve” without overwhelming vector search.

The weak spot is non-article reports and communications. PDF heading extraction is noisy in places, especially Draghi sections like `EUROMETAUX` and figure/endnote headings. The AI Continent Action Plan currently indexes as one section from the official page/source rather than a clean multi-section PDF parse, so it is searchable but not beautifully chunked.

## What I shipped
- Local source catalog for all 20 Day 2 documents: `lib/retrieval/documents.ts`
- Shared retrieval types, paths, manifest reader, BGE embedding wrapper, and sqlite-vec store/search: `lib/retrieval/types.ts`, `lib/retrieval/paths.ts`, `lib/retrieval/manifest.ts`, `lib/retrieval/bge.ts`, `lib/retrieval/store.ts`
- Ingestion CLI and fetch/chunk modules: `scripts/ingest.ts`, `scripts/fetchers/eurlex.ts`, `scripts/fetchers/pdf.ts`, `scripts/chunking/legal-chunker.ts`
- Search CLI and retrieval eval script: `scripts/search.ts`, `scripts/eval-day2.ts`
- API routes: `app/api/search/route.ts`, `app/api/docs/route.ts`, `app/api/random-chunk/route.ts`
- Chat UI now calls local retrieval and renders top 3 source cards: `components/chat-shell.tsx`
- Landing page reads indexed docs from `data/manifest.json`: `app/page.tsx`
- Local data manifest and eval output committed: `data/manifest.json`, `data/eval-day2.txt`
- Updated local-only environment docs and dependency stack: `.env.example`, `README.md`
- Chunking strategy documentation: `CHUNKING.md`
- Native-package Next config for production API routes: `next.config.mjs`

## What's broken or unfinished
- No LLM answer generation yet by design; `/chat` only shows retrieved sources.
- Report/communication chunking is adequate but rough. It needs better heading detection before this becomes a polished research browser.
- CSRD is indexed from official CELLAR XHTML, but because it is an amending directive with large nested amended-text blocks, it produces 406 article-like chunks and may need pruning later.
- `npm audit` still reports dependency advisories, including Next.js 14 advisories whose npm-proposed fix is a breaking upgrade to Next 16.

## TODOs for Oscar (in order)
1. Run `npm run search "your demo query"` on tomorrow’s talking points and spot-check the citations.
2. Decide whether Day 3 should keep the current lightweight FTS5 boost or add stronger reranking before Claude.
3. Clean up report chunking for Draghi/Letta/AI Continent if those will be prominent in the demo.
4. Decide whether to upgrade from Next 14 to Next 16 before public launch to clear the audit path.
5. Wire Claude answer generation on top of the top retrieved chunks.

## Time spent
- Started: 02:05 CEST
- Finished: 02:49 CEST
- Total: 44 minutes

## Decisions I made on your behalf
- EUR-Lex HTML returned a CloudFront WAF challenge, so I used the official Publications Office CELLAR backend. CELEX IDs resolve through `https://publications.europa.eu/resource/celex/{CELEX}` and then download official English Formex XML/XHTML.
- I used sqlite-vec as requested and added FTS5 as a small hybrid boost. Vector scores remain primary.
- I externalized `better-sqlite3`, `sqlite-vec`, `onnxruntime-node`, and `@xenova/transformers` in Next production builds so native packages work in API routes.
- I kept `data/raw/`, `data/cleaned/`, `data/models/`, and `data/lex-eu.db` gitignored. Only `data/manifest.json` and `data/eval-day2.txt` are committed.
