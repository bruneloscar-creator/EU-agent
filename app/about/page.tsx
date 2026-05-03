import { SiteHeader } from "@/components/site-header";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8">
        <p className="mb-5 font-mono text-xs uppercase tracking-[0.22em] text-primary">
          About Lex EU
        </p>
        <h1 className="font-serif text-5xl font-semibold leading-tight text-foreground">
          I&apos;m Oscar Brunel. I built Lex EU to make EU law easier to search, read, and verify.
        </h1>
        <div className="mt-8 space-y-6 text-lg leading-8 text-muted-foreground">
          <p>
            Lex EU is a research interface for European Union legislation. It
            lets you ask natural-language questions about the AI Act, GDPR, DSA,
            DMA, Data Act, Chips Act, CBAM, MiCA, DORA, and strategic reports
            such as Draghi and Letta. The goal is not to replace legal work, but
            to reduce the time spent finding the right provision and checking
            what the primary text actually says.
          </p>
          <p>
            Under the hood, Lex EU indexes 20 public EU texts into a local
            retrieval system. The ingestion pipeline downloads source documents,
            cleans them, chunks legal texts by article or annex, and stores
            searchable passages with their citation metadata. When you ask a
            question, Lex EU searches the indexed corpus first, then shows the
            provisions it used so you can click back to the source.
          </p>
          <p>
            There are two answer modes. Pro mode is terse, technical, and
            citation-heavy for lawyers, policy professionals, and regtech teams.
            Explainer mode gives more context for students, journalists, and
            non-specialists. Lex EU is intentionally source-first: always verify
            the cited provision before relying on an answer.
          </p>
        </div>
      </section>
    </main>
  );
}
