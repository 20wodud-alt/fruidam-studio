import { createHash } from "node:crypto";
import { currentMember, sameOrigin } from "@/lib/commerce-auth";
import { commerceAccess, CommerceError } from "@/lib/commerce-store";
import { studioAccess } from "@/lib/studio-store";
export const runtime="nodejs";
export async function POST(request:Request){try{
  sameOrigin(request);const input=await request.json();const member=await currentMember();
  // The existing owner-only studio remains behind Vercel Authentication.
  if(!member||member.role==="admin")return Response.json({ok:true,legacy:true});
  if(!member.projects.includes(input.projectId))throw new CommerceError("작업 접근 권한이 없습니다.",403);
  const project=(await studioAccess()).find(p=>p.id===input.projectId);if(!project)throw new CommerceError("작업을 찾지 못했습니다.",404);
  const fingerprint=createHash("sha256").update(JSON.stringify({product:project.product,sections:project.sections})).digest("hex");
  if(input.mode!=="check"&&input.mode!=="commit")throw new CommerceError("내보내기 요청을 확인해주세요.");
  const validate=(state:Awaited<ReturnType<typeof commerceAccess>>)=>{
    const actor=state.members.find(m=>m.id===member.id)!;const history=state.downloads[project.id]||[];
    if(history.includes(fingerprint))return;
    if(actor.credits<1)throw new CommerceError("완성본 다운로드에는 유료 제작 건수가 필요합니다. 무료 체험은 미리보기만 제공합니다.",403);
    const productId=state.projectProducts[project.id];if(productId?.startsWith("sample-"))throw new CommerceError("실제 공급상품으로 만든 작업에서 유료 다운로드를 이용해주세요.",403);
    if(input.mode==="commit"){actor.credits--;state.downloads[project.id]=[...history,fingerprint];if(productId&&!actor.unlocked.includes(productId))actor.unlocked.push(productId);}
  };
  if(input.mode==="commit")await commerceAccess(validate);else validate(await commerceAccess());
  return Response.json({ok:true});
}catch(error){return Response.json({error:error instanceof CommerceError?error.message:"내보내기 권한을 확인하지 못했습니다."},{status:error instanceof CommerceError?error.status:503});}}
