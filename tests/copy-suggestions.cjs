/* eslint-disable @typescript-eslint/no-require-imports -- isolated TypeScript fixtures */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript'),assert=require('node:assert/strict');
const modules=new Map();function load(file){file=path.resolve(file);if(modules.has(file))return modules.get(file);const m={exports:{}};modules.set(file,m.exports);const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(`(function(require,module,exports){${code}\n})`)(name=>name.startsWith('.')?load(path.join(path.dirname(file),name+'.ts')):require(name),m,m.exports);return m.exports;}
const {suggestionMatches,applyCopySuggestion}=load('lib/apply-copy-suggestion.ts');
const {applySuggestionWithUndo,undoCopySuggestion}=load('lib/apply-copy-suggestion.ts');
const {isAdvisorySuggestion}=load('lib/copy-suggestion-format.ts');
const {auditFingerprint,currentAudit,validateCopyAudit}=load('lib/copy-audit.ts');
const section={id:'s1',kind:'hero',title:'최고의 사과',body:'아삭하요. 아삭하요.',kicker:'좋은 아침',visible:true,reviewed:true,image:'',format:{title:{fontSize:45}},elements:[{id:'badge',type:'badge',text:'최고의 사과'}]};
let p={id:'p',product:{name:'사과',features:'아삭한 식감',category:'식품',price:'',options:''},sections:[section,{...section,id:'s2'}]};
const check={category:'claims',status:'warning',quote:'최고의',suggestion:'제철의'};const original=JSON.stringify(p);let matches=suggestionMatches(section,check);assert.equal(matches.length,2);
const advice='구체적인 판매 수량이나 기한을 명시하거나 객관적인 표현으로 수정하는 것을 권장합니다.';
assert(isAdvisorySuggestion(advice));assert(!isAdvisorySuggestion('아삭한 식감으로 즐기는 사과'));assert(!isAdvisorySuggestion('매일의 식탁에 추천드립니다'));
assert.equal(suggestionMatches(section,{...check,suggestion:advice}).length,0);
let next=applyCopySuggestion(p,'s1',check,matches[1].key);assert.equal(next.sections[0].elements[0].text,'제철의 사과');assert.equal(next.sections[0].title,section.title);assert.equal(next.sections[1].title,section.title);assert.equal(next.sections[0].format.title.fontSize,45);assert.equal(JSON.stringify(p),original);assert.equal(next.sections[0].reviewed,false);
const spelling={category:'spelling',status:'error',target:'body',quote:'아삭하요.',suggestion:'아삭해요.'};matches=suggestionMatches(section,spelling);assert.equal(matches.length,2);next=applyCopySuggestion(p,'s1',spelling,matches[1].key);assert.equal(next.sections[0].body,'아삭하요. 아삭해요.');
assert.throws(()=>applyCopySuggestion(next,'s1',spelling,matches[1].key));assert.equal(suggestionMatches(section,{...check,target:'title'}).length,1);
assert.throws(()=>applyCopySuggestion(p,'s1',{...check,target:'title',suggestion:'가'.repeat(150)},'title:0'));
assert.equal(suggestionMatches({...section,format:{title:{hidden:true}}},{...check,target:'title'}).length,0);
p.copyAudit={mode:'gemini',searched:false,sections:[{id:'s1',fingerprint:auditFingerprint(p,section),checks:[spelling,check]}]};assert(currentAudit(p,section));next=applyCopySuggestion(p,'s1',spelling,matches[0].key);assert(!currentAudit(next,next.sections[0]));assert.equal(validateCopyAudit(p.copyAudit).sections[0].checks[0].target,'body');
const transaction=applySuggestionWithUndo(p,'s1',spelling,matches[0].key);let undone=undoCopySuggestion(transaction.project,transaction.undo);assert.equal(undone.sections[0].body,section.body);assert(currentAudit(undone,undone.sections[0]));assert.equal(undone.sections[0].reviewed,true);
let changed={...transaction.project,sections:transaction.project.sections.map((s,i)=>i===0?{...s,title:'다른 제목',format:{title:{fontSize:55}}}:s)};undone=undoCopySuggestion(changed,transaction.undo);assert.equal(undone.sections[0].title,'다른 제목');assert.equal(undone.sections[0].format.title.fontSize,55);assert.equal(undone.sections[0].reviewed,false);
changed={...transaction.project,sections:transaction.project.sections.map((s,i)=>i===0?{...s,body:'이후 직접 고친 내용'}:s)};assert.throws(()=>undoCopySuggestion(changed,transaction.undo));
const transaction2=applySuggestionWithUndo(transaction.project,'s1',{...check,target:'title'},'title:0');undone=undoCopySuggestion(undoCopySuggestion(transaction2.project,transaction2.undo),transaction.undo);assert.equal(undone.sections[0].title,section.title);assert.equal(undone.sections[0].body,section.body);
const rerun={...transaction.project,copyAudit:{...p.copyAudit,sections:[{id:'s1',fingerprint:auditFingerprint(transaction.project,transaction.project.sections[0]),checks:[{...spelling,status:'pass',quote:'',suggestion:''},check]}]}};undone=undoCopySuggestion(rerun,transaction.undo);assert(currentAudit(undone,undone.sections[0]));
console.log('PASS: exact field/occurrence replacement, duplicate location choice, stale/hidden guards, length limits, untouched formats/other sections, review invalidation and target persistence.');
