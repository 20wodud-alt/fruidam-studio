import { approvedAccess } from "./member-access";
import { optionName, sampleProducts, supplyImages, type CommerceState, type Member, type SupplyProduct } from "./commerce";
import { CommerceError } from "./commerce-store";
import { emptyDesignBrief, type Product } from "./studio";
import { createHash, randomUUID } from "node:crypto";

export function supplyProjectId(memberId:string,requestId:unknown){
  if(typeof requestId!=="string"||!/^[a-f0-9-]{36}$/i.test(requestId))return randomUUID();
  const hex=createHash("sha256").update(`fruidam-supply-project:${memberId}:${requestId}`).digest("hex").slice(0,32);
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

export function supplyForProject(state:CommerceState,member:Member,id:string):SupplyProduct{
  if(!approvedAccess(member))throw new CommerceError("운영자 승인 후 상세페이지를 제작할 수 있습니다.",403);
  const supply=state.products.find(product=>product.id===id)||sampleProducts.find(product=>product.id===id);
  if(!supply)throw new CommerceError("공급 상품을 찾을 수 없습니다.",404);
  if(member.role==="admin")return supply;
  if(member.role==="supplier"){
    if(!member.approved||supply.supplierId!==member.id)throw new CommerceError("승인된 입점 계정의 등록 상품에서 제작해주세요.",403);
    return supply;
  }
  if(supply.status!=="approved")throw new CommerceError("공개된 공급 상품에서 제작해주세요.",403);
  return supply;
}

export function supplyProjectProduct(supply:SupplyProduct):Product{
  return {name:supply.name,category:"식품 · 농수산물",features:supply.features.slice(0,3000),price:"",options:supply.options.map(optionName).join("\n").slice(0,2000),images:supplyImages(supply),theme:"forest",length:"15",design:{...structuredClone(emptyDesignBrief),photoDirection:{mode:"mixed",people:false,instructions:"대표·옵션은 실제 상품 사진 유지. 과육 접사, 사선 원물 정물, 탑뷰 식탁 등 서로 다른 구도를 섹션 내용에 맞춰 연출합니다. 실제 상품 외관과 품종을 유지합니다."}}};
}
