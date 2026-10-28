import type { StudioProject } from "./studio";

export class StudioStorageError extends Error {
  readonly code = "FRUIDAM_STORAGE";
  constructor(message: string, readonly status = 503) { super(message); this.name = "StudioStorageError"; }
}
type StorageEnvironment = Record<string, string | undefined>;
type Snapshot = { project: StudioProject; revision: number };
export type SupabaseStorageConfig = { url: string; key: string };

export function storageProvider(env: StorageEnvironment = process.env): "local" | "supabase" {
  const mode = env.FRUIDAM_STORAGE?.trim();
  if (mode && mode !== "local" && mode !== "supabase") throw new StudioStorageError("저장소 설정을 확인해주세요.");
  if (mode === "local") return "local";
  return mode === "supabase" || env.SUPABASE_URL || env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY ? "supabase" : "local";
}
export function supabaseStorageConfig(env: StorageEnvironment = process.env): SupabaseStorageConfig {
  let url: URL;
  try { url = new URL(env.SUPABASE_URL || ""); } catch { throw new StudioStorageError("Supabase URL과 서버 전용 키를 설정해주세요."); }
  const key = (env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (url.protocol !== "https:" || !/^[a-z0-9]+\.supabase\.co$/.test(url.hostname) || url.username || url.password || url.port || url.search || url.hash || !["", "/"].includes(url.pathname) || !key || !(key.startsWith("sb_secret_") || key.startsWith("eyJ"))) {
    throw new StudioStorageError("Supabase 프로젝트 URL과 서버 전용 secret/service_role 키를 확인해주세요.");
  }
  return { url: url.origin, key };
}

async function request(config: SupabaseStorageConfig, name: string, body: unknown, fetcher: typeof fetch): Promise<unknown> {
  const headers: Record<string, string> = { apikey: config.key, "Content-Type": "application/json" };
  if (config.key.startsWith("eyJ")) headers.Authorization = `Bearer ${config.key}`;
  let response: Response;
  try {
    response = await fetcher(`${config.url}/rest/v1/rpc/${name}`, { method: "POST", headers, body: JSON.stringify(body), cache: "no-store", redirect: "error", signal: AbortSignal.timeout(20000) });
  } catch { throw new StudioStorageError("Supabase에 연결하지 못했어요. 연결 상태를 확인해주세요. 로컬 저장으로 자동 전환하지 않습니다."); }
  if (!response.ok) {
    let code = "";
    try { const error = await response.json(); code = typeof error.code === "string" ? error.code : ""; } catch { /* Never echo response bodies, keys, or document content. */ }
    if (code === "40001") throw new StudioStorageError("다른 저장 요청과 충돌했어요. 작업을 새로 불러온 뒤 저장해주세요.", 409);
    throw new StudioStorageError("Supabase 저장에 실패했어요. 프로젝트 상태·서버 키·FRUIDAM 테이블 설정을 확인해주세요.");
  }
  if (response.status === 204) return null;
  try { return await response.json(); } catch { throw new StudioStorageError("Supabase 저장 응답을 확인하지 못했어요."); }
}

export async function supabaseStudioAccess(update?: (projects: StudioProject[]) => void, config = supabaseStorageConfig(), fetcher: typeof fetch = fetch): Promise<StudioProject[]> {
  const raw = await request(config, "FRUIDAM_load_projects", {}, fetcher);
  if (!Array.isArray(raw) || raw.some(row => !row?.project || typeof row.project.id !== "string" || !Array.isArray(row.project.sections) || !Number.isSafeInteger(row.revision) || row.revision < 1)) throw new StudioStorageError("Supabase 작업 데이터 형식을 확인해주세요.");
  const rows = raw as Snapshot[];
  const previous = new Map(rows.map((row, position) => [row.project.id, { revision: row.revision, position, serialized: JSON.stringify(row.project) }]));
  const projects = rows.map(row => row.project);
  if (!update) return projects;
  update(projects);
  if (new Set(projects.map(project => project.id)).size !== projects.length) throw new StudioStorageError("중복된 작업 ID가 있어 저장하지 못했어요.", 400);
  const present = new Set(projects.map(project => project.id));
  const changes = projects.flatMap((project, position) => {
    const before = previous.get(project.id);
    return before?.serialized === JSON.stringify(project) && before.position === position ? [] : [{ project, position, expected_revision: before?.revision ?? 0 }];
  });
  const deletions = [...previous].filter(([id]) => !present.has(id)).map(([id, before]) => ({ id, expected_revision: before.revision }));
  if (changes.length || deletions.length) await request(config, "FRUIDAM_apply_changes", { changes, deletions }, fetcher);
  return projects;
}
