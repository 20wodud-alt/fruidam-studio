import { NextResponse } from "next/server";
import { normalizeGeminiModel, publicAISettings, readAISettings, saveAISettings, validateGeminiKey } from "@/lib/ai-settings";
import { verifyGeminiConnection } from "@/lib/gemini-client";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() { try { return NextResponse.json(await publicAISettings(),{headers:{"Cache-Control":"no-store"}}); } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "설정을 읽지 못했어요." }, { status: 500 }); } }
export async function POST(request: Request) {
  const origin = request.headers.get("origin"); if (origin && new URL(origin).host !== request.headers.get("host")) return NextResponse.json({ error: "이 앱의 설정 화면에서 연결해주세요." }, { status: 403 });
  try {
    const input=await request.json();
    if (!input.clearKey && input.enabled === true) {
      const saved=await readAISettings();
      const key=process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || (input.apiKey ? validateGeminiKey(input.apiKey) : saved.apiKey);
      await verifyGeminiConnection(key,normalizeGeminiModel(input.model));
      if(input.imageModel && input.imageModel!==saved.imageModel)await verifyGeminiConnection(key,normalizeGeminiModel(input.imageModel));
    }
    return NextResponse.json(await saveAISettings(input),{headers:{"Cache-Control":"no-store"}});
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.name === "TimeoutError" ? "연결 확인 시간이 초과됐어요. 기존 설정은 유지됩니다. 다시 시도해주세요." : e.message : "설정을 저장하지 못했어요." }, { status: 400 }); }
}
