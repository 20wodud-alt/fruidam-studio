import { reviewTexts, type AuditCheck, type SectionAudit } from "./copy-audit";
import type { Section } from "./studio";
export function bindAuditChecks(section:Section,result?:SectionAudit) {
  const fields=reviewTexts(section);
  return (result?.checks || []).filter(c=>c.status!=="pass" && ["spelling","claims"].includes(c.category)).map((check,index)=>({check,index,targets:check.target?[check.target]:check.quote?fields.filter(field=>field.value.includes(check.quote!)).map(field=>field.target):[]}));
}
export function reviewHighlightRanges(value:string,checks:AuditCheck[]) {
  const ranges:{start:number;end:number}[]=[];
  for(const check of checks){if(check.status==="pass" || !check.quote)continue;let start=0;while((start=value.indexOf(check.quote,start))!==-1){ranges.push({start,end:start+check.quote.length});start+=check.quote.length;}}
  ranges.sort((a,b)=>a.start-b.start||a.end-b.end);
  const merged:typeof ranges=[];
  for(const range of ranges){const last=merged.at(-1);if(last && range.start<=last.end)last.end=Math.max(last.end,range.end);else merged.push({...range});}
  return merged;
}
