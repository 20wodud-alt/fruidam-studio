"use client";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Undo2, CheckCheck, ListChecks, Sparkles } from "lucide-react";
import { cleanCopy } from "@/lib/copy-review";
import { sectionNames, type StudioProject } from "@/lib/studio";

import { applySuggestionWithUndo, undoCopySuggestion, type CopySuggestionUndo } from "@/lib/apply-copy-suggestion";
import { editCopyDraft, previewCopyDrafts, saveCopyDraft, type ReviewCopyDraft } from "@/lib/review-copy-drafts";
import { currentAudit, type AuditCheck } from "@/lib/copy-audit";
import { useReviewNavigation } from "./use-review-navigation";
import { useCopyAudit } from "./use-copy-audit";
import { ReviewSectionFields, AuditPassBadges } from "./review-section-fields";
import { ReviewComparison } from "./review-comparison";
import { CopyAuditControls } from "./copy-audit-controls";

export function CopyReviewPage({ project, onChange, onBack, onContinue, children }: { project: StudioProject; onChange: (next: StudioProject) => void; onBack: () => void; onContinue: () => void; children: React.ReactNode }) {
  const [filter, setFilter] = useState("all");
  const audit = useCopyAudit(project, onChange);
  const [suggestionHistory,setSuggestionHistory]=useState<CopySuggestionUndo[]>([]),[undoVersion,setUndoVersion]=useState(0),[suggestionError,setSuggestionError]=useState(""),[suggestionMessage,setSuggestionMessage]=useState("");
  const [manualDrafts,setManualDrafts]=useState<ReviewCopyDraft[]>([]);
  const workingProject=previewCopyDrafts(project,manualDrafts),hasPendingEdits=manualDrafts.length>0;
  const visible = workingProject.sections.filter(s => s.visible);
  const reviewed = visible.filter(s => currentAudit(workingProject, s)).length;
  const issueCount = visible.reduce((sum, s) => sum + (currentAudit(workingProject, s)?.checks.filter(c => c.status !== "pass").length || 0), 0);
  const [beforeReview]=useState(()=>structuredClone(project));
  const {rootRef:reviewRootRef,selection:previewSelection,select:selectReviewSection}=useReviewNavigation(project.sections.find(s=>s.visible)?.id || "",filter+project.sections.filter(s=>s.visible).map(s=>s.id+Boolean(s.reviewed)).join("|"));
  const shown = visible.filter(s => filter === "all" || (filter === "pending" ? !currentAudit(workingProject, s) : (currentAudit(workingProject, s) || project.copyAudit?.sections.find(r=>r.id===s.id))?.checks.some(c => ["spelling","claims"].includes(c.category) && c.status !== "pass")));
  function selectPreviewSection(id:string){selectReviewSection(id,"section",1000);setFilter("all");requestAnimationFrame(()=>{Array.from(document.querySelectorAll<HTMLElement>(".copy-review-card")).find(card=>card.dataset.auditSection===id)?.scrollIntoView({behavior:"smooth",block:"start"});});}
  function editField(sectionId:string,target:string,value:string){try{setManualDrafts(editCopyDraft(project,manualDrafts,sectionId,target,value));setSuggestionError("");}catch(e){setSuggestionError(e instanceof Error?e.message:"문구를 편집하지 못했어요.");}}
  function saveField(sectionId:string,target:string){const draft=manualDrafts.find(d=>d.sectionId===sectionId&&d.target===target);if(!draft)return;try{onChange(saveCopyDraft(project,draft));setManualDrafts(previous=>previous.filter(d=>d.sectionId!==sectionId||d.target!==target));setSuggestionError("");}catch(e){setSuggestionError(e instanceof Error?e.message:"문구를 저장하지 못했어요.");}}
  function cancelField(sectionId:string,target:string){setManualDrafts(previous=>previous.filter(d=>d.sectionId!==sectionId||d.target!==target));setSuggestionError("");}

  function applySuggestion(sectionId:string,check:AuditCheck,key:string){const change=applySuggestionWithUndo(project,sectionId,check,key);onChange(change.project);setSuggestionHistory(history=>[...history.slice(-59),change.undo]);setSuggestionError("");setSuggestionMessage("");}
  function undoSuggestion(){const last=suggestionHistory.at(-1);if(!last)return;try{onChange(undoCopySuggestion(project,last));setSuggestionHistory(history=>history.slice(0,-1));setUndoVersion(v=>v+1);setSuggestionError("");setSuggestionMessage("선택한 제안 수정을 취소했어요.");}catch(e){setSuggestionError(e instanceof Error?e.message:"수정을 취소하지 못했어요.");}}
  function cleanAll() { onChange({ ...project, sections: project.sections.map(s => { const title = cleanCopy(s.title), body = cleanCopy(s.body); return s.visible && (title !== s.title || body !== s.body) ? { ...s, title, body, reviewed: false } : s; }) }); }
  return <main className="copy-review-page review-with-preview"><div className="copy-review-heading"><button className="back-link" disabled={audit.busy||hasPendingEdits} onClick={onBack}><ArrowLeft size={14} />구성안으로</button>{children}<span className="eyebrow">GOOD WORDS MAKE A GOOD FIRST IMPRESSION</span><h1>문구를 점검하고, 자신 있게 완성해요.</h1><p>문구와 상세페이지를 비교하며 맞춤법과 팩트를 확인해주세요.</p></div>
    <CopyAuditControls project={workingProject} audit={audit} pendingEdits={manualDrafts.length} />{suggestionError && <p className="audit-error" role="alert">{suggestionError}</p>}{suggestionMessage && <p className="audit-undo-message" role="status">{suggestionMessage}</p>}<div className="copy-review-summary"><div><span className="review-summary-icon"><ListChecks size={22} /></span><div><strong>{reviewed}<span> / {visible.length}개 섹션 검수</span></strong><p>{reviewed === visible.length ? "모든 섹션의 검수 결과가 준비됐어요. 결과를 확인하고 디자인을 완성해주세요." : "저장한 문구가 바뀐 섹션만 다시 검수합니다."}</p></div></div><div className="copy-review-progress"><span style={{ width: `${reviewed / Math.max(1, visible.length) * 100}%` }} /></div><span className="review-issue-count">확인할 표현 <b>{issueCount}</b></span></div>
    <div className="copy-review-layout"><aside className="copy-review-aside"><ReviewComparison project={workingProject} before={beforeReview} selectedId={previewSelection.id} selectedTarget={previewSelection.target} navigationRevision={previewSelection.revision} onSelect={selectPreviewSection}/></aside><section className="copy-review-main" ref={reviewRootRef}><div className="copy-review-toolbar"><div className="review-tabs">{[["all", "전체"], ["pending", "미검수"], ["issues", "점검 표시"]].map(([id, label]) => <button className={filter === id ? "selected" : ""} key={id} onClick={() => setFilter(id)}>{label}{id === "pending" && <span>{visible.length - reviewed}</span>}</button>)}</div><button className="text-button" disabled={audit.busy||hasPendingEdits} onClick={cleanAll}><Sparkles size={12} />공백 정리</button></div>
      {shown.map(section => { const result = currentAudit(workingProject, section), confirmed = Boolean(result && result.checks.every(check=>check.status==="pass")), displayResult=result || project.copyAudit?.sections.find(r=>r.id===section.id); return <article className={`copy-review-card ${confirmed ? "reviewed" : ""}`} key={section.id} data-audit-section={section.id} onFocusCapture={event=>selectReviewSection(section.id,(event.target as HTMLElement).closest<HTMLElement>(".audit-field-group")?.dataset.reviewField || "section")} onPointerDownCapture={event=>selectReviewSection(section.id,(event.target as HTMLElement).closest<HTMLElement>(".audit-field-group")?.dataset.reviewField || "section")}><div className="copy-card-heading"><span className="review-section-number">{String(visible.indexOf(section) + 1).padStart(2, "0")}</span><span className="section-kind">{sectionNames[section.kind]}</span><AuditPassBadges result={result}/></div><ReviewSectionFields key={`${section.id}-${displayResult?.fingerprint || "none"}-${undoVersion}`} section={section} result={displayResult} stale={!result} busy={audit.busy} actionsDisabled={hasPendingEdits} dirtyTargets={manualDrafts.filter(d=>d.sectionId===section.id).map(d=>d.target)} onEdit={(target,value)=>editField(section.id,target,value)} onSave={target=>saveField(section.id,target)} onCancel={target=>cancelField(section.id,target)} onApply={(check,key)=>applySuggestion(section.id,check,key)} /></article>; })}
      {!shown.length && <div className="review-empty"><CheckCheck size={28} /><strong>{filter === "pending" ? "모든 섹션의 검수 결과가 준비됐어요" : "표시된 점검 항목이 없어요"}</strong><p>내용을 검토한 뒤 디자인 편집으로 넘어가세요.</p></div>}
    </section></div>
    <div className="copy-review-bottom"><span><strong>{reviewed}/{visible.length}</strong> 섹션 검수<small>모든 표시 섹션을 검수하고 확인해주세요</small></span><button className="light-button audit-undo-button" disabled={audit.busy || hasPendingEdits || !suggestionHistory.length} onClick={undoSuggestion}><Undo2 size={16}/>최근 제안 수정 취소{suggestionHistory.length>0 && <span>{suggestionHistory.length}</span>}</button><button className="generate-button" disabled={audit.busy || hasPendingEdits || !visible.length || reviewed !== visible.length} onClick={onContinue}><CheckCheck size={16} />검수 완료 · 디자인 완성<ArrowRight size={15} /></button></div>
  </main>;
}
