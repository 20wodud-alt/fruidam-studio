import { defaultImageModel, imageModels } from "./image-plan";
import { readSettingFile, writeSettingFile } from "./asset-store";
export const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";
export type AISettings = { provider: "gemini"; imageModel:string; apiKey: string; model: string; enabled: boolean; research: boolean };
type SavedSettings = Partial<Omit<AISettings,"provider">> & { provider?: string };
export function normalizeGeminiModel(value: unknown) {
  if (typeof value !== "string") throw new Error("Gemini 모델 ID를 확인해주세요. 예: gemini-3.8-flash");
  const model = value.trim().replace(/^models\//, "").toLowerCase().replace(/\s+/g, "-");
  if (!/^gemini-[a-z0-9][a-z0-9._-]{0,95}$/.test(model)) throw new Error("Gemini 모델 ID를 확인해주세요. 예: gemini-3.8-flash");
  return model;
}
export function validateGeminiKey(value: unknown) {
  if (typeof value !== "string" || !value.trim()) throw new Error("Gemini API 키 값을 입력해주세요.");
  let key = value.trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) key = key.slice(1,-1).trim();
  if (!key) throw new Error("Gemini API 키 값을 입력해주세요.");
  // Key formats evolve (including longer auth keys with punctuation). Google,
  // rather than a local prefix/length pattern, verifies credential validity.
  if (key.length > 8192) throw new Error("입력 내용이 너무 길어요. API 키 값만 복사해주세요.");
  if (/\s|[^\x21-\x7e]/.test(key)) throw new Error("API 키 안에 공백·줄바꿈 또는 보이지 않는 문자가 있어요. 키 값만 다시 복사해주세요.");
  if (key.startsWith("sk-")) throw new Error("OpenAI 키가 입력됐어요. Google AI Studio에서 발급한 Gemini 키를 사용해주세요.");
  return key;
}
async function savedSettings(): Promise<SavedSettings> {
  try { return JSON.parse(await readSettingFile("ai-settings.json")); } catch (e) { if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw new Error("AI 설정을 읽지 못했어요."); return {}; }
}
export async function readAISettings(): Promise<AISettings> {
  const saved = await savedSettings();
  const compatible = saved.provider === "gemini" || /^(AIza|AQ[._])/.test(saved.apiKey || "");
  let model = DEFAULT_GEMINI_MODEL;
  try { model = normalizeGeminiModel((compatible ? saved.model : undefined) || process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL); } catch { /* Migrate display names or old OpenAI model settings to the Gemini default. */ }
  const rawKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || (compatible ? saved.apiKey || "" : "");
  return {provider:"gemini",imageModel:imageModels.some(m=>m.id===saved.imageModel) ? saved.imageModel! : defaultImageModel,apiKey:rawKey ? validateGeminiKey(rawKey) : "",model,enabled:saved.enabled ?? true,research:saved.research ?? true};
}
export async function publicAISettings() {
  const settings = await readAISettings(), saved = await savedSettings();
  return {provider:"gemini",configured:Boolean(settings.apiKey),imageModel:settings.imageModel,model:settings.model,enabled:settings.enabled,research:settings.research,fromEnvironment:Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),needsNewKey:Boolean(!settings.apiKey && saved.apiKey && saved.provider !== "gemini" && !/^(AIza|AQ[._])/.test(saved.apiKey))};
}
export async function saveAISettings(input: Record<string,unknown>) {
  if ((process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) && (input.clearKey || input.apiKey)) throw new Error("서버 환경변수의 Gemini 키는 Vercel 환경변수에서 변경해주세요.");
  const previous = await readAISettings(); const model = normalizeGeminiModel(input.model);
  const imageModel = input.imageModel === undefined ? previous.imageModel : String(input.imageModel);
  if(!imageModels.some(model=>model.id===imageModel))throw new Error("이미지 생성 모델을 다시 선택해주세요.");
  const typedKey = input.clearKey ? "" : input.apiKey === undefined || input.apiKey === "" ? "" : validateGeminiKey(input.apiKey);
  const data: AISettings = {provider:"gemini",imageModel,apiKey:input.clearKey ? "" : typedKey || ((process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) ? "" : previous.apiKey),model,enabled:input.enabled === true,research:input.research === true};
  await writeSettingFile("ai-settings.json",data);
  return publicAISettings();
}
