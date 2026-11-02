import { randomUUID } from "node:crypto";
import { canOrder, type CommerceState, type Member, type SupplyOrder } from "./commerce";
import { CommerceError } from "./commerce-store";
export function createPendingOrder(state:CommerceState,actor:Member,input:Record<string,unknown>):SupplyOrder{
  if(actor.role!=="seller")throw new CommerceError("셀러 계정에서 발주해주세요.",403);
  const product=state.products.find(p=>p.id===input.productId&&p.status==="approved");if(!product||!canOrder(actor,product.id))throw new CommerceError("상품 발주 권한을 확인해주세요.",403);
  const option=product.options.find(o=>o.id===input.optionId),quantity=Number(input.quantity);
  if(!Number.isSafeInteger(quantity)||quantity<1||quantity>1000||!option||option.stock<quantity)throw new CommerceError("출고 가능 수량을 확인해주세요.");
  const clean=(value:unknown,max:number)=>typeof value==="string"?value.trim().slice(0,max):"";
  const recipient=clean(input.recipient,60),phone=clean(input.phone,30),address=clean(input.address,300);
  if(!recipient||!/^[0-9+() -]{9,30}$/.test(phone)||address.length<8)throw new CommerceError("수령인·연락처·전체 주소를 확인해주세요.");
  if(Number(input.unitPrice)!==option.price)throw new CommerceError("공급가가 변경됐습니다. 새로고침 후 금액을 다시 확인해주세요.",409);
  const supplier=state.members.find(m=>m.id===product.supplierId);if(!supplier?.approved)throw new CommerceError("공급처의 입점 상태를 확인해주세요.",403);
  return {id:randomUUID(),sellerId:actor.id,supplierId:product.supplierId,productId:product.id,productName:product.name,optionId:option.id,optionLabel:option.label,quantity,unitPrice:option.price,amount:option.price*quantity,commission:supplier.commission,recipient,phone,address,note:clean(input.note,300),status:"payment_pending",createdAt:new Date().toISOString()};
}
