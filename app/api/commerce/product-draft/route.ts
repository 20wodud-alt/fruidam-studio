import { withApiAccess } from "@/lib/api-access";
import { requireMember } from "@/lib/commerce-auth";
import { CommerceError, commerceAccess } from "@/lib/commerce-store";
import { supplyForProject, supplyProjectProduct } from "@/lib/supply-project";
export const runtime="nodejs";
export const dynamic="force-dynamic";

async function handleGET(request:Request){
  try{
    const member=await requireMember();
    const state=await commerceAccess();
    const fresh=state.members.find(item=>item.id===member.id);
    if(!fresh)throw new CommerceError("로그인 후 이용해주세요.",401);
    const supply=supplyForProject(state,fresh,new URL(request.url).searchParams.get("productId")||"");
    return Response.json({productId:supply.id,product:supplyProjectProduct(supply)},{headers:{"Cache-Control":"no-store"}});
  }catch(error){return Response.json({error:error instanceof CommerceError?error.message:"상품 정보를 불러오지 못했습니다."},{status:error instanceof CommerceError?error.status:503});}
}

export const GET=withApiAccess(handleGET);
