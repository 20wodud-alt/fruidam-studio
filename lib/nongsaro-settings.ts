import { readSettingFile, writeSettingFile } from "./asset-store";
export type NongsaroSettings = { apiKey:string; serviceName:string; endpointPath:string; notes:string };
export async function readNongsaroSettings(): Promise<NongsaroSettings> {
  let saved: Partial<NongsaroSettings> = {};
  try {saved = JSON.parse(await readSettingFile("nongsaro-settings.json"));} catch(e) {if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw new Error("농사로 설정을 읽지 못했어요.");}
  return {apiKey:process.env.NONGSARO_API_KEY || saved.apiKey || "",serviceName:saved.serviceName || "",endpointPath:saved.endpointPath || "",notes:saved.notes || ""};
}
export async function publicNongsaroSettings() {
  const s = await readNongsaroSettings();
  return {configured:Boolean(s.apiKey),fromEnvironment:Boolean(process.env.NONGSARO_API_KEY),serviceName:s.serviceName,endpointPath:s.endpointPath,notes:s.notes,stage:"prepared" as const};
}
export async function saveNongsaroSettings(input:Record<string,unknown>) {
  if (process.env.NONGSARO_API_KEY && (input.clearKey || input.apiKey)) throw new Error("서버 환경변수의 농사로 키는 Vercel 환경변수에서 변경해주세요.");
  const old = await readNongsaroSettings();
  function text(value:unknown,max:number) {if(typeof value !== "string" || value.length > max) throw new Error("농사로 설정의 입력 길이를 확인해주세요.");return value.trim();}
  const apiKey = input.clearKey ? "" : input.apiKey === undefined || input.apiKey === "" ? "" : text(input.apiKey,500);
  if (apiKey && !/^[a-zA-Z0-9_+./=%-]+$/.test(apiKey)) throw new Error("농사로에서 발급받은 인증키를 확인해주세요.");
  const endpointPath = text(input.endpointPath,200);
  if(endpointPath && !/^\/?[a-zA-Z0-9_/-]+$/.test(endpointPath)) throw new Error("서비스 경로만 입력해주세요. URL·인증키·쿼리 문자열은 넣지 마세요.");
  const data:NongsaroSettings = {apiKey:input.clearKey ? "" : apiKey || (process.env.NONGSARO_API_KEY ? "" : old.apiKey),serviceName:text(input.serviceName,100),endpointPath,notes:text(input.notes,1000)};
  await writeSettingFile("nongsaro-settings.json",data);
  return publicNongsaroSettings();
}
