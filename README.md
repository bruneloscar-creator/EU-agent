# Lex EU

**Talk to European legislation.** A research interface for navigating EU regulation, from the AI Act to the Chips Act. Answers are grounded in primary sources, with citations.

-> Live demo: https://eu-agents.vercel.app

<div style="aspect-ratio: 16 / 9; border: 1px solid #d6d0c4; background: #fbfaf7; display: flex; align-items: center; justify-content: center; color: #6b6b6b; font-family: sans-serif;">
  TODO: add product screenshot after the first deploy
</div>

## Why

EU legislation is dense, fragmented, and constantly evolving. Today, understanding what the AI Act says about high-risk systems means downloading a 200-page PDF from EUR-Lex, reading article by article, and cross-referencing with the Annexes. Across law firms, regtech startups, NGOs, and journalists, hundreds of hours per week are spent on retrieval that should take 30 seconds.

Lex EU compresses that work into a source-first research flow, with primary-source citations.

## What's indexed (V0)

**Tech & digital**

- AI Act
- GDPR
- Digital Services Act
- Digital Markets Act
- Data Act
- Data Governance Act
- Cyber Resilience Act
- NIS2 Directive

**Industrial**

- European Chips Act
- Critical Raw Materials Act
- Net-Zero Industry Act

**Green**

- European Climate Law
- CSRD
- CBAM

**Finance**

- Markets in Crypto-Assets Regulation
- DORA

**Strategic documents**

- Draghi Report
- Letta Report
- AI Continent Action Plan
- Commission Work Programme 2026

## Two modes

- **Pro** - terse, technical, citation-heavy. For lawyers, public affairs, regtech.
- **Explainer** - plain-English, more context. For students, journalists, founders.

## Stack

Next.js 14 · TypeScript · Tailwind · shadcn/ui · local embeddings · sqlite-vec · better-sqlite3 · Vercel

Lex EU runs retrieval locally: source texts are chunked with citation metadata, embedded, and searched through SQLite-backed vector retrieval.

## How it works

V0 uses a source-first retrieval flow:

```text
EU source texts -> article-aware chunking + metadata -> local BGE embeddings -> sqlite-vec
      user question -> retrieval -> cited answer with source passages
```

The product searches the local corpus before answering and renders clickable citations back to indexed passages.

## Ingestion and search

Build the local index:

```bash
npm run ingest
```

Search from the CLI:

```bash
npm run search "high-risk AI system"
```

Use the API from a running app:

```bash
GET /api/search?q=high-risk+AI+system
GET /api/docs
```

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

Retrieval, ingestion, and CLI search run locally with no API keys. Streamed answers require the production language model key:

```bash
cp .env.example .env.local
# then set ANTHROPIC_API_KEY in .env.local
```

Never commit real secrets.

## Deploy

Deploy on Vercel after setting the production environment variables. No custom `vercel.json` is required for the current Next.js app.

```bash
npm run build
```

## Roadmap

**V0** - 20 indexed texts, conversational answers with citations, dual-mode, "compare two provisions" feature.

**V1** - French / German support, CJEU case law, real-time tracking of legislative proposals, national transpositions.

## Status

Local ingestion/retrieval are working; chat answers use local search and clickable citations. [TODO: update each day]

## License

MIT
