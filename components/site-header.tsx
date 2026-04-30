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
      <nav className="flex items-center gap-5 text-sm font-medium text-muted-foreground">
        <Link href="/about" className="transition-colors hover:text-primary">
          About
        </Link>
        <Link href="/chat" className="transition-colors hover:text-primary">
          Try the demo
        </Link>
      </nav>
    </header>
  );
}
