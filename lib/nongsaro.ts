import { publicNongsaroSettings } from "./nongsaro-settings";
// Implement the selected service's request parameters, XML/JSON parser and attribution
// here after its official contract is chosen. No outbound requests occur in prepared mode.
export type NongsaroReference = {id:string;title:string;summary:string;sourceUrl:string;license:string};
export async function getNongsaroReferences() {
  const settings=await publicNongsaroSettings();
  return {stage:"prepared" as const,configured:settings.configured,serviceName:settings.serviceName,items:[] as NongsaroReference[],message:"농사로 연결 준비 단계입니다. 서비스 명세와 인증키를 확인한 뒤 실제 조회·출처 표시를 연결할 예정입니다."};
}
