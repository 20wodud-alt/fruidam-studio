import { requireMember, sameOrigin } from "./commerce-auth";
import { CommerceError } from "./commerce-store";
import { approvedAccess } from "./member-access";

export async function requireApprovedMember(){
  const member=await requireMember();
  if(!approvedAccess(member))throw new CommerceError("운영자 승인 완료 후 상품 상세·가격·스튜디오를 이용할 수 있습니다.",403);
  return member;
}
export function withApiAccess<Args extends unknown[]>(handler:(...args:Args)=>Promise<Response>,level:"approved"|"admin"="approved"){
  return async(...args:Args):Promise<Response>=>{
    try{
      const request=args[0];
      if(request instanceof Request && !["GET","HEAD"].includes(request.method))sameOrigin(request);
      const member=await requireApprovedMember();
      if(level==="admin"&&member.role!=="admin")throw new CommerceError("운영자만 이용할 수 있습니다.",403);
      return await handler(...args);
    }catch(error){return Response.json({error:error instanceof CommerceError?error.message:"회원 권한을 확인하지 못했습니다. 잠시 후 다시 시도해주세요."},{status:error instanceof CommerceError?error.status:503,headers:{"Cache-Control":"no-store"}});}
  };
}
