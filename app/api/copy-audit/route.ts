import { NextResponse } from "next/server";
import { readAISettings } from "@/lib/ai-settings";
import { auditWithGemini } from "@/lib/copy-audit-ai";
import { currentAudit, localAudit, reviewTexts, validateCopyAudit, type CopyAudit } from "@/lib/copy-audit";
import { sectionNames, type Section, type StudioProject } from "@/lib/studio";
import { studioAccess } from "@/lib/studio-store";
import { product, text, image } from "@/lib/validate-product";
import { validateElements, validateSectionFormat } from "@/lib/validate-element-style";
export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (origin && new URL(origin).host !== request.headers.get("host")) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    const input = (await request.json()).project as StudioProject;
    if (!input || !(await studioAccess()).some(p => p.id === input.id) || !Array.isArray(input.sections) || input.sections.length > 30) throw new Error("검수할 작업을 확인해주세요.");
    const sections: Section[] = input.sections.map(s => {
      if (!s || !Object.hasOwn(sectionNames, s.kind)) throw new Error("섹션 종류를 확인해주세요.");
      return { id: text(s.id, 100), kind: s.kind, title: text(s.title, 150), body: text(s.body, 5000), kicker: s.kicker === undefined ? undefined : text(s.kicker, 200), visible: Boolean(s.visible), image: "", format: validateSectionFormat(s.format), elements: validateElements(s.elements, image) };
    });
    if (new Set(sections.map(s => s.id)).size !== sections.length) throw new Error("중복된 섹션이 있습니다.");
    const project: StudioProject = { ...input, product: product({ ...input.product }), sections, copyAudit: validateCopyAudit(input.copyAudit) };
    const visible = sections.filter(s => s.visible);
    if (!visible.length) throw new Error("표시 중인 섹션이 없습니다.");
    const settings = await readAISettings(), ai = Boolean(settings.enabled && settings.apiKey);
    const cached = visible.flatMap(s => { const row = currentAudit(project, s); return row ? [row] : []; });
    const pending = visible.filter(s => !cached.some(r => r.id === s.id));
    if (JSON.stringify(pending.map(reviewTexts)).length > 90000) throw new Error("검수할 문구가 너무 많아요. 문구를 줄이거나 일부 섹션을 숨긴 뒤 진행해주세요.");
    const stream = new ReadableStream({ async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: object) => { if (!request.signal.aborted) controller.enqueue(encoder.encode(JSON.stringify(event) + "\n")); };
      try {
        const local = pending.map(s => localAudit(project, s));
        send({ type: "progress", phase: "local", label: "문구와 기본 표현 점검 완료", completed: cached.length, total: visible.length, percent: 20, mode: ai ? "gemini" : "local", searched: false });
        const withText = pending.filter(s => reviewTexts(s).length);
        send({ type: "progress", phase: "analysis", label: ai && withText.length ? "AI가 맞춤법과 상품 정보를 점검하고 있어요" : "로컬 점검 결과를 정리하고 있어요", completed: cached.length, total: visible.length, percent: 35 });
        const aiRows = ai && withText.length ? await auditWithGemini(project, withText, settings, request.signal) : [];
        const rows = [...cached];
        for (const row of local) {
          rows.push(aiRows.find(r => r.id === row.id) || row);
          send({ type: "progress", phase: "results", label: `${rows.length}/${visible.length}개 섹션 결과 정리`, completed: rows.length, total: visible.length, percent: 70 + Math.round(30 * rows.length / visible.length) });
        }
        const report: CopyAudit = { mode: aiRows.length ? "gemini" : project.copyAudit?.mode || "local", searched: false, generatedAt: new Date().toISOString(), sections: rows };
        send({ type: "complete", report });
      } catch (e) { send({ type: "error", error: e instanceof Error ? (e.name === "TimeoutError" ? "검수 응답 시간이 길어졌어요. 자동 재시도는 하지 않았습니다." : e.message) : "검수 중 오류가 발생했어요." }); }
      finally { controller.close(); }
    } });
    return new Response(stream, { headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-store" } });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "검수를 시작하지 못했어요." }, { status: 400 }); }
}
