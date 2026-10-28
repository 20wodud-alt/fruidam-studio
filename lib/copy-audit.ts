import { copyIssues } from "./copy-review";
import type { Section, StudioProject } from "./studio";

export const auditCategories = { spelling: "오타·맞춤법", claims: "팩트 확인" } as const;
export type AuditCategory = keyof typeof auditCategories;
export type AuditStatus = "pass" | "warning" | "error" | "unverified";
export type AuditCheck = { category: AuditCategory; status: AuditStatus; detail: string; target?: string; quote?: string; suggestion?: string; evidence?: string; sources?: { title: string; url: string }[] };
export type SectionAudit = { id: string; fingerprint: string; checks: AuditCheck[] };
export type CopyAudit = { mode: "local" | "gemini"; searched: boolean; generatedAt: string; sections: SectionAudit[] };
export function reviewTexts(section: Section) {
  return [
    ...(!section.format?.title?.hidden ? [{ target: "title", value: section.title }] : []),
    ...(!section.format?.body?.hidden ? [{ target: "body", value: section.body }] : []),
    ...(!section.format?.kicker?.hidden && section.kicker ? [{ target: "kicker", value: section.kicker }] : []),
    ...(section.elements || []).filter(e => ["text", "badge"].includes(e.type) && !e.format?.hidden).map(e => ({ target: `extra:${e.id}`, value: e.text || "" })),
  ].filter(t => t.value.trim());
}
export function auditFacts(project: StudioProject) {
  const p = project.product;
  return { name: p.name.trim(), category: p.category.trim(), features: p.features.trim(), price: p.price.trim(), options: p.options.trim(), brief: p.design?.brief?.trim() || "" };
}
export function auditFingerprint(project: StudioProject, section: Section) {
  const value = JSON.stringify([auditFacts(project), reviewTexts(section).map(t => ({ ...t, value: t.value.trim() }))]);
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
  return `${value.length}-${(hash >>> 0).toString(36)}`;
}
export function currentAudit(project: StudioProject, section: Section) {
  const result = project.copyAudit?.sections.find(s => s.id === section.id && s.fingerprint === auditFingerprint(project, section) && Object.keys(auditCategories).every(category => s.checks.some(c => c.category === category)));
  return result ? { ...result, checks: result.checks.filter(c => Object.hasOwn(auditCategories, c.category)) } : undefined;
}
export function localAudit(project: StudioProject, section: Section): SectionAudit {
  const texts = reviewTexts(section), combined = texts.map(t => t.value).join("\n");
  if (!texts.length) return { id: section.id, fingerprint: auditFingerprint(project, section), checks: Object.keys(auditCategories).map(category => ({ category: category as AuditCategory, status: "pass", detail: "표시 중인 문구가 없는 이미지·빈 섹션입니다." })) };
  const issues = copyIssues({ ...section, title: section.title || "이미지", body: combined });
  const typo = issues.filter(i => i.label !== "표현 확인");
  return { id: section.id, fingerprint: auditFingerprint(project, section), checks: [
    { category: "spelling", status: typo.length ? "warning" : "unverified", detail: typo.map(i => `${i.label}: ${i.detail}`).join(" ") || "기본 공백 점검을 마쳤습니다. 문맥에 따른 맞춤법은 직접 확인해주세요." },
    { category: "claims", status: issues.some(i => i.label === "표현 확인") ? "warning" : "unverified", detail: issues.some(i => i.label === "표현 확인") ? "수치·순위·효과를 단정하는 표현이 있습니다. 근거를 확인해주세요." : "규칙에 해당하는 단정 표현은 없지만 문맥 검토가 필요합니다." },
  ] };
}
export function validateCopyAudit(value: unknown): CopyAudit | undefined {
  if (!value || typeof value !== "object") return;
  const v = value as CopyAudit;
  if (!["local", "gemini"].includes(v.mode) || !Array.isArray(v.sections) || v.sections.length > 30 || v.sections.some(s => !s) || new Set(v.sections.map(s => s.id)).size !== v.sections.length) return;
  const limit = (s: unknown, n: number) => typeof s === "string" ? s.slice(0, n) : "";
  return { mode: v.mode, searched: Boolean(v.searched), generatedAt: limit(v.generatedAt, 50), sections: v.sections.filter(s => s && typeof s.id === "string" && Array.isArray(s.checks)).map(s => ({ id: limit(s.id, 100), fingerprint: limit(s.fingerprint, 80), checks: s.checks.filter(c => c && Object.hasOwn(auditCategories, c.category) && ["pass", "warning", "error", "unverified"].includes(c.status)).slice(0, 12).map(c => ({ category: c.category, status: c.status, detail: limit(c.detail, 700), target: limit(c.target, 110) || undefined, quote: limit(c.quote, 500), suggestion: limit(c.suggestion, 500), evidence: limit(c.evidence, 500), sources: Array.isArray(c.sources) ? c.sources.filter(source => source && typeof source.url === "string" && /^https:\/\//.test(source.url)).slice(0, 5).map(source => ({ title: limit(source.title, 200), url: limit(source.url, 2000) })) : [] })) })) };
}
