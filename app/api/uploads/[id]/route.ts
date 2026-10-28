import { readAsset } from "@/lib/asset-store";
export const runtime = "nodejs";
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[a-f0-9-]+\.webp$/.test(id)) return new Response("Not found", { status: 404 });
  try {
    const data = await readAsset(id);
    return new Response(new Uint8Array(data), { headers: { "Content-Type": "image/webp", "Cache-Control": "private, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" } });
  } catch { return new Response("Not found", { status: 404 }); }
}
