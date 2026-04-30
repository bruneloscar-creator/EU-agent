"use client";

import { Send, SquarePen } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { exampleQuestions } from "@/lib/content";
import type { SearchResult } from "@/lib/retrieval/types";

type Mode = "Pro" | "Explainer";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function ChatShell() {
  const [mode, setMode] = useState<Mode>("Explainer");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [sources, setSources] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  async function submitMessage(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const trimmed = input.trim();

    if (!trimmed) {
      return;
    }

    setMessages((current) => [...current, { role: "user", content: trimmed }]);
    setInput("");
    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
      if (!response.ok) {
        throw new Error(`Search failed with HTTP ${response.status}`);
      }
      const payload = (await response.json()) as { results: SearchResult[] };
      setSources(payload.results.slice(0, 3));
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            payload.results.length > 0
              ? "Sources found. Answer generation is wired on Day 3."
              : "No local sources found yet. Run npm run ingest to build the local index."
        }
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Search failed";
      setSearchError(message);
      setSources([]);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "Local retrieval is unavailable. Run npm run ingest, then try again."
        }
      ]);
    } finally {
      setIsSearching(false);
    }
  }

  function resetConversation() {
    setMessages([]);
    setSources([]);
    setInput("");
    setMode("Explainer");
    setSearchError(null);
  }

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto grid h-16 w-full max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-8">
          <Link
            href="/"
            className="font-serif text-2xl font-semibold text-foreground"
          >
            Lex EU
          </Link>

          <div className="flex rounded-md border border-border bg-secondary p-1">
            {(["Pro", "Explainer"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMode(option)}
                className={cn(
                  "h-8 rounded px-3 text-sm font-medium transition-colors",
                  mode === option
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {option}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="justify-self-end"
            onClick={resetConversation}
          >
            <SquarePen className="mr-2 h-4 w-4" aria-hidden="true" />
            New conversation
          </Button>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 pb-44 pt-10 sm:px-8">
        {messages.length === 0 ? (
          <div className="m-auto flex w-full max-w-2xl flex-col items-center text-center">
            <p className="font-serif text-3xl font-semibold text-foreground sm:text-4xl">
              Ask anything about EU legislation.
            </p>
            <div className="mt-8 grid w-full gap-3">
              {exampleQuestions.map((question) => (
                <button
                  key={question.text}
                  type="button"
                  onClick={() => setInput(question.text)}
                  className="rounded-lg border border-border bg-background p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lift"
                >
                  <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    {question.mode}
                  </span>
                  <span className="mt-2 block text-sm leading-6 text-foreground sm:text-base">
                    {question.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg border px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[72%]",
                    message.role === "user"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-secondary/70 text-foreground"
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {(isSearching || sources.length > 0 || searchError) && (
              <div className="rounded-lg border border-border bg-secondary/45 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Sources found
                  </p>
                  {isSearching && (
                    <span className="text-xs text-muted-foreground">Searching...</span>
                  )}
                </div>

                {searchError ? (
                  <p className="mt-3 text-sm text-muted-foreground">{searchError}</p>
                ) : (
                  <div className="mt-3 grid gap-3">
                    {sources.map((source) => (
                      <a
                        key={source.chunk.id}
                        href={source.chunk.source_url}
                        className="rounded-md border border-border bg-background p-3 text-left transition-colors hover:border-primary/50"
                      >
                        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-primary">
                          {source.chunk.doc_short_name} · {source.chunk.section_type}{" "}
                          {source.chunk.section_number} · score{" "}
                          {source.score.toFixed(3)}
                        </span>
                        <span className="mt-1 block text-sm font-medium text-foreground">
                          {source.chunk.section_title ?? source.chunk.doc_full_title}
                        </span>
                        <span className="mt-1 line-clamp-2 block text-sm leading-6 text-muted-foreground">
                          {source.chunk.text}
                        </span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 backdrop-blur">
        <form
          onSubmit={submitMessage}
          className="mx-auto w-full max-w-4xl px-4 py-4 sm:px-8"
        >
          <div className="rounded-lg border border-border bg-background p-2 shadow-lift">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void submitMessage();
                  }
                }}
                placeholder="Ask about the AI Act, GDPR, DSA, Chips Act..."
                className="min-h-[76px] resize-none border-0 shadow-none focus-visible:ring-0"
              />
              <Button
                type="submit"
                size="icon"
                className="mt-auto h-10 w-10 shrink-0"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Lex EU may make mistakes. Always verify with primary sources.
          </p>
        </form>
      </div>
    </main>
  );
}
