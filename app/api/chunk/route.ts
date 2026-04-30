import { findChunkByCitation, getChunkById } from "@/lib/retrieval/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id")?.trim();
  const doc = searchParams.get("doc")?.trim();
  const ref = searchParams.get("ref")?.trim();

  const chunk = id
    ? getChunkById(id)
    : doc && ref
      ? await findChunkByCitation(doc, ref)
      : null;

  if (!chunk) {
    return Response.json(
      {
        chunk: null,
        message: "Source not in current context or local index."
      },
      { status: 404 }
    );
  }

  return Response.json({ chunk });
}
