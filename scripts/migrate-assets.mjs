import { readFile, writeFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { configuration, rpc } from "./supabase-helpers.mjs";

try {
  const config = configuration(), bucket = "fruidam-assets";
  const headers = { apikey: config.key };
  if (config.key.startsWith("eyJ")) headers.Authorization = `Bearer ${config.key}`;
  async function request(endpoint, init = {}, allowMissing = false) {
    const response = await fetch(`${config.url}/storage/v1/${endpoint}`, { ...init, headers: { ...headers, ...init.headers }, redirect: "error", signal: AbortSignal.timeout(30000) });
    if (allowMissing && [400, 404].includes(response.status)) return null;
    if (!response.ok) throw new Error(`비공개 사진 저장소 요청 실패 (${response.status}). 자동 재시도하지 않았습니다.`);
    return response;
  }
  let existing = await request(`bucket/${bucket}`, {}, true);
  if (!existing) {
    await request("bucket", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: bucket, name: bucket, public: false, file_size_limit: 8 * 1024 * 1024, allowed_mime_types: ["image/webp", "application/json"] }) });
    existing = await request(`bucket/${bucket}`);
  }
  if ((await existing.json()).public !== false) throw new Error("사진 버킷이 비공개인지 확인해주세요.");
  const rows = await rpc(config, "FRUIDAM_load_projects", {});
  const ids = new Set(rows.map(row => row.project.id)), names = new Set(), metadata = new Map();
  const collect = value => {
    if (typeof value === "string") { const match = /^\/api\/uploads\/([a-f0-9-]+\.webp)$/.exec(value); if (match) names.add(match[1]); }
    else if (Array.isArray(value)) value.forEach(collect);
    else if (value && typeof value === "object") Object.values(value).forEach(collect);
  };
  rows.forEach(row => collect(row.project));
  const directory = path.join("data", "uploads");
  for (const filename of (await readdir(directory)).filter(name => /^[a-f0-9-]+\.webp\.json$/.test(name))) {
    const bytes = await readFile(path.join(directory, filename)), meta = JSON.parse(bytes.toString("utf8"));
    const image = filename.slice(0, -5);
    if (ids.has(meta.projectId)) names.add(image);
    if (names.has(image) || ids.has(meta.projectId)) metadata.set(filename, { bytes, meta });
  }
  const objects = [...await Promise.all([...names].map(async name => ({ name, bytes: await readFile(path.join(directory, name)), type: "image/webp" })))];
  for (const [name, { bytes, meta }] of metadata) {
    objects.push({ name, bytes, type: "application/json" });
    if (ids.has(meta.projectId)) objects.push({ name: `history/${meta.projectId}/${name}`, bytes, type: "application/json" });
  }
  for (const name of ["ai-settings.json", "nongsaro-settings.json"]) {
    let saved;
    try { saved = JSON.parse(await readFile(path.join("data", name), "utf8")); }
    catch (error) { if (error.code === "ENOENT") continue; throw error; }
    // Credentials go to encrypted Vercel environment variables, never this migration.
    saved.apiKey = "";
    objects.push({ name: `settings/${name}`, bytes: Buffer.from(JSON.stringify(saved)), type: "application/json" });
  }
  const hash = bytes => createHash("sha256").update(bytes).digest("hex");
  for (let offset = 0; offset < objects.length; offset += 4) {
    await Promise.all(objects.slice(offset, offset + 4).map(async object => {
      const key = object.name.split("/").map(encodeURIComponent).join("/");
      await request(`object/${bucket}/${key}`, { method: "POST", headers: { "Content-Type": object.type, "x-upsert": "true" }, body: object.bytes });
      const downloaded = await request(`object/authenticated/${bucket}/${key}`);
      if (hash(Buffer.from(await downloaded.arrayBuffer())) !== hash(object.bytes)) throw new Error("사진 이전 후 원본 대조에 실패했습니다.");
    }));
    console.log(`사진·메타데이터 원본 대조: ${Math.min(offset + 4, objects.length)}/${objects.length}`);
  }
  const result = { bucket, images: names.size, metadata: metadata.size, objects: objects.length, bytes: objects.reduce((sum, object) => sum + object.bytes.length, 0), migrated_at: new Date().toISOString() };
  await writeFile("data/asset-migration-summary.json", JSON.stringify(result, null, 2));
  console.log(`완료: 비공개 사진 ${result.images}개, 생성 이력 ${result.metadata}개. 원본 파일과 기존 URL을 유지했습니다.`);
} catch (error) { console.error(error instanceof Error ? error.message : "사진 저장소 이전 실패"); process.exitCode = 1; }
