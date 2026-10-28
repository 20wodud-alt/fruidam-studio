import { moveTargets, setTargetFormat, targetFormat } from "./canvas-operations";
import { parseInstruction } from "./natural-edit";
import type { Section, StudioProject } from "./studio";
import type {EditorMetrics} from "./editor-metrics";
import {resizeElement} from "./resize-element";

export type EditSelection = {sectionId:string;target?:string;targets?:string[];metrics?:EditorMetrics};

export function editSectionIds(project: StudioProject, request: string, selectedId: string): Set<string> {
  const pages=[...request.matchAll(/(\d{1,2})\s*(?:번|번째)?\s*페이지/g)].map(m=>Number(m[1]));
  if (pages.length) {
    if (pages.some(n=>n<1 || n>project.sections.length)) throw new Error(`페이지 번호는 1~${project.sections.length} 사이로 입력해주세요.`);
    return new Set(pages.map(n=>project.sections[n-1].id));
  }
  const thisPage=/(?:이|현재|선택한)\s*페이지/.test(request);
  const containOnly=/(?:사진|이미지).*전체\s*(?:보이|맞춤)/.test(request);
  const all=!thisPage && /전체|모든|모두|전부/.test(request) && (!containOnly || /전체\s*페이지|모든\s*페이지/.test(request));
  return new Set(all ? project.sections.map(s=>s.id) : [selectedId]);
}

function isPhoto(section: Section, target: string) {
  return target==="image" || Boolean(section.elements?.some(e=>`extra:${e.id}`===target && e.type==="image"));
}
function textTargets(section: Section) {
  return ["title","body","kicker",...(section.elements || []).filter(e=>e.type==="text" || e.type==="badge").map(e=>`extra:${e.id}`)];
}
function targetsFor(section: Section, request: string, selection: EditSelection, photo: boolean) {
  if(photo && /전체|모든|전부|모두/.test(request) && !/전체\s*(?:보이|맞춤)/.test(request))return [...(section.image?["image"]:[]),...(section.elements||[]).filter(e=>e.type==="image"&&e.image).map(e=>`extra:${e.id}`)];
  if (!photo) {
    if (/서브\s*카피|보조\s*문구/.test(request)) return ["kicker"];
    if (/본문|설명글/.test(request)) return ["body"];
    if (/제목|메인\s*(?:문구|카피)/.test(request)) return ["title"];
    if (/모든\s*(?:글|텍스트)|(?:글씨|글자|텍스트)\s*(?:전체|전부)|페이지.*전체|전체\s*(?:글|텍스트)/.test(request)) return textTargets(section);
  }
  const selected=selection.targets?.length ? selection.targets : selection.target && selection.target!=="section" ? [selection.target] : [];
  const targets=section.id===selection.sectionId ? selected.filter(t=>photo ? isPhoto(section,t) : textTargets(section).includes(t)) : [];
  return targets.length ? targets : photo ? section.image?["image"]:(section.elements||[]).filter(e=>e.type==="image"&&e.image).slice(0,1).map(e=>`extra:${e.id}`) : ["title"];
}

// Shared by the chat UI and API route: deterministic changes need no model/key.
// Return null for creative requests so the full Gemini tool set stays available.
export function applyLocalEditorRequest(project: StudioProject, request: string, selection: EditSelection) {
  const instruction=parseInstruction(request);
  if (!instruction || !["format","photo","move","resize"].includes(instruction.type)) return null;
  const ids=editSectionIds(project,request,selection.sectionId);
  let count=0;
  const resizedSizes:string[]=[];
  const sections=project.sections.map(section=>{
    if (!ids.has(section.id)) return section;
    const photo=instruction.type==="photo" || instruction.type==="resize"&&instruction.subject==="photo" || /사진|이미지/.test(request) || (instruction.type==="move"||instruction.type==="resize") && !/글씨|글자|텍스트|제목|본문|서브/.test(request) && selection.target!==undefined && isPhoto(section,selection.target);
    const targets=targetsFor(section,request,selection,photo);
    let next=section;
    for (const target of targets) {
      const before=JSON.stringify(next);
      if(instruction.type==="resize")next=resizeElement(next,target,instruction,selection.metrics?.[section.id]?.[target]);
      else if (instruction.type==="move") next=moveTargets(next,[target],instruction.x,instruction.y);
      else if (instruction.type==="format" || instruction.type==="photo") {
        const patch={...instruction.format};
        if (instruction.type==="format" && instruction.fontDelta) {
          const current=targetFormat(next,target).fontSize ?? (target==="title" ? section.kind==="hero"?65:38 : target==="kicker"?12:target==="body"?19:24);
          Object.assign(patch,{fontSize:Math.max(10,Math.min(120,current+instruction.fontDelta))});
        }
        next=setTargetFormat(next,target,patch);
      }
      if(instruction.type!=="resize"||JSON.stringify(next)!==before){
        count++;
        if(instruction.type==="resize"){
          const format=targetFormat(next,target);
          if(isPhoto(next,target))resizedSizes.push(`${format.widthPx}×${format.height}px`);
          else if(format.fontSize)resizedSizes.push(`글자 ${format.fontSize}px`);
        }
      }
    }
    return {...next,reviewed:false};
  });
  if (!count) throw new Error("변경할 사진·글이 없거나 이미 허용 크기 범위에 도달했어요. 요소와 현재 크기를 확인해주세요.");
  const size=instruction.type==="format" ? instruction.format.fontSize : undefined;
  const unitNote=size!==undefined && /(?:pt|포인트)/i.test(request) ? ` ${Math.round(size*100)/100}px로 적용했어요(1pt = 1.333px).` : size!==undefined ? ` ${size}px로 적용했어요.` : "";
  const resizeNote=resizedSizes.length?` ${resizedSizes.slice(0,3).join(", ")}${resizedSizes.length>3?" 등":""}로 변경했어요.`:"";
  return {project:{...project,sections},summary:`${ids.size}개 페이지의 ${count}개 요소를 수정했어요.${unitNote}${resizeNote} API 호출 없이 적용했습니다.`};
}
