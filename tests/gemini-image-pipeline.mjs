import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import vm from "node:vm";
const require=createRequire(import.meta.url),ts=require("typescript"),sharp=require("sharp"),cache=new Map();
const photo=await sharp({create:{width:1600,height:1000,channels:3,background:"#efa51b"}}).webp().toBuffer();
const generated=await sharp({create:{width:900,height:1200,channels:3,background:"#e78b12"}}).png().toBuffer();
let calls=0,reservations=0,written=[],badAsset=false,failProvider=false;
const mocks={"asset-store":{readAsset:async()=>badAsset?Buffer.from("bad image"):photo,writeAsset:async(name,bytes)=>written.push({name,bytes})},"ai-settings":{readAISettings:async()=>({apiKey:"test-only",enabled:true,imageModel:"fixture"})}};
function load(file){
  file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;const module={exports:{}};cache.set(file,module);
  vm.runInNewContext(ts.transpileModule(readFileSync(file,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,{module,exports:module.exports,Buffer,AbortSignal,fetch:async(url,init)=>{
    calls++;assert.equal(reservations,calls,"reserve exactly once immediately before provider request");
    const payload=JSON.parse(init.body),refs=payload.contents[0].parts.filter(p=>p.inlineData);assert.equal(refs.length,2);
    for(const ref of refs){const size=await sharp(Buffer.from(ref.inlineData.data,"base64")).metadata();assert.equal(size.width,1200,"both original images use the default resize width, never array index 0/1");assert.ok(size.height>1);}
    return {ok:!failProvider,status:503,json:async()=>failProvider?{error:{status:"UNAVAILABLE"}}:{candidates:[{finishReason:"STOP",content:{parts:[{inlineData:{mimeType:"image/png",data:generated.toString("base64")}}]}}]}};
  },require:name=>name.startsWith(".")?(mocks[path.basename(name)]||load(path.resolve(path.dirname(file),name+".ts"))):require(name)});
  return module.exports;
}
const {generateSectionImage}=load("lib/gemini-images.ts"),{imageInputPart}=load("lib/ai-image-input.ts");
const images=["/api/uploads/11111111-1111-1111-1111-111111111111.webp","/api/uploads/22222222-2222-2222-2222-222222222222.webp"];
const product={name:"조생감귤",category:"과일",features:"제주 감귤",images,design:{photoDirection:{mode:"mixed",people:false,instructions:"원본 유지"}}};
const section={id:"scene",kind:"detail",title:"한입의 즐거움",body:"과일 시간",image:images[0],visible:true};
const snapshot=JSON.stringify({product,section});
const result=await generateSectionImage(product,section,"detail","",undefined,async()=>{reservations++;});
assert.equal(calls,1);assert.equal(written.length,1);assert.equal((await sharp(written[0].bytes).metadata()).format,"webp");assert.equal(result.imageMeta.originalImage,images[0]);assert.equal(result.imageMeta.source,"ai");assert.ok(result.image.endsWith(written[0].name));assert.equal(JSON.stringify({product,section}),snapshot);
await assert.rejects(()=>imageInputPart(images[0],0),/처리 크기/);
badAsset=true;await assert.rejects(()=>generateSectionImage(product,section,"detail","",undefined,async()=>{reservations++;}));assert.equal(reservations,1,"invalid original images never consume an attempt");assert.equal(calls,1);badAsset=false;
await assert.rejects(()=>generateSectionImage(product,section,"detail","",undefined,async()=>{throw Error("quota");}),/quota/);assert.equal(calls,1,"quota rejection sends no AI request");
failProvider=true;await assert.rejects(()=>generateSectionImage(product,section,"detail","",undefined,async()=>{reservations++;}));assert.equal(calls,2,"no automatic retry after provider failure");assert.equal(reservations,2);assert.equal(written.length,1,"failed provider never overwrites a saved image");
console.log("PASS: real Sharp processing of 2 reference photos, mocked Gemini image response, saved WebP/metadata, no preflight quota consumption and no provider retry. No external AI calls.");
