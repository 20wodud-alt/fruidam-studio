/* eslint-disable @typescript-eslint/no-require-imports -- isolated local image processing fixtures */
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
const vm = require("node:vm");
const ts = require("typescript");
const sharp = require("sharp");
sharp.cache(false);

const skinCatalog = { exports: {} };
vm.runInThisContext(`(function(exports){${ts.transpileModule(require("node:fs").readFileSync("lib/design-skins.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText}\n})`)(skinCatalog.exports);

const loadedModules = new Map();
function load(file, cwd) {
  const full = path.resolve(file), key = `${cwd}:${full}`;
  if (loadedModules.has(key)) return loadedModules.get(key);
  const loaded = { exports: {} }; loadedModules.set(key, loaded.exports);
  const compiled = ts.transpileModule(require("node:fs").readFileSync(full, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const req = name => name === "./fonts" ? { fontIds: ["sans"], fontFamilies: {} } : name === "./design-skins" ? skinCatalog.exports : name.startsWith("@/") ? load(name.slice(2) + ".ts", cwd) : name.startsWith(".") ? load(path.resolve(path.dirname(full), name + ".ts"), cwd) : require(name);
  vm.runInThisContext(`(function(exports,require,module,process,Response,Buffer){${compiled}\n})`)(loaded.exports, req, loaded, { cwd: () => cwd, env: { FRUIDAM_ASSET_STORAGE: "local", FRUIDAM_SETTINGS_STORAGE: "local" } }, Response, Buffer);
  return loaded.exports;
}

(async () => {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), "fruitdam-image-tools-"));
  const directory = path.join(temporary, "data", "uploads");
  await fs.mkdir(directory, { recursive: true });
  try {
    const source = await sharp({ create: { width: 100, height: 80, channels: 4, background: "#ffffff" } }).composite([{ input: await sharp({ create: { width: 40, height: 30, channels: 4, background: "#ff0000" } }).png().toBuffer(), left: 30, top: 25 }]).webp({ lossless: true }).toBuffer();
    await fs.writeFile(path.join(directory, "aabbcc.webp"), source);
    const provenance = { source: "ai", projectId: "test-project", imageMeta: { source: "ai", scene: "detail" }, url: "/api/uploads/aabbcc.webp" };
    await fs.writeFile(path.join(directory, "aabbcc.webp.json"), JSON.stringify(provenance));
    const { POST } = await load("app/api/image-tools/route.ts", temporary);
    const request = input => POST(new Request("http://localhost/api/image-tools", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: provenance.url, ...input }) }));
    const crop = await request({ action: "crop", rect: { x: 25, y: 25, width: 50, height: 50 } });
    assert.equal(crop.status, 200);
    const cropURL = (await crop.json()).url;
    const cropFile = path.join(directory, path.basename(cropURL));
    const metadata = await sharp(cropFile).metadata();
    assert.equal(metadata.width, 50); assert.equal(metadata.height, 40);
    const copied = JSON.parse(await fs.readFile(`${cropFile}.json`, "utf8"));
    assert.equal(copied.projectId, provenance.projectId); assert.equal(copied.imageMeta.source, "ai"); assert.equal(copied.url, cropURL);
    const removed = await request({ action: "background", color: "#ffffff", tolerance: 20 });
    assert.equal(removed.status, 200);
    const raw = await sharp(path.join(directory, path.basename((await removed.json()).url))).ensureAlpha().raw().toBuffer();
    assert.equal(raw[3], 0); assert.equal(raw[(40 * 100 + 50) * 4 + 3], 255);
    assert.equal((await request({ action: "sharpen" })).status, 200);
    for (const image of ["../../ai-settings.json", "https://example.com/image.webp", "/api/uploads/../secret.webp"]) assert.equal((await request({ image, action: "sharpen" })).status, 400);
    assert.equal((await request({ action: "crop", rect: { x: 90, y: 0, width: 50, height: 50 } })).status, 400);
    assert.equal((await request({ action: "background", color: "red", tolerance: 20 })).status, 400);
    assert.deepEqual(await fs.readFile(path.join(directory, "aabbcc.webp")), source);
    const { validateSectionFormat } = await load("lib/validate-element-style.ts", temporary);
    const { photoCSS } = await load("lib/element-style.ts", temporary);
    const saved = validateSectionFormat({ image: { flipY: true, grayscale: true, zIndex: 12 } });
    assert.equal(saved.image.flipY, true); assert.equal(saved.image.grayscale, true); assert.equal(saved.image.zIndex, 12);
    const style = photoCSS(saved.image); assert(style.transform.includes("scaleY(-1)")); assert(style.filter.includes("grayscale(100%)")); assert.equal(style.zIndex, 12);
    assert.throws(() => validateSectionFormat({ image: { zIndex: 51 } }));
    console.log("PASS: crop dimensions, transparent background, sharpen, safe paths, source preservation, AI provenance, and persisted photo styles.");
  } finally {
    const resolved = path.resolve(temporary);
    assert.equal(path.dirname(resolved), path.resolve(os.tmpdir()));
    assert(path.basename(resolved).startsWith("fruitdam-image-tools-"));
    await fs.rm(resolved, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
