"use client";
import { useEffect, useRef, useState } from "react";
import { Eye, Maximize2, X } from "lucide-react";
import { DetailPage } from "./detail-page";
import { reviewTexts } from "@/lib/copy-audit";
import { sectionNames, type StudioProject } from "@/lib/studio";
type Mode="after"|"before"|"compare";
type Props={project:StudioProject;before:StudioProject;selectedId:string;selectedTarget?:string;navigationRevision?:number;onSelect:(id:string)=>void};
export function ReviewComparison({project,before,selectedId,selectedTarget="section",navigationRevision=0,onSelect}:Props) {
  const [mode,setMode]=useState<Mode>("after");
  const dialog=useRef<HTMLDialogElement>(null);
  const changed=project.sections.filter(s=>{const original=before.sections.find(old=>old.id===s.id);return s.visible&&(!original||JSON.stringify(reviewTexts(s))!==JSON.stringify(reviewTexts(original)));});
  const controls=(large:boolean)=><>
    <div className="rc-heading"><strong><Eye size={18}/>상세페이지 비교</strong><span className="rc-live"><i/>실시간 반영</span>{large?<button aria-label="상세페이지 비교 닫기" onClick={()=>dialog.current?.close()}><X size={19}/></button>:<button onClick={()=>dialog.current?.showModal()}><Maximize2 size={15}/>크게 보기</button>}</div>
    <div className="rc-modes" role="tablist" aria-label={large?"확대 비교 방식":"상세페이지 비교 방식"}>{([["after","수정 후"],["before","수정 전"],["compare","나란히 비교"]] as const).map(([id,label])=><button key={id} role="tab" aria-selected={mode===id} onClick={()=>setMode(id)}>{label}</button>)}</div>
    <div className="rc-section-picker"><select aria-label={large?"확대 비교할 섹션":"비교할 섹션"} value={selectedId} onChange={e=>onSelect(e.target.value)}>{project.sections.filter(s=>s.visible).map((s,i)=><option key={s.id} value={s.id}>{String(i+1).padStart(2,"0")} · {sectionNames[s.kind]}{changed.some(row=>row.id===s.id)?" · 수정됨":""}</option>)}</select><span>수정 {changed.length}개 섹션</span></div>
  </>;
  const pages=()=> <div className={`rc-pages ${mode==="compare"?"comparing":""}`} role="tabpanel" aria-label="상세페이지 미리보기">{mode!=="after"&&<PreviewPage key="before" label="수정 전" project={before} selectedId={selectedId} target={selectedTarget} revision={navigationRevision} onSelect={onSelect}/>} {mode!=="before"&&<PreviewPage key="after" label="수정 후" project={project} selectedId={selectedId} target={selectedTarget} revision={navigationRevision} onSelect={onSelect}/>}</div>;
  return <section className="review-comparison" aria-label="상세페이지 비교 미리보기">{controls(false)}<p className="rc-baseline-note">수정 전은 이 검수 화면을 열었을 때의 문구입니다.</p>{pages()}<dialog className="rc-dialog" ref={dialog} onClick={e=>{if(e.target===e.currentTarget)dialog.current?.close();}}><div className="rc-large">{controls(true)}{pages()}</div></dialog></section>;
}
function PreviewPage({project,label,selectedId,target,revision,onSelect}:{project:StudioProject;label:string;selectedId:string;target:string;revision:number;onSelect:(id:string)=>void}) {
  const viewport=useRef<HTMLDivElement>(null),[scale,setScale]=useState(.5);
  useEffect(()=>{const node=viewport.current;if(!node)return;const observer=new ResizeObserver(([entry])=>{if(entry.contentRect.width>0)setScale(Math.min(1,entry.contentRect.width/860));});observer.observe(node);return()=>observer.disconnect();},[]);
  useEffect(()=>{
    const node=viewport.current;if(!node)return;
    const section=Array.from(node.querySelectorAll<HTMLElement>(".dp-section")).find(s=>s.dataset.section===selectedId);
    const selectors:Record<string,string>={title:"h2",body:".dp-body,.dp-points,.dp-option",kicker:".dp-kicker"};
    const field=section&&selectors[target]?section.querySelector<HTMLElement>(selectors[target]):null;
    const anchor=field&&field.getBoundingClientRect().height>0?field:section;
    node.querySelectorAll('.rc-field-follow').forEach(element=>element.classList.remove('rc-field-follow'));
    if(field)field.classList.add('rc-field-follow');
    if(anchor)node.scrollTop+=anchor.getBoundingClientRect().top-node.getBoundingClientRect().top-12;
  },[selectedId,target,revision,scale]);
  return <div className="rc-page"><div className="rc-page-label">{label}</div><div className="rc-viewport" ref={viewport}><div className="rc-scale" style={{zoom:scale}}><DetailPage project={project} selected={selectedId} onSelect={onSelect}/></div></div></div>;
}
