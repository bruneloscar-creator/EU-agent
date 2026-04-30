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
          What is Lex EU?
        </h1>
        <div className="mt-8 space-y-6 text-lg leading-8 text-muted-foreground">
          <p>
            Lex EU is an AI agent that lets you ask questions about European
            Union legislation in natural language. Answers are grounded in
            primary source documents &mdash; the actual regulations, directives,
            and strategic reports &mdash; with citations to specific articles you
            can click to verify.
          </p>
          <p>
            20 texts spanning EU digital law (AI Act, GDPR, DSA, DMA, Data Act,
            Cyber Resilience Act, NIS2), industrial policy (Chips Act, Critical
            Raw Materials Act, Net-Zero Industry Act), climate (CSRD, CBAM,
            Climate Law), finance (MiCA, DORA), and strategic documents (Draghi
            Report, Letta Report). Built in 5 days as a sprint project.
          </p>
        </div>
      </section>
    </main>
  );
}
