import type { Member, SupplyProduct } from "./commerce";

export function approvedAccess(member:Member|null|undefined):boolean {
  return !!member && !member.awaitingSignup && (member.role==="admin" || member.approved===true);
}

/** Public catalogue is an allowlist: never send wholesale options, stock or details. */
export function publicProduct(product:SupplyProduct):SupplyProduct {
  return {id:product.id,name:product.name,category:product.category,supplier:product.supplier,supplierId:"",image:product.image,origin:"",features:"",options:[],cutoff:"",shipping:"",status:"approved",updatedAt:product.updatedAt,...(product.demo?{demo:true}:{})};
}
