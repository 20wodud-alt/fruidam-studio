import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

export function configuration() {
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
  const url = new URL(process.env.SUPABASE_URL || "https://invalid.local");
  const match = /^([a-z0-9]{20})\.supabase\.co$/.exec(url.hostname);
  if (url.protocol !== "https:" || !match || url.username || url.password || url.port || url.search || url.hash || !["", "/"].includes(url.pathname)) throw new Error(".env.local의 SUPABASE_URL을 확인해주세요.");
  const key = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  return { url: url.origin, ref: match[1], key };
}
export async function managementRequest(ref, suffix, body) {
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim() || (await readFile(path.join(os.homedir(), ".supabase", "access-token"), "utf8")).trim();
  const response = await fetch(`https://api.supabase.com/v1/projects/${ref}${suffix}`, { method: body === undefined ? "GET" : "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), redirect: "error", signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Supabase 관리 요청 실패 (${response.status}). 계정 권한과 프로젝트 상태를 확인해주세요.`);
  return response.json();
}
export async function rpc(config, name, body) {
  if (!config.key.startsWith("sb_secret_") && !config.key.startsWith("eyJ")) throw new Error("서버 전용 Supabase secret/service_role 키를 설정해주세요.");
  const headers = { apikey: config.key, "Content-Type": "application/json" };
  if (config.key.startsWith("eyJ")) headers.Authorization = `Bearer ${config.key}`;
  const response = await fetch(`${config.url}/rest/v1/rpc/${name}`, { method: "POST", headers, body: JSON.stringify(body), redirect: "error", signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Supabase 데이터 요청 실패 (${response.status}). 테이블 설정과 서버 키를 확인해주세요. 자동 재시도하지 않았습니다.`);
  return response.status === 204 ? null : response.json();
}
