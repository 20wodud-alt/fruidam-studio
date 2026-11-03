// Explicit integration check: creates disposable Auth accounts and tagged rows,
// never sends email, calls AI or charges a payment. Cleans only its own records.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
process.loadEnvFile(".env.local");
const require=createRequire(import.meta.url),sharp=require("sharp");
const origin=process.env.FRUIDAM_TEST_ORIGIN||"http://127.0.0.1:3010";
if(!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin))throw Error("Integration checks require a local server.");
const base=process.env.SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;
const users=[],projects=new Set();let asset="";const assets=[];
const headers={apikey:key,Authorization:`Bearer ${key}`,"Content-Type":"application/json"};
async function remote(endpoint,body,method){const r=await fetch(`${base}${endpoint}`,{method:method||(body===undefined?"GET":"POST"),headers,...(body===undefined?{}:{body:JSON.stringify(body)})});if(!r.ok)throw Error(`Fixture service request failed (${r.status})`);return r.status===204?null:r.json();}
async function stateUpdate(update){const snapshot=await remote("/rest/v1/rpc/FRUIDAM_commerce_load",{});update(snapshot.document);await remote("/rest/v1/rpc/FRUIDAM_commerce_save",{next_document:snapshot.document,expected_revision:snapshot.revision});}
async function api(session,path,payload){const r=await fetch(`${origin}${path}`,{method:payload===undefined?"GET":"POST",headers:{Origin:origin,...(session?{Cookie:session}:{}),...(payload===undefined?{}:{"Content-Type":"application/json"})},...(payload===undefined?{}:{body:JSON.stringify(payload)})});return {status:r.status,data:await r.json()};}
async function account(role){const email=`fruidam-test-${randomUUID()}@example.invalid`,password=randomUUID()+"!aA1";const user=await remote("/auth/v1/admin/users",{email,password,email_confirm:true,user_metadata:{name:"자동 검증용 계정",role}});users.push(user.id);const r=await fetch(`${origin}/api/account`,{method:"POST",headers:{Origin:origin,"Content-Type":"application/json"},body:JSON.stringify({action:"login",email,password})});assert.equal(r.status,200,"password login");const cookie=r.headers.getSetCookie().map(c=>c.split(";")[0]).join("; ");const profile=await api(cookie,"/api/account");assert.equal(profile.data.member.role,role==="supplier"?"supplier":"seller","metadata cannot grant admin");return {id:user.id,cookie};}
try{
  const unverifiedEmail=`fruidam-auth-test-${randomUUID()}@example.invalid`,unverifiedPassword=randomUUID()+"!aA1";
  const unverified=await remote("/auth/v1/admin/users",{email:unverifiedEmail,password:unverifiedPassword,email_confirm:false});users.push(unverified.id);
  const notConfirmed=await api(null,"/api/account",{action:"login",email:unverifiedEmail,password:unverifiedPassword});assert.equal(notConfirmed.status,401);assert.equal(notConfirmed.data.code,"email_not_confirmed","verification failure has a specific error code");
  const wrongPassword=await api(null,"/api/account",{action:"login",email:unverifiedEmail,password:randomUUID()+"!aA1"});assert.equal(wrongPassword.status,401);assert.equal(wrongPassword.data.code,"invalid_credentials","wrong password is distinct from email verification");
  assert.equal((await api(null,"/api/account",{action:"resendConfirmation",email:"invalid"})).status,400,"invalid email is rejected without sending mail");
  const guest=await api(null,"/api/commerce");assert.equal(guest.status,200);assert.equal(guest.data.member,null);assert.equal(guest.data.orders.length,0);assert.equal(guest.data.members.length,0);
  const seller=await account("seller"),supplier=await account("supplier"),admin=await account("admin");
  await stateUpdate(s=>{s.members.find(m=>m.id===admin.id).role="admin";});
  assert.equal((await api(seller.cookie,"/api/commerce",{action:"approveSupplier",id:supplier.id,commission:1250})).status,403,"seller cannot approve supplier");
  assert.equal((await api(admin.cookie,"/api/commerce",{action:"approveSupplier",id:supplier.id,commission:1250})).status,200);
  const png=await sharp({create:{width:80,height:80,channels:3,background:"#c34030"}}).png().toBuffer();const upload=new FormData();upload.set("file",new File([png],"fixture.png",{type:"image/png"}));const uploadResponse=await fetch(`${origin}/api/uploads`,{method:"POST",headers:{Origin:origin,Cookie:supplier.cookie},body:upload});assert.equal(uploadResponse.status,200);asset=(await uploadResponse.json()).url;assets.push(asset);const secondUpload=await fetch(`${origin}/api/uploads`,{method:"POST",headers:{Origin:origin,Cookie:supplier.cookie},body:upload});assert.equal(secondUpload.status,200);assets.push((await secondUpload.json()).url);
  const productInput={action:"supplierProduct",name:"자동검증 전용 상품",category:"사과·배",origin:"테스트 데이터",features:"자동 검증 후 삭제되는 공급상품",image:asset,images:assets,badge:"국내과일",variety:"부사",taxStatus:"tax_free",shippingLabel:"free",dispatchType:"센터",carrier:"CJ대한통운",productionYear:2026,storageType:"냉장보관",storageInstructions:"0~10도 냉장 보관",jejuSurcharge:3000,remoteSurcharge:6000,cutoff:"12:00",shipping:"검증용 출고 안내",options:[{id:"fixture-option",label:"3kg",price:20000,stock:10}]};
  assert.equal((await api(seller.cookie,"/api/commerce",productInput)).status,403,"seller cannot register supply products");
  const direct=await api(admin.cookie,"/api/commerce",{...productInput,name:"운영자 직접등록 검증 상품"});assert.equal(direct.status,200,"admin can register directly");
  const directProduct=direct.data.products.find(p=>p.supplierId===admin.id);assert.ok(directProduct);assert.equal(directProduct.status,"pending","admin registration still requires product review");assert.equal(directProduct.images.length,2);assert.equal(directProduct.taxStatus,"tax_free");assert.equal(directProduct.productionYear,2026);assert.equal(directProduct.jejuSurcharge,3000);assert.equal(directProduct.carrier,"CJ대한통운");
  for(const invalid of [{taxStatus:"invalid"},{jejuSurcharge:-1},{productionYear:1900},{images:["https://example.invalid/photo.jpg"]},{cutoff:"25:99"}])assert.equal((await api(admin.cookie,"/api/commerce",{...productInput,...invalid})).status,400,"invalid metadata rejected");
  const auto=await api(admin.cookie,"/api/commerce",{...productInput,name:"자동 옵션명 검증",options:[{id:"auto-option",label:"",customLabel:false,grade:"정품",weight:"2kg",size:"중소과",fruitCount:"13과 내외",price:8950,stock:10}]});assert.equal(auto.status,200);const autoProduct=auto.data.products.find(p=>p.name==="자동 옵션명 검증");assert.equal(autoProduct.options[0].label,"정품 2kg / 중소과 / 13과 내외");assert.equal(autoProduct.options[0].customLabel,false);
  assert.equal((await api(supplier.cookie,"/api/commerce",{...productInput,id:directProduct.id})).status,403,"supplier cannot edit admin product");
  const delegated=await api(admin.cookie,"/api/commerce",{...productInput,name:"공급처 대리등록 검증 상품",supplierId:supplier.id});assert.equal(delegated.status,200,"admin can register for approved supplier");
  const delegatedProduct=delegated.data.products.find(p=>p.name==="공급처 대리등록 검증 상품");assert.equal(delegatedProduct.supplierId,supplier.id);
  const edited=await api(admin.cookie,"/api/commerce",{...productInput,id:delegatedProduct.id,name:"공급처 대리수정 검증 상품"});assert.equal(edited.status,200);assert.equal(edited.data.products.find(p=>p.id===delegatedProduct.id).supplierId,supplier.id,"admin edit preserves supplier ownership");
  const oldShape={action:"supplierProduct",id:delegatedProduct.id,name:"이전 양식 수정 검증",origin:productInput.origin,features:productInput.features,shipping:productInput.shipping,image:asset,cutoff:"12:00",options:productInput.options};const compatible=await api(admin.cookie,"/api/commerce",oldShape);assert.equal(compatible.status,200);const preserved=compatible.data.products.find(p=>p.id===delegatedProduct.id);assert.equal(preserved.images.length,2);assert.equal(preserved.taxStatus,"tax_free");assert.equal(preserved.storageInstructions,"0~10도 냉장 보관");
  const saved=await api(supplier.cookie,"/api/commerce",productInput);assert.equal(saved.status,200);const product=saved.data.products.find(p=>p.supplierId===supplier.id);assert.ok(product);assert.equal(product.status,"pending");
  assert.equal((await api(null,`/api/commerce/product-draft?productId=${product.id}`)).status,401,"prefill requires login");
  assert.equal((await api(seller.cookie,`/api/commerce/product-draft?productId=${product.id}`)).status,403,"seller cannot prefill private pending products");
  assert.equal((await api(supplier.cookie,`/api/commerce/product-draft?productId=${directProduct.id}`)).status,403,"supplier cannot import another supplier's product");
  const supplierDraft=await api(supplier.cookie,`/api/commerce/product-draft?productId=${product.id}`);assert.equal(supplierDraft.status,200);assert.equal(supplierDraft.data.product.name,product.name);assert.deepEqual(supplierDraft.data.product.images,assets);assert.ok(supplierDraft.data.product.features.includes(product.origin));assert.ok(supplierDraft.data.product.features.includes("냉장보관"));assert.equal(supplierDraft.data.product.price,"","wholesale cost must not become a consumer sales price");assert.equal(supplierDraft.data.product.design.photoDirection.mode,"original","import does not initiate image generation");
  assert.equal((await api(admin.cookie,`/api/commerce/product-draft?productId=${product.id}`)).status,200,"admin can import pending registered products");
  assert.equal((await api(seller.cookie,"/api/account")).data.member.trialProject,undefined,"prefill does not reserve trial usage");assert.equal((await api(supplier.cookie,"/api/account")).data.member.projects.length,0,"prefill does not create projects");
  assert.equal((await api(admin.cookie,"/api/commerce",{action:"approveProduct",id:product.id})).status,200);
  const created=await api(seller.cookie,"/api/commerce",{action:"createProject",productId:product.id});assert.equal(created.status,200);projects.add(created.data.projectId);
  assert.equal((await api(seller.cookie,"/api/commerce",{action:"createProject",productId:product.id})).status,403,"trial is one project");
  const own=await api(seller.cookie,"/api/studio");assert.equal(own.status,200);assert.equal(own.data.length,1);assert.equal(own.data[0].id,created.data.projectId);assert.equal(own.data[0].product.images.length,2);assert.ok(own.data[0].product.features.includes("냉장보관"));
  const foreign=await api(supplier.cookie,"/api/studio");assert.equal(foreign.data.length,0,"projects isolated by account");
  assert.equal((await api(seller.cookie,"/api/commerce/export",{projectId:created.data.projectId,mode:"check"})).status,403,"trial cannot download");
  assert.equal((await api(supplier.cookie,"/api/commerce/export",{projectId:created.data.projectId,mode:"check"})).status,403,"other account cannot export");
  assert.equal((await api(seller.cookie,"/api/ai-settings",{enabled:false})).status,403,"seller cannot modify shared AI settings");
  const order={action:"createOrder",productId:product.id,optionId:"fixture-option",quantity:2,unitPrice:20000,recipient:"자동검증",phone:"01000000000",address:"자동 검증 전용 배송지 123",note:"실제 배송 금지",shippingRegion:"mainland"};
  assert.equal((await api(seller.cookie,"/api/commerce",order)).status,403,"trial cannot order");
  await stateUpdate(s=>{s.members.find(m=>m.id===seller.id).unlocked.push(product.id);});
  assert.equal((await api(seller.cookie,"/api/commerce",{...order,unitPrice:1})).status,409,"tampered price rejected");
  const pending=await api(seller.cookie,"/api/commerce",order);assert.equal(pending.status,200);const placed=pending.data.orders[0];assert.equal(placed.amount,40000);assert.equal(placed.status,"payment_pending");assert.equal(pending.data.products.find(p=>p.id===product.id).options[0].stock,10,"draft does not decrement stock");
  assert.equal((await api(seller.cookie,"/api/commerce",{action:"importOrders",rows:[order,{...order,phone:"bad"}]})).status,400,"invalid batch rejected");
  assert.equal((await api(seller.cookie,"/api/commerce")).data.orders.length,1,"invalid batch creates no partial orders");
  assert.equal((await api(seller.cookie,"/api/commerce",{action:"importOrders",rows:[order,order]})).status,200,"valid batch accepted");
  const regional=await api(seller.cookie,"/api/commerce",{action:"importOrders",rows:[{...order,shippingRegion:"제주",shippingSurcharge:1}]});assert.equal(regional.status,200);assert.equal(regional.data.orders[0].shippingSurcharge,3000);assert.equal(regional.data.orders[0].amount,43000,"server calculates regional fee once, ignoring client amount");
  assert.notEqual((await api(supplier.cookie,"/api/commerce",{action:"orderStatus",id:placed.id,status:"paid"})).status,200,"manual status cannot fake payment");
  // Fixture-only paid order, without any real provider call.
  await stateUpdate(s=>{s.orders.find(o=>o.id===placed.id).status="paid";});
  assert.equal((await api(seller.cookie,"/api/commerce",{action:"orderStatus",id:placed.id,status:"preparing"})).status,403,"seller cannot dispatch");
  assert.equal((await api(supplier.cookie,"/api/commerce",{action:"orderStatus",id:placed.id,status:"preparing"})).status,200);
  assert.equal((await api(supplier.cookie,"/api/commerce",{action:"orderStatus",id:placed.id,status:"shipping",carrier:"검증용",tracking:"000000"})).status,200);
  assert.equal((await api(supplier.cookie,"/api/commerce",{action:"orderStatus",id:placed.id,status:"delivered"})).status,200);
  assert.equal((await api(admin.cookie,"/api/commerce",{action:"settle",ids:[placed.id]})).status,200);
  const notices=await api(seller.cookie,"/api/commerce");assert.ok(notices.data.notices.some(n=>n.title.includes("배송 완료")));
  assert.equal((await api(admin.cookie,"/api/commerce",{action:"approveProduct",id:directProduct.id})).status,200);
  await stateUpdate(s=>{s.members.find(m=>m.id===seller.id).unlocked.push(directProduct.id);});
  assert.equal((await api(seller.cookie,"/api/commerce",{...order,productId:directProduct.id})).status,200,"admin-managed supply product supports order drafts");
  assert.equal((await api(seller.cookie,"/api/commerce",{action:"revokeSupplierApproval",id:supplier.id})).status,403,"seller cannot revoke supplier approval");
  const revoked=await api(admin.cookie,"/api/commerce",{action:"revokeSupplierApproval",id:supplier.id});assert.equal(revoked.status,200);assert.equal(revoked.data.members.find(m=>m.id===supplier.id).approved,false);assert.equal(revoked.data.products.find(p=>p.id===product.id).status,"paused");assert.ok(revoked.data.orders.find(o=>o.id===placed.id).settledAt,"existing settlement preserved");
  assert.equal((await api(supplier.cookie,"/api/commerce",productInput)).status,403,"revoked supplier cannot register new products");
  assert.equal((await api(supplier.cookie,"/api/commerce",{action:"createProject",productId:product.id})).status,403,"revoked supplier cannot start new source projects");
  assert.equal((await api(seller.cookie,"/api/commerce",order)).status,403,"revoked supplier cannot receive new orders");
  assert.equal((await api(admin.cookie,"/api/commerce",{action:"approveProduct",id:product.id})).status,400,"product cannot bypass revoked supplier approval");
  assert.equal((await api(admin.cookie,"/api/commerce",{action:"approveSupplier",id:supplier.id,commission:1250})).status,200);assert.equal((await api(admin.cookie,"/api/commerce",{action:"approveProduct",id:product.id})).status,200,"reapproval and product review restore availability");
  const sourceRequest=randomUUID(),editedInfo={...supplierDraft.data.product,name:"입력 단계에서 수정한 상품명",price:"29,800원",features:supplierDraft.data.product.features+"\n입력 단계 수정",images:[...assets].reverse()};
  const sourceProject=await api(supplier.cookie,"/api/commerce",{action:"createProject",productId:product.id,requestId:sourceRequest,product:editedInfo});assert.equal(sourceProject.status,200);projects.add(sourceProject.data.projectId);assert.notEqual(sourceProject.data.projectId,sourceRequest,"client cannot choose an existing private project id");assert.equal(sourceProject.data.project.product.name,editedInfo.name);assert.deepEqual(sourceProject.data.project.product.images,editedInfo.images);assert.equal(sourceProject.data.project.supplyProductId,product.id);assert.equal((await api(supplier.cookie,"/api/account")).data.member.trialProject,undefined,"supplier creation is not a seller trial");
  const replay=await api(supplier.cookie,"/api/commerce",{action:"createProject",productId:product.id,requestId:sourceRequest,product:editedInfo});assert.equal(replay.status,200);assert.equal(replay.data.projectId,sourceProject.data.projectId,"retry reuses the same owned project");
  assert.equal((await api(supplier.cookie,"/api/account")).data.member.projects.filter(id=>id===sourceProject.data.projectId).length,1,"retry does not duplicate membership");
  const adminSource=await api(admin.cookie,"/api/commerce",{action:"createProject",productId:product.id,requestId:sourceRequest,product:editedInfo});assert.equal(adminSource.status,200);projects.add(adminSource.data.projectId);assert.notEqual(adminSource.data.projectId,sourceProject.data.projectId,"same request id from another member cannot claim a project");
  assert.equal((await api(supplier.cookie,"/api/commerce",{action:"createProject",productId:product.id,product:{...editedInfo,images:Array(11).fill(asset)}})).status,400,"edited product input is validated");
  assert.equal((await api(admin.cookie,"/api/commerce")).data.products.find(p=>p.id===product.id).name,product.name,"project edits do not change registered supply products");
  console.log("PASS: real Auth login, role escalation prevention, supplier approval/product review/revocation, scoped studio, trial/export limits, price validation, order states, notifications and settlement records. Extended product metadata/gallery, automatic option labels, legacy edits and regional shipping also verified. No email, AI or payment calls.");
}finally{
  const ids=new Set(users);
  await stateUpdate(s=>{for(const m of s.members.filter(m=>ids.has(m.id)))for(const id of m.projects)projects.add(id);s.members=s.members.filter(m=>!ids.has(m.id));s.products=s.products.filter(p=>!ids.has(p.supplierId));s.orders=s.orders.filter(o=>!ids.has(o.sellerId)&&!ids.has(o.supplierId));s.claims=s.claims.filter(c=>!ids.has(c.sellerId)&&!ids.has(c.supplierId));s.notices=s.notices.filter(n=>!ids.has(n.memberId));s.purchases=s.purchases.filter(p=>!ids.has(p.memberId));for(const id of projects){delete s.projectProducts[id];delete s.downloads[id];delete s.imageUsage[id];}});
  const all=await remote("/rest/v1/rpc/FRUIDAM_load_projects",{});const deletions=all.filter(row=>projects.has(row.project.id)).map(row=>({id:row.project.id,expected_revision:row.revision}));if(deletions.length)await remote("/rest/v1/rpc/FRUIDAM_apply_changes",{changes:[],deletions});
  if(assets.length)await remote("/storage/v1/object/fruidam-assets",{prefixes:assets.map(url=>url.split("/").at(-1))},"DELETE");
  for(const id of users)await remote(`/auth/v1/admin/users/${id}`,undefined,"DELETE");
  console.log("Disposable integration accounts and records cleaned up.");
}
