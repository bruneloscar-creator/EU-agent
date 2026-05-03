# Lex EU

**Talk to European legislation.** Lex EU is a source-first research interface for European Union regulation, from the AI Act to the Chips Act. It answers natural-language questions with citations to the underlying primary texts.

Live demo: [https://eu-agents.vercel.app](https://eu-agents.vercel.app)

Built by **Oscar Brunel**.

## Why This Exists

EU legislation is dense, fragmented, and difficult to navigate quickly. A practical question like “what counts as a high-risk system under the AI Act?” can mean opening EUR-Lex, finding the right regulation, reading Article 6, checking Annex III, and then following related obligations across the text.

Lex EU compresses that workflow into a verifiable research loop: ask a question, retrieve the relevant source passages, read a cited answer, and click back to the exact provision.

## What It Does

- Searches a curated corpus of 20 EU legal and policy texts.
- Retrieves article-aware chunks rather than arbitrary text snippets.
- Streams answers with inline citations such as `[AI Act, Art. 6]`.
- Opens cited passages in a source panel for verification.
- Supports two response modes:
  - **Pro**: terse, technical, citation-heavy.
  - **Explainer**: plain-English, contextual, accessible.

## Indexed Corpus

**Tech and digital**

- AI Act
- GDPR
- Digital Services Act
- Digital Markets Act
- Data Act
- Data Governance Act
- Cyber Resilience Act
- NIS2 Directive

**Industrial policy**

- European Chips Act
- Critical Raw Materials Act
- Net-Zero Industry Act

**Climate and sustainability**

- European Climate Law
- CSRD
- CBAM

**Finance and markets**

- Markets in Crypto-Assets Regulation
- DORA

**Strategic documents**

- Draghi Report
- Letta Report
- AI Continent Action Plan
- Commission Work Programme 2026

## Architecture

```text
EUR-Lex / official PDFs
        |
        v
fetch + clean source text
        |
        v
article-aware chunking with citation metadata
        |
        v
local SQLite index + full-text fallback
        |
        v
retrieval tool used by the chat route
        |
        v
streamed answer with clickable source citations
```

The repository includes a generated local SQLite index so the deployed demo can retrieve sources without a hosted vector database. The ingestion pipeline can regenerate that index from public sources.

See [CHUNKING.md](./CHUNKING.md) for the chunking strategy.

## Tech Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-style primitives
- better-sqlite3
- sqlite-vec for local vector indexing during ingestion
- SQLite FTS fallback for production-safe retrieval
- Anthropic API for streamed answer generation
- Vercel

## Try It Locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

`ANTHROPIC_API_KEY` is required for streamed chat answers. The retrieval APIs and CLI search can run locally from the committed index.

## Useful Commands

Run a production build:

```bash
npm run build
```

Search the local corpus from the CLI:

```bash
npm run search "What does the AI Act consider a high-risk system?"
```

Regenerate the local index:

```bash
npm run ingest
```

Inspect the retrieval API from a running app:

```bash
curl "http://localhost:3000/api/search?q=high-risk+AI+system"
curl "http://localhost:3000/api/docs"
```

## API Routes

- `GET /api/health` - service health check
- `GET /api/docs` - indexed corpus manifest
- `GET /api/search?q=...` - retrieval results with chunk metadata
- `GET /api/chunk?doc=...&ref=...` - source lookup for citations
- `POST /api/chat` - streamed chat response

## Example Questions

- What does the AI Act consider a high-risk system?
- Compare GDPR Article 6 with the Data Act's access rules.
- What does the Chips Act fund, and how is it structured?
- How does CBAM interact with the Emissions Trading System?
- What are MiCA's reserve requirements for stablecoins?

## Project Status

Lex EU is a working prototype: ingestion, local retrieval, citation lookup, streamed answers, and the public demo are live. The next step is improving retrieval ranking and expanding citation coverage for annex-heavy provisions.

## License

MIT
