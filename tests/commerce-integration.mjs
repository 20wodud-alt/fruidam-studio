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
const users=[],projects=new Set();let asset="";
const headers={apikey:key,Authorization:`Bearer ${key}`,"Content-Type":"application/json"};
async function remote(endpoint,body,method){const r=await fetch(`${base}${endpoint}`,{method:method||(body===undefined?"GET":"POST"),headers,...(body===undefined?{}:{body:JSON.stringify(body)})});if(!r.ok)throw Error(`Fixture service request failed (${r.status})`);return r.status===204?null:r.json();}
async function stateUpdate(update){const snapshot=await remote("/rest/v1/rpc/FRUIDAM_commerce_load",{});update(snapshot.document);await remote("/rest/v1/rpc/FRUIDAM_commerce_save",{next_document:snapshot.document,expected_revision:snapshot.revision});}
async function api(session,path,payload){const r=await fetch(`${origin}${path}`,{method:payload===undefined?"GET":"POST",headers:{Origin:origin,...(session?{Cookie:session}:{}),...(payload===undefined?{}:{"Content-Type":"application/json"})},...(payload===undefined?{}:{body:JSON.stringify(payload)})});return {status:r.status,data:await r.json()};}
async function account(role){const email=`fruidam-test-${randomUUID()}@example.invalid`,password=randomUUID()+"!aA1";const user=await remote("/auth/v1/admin/users",{email,password,email_confirm:true,user_metadata:{name:"자동 검증용 계정",role}});users.push(user.id);const r=await fetch(`${origin}/api/account`,{method:"POST",headers:{Origin:origin,"Content-Type":"application/json"},body:JSON.stringify({action:"login",email,password})});assert.equal(r.status,200,"password login");const cookie=r.headers.getSetCookie().map(c=>c.split(";")[0]).join("; ");const profile=await api(cookie,"/api/account");assert.equal(profile.data.member.role,role==="supplier"?"supplier":"seller","metadata cannot grant admin");return {id:user.id,cookie};}
try{
  const guest=await api(null,"/api/commerce");assert.equal(guest.status,200);assert.equal(guest.data.member,null);assert.equal(guest.data.orders.length,0);assert.equal(guest.data.members.length,0);
  const seller=await account("seller"),supplier=await account("supplier"),admin=await account("admin");
  await stateUpdate(s=>{s.members.find(m=>m.id===admin.id).role="admin";});
  assert.equal((await api(seller.cookie,"/api/commerce",{action:"approveSupplier",id:supplier.id,commission:1250})).status,403,"seller cannot approve supplier");
  assert.equal((await api(admin.cookie,"/api/commerce",{action:"approveSupplier",id:supplier.id,commission:1250})).status,200);
  const png=await sharp({create:{width:80,height:80,channels:3,background:"#c34030"}}).png().toBuffer();const upload=new FormData();upload.set("file",new File([png],"fixture.png",{type:"image/png"}));const uploadResponse=await fetch(`${origin}/api/uploads`,{method:"POST",headers:{Origin:origin,Cookie:supplier.cookie},body:upload});assert.equal(uploadResponse.status,200);asset=(await uploadResponse.json()).url;
  const productInput={action:"supplierProduct",name:"자동검증 전용 상품",category:"사과·배",origin:"테스트 데이터",features:"자동 검증 후 삭제되는 공급상품",image:asset,cutoff:"12:00",shipping:"검증용 출고 안내",options:[{id:"fixture-option",label:"3kg",price:20000,stock:10}]};
  const saved=await api(supplier.cookie,"/api/commerce",productInput);assert.equal(saved.status,200);const product=saved.data.products.find(p=>p.supplierId===supplier.id);assert.ok(product);assert.equal(product.status,"pending");
  assert.equal((await api(admin.cookie,"/api/commerce",{action:"approveProduct",id:product.id})).status,200);
  const created=await api(seller.cookie,"/api/commerce",{action:"createProject",productId:product.id});assert.equal(created.status,200);projects.add(created.data.projectId);
  assert.equal((await api(seller.cookie,"/api/commerce",{action:"createProject",productId:product.id})).status,403,"trial is one project");
  const own=await api(seller.cookie,"/api/studio");assert.equal(own.status,200);assert.equal(own.data.length,1);assert.equal(own.data[0].id,created.data.projectId);
  const foreign=await api(supplier.cookie,"/api/studio");assert.equal(foreign.data.length,0,"projects isolated by account");
  assert.equal((await api(seller.cookie,"/api/commerce/export",{projectId:created.data.projectId,mode:"check"})).status,403,"trial cannot download");
  assert.equal((await api(supplier.cookie,"/api/commerce/export",{projectId:created.data.projectId,mode:"check"})).status,403,"other account cannot export");
  assert.equal((await api(seller.cookie,"/api/ai-settings",{enabled:false})).status,403,"seller cannot modify shared AI settings");
  const order={action:"createOrder",productId:product.id,optionId:"fixture-option",quantity:2,unitPrice:20000,recipient:"자동검증",phone:"01000000000",address:"자동 검증 전용 배송지 123",note:"실제 배송 금지"};
  assert.equal((await api(seller.cookie,"/api/commerce",order)).status,403,"trial cannot order");
  await stateUpdate(s=>{s.members.find(m=>m.id===seller.id).unlocked.push(product.id);});
  assert.equal((await api(seller.cookie,"/api/commerce",{...order,unitPrice:1})).status,409,"tampered price rejected");
  const pending=await api(seller.cookie,"/api/commerce",order);assert.equal(pending.status,200);const placed=pending.data.orders[0];assert.equal(placed.amount,40000);assert.equal(placed.status,"payment_pending");assert.equal(pending.data.products.find(p=>p.id===product.id).options[0].stock,10,"draft does not decrement stock");
  assert.equal((await api(seller.cookie,"/api/commerce",{action:"importOrders",rows:[order,{...order,phone:"bad"}]})).status,400,"invalid batch rejected");
  assert.equal((await api(seller.cookie,"/api/commerce")).data.orders.length,1,"invalid batch creates no partial orders");
  assert.equal((await api(seller.cookie,"/api/commerce",{action:"importOrders",rows:[order,order]})).status,200,"valid batch accepted");
  assert.notEqual((await api(supplier.cookie,"/api/commerce",{action:"orderStatus",id:placed.id,status:"paid"})).status,200,"manual status cannot fake payment");
  // Fixture-only paid order, without any real provider call.
  await stateUpdate(s=>{s.orders.find(o=>o.id===placed.id).status="paid";});
  assert.equal((await api(seller.cookie,"/api/commerce",{action:"orderStatus",id:placed.id,status:"preparing"})).status,403,"seller cannot dispatch");
  assert.equal((await api(supplier.cookie,"/api/commerce",{action:"orderStatus",id:placed.id,status:"preparing"})).status,200);
  assert.equal((await api(supplier.cookie,"/api/commerce",{action:"orderStatus",id:placed.id,status:"shipping",carrier:"검증용",tracking:"000000"})).status,200);
  assert.equal((await api(supplier.cookie,"/api/commerce",{action:"orderStatus",id:placed.id,status:"delivered"})).status,200);
  assert.equal((await api(admin.cookie,"/api/commerce",{action:"settle",ids:[placed.id]})).status,200);
  const notices=await api(seller.cookie,"/api/commerce");assert.ok(notices.data.notices.some(n=>n.title.includes("배송 완료")));
  console.log("PASS: real Auth login, role escalation prevention, supplier approval/product review, scoped studio, trial/export limits, price validation, order states, notifications and settlement records. No email, AI or payment calls.");
}finally{
  const ids=new Set(users);
  await stateUpdate(s=>{for(const m of s.members.filter(m=>ids.has(m.id)))for(const id of m.projects)projects.add(id);s.members=s.members.filter(m=>!ids.has(m.id));s.products=s.products.filter(p=>!ids.has(p.supplierId));s.orders=s.orders.filter(o=>!ids.has(o.sellerId)&&!ids.has(o.supplierId));s.claims=s.claims.filter(c=>!ids.has(c.sellerId)&&!ids.has(c.supplierId));s.notices=s.notices.filter(n=>!ids.has(n.memberId));s.purchases=s.purchases.filter(p=>!ids.has(p.memberId));for(const id of projects){delete s.projectProducts[id];delete s.downloads[id];delete s.imageUsage[id];}});
  const all=await remote("/rest/v1/rpc/FRUIDAM_load_projects",{});const deletions=all.filter(row=>projects.has(row.project.id)).map(row=>({id:row.project.id,expected_revision:row.revision}));if(deletions.length)await remote("/rest/v1/rpc/FRUIDAM_apply_changes",{changes:[],deletions});
  if(asset)await remote("/storage/v1/object/fruidam-assets",{prefixes:[asset.split("/").at(-1)]},"DELETE");
  for(const id of users)await remote(`/auth/v1/admin/users/${id}`,undefined,"DELETE");
  console.log("Disposable integration accounts and records cleaned up.");
}
