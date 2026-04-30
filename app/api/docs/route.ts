import { readManifest } from "@/lib/retrieval/manifest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  const manifest = readManifest();
  return Response.json({
    docs: manifest?.docs ?? [],
    generated_at: manifest?.generated_at ?? null,
    total_chunks: manifest?.total_chunks ?? 0
  });
}
