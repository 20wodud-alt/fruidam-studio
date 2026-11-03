import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { currentMember, requireMember, sameOrigin } from "@/lib/commerce-auth";
import { CommerceError, commerceAccess } from "@/lib/commerce-store";
import { canOrder, orderLabels, plans, sampleProducts, subscribed, type CommerceState, type Member, type SupplyProduct, type SupplyOrder } from "@/lib/commerce";
import { studioAccess } from "@/lib/studio-store";
import { emptyDesignBrief, generateSections, type Product, type StudioProject } from "@/lib/studio";
import { createPendingOrder } from "@/lib/commerce-orders";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const text=(value:unknown,max=200)=> typeof value==="string"?value.trim().slice(0,max):"";
function number(value:unknown,min:number,max:number){const n=Number(value);if(!Number.isSafeInteger(n)||n<min||n>max)throw new CommerceError("금액·수량을 확인해주세요.");return n;}
function notice(state:CommerceState,memberId:string,title:string,body:string){state.notices.unshift({id:randomUUID(),memberId,title,body,createdAt:new Date().toISOString(),read:false});}
function ownedOrder(state:CommerceState,id:string,member:Member){const order=state.orders.find(o=>o.id===id);if(!order || (member.role!=="admin"&&order.sellerId!==member.id&&order.supplierId!==member.id))throw new CommerceError("주문을 찾을 수 없습니다.",404);return order;}
function snapshot(state:CommerceState,member:Member|null){
  const members=member?.role==="admin"?state.members:[];
  const products=state.products.filter(p=>p.status==="approved" || member?.role==="admin" || p.supplierId===member?.id).map(p=>member && (subscribed(member)||member.unlocked.length>0||member.credits>0||member.role!=="seller")?p:{...p,options:p.options.map(o=>({...o,price:0}))});
  return {member,products,samples:sampleProducts,members,orders:member?state.orders.filter(o=>member.role==="admin"||o.sellerId===member.id||o.supplierId===member.id).map(o=>member.role==="seller"||member.role==="admin"?o:{...o,sellerId:""}):[],claims:member?state.claims.filter(c=>member.role==="admin"||c.sellerId===member.id||c.supplierId===member.id):[],notices:member?state.notices.filter(n=>n.memberId===member.id).slice(0,100):[],purchases:member?state.purchases.filter(p=>p.memberId===member.id):[],paymentReady:false,notificationReady:{email:false,kakao:false,sms:false}};
}
export async function GET(){try{const member=await currentMember();return NextResponse.json(snapshot(await commerceAccess(),member),{headers:{"Cache-Control":"no-store"}});}catch(error){return failure(error);}}
function failure(error:unknown){return NextResponse.json({error:error instanceof CommerceError?error.message:"서비스 요청을 처리하지 못했습니다. 다시 확인해주세요."},{status:error instanceof CommerceError?error.status:503});}
export async function POST(request:Request){
  try{
    sameOrigin(request);if(Number(request.headers.get("content-length")||0)>200000)throw new CommerceError("입력 데이터가 너무 큽니다.",413);
    const input=await request.json();const member=await requireMember();
    if(input.action==="createProject"){
      const state=await commerceAccess();const fresh=state.members.find(m=>m.id===member.id)!;
      if(fresh.role!=="seller")throw new CommerceError("셀러 계정에서 제작해주세요.",403);
      if(!subscribed(fresh)&&fresh.credits<1&&(fresh.trialProject||Date.now()-new Date(fresh.createdAt).getTime()>3*86400000))throw new CommerceError("무료 체험이 종료됐습니다. 이용권을 선택해주세요.",403);
      const supply=state.products.find(p=>p.id===input.productId&&p.status==="approved")||sampleProducts.find(p=>p.id===input.productId);
      if(!supply)throw new CommerceError("공급 상품을 선택해주세요.");
      const id=randomUUID();const info:Product={name:supply.name,category:"식품 · 농수산물",features:`${supply.features}\n원산지: ${supply.origin}\n배송: ${supply.shipping}`,price:"",options:supply.options.map(o=>o.label).join("\n"),images:supply.image?[supply.image]:[],theme:"forest",length:"15",design:{...emptyDesignBrief,photoDirection:{mode:"original",people:false,instructions:"실제 상품 외관을 유지합니다."}}};
      const project:StudioProject={id,product:info,sections:generateSections(info),starred:false,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),supplyProductId:supply.id};
      await commerceAccess(s=>{const m=s.members.find(m=>m.id===member.id)!;if(!subscribed(m)&&m.credits<1){if(m.trialProject||Date.now()-new Date(m.createdAt).getTime()>3*86400000)throw new CommerceError("무료 체험을 이미 사용했습니다.",409);m.trialProject=id;}m.projects.push(id);s.projectProducts[id]=supply.id;});
      await studioAccess(projects=>{projects.unshift(project);});
      return NextResponse.json({ok:true,projectId:id,url:`/studio?project=${id}`});
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
        if(!name||!origin||!features||!shipping||!/^\d{2}:\d{2}$/.test(cutoff))throw new CommerceError("필수 상품 정보와 주문 마감 시간을 입력해주세요.");
        if(image&&!/^\/api\/uploads\/[a-f0-9-]+\.webp$/.test(image))throw new CommerceError("직접 업로드한 실제 상품 사진을 선택해주세요.");
        const options:SupplyProduct["options"]=Array.isArray(input.options)?input.options.slice(0,20).map((o:{id?:string;label?:string;price?:number;stock?:number})=>({id:text(o.id)||randomUUID(),label:text(o.label,100),price:number(o.price,100,10000000),stock:number(o.stock,0,100000)})):[];
        if(!options.length||options.some(o=>!o.label)||new Set(options.map(o=>o.id)).size!==options.length)throw new CommerceError("상품 옵션을 확인해주세요.");
        const next:SupplyProduct={id,supplierId:supplier.id,supplier:supplier.name,name,origin,features,shipping,image,cutoff,category:text(input.category,30)||"포도·기타",options,status:"pending",updatedAt:new Date().toISOString()};
        if(existing){s.products[s.products.indexOf(existing)]=next;for(const m of s.members)if(m.unlocked.includes(id)||m.projects.some(p=>s.projectProducts[p]===id))notice(s,m.id,"공급 조건 변경",`${name}의 공급 조건이 변경되어 검수 중입니다. 최신 내용을 확인해주세요.`);}else s.products.unshift(next);
      }else if(input.action==="approveSupplier"){
        if(actor.role!=="admin")throw new CommerceError("운영자만 처리할 수 있습니다.",403);
        const target=s.members.find(m=>m.id===input.id&&m.role==="supplier");if(!target)throw new CommerceError("공급처를 찾지 못했습니다.");target.approved=true;target.commission=number(input.commission,0,10000);notice(s,target.id,"입점 승인 완료","상품을 등록하고 검수를 요청할 수 있습니다.");
      }else if(input.action==="approveProduct"||input.action==="pauseProduct"){
        const target=s.products.find(p=>p.id===input.id);if(!target)throw new CommerceError("상품을 찾지 못했습니다.");
        if(actor.role!=="admin" && !(input.action==="pauseProduct"&&actor.id===target.supplierId))throw new CommerceError("처리 권한이 없습니다.",403);
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
