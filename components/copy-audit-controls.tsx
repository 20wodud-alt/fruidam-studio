"use client";
import { useState } from "react";
import { AlertCircle, PencilLine, FileText, ListChecks, LoaderCircle, Play } from "lucide-react";
import { auditCategories, currentAudit, type AuditCheck, type SectionAudit } from "@/lib/copy-audit";
import { isAdvisorySuggestion } from "@/lib/copy-suggestion-format";
import { suggestionMatches } from "@/lib/apply-copy-suggestion";
import type { Section, StudioProject } from "@/lib/studio";
import type { useCopyAudit } from "./use-copy-audit";
export const auditStatusLabels = { pass: "점검 통과", warning: "주의·확인 필요", error: "수정 권장", unverified: "미확인" };
export function CopyAuditControls({ project, audit, pendingEdits=0 }: { project: StudioProject; audit: ReturnType<typeof useCopyAudit>; pendingEdits?:number }) {
  const visible = project.sections.filter(s => s.visible), checked = visible.filter(s => currentAudit(project, s)).length, checks = visible.flatMap(s => currentAudit(project, s)?.checks || []);
  return <section className="audit-run-panel" aria-label="문구 검수 진행">
    <div className="audit-run-heading"><div><strong><ListChecks size={20} />문구 검수</strong><p>점검 대상 {visible.length-checked}개 · 기존 결과 {checked}개는 다시 검수하지 않아요.</p></div><button className="dark-button" disabled={audit.busy || pendingEdits>0 || !visible.length || checked===visible.length} onClick={() => void audit.run()}>{audit.busy ? <LoaderCircle className="spin" size={16} /> : <Play size={16} />}{audit.busy ? "검수 진행 중" : pendingEdits>0 ? "문구 저장 필요" : checked===visible.length ? "변경된 문구 없음" : checked ? "수정된 문구 검수" : "검수 진행"}</button></div>
    {audit.progress && <div className={`audit-progress ${audit.error ? "failed" : ""}`} role="status" aria-live="polite"><div><span>{audit.busy && <LoaderCircle size={15} className="spin" />}{audit.error ? "검수가 중단되었어요" : audit.progress.label}</span><small>{audit.elapsed}초{audit.progress.phase === "complete" ? ` · ${audit.progress.mode === "gemini" ? "AI 점검" : "로컬 기본 점검"}` : ""}</small></div><div className="audit-progress-track" role="progressbar" aria-label="검수 단계 진행률" aria-valuemin={0} aria-valuemax={100} aria-valuenow={audit.progress.percent}><span style={{ width: `${audit.progress.percent}%` }} /></div><ol><li className={audit.progress.percent >= 20 ? "done" : ""}>1. 기본 문구 점검</li><li className={audit.progress.percent >= 70 ? "done" : ""}>2. 맞춤법·팩트 확인</li><li className={audit.progress.phase === "complete" ? "done" : ""}>3. 섹션 결과 정리</li></ol></div>}
    {audit.error && <p className="audit-error" role="alert"><AlertCircle size={16} />{audit.error}</p>}
    {project.copyAudit?.mode === "local" && <p className="audit-local-note">현재 결과는 기본 규칙 점검입니다. 문맥에 따른 오타는 ‘미확인’으로 남기며, 직접 검토하거나 AI 연결 후 다시 진행해주세요.</p>}
    <div className="audit-legend">{Object.entries(auditStatusLabels).map(([status, label]) => <span key={status} className={`audit-status-${status}`}>{label}<b>{checks.filter(c => c.status === status).length}</b></span>)}</div>
  </section>;
}
export function SectionAuditResults({ result, section, stale, busy, onApply }: { result?: SectionAudit; section: Section; stale: boolean; busy: boolean; onApply: (check: AuditCheck, key: string) => void }) {
  return result ? <div className="audit-results" aria-label="섹션 검수 결과">{stale && <p className="audit-stale-note">문구가 바뀌어 이전 검수 결과를 표시하고 있어요. 수정 제안을 적용한 뒤 다시 검수해주세요.</p>}{result.checks.filter(check=>Object.hasOwn(auditCategories,check.category)).map((check, i) => <div className={`audit-check audit-status-${check.status}`} key={`${result.fingerprint}-${i}`}><div><strong>{auditCategories[check.category]}</strong><span>{auditStatusLabels[check.status]}</span></div><p>{check.detail}</p>{check.quote && <blockquote><mark>{check.quote}</mark></blockquote>}{check.suggestion && !isAdvisorySuggestion(check.suggestion) && <p className="audit-suggestion"><b>제안 카피</b> {check.suggestion}</p>}{check.suggestion && isAdvisorySuggestion(check.suggestion) && <p className="audit-stale-note">이전 설명형 제안은 자동 적용하지 않아요. 필요한 문구를 직접 다듬어주세요.</p>}{check.quote && check.suggestion && !isAdvisorySuggestion(check.suggestion) && check.quote!==check.suggestion && <ApplySuggestion section={section} check={check} busy={busy} onApply={onApply}/>}</div>)}</div> : <div className="audit-stale-note"><FileText size={15} />검수 전이거나 문구·상품 정보가 바뀌었어요. 상단에서 검수를 진행해주세요.</div>;
}

function ApplySuggestion({section,check,busy,onApply}:{section:Section;check:AuditCheck;busy:boolean;onApply:(check:AuditCheck,key:string)=>void}) {
  const [selected,setSelected]=useState(""),[applied,setApplied]=useState(false),[error,setError]=useState("");
  const matches=suggestionMatches(section,check),key=matches.length===1?matches[0].key:selected;
  return <div className="audit-apply-suggestion">{applied ? <button className="audit-suggestion-applied" disabled><PencilLine size={15}/>제안 수정 완료</button> : <>
    {matches.length>1 && <label>수정할 위치<select aria-label="수정 제안 적용 위치" disabled={busy} value={selected} onChange={e=>{setSelected(e.target.value);setError("");}}><option value="">수정할 글 박스를 선택해주세요</option>{matches.map(match=><option key={match.key} value={match.key}>{match.label}</option>)}</select></label>}
    <button disabled={busy||!key||!matches.some(m=>m.key===key)} onClick={()=>{try{onApply(check,key);setApplied(true);setError("");}catch(e){setError(e instanceof Error?e.message:"제안을 적용하지 못했어요.");}}}><PencilLine size={15}/>제안 수정</button>
    {!matches.length && <small>대상 원문이 바뀌었어요. 다시 검수한 뒤 적용해주세요.</small>}
  </>}{error && <p className="audit-suggestion-error" role="alert">{error}</p>}</div>;
}
