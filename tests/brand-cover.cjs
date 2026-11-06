/* eslint-disable @typescript-eslint/no-require-imports */
// Render the real shared document: cover precedes editable sections and is never
// serialized into, or mutated with, the seller's product data. No API calls.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const cache=new Map();
function load(file){
  file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;
  const module={exports:{}};cache.set(file,module);
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,{module,exports:module.exports,require:name=>{
    if(name.startsWith('.')||name.startsWith('@/')){const base=name.startsWith('@/')?path.resolve(name.slice(2)):path.resolve(path.dirname(file),name);return load(['.ts','.tsx'].map(ext=>base+ext).find(p=>fs.existsSync(p)));}
    return require(name);
  }});return module.exports;
}
const {DetailPage,detailStyles}=load('components/detail-page.tsx');
const product={name:'검증 감귤',category:'식품',features:'원본 특징',options:'10kg',images:[],price:'',theme:'forest',length:'15'};
const sections=[{id:'hero',kind:'hero',title:'상품 이야기',body:'상품 본문',image:'',visible:true},{id:'hidden',kind:'detail',title:'숨긴 문구',body:'',image:'',visible:false}];
const project={id:'fixture',supplyProductId:'source',product,sections};
const original=JSON.stringify(project),render=props=>renderToStaticMarkup(React.createElement(DetailPage,{project,...props}));
const html=render({onSelect:()=>{},onSelectElement:()=>{}});
assert.equal((html.match(/data-brand-cover=/g)||[]).length,1);
assert.ok(html.indexOf('data-brand-cover=')<html.indexOf('data-section="hero"'));
const cover=html.slice(html.indexOf('data-brand-cover='),html.indexOf('data-section="hero"'));
assert.ok(cover.includes('/fruitdam-logo.png'));assert.ok(cover.includes('산지의 신선함을,'));
assert.ok(!cover.includes('data-element='));assert.ok(!cover.includes('contenteditable'));
assert.ok(!html.includes('숨긴 문구'));assert.equal(JSON.stringify(project),original);
assert.ok(!render({includeBrandCover:false}).includes('data-brand-cover='),'thumbnails omit fixed cover');
assert.ok(!render({project:{...project,supplyProductId:undefined}}).includes('data-brand-cover='),'legacy standalone projects remain unchanged');
assert.ok(render({project:{...project,sections:[sections[1]]}}).includes('data-brand-cover='),'hiding product sections cannot remove cover');
assert.ok(detailStyles.includes('.fb-cover'));assert.ok(detailStyles.includes('Gowun Batang'),'offline HTML includes cover styling');
console.log('PASS: one fixed cover before product pages, no editing targets, source data preserved, no duplicate thumbnail covers, hidden sections excluded, offline cover CSS included.');
