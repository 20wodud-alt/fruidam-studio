import { randomUUID } from "node:crypto";
import type { CommerceState } from "./commerce";
import { CommerceError } from "./commerce-store";

type AuthMember = { id:string; email:string; email_confirmed_at?:string; created_at:string; user_metadata?:Record<string,string> };

// Only server-provisioned supplier profiles may be claimed, after email verification.
export function registerCommerceMember(state:CommerceState,user:AuthMember){
  const existing=state.members.find(member=>member.id===user.id);
  if(existing)return existing;
  const pending=state.members.find(member=>member.role==="supplier"&&member.awaitingSignup===true&&member.email.toLowerCase()===user.email.toLowerCase());
  if(pending){
    if(!user.email_confirmed_at)throw new CommerceError("이메일 인증 후 입점 계정을 이용해주세요.",403);
    const previousId=pending.id;
    pending.id=user.id;delete pending.awaitingSignup;
    for(const product of state.products)if(product.supplierId===previousId)product.supplierId=user.id;
    for(const order of state.orders)if(order.supplierId===previousId)order.supplierId=user.id;
    for(const claim of state.claims)if(claim.supplierId===previousId)claim.supplierId=user.id;
    for(const notice of state.notices)if(notice.memberId===previousId)notice.memberId=user.id;
    return pending;
  }
  const member={id:user.id,email:user.email,name:(user.user_metadata?.name||user.email.split("@")[0]).slice(0,60),role:user.user_metadata?.role==="supplier"?"supplier" as const:"seller" as const,createdAt:user.created_at,approved:false,commission:0,credits:0,unlocked:[],projects:[]};
  state.members.push(member);return member;
}

export function revokeSupplierApproval(state:CommerceState,actorId:string,supplierId:string){
  if(state.members.find(member=>member.id===actorId)?.role!=="admin")throw new CommerceError("운영자만 처리할 수 있습니다.",403);
  const supplier=state.members.find(member=>member.id===supplierId&&member.role==="supplier");
  if(!supplier)throw new CommerceError("공급처를 찾지 못했습니다.",404);
  if(!supplier.approved)return;
  supplier.approved=false;
  for(const product of state.products)if(product.supplierId===supplier.id&&product.status==="approved"){product.status="paused";product.updatedAt=new Date().toISOString();}
  state.notices.unshift({id:randomUUID(),memberId:supplier.id,title:"입점 승인 취소",body:"신규 상품 등록·발주가 중단되었습니다. 기존 주문의 배송·문제 처리와 정산 내역은 유지됩니다. 운영자에게 문의해주세요.",createdAt:new Date().toISOString(),read:false});
}
