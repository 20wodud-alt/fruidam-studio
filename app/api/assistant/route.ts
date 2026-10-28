import { textEditScope } from "@/lib/text-edit-scope";
import { validateEditorMetrics } from "@/lib/editor-metrics";
import { hasEditorChanges } from "@/lib/editor-result";
import { validateAssistantAttachments } from "@/lib/assistant-attachments";
import { applyLocalEditorRequest, editSectionIds } from "@/lib/local-editor";
import { applyEditorOperations, pointCount } from "@/lib/ai-editor-operations";
import { NextResponse } from "next/server";
import { studioAccess } from "@/lib/studio-store";
import { composeCopy } from "@/lib/ai-copywriter";
import { readAISettings } from "@/lib/ai-settings";
import type { StudioProject } from "@/lib/studio";
export const runtime = "nodejs";
export const maxDuration = 120;
export async function POST(request: Request) {
  try {
    if (request.headers.get("origin") && new URL(request.headers.get("origin")!).host !== request.headers.get("host")) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    const input = await request.json();
    if (typeof input.request !== "string" || !input.request.trim() || input.request.length > 5000) throw new Error("수정할 내용을 5,000자 이내로 입력해주세요.");
    const current = input.project as StudioProject;
    if (!current || !(await studioAccess()).some(p => p.id === current.id) || !current.product || !Array.isArray(current.sections) || current.sections.length > 30) throw new Error("편집 중인 작업을 확인해주세요.");
    const selectedHook=/^선택\s*후킹[:：]/.test(input.request);
    const textTarget=textEditScope(current,input.sectionId,typeof input.target==="string"?input.target:"section",input.request,selectedHook);
    const attachments=validateAssistantAttachments(input.attachments);
    const metrics=validateEditorMetrics(input.metrics);
    const local = applyLocalEditorRequest(current,input.request,{sectionId:input.sectionId,target:input.target,targets:input.targets,metrics});
    if(local) return NextResponse.json({project:local.project,sections:local.project.sections,editSummary:local.summary,mode:"local",report:current.copyReport});
    const settings = await readAISettings();
    if(attachments.length && (!settings.apiKey || !settings.enabled))throw new Error("첨부 자료를 참고한 AI 편집은 Gemini API를 연결한 후 사용할 수 있어요.");
    const images=textTarget?current.product.images:Array.from(new Set([...current.product.images,...attachments.filter(a=>a.type==="image").map(a=>a.url)]));
    if(images.length>10)throw new Error("상품 사진은 첨부 이미지를 포함해 최대 10장까지 등록할 수 있어요.");
    const editingProject={...current,product:{...current.product,images}};
    const count=textTarget?undefined:pointCount(input.request),hook=/후킹|쿠팡/.test(input.request);
    const whole = !textTarget && input.all && !/(?:이|현재|선택한)\s*페이지|\d+\s*페이지/.test(input.request);
    const scope = textTarget ? new Set([input.sectionId]) : whole ? new Set(current.sections.map(s=>s.id)) : editSectionIds(current,input.request,input.sectionId);
    const selected = current.sections.filter(s => scope.has(s.id) && (!whole || !count || s.kind==="benefits")).map(s=>count?{...s,kind:"benefits" as const}:s);
    if (!selected.length) throw new Error("선택한 페이지가 없어요.");
    const research = hook || Boolean(input.all) && /문구|카피|작성|리뷰|써|다듬/.test(input.request);
    const result = await composeCopy(editingProject.product, selected, input.request, research,{textTarget,metrics,attachments,editorTarget:typeof input.target==="string"?input.target:"section",selectedTargets:Array.isArray(input.targets)?input.targets.filter((x:unknown)=>typeof x==="string").slice(0,24):[],pointCount:count,hook});
    const allowed=new Set(selected.map(s=>s.id));const project=applyEditorOperations({...editingProject,copyReport:result.report,sections:current.sections.map(s=>result.sections.find(g=>g.id===s.id)||s)},result.operations,allowed);
    if(!hasEditorChanges(current,project))throw new Error("요청을 실제 변경으로 적용하지 못했어요. 기존 내용은 유지되며 요청을 다른 표현으로 보내주세요.");
    return NextResponse.json({ ...result, project, attachmentsUsed:attachments.length>0, mode: settings.apiKey && settings.enabled ? "gemini" : "local" });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? (e.name === "TimeoutError" ? "AI 응답 시간이 길어졌어요. 다시 시도해주세요." : e.message) : "요청을 처리하지 못했어요." }, { status: 400 }); }
}
