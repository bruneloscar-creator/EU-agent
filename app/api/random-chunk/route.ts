import { getRandomChunk } from "@/lib/retrieval/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  const chunk = getRandomChunk();
  if (!chunk) {
    return Response.json({ chunk: null }, { status: 404 });
  }

  return Response.json({ chunk });
}
