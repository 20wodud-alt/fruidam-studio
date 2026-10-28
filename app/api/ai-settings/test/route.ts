import { NextResponse } from "next/server";
import { normalizeGeminiModel, readAISettings, validateGeminiKey } from "@/lib/ai-settings";
import { verifyGeminiConnection } from "@/lib/gemini-client";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (origin && new URL(origin).host !== request.headers.get("host")) return NextResponse.json({error:"설정 화면에서 요청해주세요."},{status:403});
    const input = await request.json(), saved = await readAISettings();
    const apiKey = input.apiKey ? validateGeminiKey(input.apiKey) : saved.apiKey;
    const model = normalizeGeminiModel(input.model || saved.model);
    const verified = await verifyGeminiConnection(apiKey,model);
    return NextResponse.json({ok:true,...verified,message:"API 키와 모델 접근을 확인했어요. 문구 생성·검색의 할당량은 실제 요청 시 적용됩니다."});
  } catch(e) { return NextResponse.json({error:e instanceof Error ? e.name === "TimeoutError" ? "Gemini 연결 확인 시간이 초과됐어요. 다시 시도해주세요." : e.message : "연결을 확인하지 못했어요."},{status:400}); }
}
