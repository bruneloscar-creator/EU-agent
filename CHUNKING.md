# Lex EU Chunking Strategy

Lex EU chunks EU legislation by legal structure, not by arbitrary token windows.

## Legal acts

For regulations and directives, the ingestion pipeline resolves each CELEX ID through the Publications Office CELLAR endpoint, downloads the official English Formex XML or XHTML manifestation, and extracts:

- one chunk per Article
- one chunk per Annex section when annexes are present
- sub-chunks only when a single Article or Annex section exceeds roughly 8,000 characters

Every chunk keeps citation metadata: document name, CELEX ID, document type, section type, article or annex number, section title, source URL, and ingestion timestamp.

## Long articles

Long articles are split at paragraph-style boundaries such as numbered paragraphs and point markers. The sub-chunks keep the same article number and title, with ordered IDs like `32024R1689_article_4_part_2`.

Example:

```text
Article 4 — Definitions
1. ...
(a) ...
(b) ...
```

If the full Article crosses the size threshold, Lex EU splits at `1.`, `(a)`, `(b)`, etc. This preserves the citation as Article 4 while keeping embedding inputs small enough for precise retrieval.

## Reports and communications

The Draghi Report, Letta Report, AI Continent Action Plan, and Commission Work Programme are not article-based. These are chunked by detected section headings from extracted PDF or page text. The section heading becomes both `section_number` and `section_title`.

## Retrieval

Embeddings use `Xenova/bge-small-en-v1.5` with normalized 384-dimensional vectors. Search uses sqlite-vec for nearest-neighbor retrieval, with a small FTS5 lexical boost so exact legal terms can lift close vector matches without overpowering semantic ranking.
