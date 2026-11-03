import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { emptyCommerce, type CommerceState } from "./commerce";
import { storageProvider, supabaseStorageConfig } from "./supabase-storage";

export class CommerceError extends Error { constructor(message: string, public status = 400, public code?:string) { super(message); } }
const singleton = globalThis as typeof globalThis & { commerceQueue?: Promise<unknown> };
async function rpc(name: string, body: unknown) {
  const {url,key} = supabaseStorageConfig();
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, { method: "POST", headers: { apikey: key, ...(key.startsWith("eyJ") ? {Authorization: `Bearer ${key}`} : {}), "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store", signal: AbortSignal.timeout(20000) });
  if (!response.ok) { const data = await response.json().catch(() => ({})); throw new CommerceError(data.code === "40001" ? "다른 요청이 먼저 저장됐습니다. 새로고침 후 다시 진행해주세요." : "판매 서비스 저장소를 연결하지 못했습니다. 잠시 후 다시 확인해주세요.", data.code === "40001" ? 409 : 503); }
  return response.status === 204 ? null : response.json();
}
export async function commerceAccess(update?: (state: CommerceState) => void): Promise<CommerceState> {
  const task = (singleton.commerceQueue ?? Promise.resolve()).then(async () => {
    if (storageProvider() === "supabase") {
      const snapshot = await rpc("FRUIDAM_commerce_load", {});
      const state = snapshot.document as CommerceState;
      if (update) { update(state); await rpc("FRUIDAM_commerce_save", { next_document: state, expected_revision: snapshot.revision }); }
      return state;
    }
    if (process.env.VERCEL) throw new CommerceError("배포 환경에는 영구 저장소가 필요합니다.", 503);
    const file = path.join(process.cwd(), "data", "commerce.json");
    let state: CommerceState;
    try { state = JSON.parse(await fs.readFile(file, "utf8")); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; state = emptyCommerce(); }
    if (update) { update(state); await fs.mkdir(path.dirname(file), {recursive:true}); const temp = `${file}.${randomUUID()}.tmp`; await fs.writeFile(temp, JSON.stringify(state), {mode:0o600}); await fs.rename(temp, file); }
    return state;
  });
  singleton.commerceQueue = task.catch(() => {});
  return task;
}
