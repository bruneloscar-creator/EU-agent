import { search } from "@/lib/retrieval/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const started = performance.now();
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return Response.json({ query, results: [], ms: 0 }, { status: 400 });
  }

  try {
    const results = await search(query, 8);
    return Response.json({
      query,
      results,
      ms: Math.round(performance.now() - started)
    });
  } catch (error) {
    console.error("[api/search] failed", error);
    return Response.json(
      {
        query,
        results: [],
        error: "Search is temporarily unavailable. Please try again in a moment.",
        ms: Math.round(performance.now() - started)
      },
      { status: 500 }
    );
  }
}
