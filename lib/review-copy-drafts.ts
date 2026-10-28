import type { Section, StudioProject } from "./studio";
export type ReviewCopyDraft={sectionId:string;target:string;before:string;value:string};
export function copyFieldValue(section:Section,target:string) {
  if(target==="title"||target==="body"||target==="kicker")return section[target] || "";
  const element=section.elements?.find(e=>`extra:${e.id}`===target&&["text","badge"].includes(e.type));
  if(!element)throw new Error("편집할 글 박스를 찾지 못했어요.");
  return element.text;
}
function patchField(section:Section,target:string,value:string):Section {
  const limit=target==="title"?150:target==="body"?5000:target==="kicker"?200:3000;
  if(value.length>limit)throw new Error(`글자 수 제한(${limit.toLocaleString()}자)을 넘었어요.`);
  copyFieldValue(section,target);
  return target.startsWith("extra:")?{...section,elements:section.elements?.map(e=>`extra:${e.id}`===target?{...e,text:value}:e),reviewed:false}:{...section,[target]:value,reviewed:false};
}
export function editCopyDraft(project:StudioProject,drafts:ReviewCopyDraft[],sectionId:string,target:string,value:string) {
  const section=project.sections.find(s=>s.id===sectionId);
  if(!section)throw new Error("편집할 섹션을 찾지 못했어요.");
  patchField(section,target,value);
  const before=drafts.find(d=>d.sectionId===sectionId&&d.target===target)?.before ?? copyFieldValue(section,target);
  const rest=drafts.filter(d=>d.sectionId!==sectionId||d.target!==target);
  return value===before?rest:[...rest,{sectionId,target,before,value}];
}
export function previewCopyDrafts(project:StudioProject,drafts:ReviewCopyDraft[]):StudioProject {
  if(!drafts.length)return project;
  return {...project,sections:project.sections.map(section=>drafts.filter(d=>d.sectionId===section.id).reduce((s,d)=>patchField(s,d.target,d.value),section))};
}
export function saveCopyDraft(project:StudioProject,draft:ReviewCopyDraft):StudioProject {
  const section=project.sections.find(s=>s.id===draft.sectionId);
  if(!section)throw new Error("섹션이 없어 문구를 저장하지 못했어요.");
  if(copyFieldValue(section,draft.target)!==draft.before)throw new Error("이 문구에 다른 수정이 반영되어 저장을 중단했어요. 취소 후 다시 편집해주세요.");
  return {...project,sections:project.sections.map(s=>s.id===draft.sectionId?patchField(s,draft.target,draft.value):s)};
}
