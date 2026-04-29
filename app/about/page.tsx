import { SiteHeader } from "@/components/site-header";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8">
        <p className="mb-5 font-mono text-xs uppercase tracking-[0.22em] text-primary">
          About
        </p>
        <h1 className="font-serif text-5xl font-semibold leading-tight text-foreground">
          Lex EU turns dense regulation into cited answers.
        </h1>
        <div className="mt-8 space-y-6 text-lg leading-8 text-muted-foreground">
          <p>
            EU law is public, but it is rarely easy to work with. Important
            obligations are spread across articles, annexes, recitals, delegated
            acts, and strategic reports that are difficult to compare quickly.
          </p>
          <p>
            Lex EU is being built as a focused research agent for European
            legislation. The goal is simple: ask a natural-language question,
            choose Pro or Explainer mode, and get an answer grounded in primary
            source text with specific citations.
          </p>
        </div>
      </section>
    </main>
  );
}
