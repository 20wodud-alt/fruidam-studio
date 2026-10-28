import { auditFingerprint, currentAudit, reviewTexts, type AuditCheck, type SectionAudit } from "./copy-audit";
import { isAdvisorySuggestion } from "./copy-suggestion-format";
import type { Section, StudioProject } from "./studio";
export type SuggestionMatch = { key: string; target: string; start: number; label: string };
export type CopySuggestionUndo = { sectionId:string; target:string; before:string; after:string; fingerprint:string; reviewed:boolean; audit?:SectionAudit };
const fieldNames: Record<string, string> = { title: "제목", body: "본문", kicker: "서브 카피" };
export function suggestionMatches(section: Section, check: AuditCheck): SuggestionMatch[] {
  if (!check.quote || !check.suggestion || check.quote === check.suggestion || isAdvisorySuggestion(check.suggestion)) return [];
  const matches: SuggestionMatch[] = [];
  for (const field of reviewTexts(section)) {
    if (check.target && field.target !== check.target) continue;
    let start = 0, occurrence = 0;
    while ((start = field.value.indexOf(check.quote, start)) !== -1) {
      occurrence++;
      const context = field.value.slice(Math.max(0, start - 18), start + check.quote.length + 18).replace(/\n/g, " ");
      matches.push({ key: `${field.target}:${start}`, target: field.target, start, label: `${fieldNames[field.target] || "추가 문구"} · ${occurrence}번째 · ${context}` });
      start += check.quote.length;
    }
  }
  return matches;
}
export function applyCopySuggestion(project: StudioProject, sectionId: string, check: AuditCheck, matchKey: string): StudioProject {
  const section = project.sections.find(s => s.id === sectionId && s.visible);
  if (!section) throw new Error("수정할 섹션을 찾지 못했어요.");
  const match = suggestionMatches(section, check).find(m => m.key === matchKey);
  if (!match) throw new Error("원문이 바뀌었어요. 다시 검수한 뒤 제안을 적용해주세요.");
  const field = reviewTexts(section).find(t => t.target === match.target)!;
  const value = field.value.slice(0, match.start) + check.suggestion + field.value.slice(match.start + check.quote!.length);
  const limit = match.target === "title" ? 150 : match.target === "body" ? 5000 : match.target === "kicker" ? 200 : 3000;
  if (value.length > limit) throw new Error(`수정하면 글자 수 제한(${limit.toLocaleString()}자)을 넘어요. 제안을 직접 다듬어주세요.`);
  const next = match.target.startsWith("extra:") ? { ...section, elements: section.elements?.map(e => `extra:${e.id}` === match.target ? { ...e, text: value } : e), reviewed: false } : { ...section, [match.target]: value, reviewed: false };
  return { ...project, sections: project.sections.map(s => s.id === sectionId ? next : s) };
}

export function applySuggestionWithUndo(project:StudioProject,sectionId:string,check:AuditCheck,matchKey:string) {
  const section=project.sections.find(s=>s.id===sectionId)!;
  const match=section && suggestionMatches(section,check).find(m=>m.key===matchKey);
  if(!match)throw new Error("대상 원문이 바뀌었어요. 다시 확인해주세요.");
  const next=applyCopySuggestion(project,sectionId,check,matchKey);
  const undo:CopySuggestionUndo={sectionId,target:match.target,before:reviewTexts(section).find(t=>t.target===match.target)!.value,after:reviewTexts(next.sections.find(s=>s.id===sectionId)!).find(t=>t.target===match.target)!.value,fingerprint:auditFingerprint(project,section),reviewed:Boolean(section.reviewed),audit:currentAudit(project,section)};
  return {project:next,undo};
}
export function undoCopySuggestion(project:StudioProject,undo:CopySuggestionUndo):StudioProject {
  const section=project.sections.find(s=>s.id===undo.sectionId);
  if(!section)throw new Error("섹션이 삭제되어 이 수정을 취소할 수 없어요.");
  const field=undo.target.startsWith("extra:")?section.elements?.find(e=>`extra:${e.id}`===undo.target)?.text:section[undo.target as "title"|"body"|"kicker"];
  if(field!==undo.after)throw new Error("이 글을 이후에 직접 편집했어요. 내용을 덮어쓰지 않도록 수정 취소를 중단했습니다.");
  const restored:Section=undo.target.startsWith("extra:")?{...section,elements:section.elements?.map(e=>`extra:${e.id}`===undo.target?{...e,text:undo.before}:e),reviewed:false}:{...section,[undo.target]:undo.before,reviewed:false};
  let next={...project,sections:project.sections.map(s=>s.id===undo.sectionId?restored:s)};
  if(auditFingerprint(next,restored)===undo.fingerprint && undo.audit && next.copyAudit){
    next={...next,copyAudit:{...next.copyAudit,sections:[...next.copyAudit.sections.filter(s=>s.id!==undo.sectionId),undo.audit]},sections:next.sections.map(s=>s.id===undo.sectionId?{...s,reviewed:undo.reviewed}:s)};
  }
  return next;
}
