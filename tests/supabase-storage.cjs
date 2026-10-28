/* eslint-disable @typescript-eslint/no-require-imports -- isolated persistence and credential boundary fixtures */
const fs = require("node:fs"), vm = require("node:vm"), ts = require("typescript"), assert = require("node:assert/strict");
const loaded = { exports: {} };
const code = ts.transpileModule(fs.readFileSync("lib/supabase-storage.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
vm.runInThisContext(`(function(exports){${code}\n})`)(loaded.exports);
const { storageProvider, supabaseStorageConfig, supabaseStudioAccess, StudioStorageError } = loaded.exports;
assert.equal(storageProvider({}), "local"); assert.equal(storageProvider({ FRUIDAM_STORAGE: "local", SUPABASE_URL: "invalid" }), "local");
assert.equal(storageProvider({ SUPABASE_URL: "https://fixture.supabase.co" }), "supabase");
assert.throws(() => storageProvider({ FRUIDAM_STORAGE: "unknown" }));
assert.throws(() => supabaseStorageConfig({ SUPABASE_URL: "https://fixture.supabase.co" }));
for (const url of ["http://fixture.supabase.co", "https://attacker.example", "https://secret@fixture.supabase.co", "https://fixture.supabase.co/leak", "https://fixture.supabase.co?key=secret"]) assert.throws(() => supabaseStorageConfig({ SUPABASE_URL: url, SUPABASE_SECRET_KEY: "sb_secret_fixture" }));
assert.throws(() => supabaseStorageConfig({ SUPABASE_URL: "https://fixture.supabase.co", SUPABASE_SECRET_KEY: "sb_publishable_fixture" }));
const config = supabaseStorageConfig({ SUPABASE_URL: "https://fixture.supabase.co", SUPABASE_SECRET_KEY: "sb_secret_fixture" });
const original = [{ revision: 4, project: { id: "first", product: { name: "Original" }, sections: [{ id: "s1", body: "Copy" }] } }, { revision: 2, project: { id: "second", product: { name: "Other" }, sections: [{ id: "s2", body: "Untouched" }] } }];
let calls = [], fail = false, conflict = false;
const fixtureFetch = async (url, init) => {
  calls.push({ url, init, payload: JSON.parse(init.body) });
  assert.equal(init.headers.apikey, config.key); assert.equal(init.headers.Authorization, undefined); assert.equal(init.redirect, "error"); assert.equal(init.cache, "no-store");
  if (url.endsWith("FRUIDAM_load_projects")) return Response.json(structuredClone(original));
  if (conflict) return Response.json({ code: "40001", message: "PRIVATE_TEXT sb_secret_fixture" }, { status: 409 });
  if (fail) return Response.json({ message: "PRIVATE_TEXT sb_secret_fixture" }, { status: 500 });
  return new Response(null, { status: 204 });
};
(async () => {
  assert.equal((await supabaseStudioAccess(undefined, config, fixtureFetch)).length, 2); assert.equal(calls.length, 1);
  calls = []; await supabaseStudioAccess(() => {}, config, fixtureFetch); assert.equal(calls.length, 1);
  calls = []; await supabaseStudioAccess(projects => { projects[0].sections[0].body = "Edited"; }, config, fixtureFetch);
  assert.equal(calls.length, 2); assert.equal(calls[1].payload.changes.length, 1); assert.equal(calls[1].payload.changes[0].expected_revision, 4); assert.equal(calls[1].payload.changes[0].project.id, "first"); assert.equal(calls[1].payload.deletions.length, 0);
  calls = []; await supabaseStudioAccess(projects => { projects.splice(1, 1); }, config, fixtureFetch);
  assert.equal(calls[1].payload.deletions[0].id, "second"); assert.equal(calls[1].payload.deletions[0].expected_revision, 2); assert.equal(calls[1].payload.changes.length, 0);
  calls = []; await supabaseStudioAccess(projects => { projects.push({ id: "new", product: {}, sections: [{ id: "n" }] }); }, config, fixtureFetch); assert.equal(calls[1].payload.changes[0].expected_revision, 0);
  conflict = true; calls = [];
  await assert.rejects(supabaseStudioAccess(projects => { projects[0].starred = true; }, config, fixtureFetch), error => error instanceof StudioStorageError && error.status === 409 && !error.message.includes("sb_secret") && !error.message.includes("PRIVATE_TEXT")); assert.equal(calls.length, 2);
  conflict = false; fail = true; calls = [];
  await assert.rejects(supabaseStudioAccess(projects => { projects[0].starred = true; }, config, fixtureFetch), error => error instanceof StudioStorageError && !error.message.includes("PRIVATE_TEXT")); assert.equal(calls.length, 2);
  calls = []; await assert.rejects(supabaseStudioAccess(() => { throw new Error("Invalid edit"); }, config, fixtureFetch)); assert.equal(calls.length, 1);
  assert.equal(original[0].project.sections[0].body, "Copy");
  console.log("PASS: provider validation, secret-only server requests, scoped commits/no-op, revisions, safe errors, no retries and no fallback on failures.");
})().catch(error => { console.error(error.message); process.exitCode = 1; });
