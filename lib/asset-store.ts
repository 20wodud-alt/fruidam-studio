import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { supabaseStorageConfig } from "./supabase-storage";

const assetPattern = /^[a-f0-9-]+\.webp(?:\.json)?$/;
type SettingFile = "ai-settings.json" | "nongsaro-settings.json";
function cloud(kind: "asset" | "settings") {
  const mode = process.env[kind === "asset" ? "FRUIDAM_ASSET_STORAGE" : "FRUIDAM_SETTINGS_STORAGE"];
  if (mode && mode !== "local" && mode !== "supabase") throw new Error("파일 저장소 설정을 확인해주세요.");
  if (process.env.VERCEL && mode === "local") throw new Error("배포 환경에서는 영구 파일 저장소가 필요해요.");
  return mode === "supabase" || Boolean(process.env.VERCEL);
}
function objectPath(key: string) {
  if (!assetPattern.test(key) && !/^history\/[a-z0-9-]{1,100}\/[a-f0-9-]+\.webp\.json$/i.test(key) && !/^settings\/(ai|nongsaro)-settings\.json$/.test(key)) throw new Error("파일 저장 경로를 확인해주세요.");
  return key.split("/").map(encodeURIComponent).join("/");
}
async function storageRequest(endpoint: string, init: RequestInit = {}) {
  const config = supabaseStorageConfig();
  const headers: Record<string, string> = { apikey: config.key, ...(init.headers as Record<string, string> || {}) };
  if (config.key.startsWith("eyJ")) headers.Authorization = `Bearer ${config.key}`;
  let response: Response;
  try { response = await fetch(`${config.url}/storage/v1/${endpoint}`, { ...init, headers, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(30000) }); }
  catch { throw new Error("사진 저장소에 연결하지 못했어요. 잠시 후 다시 확인해주세요."); }
  if (!response.ok) {
    let missing = response.status === 404;
    if (!missing) try { const result = await response.json(); missing = result.statusCode === "404" || result.statusCode === 404 || result.error === "not_found"; } catch { /* Do not echo response content. */ }
    if (missing) throw Object.assign(new Error("파일을 찾을 수 없어요."), { code: "ENOENT" });
    throw new Error("파일 저장소 요청에 실패했어요. 연결과 접근 권한을 확인해주세요.");
  }
  return response;
}
const bucket = "fruidam-assets";
async function readObject(key: string) { return Buffer.from(await (await storageRequest(`object/authenticated/${bucket}/${objectPath(key)}`)).arrayBuffer()); }
async function writeObject(key: string, bytes: Buffer, contentType: string) {
  await storageRequest(`object/${bucket}/${objectPath(key)}`, { method: "POST", headers: { "Content-Type": contentType, "x-upsert": "true" }, body: new Uint8Array(bytes) });
}
export async function readAsset(filename: string): Promise<Buffer> {
  if (!assetPattern.test(filename)) throw new Error("이미지 파일명을 확인해주세요.");
  return cloud("asset") ? readObject(filename) : fs.readFile(path.join(process.cwd(), "data", "uploads", filename));
}
export async function writeAsset(filename: string, bytes: Buffer): Promise<void> {
  if (!assetPattern.test(filename)) throw new Error("이미지 파일명을 확인해주세요.");
  if (cloud("asset")) {
    await writeObject(filename, bytes, filename.endsWith(".json") ? "application/json" : "image/webp");
    if (filename.endsWith(".json")) {
      const meta = JSON.parse(bytes.toString("utf8"));
      if (meta.source === "ai" && typeof meta.projectId === "string" && /^[a-z0-9-]{1,100}$/i.test(meta.projectId)) await writeObject(`history/${meta.projectId}/${filename}`, bytes, "application/json");
    }
  } else {
    const directory = path.join(process.cwd(), "data", "uploads");
    await fs.mkdir(directory, { recursive: true });
    const temp = path.join(directory, `${filename}.${randomUUID()}.tmp`);
    await fs.writeFile(temp, bytes); await fs.rename(temp, path.join(directory, filename));
  }
}
export async function assetMetadataFiles(projectId: string): Promise<string[]> {
  if (!/^[a-z0-9-]{1,100}$/i.test(projectId)) throw new Error("작업 ID를 확인해주세요.");
  if (!cloud("asset")) {
    try { return (await fs.readdir(path.join(process.cwd(), "data", "uploads"))).filter(name => /^[a-f0-9-]+\.webp\.json$/.test(name)); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return []; throw error; }
  }
  const files: string[] = [];
  for (let offset = 0; ; offset += 100) {
    const response = await storageRequest(`object/list/${bucket}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prefix: `history/${projectId}/`, limit: 100, offset, sortBy: { column: "name", order: "asc" } }) });
    const rows = await response.json() as { name: string }[];
    if (!Array.isArray(rows)) throw new Error("사진 이력을 읽지 못했어요.");
    files.push(...rows.filter(row => /^[a-f0-9-]+\.webp\.json$/.test(row.name)).map(row => row.name));
    if (rows.length < 100) break;
  }
  return files;
}
export async function readSettingFile(name: SettingFile): Promise<string> {
  return cloud("settings") ? (await readObject(`settings/${name}`)).toString("utf8") : fs.readFile(path.join(process.cwd(), "data", name), "utf8");
}
export async function writeSettingFile(name: SettingFile, value: unknown): Promise<void> {
  const bytes = Buffer.from(JSON.stringify(value, null, 2));
  if (cloud("settings")) await writeObject(`settings/${name}`, bytes, "application/json");
  else {
    const directory = path.join(process.cwd(), "data"); await fs.mkdir(directory, { recursive: true });
    const temp = path.join(directory, `${name}.${randomUUID()}.tmp`); await fs.writeFile(temp, bytes, { mode: 0o600 }); await fs.rename(temp, path.join(directory, name));
  }
}
