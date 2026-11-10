import { readAsset } from "@/lib/asset-store";
import { commerceAccess, CommerceError } from "@/lib/commerce-store";
import { requireApprovedMember } from "@/lib/api-access";
export const runtime = "nodejs";
export const dynamic="force-dynamic";
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[a-f0-9-]+\.webp$/.test(id)) return new Response("Not found", { status: 404 });
  try {
    const url=`/api/uploads/${id}`;
    const publicThumbnail=(await commerceAccess()).products.some(product=>product.status==="approved"&&product.image===url);
    if(!publicThumbnail)await requireApprovedMember();
    const data = await readAsset(id);
    return new Response(new Uint8Array(data), { headers: { "Content-Type": "image/webp", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch(error) { return new Response(error instanceof CommerceError?error.message:"Not found", { status: error instanceof CommerceError?error.status:404,headers:{"Cache-Control":"no-store"} }); }
}
