"use client";
import { useEffect, useRef, useState } from "react";
import { auditFingerprint, currentAudit, validateCopyAudit } from "@/lib/copy-audit";
import type { StudioProject } from "@/lib/studio";
export type AuditProgress = { phase: string; label: string; completed: number; total: number; percent: number; mode?: string; searched?: boolean };
export function useCopyAudit(project: StudioProject, onChange: (p: StudioProject) => void) {
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [progress, setProgress] = useState<AuditProgress | null>(null), [elapsed, setElapsed] = useState(0);
  const request = useRef<AbortController | null>(null), latest = useRef(project);
  useEffect(() => { latest.current = project; }, [project]);
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => { if (!busy) return; const start = Date.now(), timer = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000); return () => clearInterval(timer); }, [busy]);
  async function run() {
    if (request.current) return;
    const abort = new AbortController(); request.current = abort;
    const snapshot = latest.current;
    const visible = snapshot.sections.filter(s=>s.visible);
    if (visible.length && visible.every(s=>currentAudit(snapshot,s))) {
      setError(""); setProgress({phase:"complete",label:"수정된 문구가 없어 기존 검수 결과를 유지해요.",completed:visible.length,total:visible.length,percent:100,mode:snapshot.copyAudit?.mode});
      request.current=null; return;
    }
    setBusy(true); setError(""); setElapsed(0); setProgress({ phase: "start", label: "검수할 문구를 준비하고 있어요", completed: 0, total: snapshot.sections.filter(s => s.visible).length, percent: 0 });
    try {
      const response = await fetch("/api/copy-audit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ project: snapshot }), signal: abort.signal });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || "검수를 시작하지 못했어요."); }
      if (!response.body) throw new Error("검수 진행 정보를 받지 못했어요.");
      const reader = response.body.getReader(), decoder = new TextDecoder(); let buffer = "", doneReport = false;
      const event = (data: { type: string; report?: unknown; error?: string } & Partial<AuditProgress>) => {
        if (data.type === "error") throw new Error(data.error || "검수를 완료하지 못했어요.");
        if (data.type === "progress") setProgress(data as AuditProgress);
        if (data.type === "complete") {
          const report = validateCopyAudit(data.report), current = latest.current;
          if (!report || report.sections.length !== snapshot.sections.filter(s => s.visible).length || report.sections.some(r => !snapshot.sections.some(s => s.id === r.id && r.fingerprint === auditFingerprint(snapshot, s)) || r.checks.length < 2)) throw new Error("검수 결과의 대상 문구를 확인하지 못했어요.");
          if (abort.signal.aborted || current.id !== snapshot.id) return;
          onChange({ ...current, copyAudit: report, sections: current.sections.map(s => ({ ...s, reviewed: Boolean(s.reviewed && currentAudit(snapshot, s) && report.sections.some(r => r.id === s.id && r.fingerprint === auditFingerprint(current, s))) })) });
          setProgress({ phase: "complete", label: "검수를 마쳤어요. 결과를 읽고 섹션별로 확인해주세요.", completed: report.sections.length, total: report.sections.length, percent: 100, mode: report.mode, searched: report.searched }); doneReport = true;
        }
      };
      while (true) { const { value, done } = await reader.read(); buffer += decoder.decode(value, { stream: !done }); let boundary; while ((boundary = buffer.indexOf("\n")) >= 0) { const line = buffer.slice(0, boundary); buffer = buffer.slice(boundary + 1); if (line.trim()) event(JSON.parse(line)); } if (done) break; }
      if (buffer.trim()) event(JSON.parse(buffer));
      if (!doneReport && !abort.signal.aborted) throw new Error("검수 응답이 중간에 종료됐어요. 완료 결과는 저장하지 않았습니다.");
    } catch (e) { if (!abort.signal.aborted) setError(e instanceof Error ? e.message : "검수를 진행하지 못했어요."); }
    finally { if (request.current === abort) request.current = null; if (!abort.signal.aborted) setBusy(false); }
  }
  return { busy, error, progress, elapsed, run };
}
