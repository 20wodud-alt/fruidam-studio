"use client";
import { Fragment, useEffect, useRef, useState } from "react";
import { BadgeCheck, Save, SpellCheck, X } from "lucide-react";
import { auditCategories, type AuditCheck, type SectionAudit } from "@/lib/copy-audit";
import { bindAuditChecks, reviewHighlightRanges } from "@/lib/review-field-markers";
import { sectionNames, type Section } from "@/lib/studio";
import { auditStatusLabels, SectionAuditResults } from "./copy-audit-controls";

export function AuditPassBadges({result}:{result?:SectionAudit}) {
  return <div className="audit-pass-badges">{(Object.keys(auditCategories) as (keyof typeof auditCategories)[]).map(category=>{
    const checks=result?.checks.filter(c=>c.category===category)||[];
    const status=(["error","warning","unverified","pass"] as const).find(value=>checks.some(check=>check.status===value)) || "unverified";
    const passed=status==="pass",state=auditStatusLabels[status];
    const title=`${auditCategories[category]} · ${state}${category==="claims"?" · 입력 상품 정보 기준":""}`;
    return <span key={category} className={`audit-status-${status} ${passed?"passed":"needs-review"}`} title={title} aria-label={`${auditCategories[category]} · ${state}`}>{category==="spelling"?<SpellCheck size={17}/>:<BadgeCheck size={17}/>}<span>{category==="spelling"?"맞춤법":"팩트 확인"}</span></span>;
  })}</div>;
}

export function ReviewSectionFields({section,result,stale,busy,actionsDisabled,dirtyTargets,onEdit,onSave,onCancel,onApply}:{section:Section;result?:SectionAudit;stale:boolean;busy:boolean;actionsDisabled:boolean;dirtyTargets:string[];onEdit:(target:string,value:string)=>void;onSave:(target:string)=>void;onCancel:(target:string)=>void;onApply:(check:AuditCheck,key:string)=>void}) {
  // Keep a report's locations stable while its proposals are being applied.
  // The parent remounts this component for a new report or an undo operation.
  const [bindings]=useState(()=>bindAuditChecks(section,result));
  const fields=[{target:"title",label:"제목",value:section.title,limit:150},{target:"body",label:"본문",value:section.body,limit:5000},...(section.kicker!==undefined?[{target:"kicker",label:"서브 카피",value:section.kicker,limit:200}]:[]),...(section.elements||[]).filter(e=>["text","badge"].includes(e.type)&&!e.format?.hidden).map((e,i)=>({target:`extra:${e.id}`,label:`추가 문구 ${i+1}`,value:e.text,limit:3000}))];
  const unassigned=bindings.filter(b=>!b.targets.some(target=>fields.some(f=>f.target===target)));
  return <>{stale && result && <p className="audit-stale-note">문구가 바뀌어 이전 검수 결과를 표시해요. 수정 후 다시 검수해주세요.</p>}{fields.map(field=>{
    const checks=bindings.filter(b=>b.targets.includes(field.target)).map(b=>({...b.check,target:field.target}));
    const edit=(value:string)=>onEdit(field.target,value);
    return <div className="audit-field-group" data-review-field={field.target} key={field.target}>
      <label className="copy-field"><span>{field.label}<small>{field.value.length.toLocaleString()}/{field.limit.toLocaleString()}</small></span><HighlightedReviewInput value={field.value} label={`${sectionNames[section.kind]} ${field.label}`} limit={field.limit} multiline={field.target==="body"||field.target.startsWith("extra:")} checks={checks} busy={busy} dirty={dirtyTargets.includes(field.target)} onChange={edit} onSave={()=>onSave(field.target)} onCancel={()=>onCancel(field.target)}/></label>
      {checks.length>0 && result && <SectionAuditResults result={{...result,checks}} section={section} stale={false} busy={busy||actionsDisabled} onApply={onApply}/>}</div>;
  })}{unassigned.length>0 && result && <div className="audit-unassigned"><strong>수정 위치 확인이 필요한 항목</strong><SectionAuditResults result={{...result,checks:unassigned.map(b=>b.check)}} section={section} stale={false} busy={busy||actionsDisabled} onApply={onApply}/></div>}</>;
}

function HighlightedReviewInput({value,label,limit,multiline,checks,busy,dirty,onChange,onSave,onCancel}:{value:string;label:string;limit:number;multiline:boolean;checks:AuditCheck[];busy:boolean;dirty:boolean;onChange:(value:string)=>void;onSave:()=>void;onCancel:()=>void}) {
  const editor=useRef<HTMLInputElement|HTMLTextAreaElement|null>(null),backdrop=useRef<HTMLDivElement>(null);
  const ranges=reviewHighlightRanges(value,checks);
  const hasHighlights=ranges.length>0;
  const sync=()=>{const node=editor.current,mirror=backdrop.current;if(!node||!mirror)return;mirror.style.width=`${node.clientWidth+2}px`;mirror.style.height=`${node.clientHeight+2}px`;mirror.scrollTop=node.scrollTop;mirror.scrollLeft=node.scrollLeft;};
  useEffect(()=>{const node=editor.current;if(!node)return;const observer=new ResizeObserver(sync);observer.observe(node);sync();return()=>observer.disconnect();},[value,hasHighlights,multiline,dirty]);
  const pieces:React.ReactNode[]=[];let offset=0;
  for(const range of ranges){pieces.push(<Fragment key={`text-${offset}`}>{value.slice(offset,range.start)}</Fragment>,<mark key={`mark-${range.start}`}>{value.slice(range.start,range.end)}</mark>);offset=range.end;}
  pieces.push(<Fragment key="tail">{value.slice(offset)}{"\n"}</Fragment>);
  const action=(save:boolean)=>{if(save)onSave();else onCancel();requestAnimationFrame(()=>editor.current?.focus());};
  const props={disabled:busy,"aria-label":label,maxLength:limit,value,onChange:(e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>)=>onChange(e.target.value),onScroll:sync,onKeyDown:(e:React.KeyboardEvent<HTMLInputElement|HTMLTextAreaElement>)=>{if(!dirty||busy||e.nativeEvent.isComposing)return;if(e.key==="Escape"){e.preventDefault();e.stopPropagation();action(false);}else if(e.key==="Enter"&&(e.ctrlKey||e.metaKey)){e.preventDefault();action(true);}}};
  return <div className={`audit-highlight-input ${multiline?"multiline":"singleline"} ${ranges.length?"has-highlights":""} ${dirty?"is-dirty":""}`}>{ranges.length>0 && <div className="audit-highlight-backdrop" aria-hidden="true" ref={backdrop}>{pieces}</div>}{multiline?<textarea {...props} ref={node=>{editor.current=node;}} rows={Math.min(9,Math.max(3,value.split("\n").length+1))}/>:<input {...props} ref={node=>{editor.current=node;}}/>}{dirty && <div className="audit-field-actions"><button type="button" title="수정 취소 · Esc" aria-label={`${label} 수정 취소`} disabled={busy} onClick={()=>action(false)}><X size={14}/></button><button type="button" title="문구 저장 · Ctrl+Enter" aria-label={`${label} 저장`} disabled={busy} onClick={()=>action(true)}><Save size={14}/></button></div>}</div>;
}
