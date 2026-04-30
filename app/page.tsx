import { Github } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { exampleQuestions } from "@/lib/content";
import { sourceDocuments } from "@/lib/retrieval/documents";
import { readManifest } from "@/lib/retrieval/manifest";

export default function Home() {
  const manifest = readManifest();
  const indexedTexts =
    manifest?.docs
      .filter((doc) => doc.status === "indexed")
      .map((doc) => doc.short_name) ?? sourceDocuments.map((doc) => doc.shortName);

  return (
    <main className="min-h-screen bg-background">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
        <Link
          href="/"
          className="font-serif text-2xl font-semibold tracking-normal text-foreground"
        >
          Lex EU
        </Link>
        <Link
          href="/chat"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          Try the demo
        </Link>
      </header>

      <section className="mx-auto flex w-full max-w-6xl flex-col px-5 pb-14 pt-10 sm:px-8 sm:pb-20 sm:pt-16">
        <div className="max-w-4xl">
          <p className="mb-5 font-mono text-xs uppercase tracking-[0.22em] text-primary">
            AI agent for primary-source EU law
          </p>
          <h1 className="max-w-4xl font-serif text-5xl font-semibold leading-[0.96] tracking-normal text-foreground sm:text-7xl lg:text-8xl">
            Ask EU legislation. Verify the source.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
            Lex EU answers questions about 20 indexed EU regulations,
            directives, and strategic reports. It searches the primary texts
            first, then gives cited answers you can click back to the article.
          </p>
          <div className="mt-9 flex flex-col items-start gap-3">
            <Button asChild size="lg" className="h-12 rounded-md px-6">
              <Link href="/chat">Try it &rarr;</Link>
            </Button>
            <p className="text-sm text-muted-foreground">
              No login. AI Act, GDPR, DSA, DMA, Chips Act, CBAM, MiCA,
              Draghi Report, and more.
            </p>
          </div>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {exampleQuestions.map((question) => (
            <Link
              key={question.text}
              href="/chat"
              className="group rounded-lg border border-border bg-background p-5 transition duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lift"
            >
              <span className="mb-5 inline-flex rounded-full border border-border px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground group-hover:border-primary/30 group-hover:text-primary">
                {question.mode}
              </span>
              <p className="font-serif text-xl leading-snug text-foreground">
                &ldquo;{question.text}&rdquo;
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-secondary/45">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-5 py-8 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">
            What&apos;s inside
          </p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3 lg:flex lg:flex-wrap lg:justify-end">
            {indexedTexts.map((text) => (
              <span
                key={text}
                className="font-mono text-sm text-muted-foreground"
              >
                {text}
              </span>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <span>Built in 5 days.</span>
          <Link href="/about" className="font-medium transition-colors hover:text-primary">
            About
          </Link>
        </div>
        <a
          href="https://github.com/[username]/lex-eu"
          className="inline-flex items-center gap-2 font-medium transition-colors hover:text-primary"
        >
          <Github className="h-4 w-4" aria-hidden="true" />
          Open source on GitHub &rarr;
        </a>
        <span className="sr-only">TODO(oscar): fix the GitHub username.</span>
      </footer>
    </main>
  );
}
