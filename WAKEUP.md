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

# Wakeup report — Day 3 — 2026-04-30 10:00 CEST

## What I shipped
- Streaming chat API route with Anthropic Claude Sonnet 4.5, local `search_legislation` tool orchestration, a 5-tool-call cap, and clear missing-key errors: `app/api/chat/route.ts`
- Pro and Explainer system prompts generated with the indexed corpus from `data/manifest.json`: `lib/agent/prompts.ts`
- Compact legal search tool wrapper that uses the Day 2 local vector store and optional document filtering: `lib/agent/search-tool.ts`
- Citation extraction/resolution helpers and warnings for unresolved citations: `lib/agent/citations.ts`
- Citation lookup endpoint for side-panel source display: `app/api/chunk/route.ts`
- Retrieval store helpers for `getChunkById` and `findChunkByCitation`: `lib/retrieval/store.ts`
- Chat UI upgraded from source cards to an agent shell: streaming text display, visible search pills, persisted Pro/Explainer toggle, conversation history, clickable citation buttons, and a right-side source panel: `components/chat-shell.tsx`
- Day 3 dependencies and env contract: `package.json`, `package-lock.json`, `.env.example`
- README updated to reflect Claude answer generation on top of local retrieval: `README.md`
- Day 3 validation notes: `data/eval-day3.txt`

## Validation results (5 test queries)
1. Blocked — `"What does the AI Act consider a high-risk AI system?"` could not be run through Claude because `.env.local` is absent and `ANTHROPIC_API_KEY` is unavailable.
2. Blocked — `"How does the DMA define a gatekeeper, and what quantitative thresholds apply?"` blocked for the same reason.
3. Blocked — `"I'm a US founder building an AI coding tool. Do I need to worry about the EU AI Act?"` blocked for the same reason.
4. Blocked — `"Compare GDPR Article 6 lawful bases with the Data Act's data access rules."` plus follow-up blocked for the same reason.
5. Blocked — `"What does the Draghi Report recommend on AI infrastructure?"` blocked for the same reason.

## Tool use behavior
- Average tool calls per question: not measurable without a live Anthropic request.
- Any infinite loops or weird behavior: none observed in local code paths; the route hard-caps each turn at 5 tool calls.
- Citation resolution rate: live agent output not measurable. Spot-check resolved `[AI Act, Art. 6]` to `32024R1689_article_6`.

## Mode differentiation quality
The prompts are structurally different, not just tonal. Pro mode requires a direct answer, terse legal analysis, and a "Key provisions cited" list. Explainer mode requires a plain-English opening, "What the text actually says", "Why this matters in practice", and jargon definitions. I could not verify actual Claude adherence without the key.

## Compare feature shipped?
No. I did not add the optional compare modal because the core agent could not be live-validated without `ANTHROPIC_API_KEY`.

## What's broken or unfinished
- Live Claude streaming was not validated because `.env.local` is missing. Add `ANTHROPIC_API_KEY` and rerun the five Day 3 UI tests.
- I installed the Vercel AI SDK packages requested, but the route uses the official Anthropic SDK with custom SSE for the tool loop. This was the safer path under the no-key constraint, but it should be revisited if you want `useChat`/`streamText` idioms exactly.
- `npm install` succeeds but reports 9 npm audit advisories. I did not run `npm audit fix --force` because it proposes breaking upgrades.
- The model name is set exactly as requested: `claude-sonnet-4-5`. If Anthropic requires a dated alias in your account, update `MODEL` in `app/api/chat/route.ts`.
- I restarted a stale dev server that was returning a `.next` chunk error; `/` and `/chat` now return HTTP 200 on `http://localhost:3000`.

## TODOs for Oscar (in order)
1. Create `.env.local` with `ANTHROPIC_API_KEY=...`, then run the five Day 3 validation prompts in `/chat`.
2. Confirm whether `claude-sonnet-4-5` is accepted by your Anthropic account; if not, switch to the dated Sonnet 4.5 model ID.
3. Watch citation resolution in the UI. If Claude cites sub-paragraphs too aggressively, tighten the final prompt or add citation post-processing.
4. Decide whether to keep the custom Anthropic SSE route or port it to Vercel AI SDK `streamText` after live validation.
5. Revisit npm audit advisories before public launch, likely with a planned Next.js upgrade rather than a forced fix.

## Time spent
- Started: 09:45 CEST
- Finished: 10:02 CEST
- Total: 17 minutes

## Decisions I made on your behalf
- I implemented a server-side Anthropic tool loop with explicit SSE events (`tool-start`, `tool-result`, `text`, `meta`, `error`, `done`) so the UI can show visible search behavior and cleanly handle missing keys.
- I resolve citations against the local SQLite store at click time rather than storing source payloads in every message. This keeps messages lighter and uses the Day 2 database as the source of truth.
- I kept the optional compare feature out because the live agent path is blocked until an API key is present.
- I left `.env.local` untouched and committed only `.env.example` with a placeholder.

## My honest take
The code is deployable in the sense that it builds, retrieval still works, and the chat route fails cleanly without secrets. It is not yet demo-proven as an agent because no Anthropic key was available, so the most important Day 3 acceptance criteria — real streamed answers, actual tool-call cadence, and citation fabrication rate — remain untested. The next hour should go entirely to live validation with a real key, then tightening prompts and citation handling based on what Claude actually does.
