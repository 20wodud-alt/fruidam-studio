import { image, product, text } from "@/lib/validate-product";
import { validateCopyAudit } from "@/lib/copy-audit";
import { imageScenes } from "@/lib/image-plan";
import { composeCopy } from "@/lib/ai-copywriter";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { studioAccess } from "@/lib/studio-store";
import { storageProvider, StudioStorageError } from "@/lib/supabase-storage";
import { generateSections, normalizeSectionLength, sectionNames, type Section } from "@/lib/studio";
import { validateElements, validateSectionFormat } from "@/lib/validate-element-style";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { return NextResponse.json((await studioAccess()).map(project => ({ ...project, product: { ...project.product, length: normalizeSectionLength(project.product.length) } })), { headers: { "X-Fruidam-Storage": storageProvider(), "Cache-Control": "no-store" } }); }
  catch (error) { return NextResponse.json({ error: error instanceof StudioStorageError ? error.message : "작업을 불러오지 못했어요." }, { status: error instanceof StudioStorageError ? error.status : 500 }); }
}
export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin"); if (origin && new URL(origin).host !== request.headers.get("host")) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    const input = await request.json();
    const initialProduct = input.action === "create" ? product(input.product) : null;
    const generated = initialProduct ? await composeCopy(initialProduct, generateSections(initialProduct)) : null;
    const projects = await studioAccess(projects => {
      if (input.action === "create") {
        const info = initialProduct!;
        projects.unshift({ id: randomUUID(), product: info, sections: generated!.sections, copyReport: generated!.report, starred: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      } else {
        const index = projects.findIndex(p => p.id === input.id);
        if (index === -1) throw new Error("작업을 찾을 수 없어요.");
        if (input.action === "delete") projects.splice(index, 1);
        else if (input.action === "duplicate") { const copy = structuredClone(projects[index]); copy.id = randomUUID(); copy.product.name = `${copy.product.name.slice(0, 93)} (사본)`; copy.createdAt = copy.updatedAt = new Date().toISOString(); projects.unshift(copy); }
        else if (input.action === "star") projects[index].starred = !projects[index].starred;
        else if (input.action === "save") {
          if (!Array.isArray(input.sections) || input.sections.length < 1 || input.sections.length > 30) throw new Error("섹션은 1~30개까지 구성할 수 있어요.");
          const sections: Section[] = input.sections.map((s: Section) => {
            if (!s || !Object.hasOwn(sectionNames, s.kind)) throw new Error("섹션 종류를 확인해주세요.");
            let imageMeta: Section["imageMeta"];
            if(s.imageMeta){if(s.imageMeta.source!=="ai" || !Object.hasOwn(imageScenes,s.imageMeta.scene))throw new Error("이미지 생성 정보를 확인해주세요.");imageMeta={source:"ai",scene:s.imageMeta.scene,model:text(s.imageMeta.model,100),createdAt:text(s.imageMeta.createdAt,100),originalImage:image(s.imageMeta.originalImage)};}
            return { canvasMode: s.canvasMode === "blank" || s.canvasMode === "photo" ? s.canvasMode : undefined, presentation: s.presentation === "fruit-editorial" ? "fruit-editorial" : undefined, imageDirection: s.imageDirection === undefined ? undefined : text(s.imageDirection, 400), imageMeta, id: text(s.id, 100), kind: s.kind, title: text(s.title, 150), body: text(s.body, 5000), image: image(s.image), visible: Boolean(s.visible), reviewed: Boolean(s.reviewed), kicker: s.kicker === undefined ? undefined : text(s.kicker, 200), format: validateSectionFormat(s.format), elements: validateElements(s.elements, image) };
          });
          if (new Set(sections.map(s => s.id)).size !== sections.length) throw new Error("중복된 섹션이 있어요.");
          if (!sections.some(s => s.visible)) throw new Error("표시할 섹션이 하나 이상 필요해요.");
          projects[index] = { ...projects[index], product: product(input.product), sections, copyAudit: validateCopyAudit(input.copyAudit), ...(input.copyReport && ["local", "openai", "gemini"].includes(input.copyReport.mode) ? { copyReport: { mode: input.copyReport.mode, searchEntryPoint: typeof input.copyReport.searchEntryPoint === "string" ? input.copyReport.searchEntryPoint.slice(0,30000) : undefined, summary: String(input.copyReport.summary || "").slice(0, 1500), reviewInsights: (Array.isArray(input.copyReport.reviewInsights) ? input.copyReport.reviewInsights : []).slice(0, 10).map((s: unknown) => String(s).slice(0, 300)), sources: (Array.isArray(input.copyReport.sources) ? input.copyReport.sources : []).slice(0, 10).filter((s: { url?: string }) => typeof s?.url === "string" && /^https:\/\//.test(s.url)).map((s: { title?: string; url: string }) => ({ title: String(s.title || "").slice(0, 200), url: s.url.slice(0, 2000) })), generatedAt: new Date().toISOString() } } : {}), updatedAt: new Date().toISOString() };
        } else throw new Error("지원하지 않는 요청이에요.");
      }
    });
    return NextResponse.json(projects, { headers: { "X-Fruidam-Storage": storageProvider(), "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof StudioStorageError) return NextResponse.json({ error: error.message }, { status: error.status });
    const storage = error instanceof Error && "code" in error;
    return NextResponse.json({ error: storage ? "로컬 파일 저장에 실패했어요. 다시 시도해주세요." : error instanceof Error ? error.message : "요청을 처리하지 못했어요." }, { status: storage ? 500 : 400 });
  }
}
