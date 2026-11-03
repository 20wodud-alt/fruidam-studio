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
  const extra=[`원산지: ${supply.origin}`,`공급처: ${supply.supplier}`,supply.variety&&`품종: ${supply.variety}`,supply.productionYear&&`생산연도: ${supply.productionYear}년`,supply.storageType&&`보관구분: ${supply.storageType}`,supply.storageInstructions&&`보관안내: ${supply.storageInstructions}`,supply.dispatchType&&`출고형태: ${supply.dispatchType}`,supply.carrier&&`택배사: ${supply.carrier}`,supply.cutoff&&`주문 마감: ${supply.cutoff}`,`배송: ${supply.shipping}`,supply.jejuSurcharge&&`제주 추가 배송비: ${supply.jejuSurcharge}원`,supply.remoteSurcharge&&`도서산간 추가 배송비: ${supply.remoteSurcharge}원`].filter(Boolean);
  return {name:supply.name,category:"식품 · 농수산물",features:[supply.features,...extra].join("\n").slice(0,3000),price:"",options:supply.options.map(optionName).join("\n").slice(0,2000),images:supplyImages(supply),theme:"forest",length:"15",design:{...structuredClone(emptyDesignBrief),photoDirection:{mode:"original",people:false,instructions:"실제 상품 외관을 유지합니다."}}};
}
