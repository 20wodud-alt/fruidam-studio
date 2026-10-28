/* eslint-disable @typescript-eslint/no-require-imports -- pure TypeScript export fixtures */
const fs=require('node:fs'),ts=require('typescript'),vm=require('node:vm'),assert=require('node:assert/strict');
const mod={exports:{}};vm.runInNewContext(`(function(exports){${ts.transpileModule(fs.readFileSync('lib/market-export.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText}})`)(mod.exports);
const {tileEnd,exportStem,escapeExportHtml,marketProfiles}=mod.exports;
assert.equal(marketProfiles.smartstore.width,848);assert.equal(marketProfiles.coupang.width,780);
assert.equal(tileEnd(0,4000,9000,[1800,3700,8000],[]),3700);
assert.equal(tileEnd(0,4000,9000,[],[{top:3990,bottom:4030}]),3989);
assert.equal(tileEnd(4000,4000,6500,[],[]),6500);
const total=42017,boundaries=[7889,15778,23667,31556,39445],bands=[{top:3990,bottom:4020},{top:7870,bottom:7900}];let start=0,heights=[];
while(start<total){const end=tileEnd(start,4000,total,boundaries,bands);assert(end>start&&end-start<=4000);if(end!==total)assert(!bands.some(b=>b.top<end&&b.bottom>end));heights.push(end-start);start=end;}
assert.equal(heights.reduce((a,b)=>a+b,0),total);
assert.equal(exportStem('a/b:c*?<>|'),'a_b_c_____');assert.equal(escapeExportHtml('<script>"&'),'&lt;script&gt;&quot;&amp;');
console.log('PASS: output presets, safe section/text cuts, long-page full coverage, filenames and HTML escaping.');
