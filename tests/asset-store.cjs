/* eslint-disable @typescript-eslint/no-require-imports -- isolated cloud file persistence fixtures */
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm"), ts = require("typescript"), assert = require("node:assert/strict");
const fakeEnv = { VERCEL: "1", SUPABASE_URL: "https://fixture.supabase.co", SUPABASE_SECRET_KEY: "sb_secret_fixture" };
const files = new Map(), calls = [], modules = new Map();
async function fixtureFetch(url, init = {}) {
  calls.push(url); assert.equal(init.headers.apikey, fakeEnv.SUPABASE_SECRET_KEY); assert.equal(init.redirect, "error");
  const part = new URL(url).pathname.split("/storage/v1/")[1];
  if (part === "object/list/fruidam-assets") {
    const body = JSON.parse(init.body); assert.equal(body.prefix, "history/project-one/");
    return Response.json([{ name: "aabb.webp.json" }]);
  }
  const key = part.replace(/^object\/(?:authenticated\/)?fruidam-assets\//, "");
  if (init.method === "POST") { files.set(key, Buffer.from(init.body)); return Response.json({ Key: key }); }
  return files.has(key) ? new Response(files.get(key)) : Response.json({ statusCode: "404" }, { status: 400 });
}
function load(file) {
  const full = path.resolve(file); if (modules.has(full)) return modules.get(full);
  const loaded = { exports: {} }; modules.set(full, loaded.exports);
  const compiled = ts.transpileModule(fs.readFileSync(full, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInThisContext(`(function(exports,require,process,fetch){${compiled}\n})`)(loaded.exports, name => name.startsWith(".") ? load(path.resolve(path.dirname(full), `${name}.ts`)) : require(name), { env: fakeEnv, cwd: () => { throw new Error("Hosted mode must not use local disk"); } }, fixtureFetch);
  return loaded.exports;
}
(async () => {
  const { readAsset, writeAsset, assetMetadataFiles, readSettingFile, writeSettingFile } = load("lib/asset-store.ts");
  const bytes = Buffer.from("fixture-image"); await writeAsset("aabb.webp", bytes); assert.deepEqual(await readAsset("aabb.webp"), bytes);
  const meta = Buffer.from(JSON.stringify({ source: "ai", projectId: "project-one", imageMeta: { source: "ai" } }));
  await writeAsset("aabb.webp.json", meta); assert(files.has("history/project-one/aabb.webp.json")); assert.deepEqual(await assetMetadataFiles("project-one"), ["aabb.webp.json"]);
  await writeSettingFile("ai-settings.json", { provider: "gemini", model: "gemini-fixture", apiKey: "" }); assert.equal(JSON.parse(await readSettingFile("ai-settings.json")).model, "gemini-fixture");
  fakeEnv.GEMINI_API_KEY = "AIza_FIXTURE_KEY";
  const ai = load("lib/ai-settings.ts");
  await ai.saveAISettings({ model: "gemini-fixture", enabled: false, research: false });
  const aiRead = await ai.readAISettings(); assert.equal(aiRead.enabled, false); assert.equal(aiRead.research, false); assert.equal(aiRead.apiKey, fakeEnv.GEMINI_API_KEY);
  assert.equal(JSON.parse(await readSettingFile("ai-settings.json")).apiKey, "");
  assert(!JSON.stringify(await ai.publicAISettings()).includes(fakeEnv.GEMINI_API_KEY));
  await assert.rejects(ai.saveAISettings({ clearKey: true, model: "gemini-fixture" }));
  await assert.rejects(readAsset("../../ai-settings.json")); await assert.rejects(assetMetadataFiles("../other-project"));
  await assert.rejects(readAsset("ffff.webp"), error => error.code === "ENOENT");
  const before = calls.length; fakeEnv.FRUIDAM_ASSET_STORAGE = "local"; await assert.rejects(writeAsset("ffff.webp", bytes)); assert.equal(calls.length, before);
  console.log("PASS: hosted private file storage, bytes, AI provenance/history scope, settings persistence, missing/path guards and no ephemeral-disk fallback.");
})().catch(error => { console.error(error.message); process.exitCode = 1; });
