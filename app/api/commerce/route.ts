import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { currentMember, requireMember, sameOrigin } from "@/lib/commerce-auth";
import { CommerceError, commerceAccess } from "@/lib/commerce-store";
import { optionName, canOrder, orderLabels, plans, sampleProducts, subscribed, type CommerceState, type Member, type SupplyProduct, type SupplyOrder } from "@/lib/commerce";
import { studioAccess } from "@/lib/studio-store";
import { generateSections, type Product, type StudioProject } from "@/lib/studio";
import { createPendingOrder } from "@/lib/commerce-orders";
import { supplyDetails } from "@/lib/commerce-product-details";

import { supplyForProject, supplyProjectProduct, supplyProjectId } from "@/lib/supply-project";
import { product as validateProduct } from "@/lib/validate-product";
import { revokeSupplierApproval } from "@/lib/commerce-members";
import { composeCopy } from "@/lib/ai-copywriter";
import { fruitCompositionRequest } from "@/lib/fruit-composition";
export const runtime="nodejs";
export const maxDuration=120;
export const dynamic="force-dynamic";
const text=(value:unknown,max=200)=> typeof value==="string"?value.trim().slice(0,max):"";
function number(value:unknown,min:number,max:number){const n=Number(value);if(!Number.isSafeInteger(n)||n<min||n>max)throw new CommerceError("금액·수량을 확인해주세요.");return n;}
function notice(state:CommerceState,memberId:string,title:string,body:string){state.notices.unshift({id:randomUUID(),memberId,title,body,createdAt:new Date().toISOString(),read:false});}
function ownedOrder(state:CommerceState,id:string,member:Member){const order=state.orders.find(o=>o.id===id);if(!order || (member.role!=="admin"&&order.sellerId!==member.id&&order.supplierId!==member.id))throw new CommerceError("주문을 찾을 수 없습니다.",404);return order;}
function snapshot(state:CommerceState,member:Member|null){
  const members=member?.role==="admin"?state.members:[];
  const operatorEmail=member?.role==="admin"?(process.env.FRUIDAM_ADMIN_NOTIFICATION_EMAIL||process.env.FRUIDAM_OWNER_EMAIL||"").trim().toLowerCase():undefined;
  const products=state.products.filter(p=>p.status==="approved" || member?.role==="admin" || p.supplierId===member?.id).map(p=>member && (subscribed(member)||member.unlocked.length>0||member.credits>0||member.role!=="seller")?p:{...p,options:p.options.map(o=>({...o,price:0}))});
  return {member,products,samples:sampleProducts,members,operatorEmail,orders:member?state.orders.filter(o=>member.role==="admin"||o.sellerId===member.id||o.supplierId===member.id).map(o=>member.role==="seller"||member.role==="admin"?o:{...o,sellerId:""}):[],claims:member?state.claims.filter(c=>member.role==="admin"||c.sellerId===member.id||c.supplierId===member.id):[],notices:member?state.notices.filter(n=>n.memberId===member.id).slice(0,100):[],purchases:member?state.purchases.filter(p=>p.memberId===member.id):[],paymentReady:false,notificationReady:{email:false,kakao:false,sms:false}};
}
export async function GET(){try{const member=await currentMember();return NextResponse.json(snapshot(await commerceAccess(),member),{headers:{"Cache-Control":"no-store"}});}catch(error){return failure(error);}}
function failure(error:unknown){return NextResponse.json({error:error instanceof CommerceError?error.message:"서비스 요청을 처리하지 못했습니다. 다시 확인해주세요."},{status:error instanceof CommerceError?error.status:503});}
export async function POST(request:Request){
  try{
    sameOrigin(request);if(Number(request.headers.get("content-length")||0)>200000)throw new CommerceError("입력 데이터가 너무 큽니다.",413);
    const input=await request.json();const member=await requireMember();
    if(input.action==="createProject"){
      const state=await commerceAccess();const fresh=state.members.find(m=>m.id===member.id)!;
      const supply=supplyForProject(state,fresh,text(input.productId));
      const id=supplyProjectId(member.id,input.requestId);
      const reserved=fresh.projects.includes(id)&&state.projectProducts[id]===supply.id;
      if(reserved){const existing=(await studioAccess()).find(project=>project.id===id);if(existing)return NextResponse.json({ok:true,projectId:id,project:existing,url:`/studio?project=${id}`});}
      if(!reserved&&fresh.role==="seller"&&!subscribed(fresh)&&fresh.credits<1&&(fresh.trialProject||Date.now()-new Date(fresh.createdAt).getTime()>3*86400000))throw new CommerceError("무료 체험이 종료됐습니다. 이용권을 선택해주세요.",403);
      let info:Product;
      try{info=input.product===undefined?supplyProjectProduct(supply):validateProduct(input.product);}catch(error){throw new CommerceError(error instanceof Error?error.message:"상품 정보를 확인해주세요.");}
      const generated=await composeCopy(info,generateSections(info),fruitCompositionRequest,false);
      const project:StudioProject={id,product:info,sections:generated.sections,copyReport:generated.report,starred:false,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),supplyProductId:supply.id};
      await commerceAccess(s=>{
        const actor=s.members.find(m=>m.id===member.id)!;supplyForProject(s,actor,supply.id);
        if(actor.projects.includes(id)){if(s.projectProducts[id]!==supply.id)throw new CommerceError("다른 작업과 요청이 겹칩니다. 다시 시작해주세요.",409);return;}
        if(s.projectProducts[id])throw new CommerceError("다른 작업과 요청이 겹칩니다. 다시 시작해주세요.",409);
        if(actor.role==="seller"&&!subscribed(actor)&&actor.credits<1){if(actor.trialProject||Date.now()-new Date(actor.createdAt).getTime()>3*86400000)throw new CommerceError("무료 체험을 이미 사용했습니다.",409);actor.trialProject=id;}
        actor.projects.push(id);s.projectProducts[id]=supply.id;
      });
      const projects=await studioAccess(projects=>{if(!projects.some(item=>item.id===id))projects.unshift(project);});
      return NextResponse.json({ok:true,projectId:id,project:projects.find(item=>item.id===id)||project,url:`/studio?project=${id}`});
    }
    const state=await commerceAccess(s=>{
      const actor=s.members.find(m=>m.id===member.id)!;
      if(input.action==="supplierProduct"){
        if(actor.role!=="admin" && (actor.role!=="supplier" || !actor.approved))throw new CommerceError("입점 승인 후 상품을 등록할 수 있습니다.",403);
        const id=text(input.id)||randomUUID();const existing=s.products.find(p=>p.id===id);
        if(existing&&actor.role!=="admin"&&existing.supplierId!==actor.id)throw new CommerceError("수정 권한이 없습니다.",403);
        const supplierId=actor.role==="admin"?(text(input.supplierId)||existing?.supplierId||actor.id):actor.id;
        const supplier=s.members.find(m=>m.id===supplierId);
        if(!supplier || !(supplier.role==="admin" || (supplier.role==="supplier"&&supplier.approved)))throw new CommerceError("승인된 공급처를 선택해주세요.");
        const name=text(input.name,100),origin=text(input.origin,100),features=text(input.features,3000),shipping=text(input.shipping,200),image=text(input.image,1000),cutoff=text(input.cutoff,5);
        if(!name||!origin||!features||!shipping||!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(cutoff))throw new CommerceError("필수 상품 정보와 주문 마감 시간을 입력해주세요.");
        if(image&&!/^\/api\/uploads\/[a-f0-9-]+\.webp$/.test(image))throw new CommerceError("직접 업로드한 실제 상품 사진을 선택해주세요.");
        if(!Array.isArray(input.options)||input.options.length>20)throw new CommerceError("상품 옵션은 최대 20개까지 등록할 수 있습니다.");
        const options:SupplyProduct["options"]=input.options.map((o:Record<string,unknown>)=>{if(!o||typeof o!=="object")throw new CommerceError("옵션 정보를 확인해주세요.");const details={label:o.customLabel===false?"":text(o.label,200),grade:text(o.grade,60),weight:text(o.weight,60),size:text(o.size,60),fruitCount:text(o.fruitCount,60)};return {id:text(o.id)||randomUUID(),...details,label:optionName(details).slice(0,200),customLabel:o.customLabel!==false,price:number(o.price,100,10000000),stock:number(o.stock,0,100000)};});
        if(!options.length||options.some(o=>!o.label)||new Set(options.map(o=>o.id)).size!==options.length)throw new CommerceError("상품 옵션을 확인해주세요.");
        const next:SupplyProduct={id,supplierId:supplier.id,supplier:supplier.name,name,origin,features,shipping,cutoff,category:text(input.category,30)||"포도·기타",options,...supplyDetails(input,existing),status:"pending",updatedAt:new Date().toISOString()};
        if(existing){s.products[s.products.indexOf(existing)]=next;for(const m of s.members)if(m.unlocked.includes(id)||m.projects.some(p=>s.projectProducts[p]===id))notice(s,m.id,"공급 조건 변경",`${name}의 공급 조건이 변경되어 검수 중입니다. 최신 내용을 확인해주세요.`);}else s.products.unshift(next);
      }else if(input.action==="approveSupplier"){
        if(actor.role!=="admin")throw new CommerceError("운영자만 처리할 수 있습니다.",403);
        const target=s.members.find(m=>m.id===input.id&&m.role==="supplier");if(!target)throw new CommerceError("공급처를 찾지 못했습니다.");target.approved=true;target.commission=number(input.commission,0,10000);notice(s,target.id,"입점 승인 완료","상품을 등록하고 검수를 요청할 수 있습니다.");
      }else if(input.action==="revokeSupplierApproval"){
        revokeSupplierApproval(s,actor.id,text(input.id));
      }else if(input.action==="approveProduct"||input.action==="pauseProduct"){
        const target=s.products.find(p=>p.id===input.id);if(!target)throw new CommerceError("상품을 찾지 못했습니다.");
        if(actor.role!=="admin" && !(input.action==="pauseProduct"&&actor.id===target.supplierId))throw new CommerceError("처리 권한이 없습니다.",403);
        if(input.action==="approveProduct"){const supplier=s.members.find(m=>m.id===target.supplierId);if(!supplier||(supplier.role!=="admin"&&!(supplier.role==="supplier"&&supplier.approved)))throw new CommerceError("입점 승인된 공급처의 상품만 승인할 수 있습니다.");}
        if(input.action==="approveProduct"&&!target.image)throw new CommerceError("실제 상품 사진을 등록한 후 승인해주세요.");
        target.status=input.action==="approveProduct"?"approved":"paused";
        notice(s,target.supplierId,target.status==="approved"?"상품 승인 완료":"상품 판매 중단",target.name);
      }else if(input.action==="createOrder"){
        s.orders.unshift(createPendingOrder(s,actor,input));
      }else if(input.action==="importOrders"){
        if(!Array.isArray(input.rows)||!input.rows.length||input.rows.length>200)throw new CommerceError("엑셀 주문은 한 번에 1~200건 등록할 수 있습니다.");
        const orders=input.rows.map((row:Record<string,unknown>,index:number)=>{try{return createPendingOrder(s,actor,row);}catch(error){throw new CommerceError(`${index+2}행: ${error instanceof Error?error.message:"입력값을 확인해주세요."}`);}});
        s.orders.unshift(...orders);
      }else if(input.action==="orderStatus"){
        const order=ownedOrder(s,input.id,actor);const target=input.status;
        if(target==="cancelled"&&order.sellerId===actor.id&&order.status==="payment_pending"){order.status="cancelled";return;}
        if(target==="cancel_requested"&&order.sellerId===actor.id&&["paid","preparing"].includes(order.status)){order.status="cancel_requested";notice(s,order.supplierId,"주문 취소 요청",order.productName);return;}
        if(actor.role!=="admin"&&order.supplierId!==actor.id)throw new CommerceError("처리 권한이 없습니다.",403);
        const allowed:Record<string,string[]>={paid:["preparing"],preparing:["shipping"],shipping:["delivered"],cancel_requested:[]};
        if(!allowed[order.status]?.includes(target))throw new CommerceError("변경할 수 없는 주문 상태입니다.");
        if(target==="shipping"){order.carrier=text(input.carrier,50);order.tracking=text(input.tracking,60);if(!order.carrier||!order.tracking)throw new CommerceError("택배사와 송장번호를 입력해주세요.");}
        order.status=target;if(target==="delivered")order.deliveredAt=new Date().toISOString();notice(s,order.sellerId,`주문 ${orderLabels[order.status]}`,`${order.productName}${order.tracking?` · ${order.carrier} ${order.tracking}`:""}`);
      }else if(input.action==="claim"){
        const order=ownedOrder(s,input.orderId,actor);if(order.sellerId!==actor.id||!["shipping","delivered"].includes(order.status))throw new CommerceError("배송 중 또는 배송 완료 주문에서 접수해주세요.");
        const description=text(input.description,3000),photo=text(input.photo,1000);if(description.length<5||!/^\/api\/uploads\/[a-f0-9-]+\.webp$/.test(photo))throw new CommerceError("문제 설명과 사진을 등록해주세요.");
        s.claims.unshift({id:randomUUID(),orderId:order.id,sellerId:actor.id,supplierId:order.supplierId,type:text(input.type,60),description,photo,resolution:input.resolution==="reship"?"reship":"refund",status:"open",createdAt:new Date().toISOString()});notice(s,order.supplierId,"상품 문제 접수",order.productName);
      }else if(input.action==="claimReply"){
        const claim=s.claims.find(c=>c.id===input.id);if(!claim||(actor.role!=="admin"&&claim.supplierId!==actor.id))throw new CommerceError("처리 권한이 없습니다.",403);claim.reply=text(input.reply,2000);if(!claim.reply)throw new CommerceError("처리 안내를 입력해주세요.");claim.status="reviewing";notice(s,claim.sellerId,"문제 접수 답변",claim.reply);
      }else if(input.action==="settle"){
        if(actor.role!=="admin")throw new CommerceError("운영자만 정산할 수 있습니다.",403);
        const ids=Array.isArray(input.ids)?input.ids:[];if(!ids.length)throw new CommerceError("정산할 주문을 선택해주세요.");
        for(const id of ids){const order=s.orders.find(o=>o.id===id);if(!order||order.status!=="delivered"||order.settledAt||s.claims.some(c=>c.orderId===id&&c.status!=="resolved"))throw new CommerceError("배송 완료·미정산·분쟁 없는 주문만 정산할 수 있습니다.");order.settledAt=new Date().toISOString();notice(s,order.supplierId,"정산 지급 완료 기록",`${order.productName}의 지급 완료가 기록됐습니다.`);}
      }else if(input.action==="readNotices"){s.notices.filter(n=>n.memberId===actor.id).forEach(n=>{n.read=true;});
      }else if(input.action==="purchase"){
        const plan=plans.find(p=>p.id===input.plan);if(!plan)throw new CommerceError("요금제를 선택해주세요.");if(actor.role!=="seller")throw new CommerceError("셀러 계정에서 이용권을 구매해주세요.");
        if(plan.id!=="single")throw new CommerceError("월 자동결제는 결제사 계약 연결 후 열립니다. 현재는 건별 결제 연결을 준비하고 있습니다.",503);
        const product=s.products.find(p=>p.id===input.productId&&p.status==="approved");if(!product)throw new CommerceError("건별 제작할 공급 상품을 먼저 선택해주세요.");
        s.purchases.unshift({id:randomUUID(),memberId:actor.id,plan:plan.id,productId:product.id,amount:plan.price,status:"pending",createdAt:new Date().toISOString()});
      }else throw new CommerceError("지원하지 않는 요청입니다.");
    });
    return NextResponse.json(snapshot(state,state.members.find(m=>m.id===member.id)||member),{headers:{"Cache-Control":"no-store"}});
  }catch(error){return failure(error);}
}
