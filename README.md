# Lex EU

**Talk to European legislation.** An AI agent for navigating EU regulation, from the AI Act to the Chips Act. Answers grounded in primary sources, with citations.

-> Live demo: [TODO: paste Vercel URL after deploy]

<div style="aspect-ratio: 16 / 9; border: 1px solid #d6d0c4; background: #fbfaf7; display: flex; align-items: center; justify-content: center; color: #6b6b6b; font-family: sans-serif;">
  TODO: add product screenshot after the first deploy
</div>

## Why

EU legislation is dense, fragmented, and constantly evolving. Today, understanding what the AI Act says about high-risk systems means downloading a 200-page PDF from EUR-Lex, reading article by article, and cross-referencing with the Annexes. Across law firms, regtech startups, NGOs, and journalists, hundreds of hours per week are spent on retrieval that should take 30 seconds.

Lex EU compresses that work to a conversation, with primary-source citations.

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

Next.js 14 · TypeScript · Tailwind · shadcn/ui · BGE embeddings via Transformers.js · sqlite-vec · better-sqlite3 · Vercel

Lex EU runs retrieval entirely on-device: embeddings via BGE running in Node, vector search via SQLite. The only paid dependency is Claude (Anthropic) for answer generation, which is wired on Day 3.

## How it works

V0 will use a retrieval-augmented generation flow:

```text
EU source texts -> article-aware chunking + metadata -> local BGE embeddings -> sqlite-vec
      user question -> retrieval -> grounded prompt -> Claude Sonnet 4 -> cited answer
```

Day 2 ships the local retrieval path. The LLM answer generation path is intentionally stubbed until Day 3.

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

Day 2 retrieval needs no environment variables and no API keys. `.env.example` is intentionally empty except for a note.

Never commit real secrets.

## Deploy

Deploy on Vercel after setting the production environment variables. No custom `vercel.json` is required for the current Next.js app.

```bash
npm run build
```

## Roadmap

**V0 (this week)** - 20 indexed texts, conversational agent with citations, dual-mode, "compare two provisions" feature.

**V1** - French / German support, CJEU case law, real-time tracking of legislative proposals, national transpositions.

## Status

Day 2 of a 5-day build sprint. Local ingestion and retrieval are working. [TODO: update each day]

## License

MIT
