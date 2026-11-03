import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import vm from "node:vm";
import { webcrypto } from "node:crypto";
const require=createRequire(import.meta.url),ts=require("typescript"),cache=new Map();
let enabled=false,requestBody;
const mocks={"ai-settings":{readAISettings:async()=>({enabled,apiKey:enabled?"test-only":"",model:"fixture",research:true})},"ai-image-input":{imageInputPart:()=>{throw Error("Copy should not upload photos.");}}};
function load(file){
  file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;
  const module={exports:{}};cache.set(file,module);
  vm.runInNewContext(ts.transpileModule(readFileSync(file,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,crypto:webcrypto,AbortSignal,fetch:async(url,init)=>{
    requestBody=JSON.parse(init.body);assert.equal(requestBody.tools,undefined,"composition does not trigger external search");
    const data=JSON.parse(requestBody.contents[0].parts[0].text);
    return {ok:true,json:async()=>({candidates:[{finishReason:"STOP",content:{parts:[{text:JSON.stringify({summary:"fixture",reviewInsights:[],sections:data.sections.map((s,i)=>({...s,title:`새로운 과일 카피 ${i}`,body:s.kind==="options"?data.product.options:`다듬은 핵심 설명 ${i}`,kicker:"FRUIT",imageDirection:`${i%2?"과육 접사":"탑뷰 식탁"} 자연광`}))})}]}}]})};
  },require:name=>{if(name.startsWith(".")){const key=path.basename(name);return mocks[key]||load(path.resolve(path.dirname(file),name+".ts"));}return require(name);}});
  return module.exports;
}
const {generateSections}=load("lib/studio.ts"),{buildImagePlan,buildImagePrompt}=load("lib/image-plan.ts"),{composeCopy}=load("lib/ai-copywriter.ts"),{fruitCompositionRequest}=load("lib/fruit-composition.ts");
const product={name:"타이벳 조생감귤",category:"식품 · 농수산물",features:"제주의 풍부한 일조량과 영양가득 토양 기른 고당도 감귤\n당도 측정검수 후 달콤새콤 맛있는 귤\n산지 직송으로 신선하게 보내드려요",options:"10kg / 대과",price:"",images:["/fruit-a.webp","/fruit-b.webp","/fruit-c.webp"],theme:"forest",length:"15",design:{brief:"",photoDirection:{mode:"mixed",people:false,instructions:"원본 외관 유지"}}};
const before=JSON.stringify(product),sections=generateSections(product);
assert.equal(JSON.stringify(product),before,"source input stays untouched");assert.equal(sections.length,15);assert.notEqual(sections[0].title,product.name,"hero uses a hook");assert.ok(sections[0].body.includes(product.name));assert.equal(sections[0].image,product.images[0]);
assert.notEqual(sections.find(s=>s.kind==="benefits").body,product.features,"points are polished");assert.equal(sections.find(s=>s.kind==="options").body,product.options);assert.ok(new Set(sections.filter(s=>s.kind==="detail").map(s=>s.title)).size>=5);
assert.ok(!JSON.stringify(sections).includes("추가해주세요"));
const jobs=buildImagePlan(product,sections);assert.equal(jobs.length,3);assert.equal(new Set(jobs.map(j=>j.sectionId)).size,3);assert.ok(jobs.every(j=>!["hero","options"].includes(sections.find(s=>s.id===j.sectionId).kind)));
assert.deepEqual(Array.from(jobs,j=>j.scene),["farm","detail","lifestyle"]);assert.ok(buildImagePrompt(product,sections[1],"lifestyle").includes("neutral dining-table setting"));
const marked=sections.map(s=>jobs.some(j=>j.sectionId===s.id)?{...s,imageMeta:{source:"ai"}}:s);assert.equal(buildImagePlan(product,marked).length,0,"already generated slots are not retried automatically");
enabled=true;const generated=await composeCopy(product,sections,fruitCompositionRequest,false);
assert.equal(generated.report.mode,"gemini");assert.ok(requestBody.systemInstruction.parts[0].text.includes('"imageDirection":"section-specific'));
assert.equal(generated.sections[0].image,sections[0].image);assert.equal(generated.sections.find(s=>s.kind==="options").body,product.options);assert.ok(generated.sections.every(s=>s.imageDirection));assert.equal(JSON.stringify(product),before);
console.log("PASS: fruit hooks, polished points, preserved source/options/hero, distinct scene slots, no retries, mocked Gemini composition and art-direction schema. No external AI calls.");
