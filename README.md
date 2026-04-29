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
- eIDAS 2.0
- European Media Freedom Act

**Industrial**

- European Chips Act
- Critical Raw Materials Act
- Net-Zero Industry Act

**Green**

- Corporate Sustainability Reporting Directive
- Corporate Sustainability Due Diligence Directive
- EU Taxonomy Regulation

**Finance**

- Markets in Crypto-Assets Regulation
- DORA

**Strategic documents**

- Draghi Report
- EU Competitiveness Compass

## Two modes

- **Pro** - terse, technical, citation-heavy. For lawyers, public affairs, regtech.
- **Explainer** - plain-English, more context. For students, journalists, founders.

## Stack

Next.js 14 · TypeScript · Tailwind · shadcn/ui · Claude Sonnet 4 (Anthropic) · Voyage embeddings · Turbopuffer · Vercel

## How it works

V0 will use a retrieval-augmented generation flow:

```text
EU source texts -> chunking + metadata -> Voyage embeddings -> Turbopuffer index
      user question -> retrieval -> grounded prompt -> Claude Sonnet 4 -> cited answer
```

Day 1 ships the public UI, chat shell, environment contract, and health endpoint. The LLM and retrieval path are intentionally stubbed until API keys and source ingestion are added.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

Copy `.env.example` to `.env.local` when wiring the agent:

```bash
ANTHROPIC_API_KEY=replace_me
VOYAGE_API_KEY=replace_me
TURBOPUFFER_API_KEY=replace_me
DATABASE_URL=postgresql://user:password@host:5432/lex_eu
```

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

Day 1 of a 5-day build sprint. [TODO: update each day]

## License

MIT
