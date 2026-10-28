export function geminiError(status:number, code?:string, reason?:string) {
  if (reason === "API_KEY_INVALID" || code === "API_KEY_INVALID") return "Google에서 API 키가 유효하지 않다고 응답했어요. Google AI Studio에서 복사한 키인지 확인해주세요. (API_KEY_INVALID)";
  if (reason === "API_KEY_EXPIRED") return "Gemini API 키가 만료됐어요. Google AI Studio에서 키를 확인해주세요. (API_KEY_EXPIRED)";
  if (status === 401) return "Google에서 인증을 거절했어요. Gemini 키의 유효 상태를 확인해주세요. (401 UNAUTHENTICATED)";
  if (status === 403) return "Google에서 API 사용 권한을 거절했어요. 키의 API 제한·서비스 계정 권한·프로젝트의 Gemini API 사용 설정을 확인해주세요. (403 PERMISSION_DENIED)";
  if (status === 402) return "Google에서 결제 또는 크레딧 확인을 요청했어요. Google AI Studio의 결제 상태를 확인해주세요. (402)";
  if (status === 404) return "이 키로 사용할 수 없는 Gemini 모델이에요. AI 설정의 연결 확인을 눌러주세요.";
  if (status === 429) return "Gemini 요청 한도를 초과했어요. Google AI Studio에서 할당량과 결제 상태를 확인해주세요.";
  if (status === 400) return "Gemini가 편집 요청의 형식을 처리하지 못했어요. 요청 내용과 구조화 출력 형식을 확인해주세요. (400 INVALID_ARGUMENT)";
  return "Gemini 서비스 요청에 실패했어요. 잠시 후 다시 시도해주세요.";
}

export async function verifyGeminiConnection(apiKey:string,model:string) {
  if (!apiKey) throw new Error("먼저 Gemini API 키를 입력해주세요.");
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}`,{headers:{"x-goog-api-key":apiKey},signal:AbortSignal.timeout(15000),cache:"no-store"});
  const data = await response.json();
  if (!response.ok) throw new Error(geminiError(response.status,data.error?.status,data.error?.details?.find((d:{reason?:string})=>d.reason)?.reason));
  if (!Array.isArray(data.supportedGenerationMethods) || !data.supportedGenerationMethods.includes("generateContent")) throw new Error("문구 작성에 사용할 수 없는 모델이에요. 텍스트 생성 모델을 선택해주세요.");
  return {model,displayName:String(data.displayName || model).slice(0,100)};
}
