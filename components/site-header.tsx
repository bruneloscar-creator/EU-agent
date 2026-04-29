import Link from "next/link";

export function SiteHeader() {
  return (
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
  );
}
