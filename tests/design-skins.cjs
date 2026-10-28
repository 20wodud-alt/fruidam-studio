/* eslint-disable @typescript-eslint/no-require-imports -- isolated skin scope and persistence fixtures */
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm"), ts = require("typescript"), assert = require("node:assert/strict");
const modules = new Map();
function load(file) {
  const absolute = path.resolve(file); if (modules.has(absolute)) return modules.get(absolute);
  const loaded = { exports: {} }; modules.set(absolute, loaded.exports);
  const code = ts.transpileModule(fs.readFileSync(absolute, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInThisContext(`(function(exports,require){${code}\n})`)(loaded.exports, name => name.startsWith(".") ? load(path.resolve(path.dirname(absolute), `${name}.ts`)) : require(name));
  return loaded.exports;
}
const { designSkins, skinIds, applyDesignSkin } = load("lib/design-skins.ts");
const { validateSectionFormat } = load("lib/validate-element-style.ts");
const project = { product: { name: "Fruit", images: ["/original.webp"] }, copyAudit: { id: "audit" }, sections: [
  { id: "hero", kind: "hero", title: "Existing headline", body: "Original copy", image: "/original.webp", imageMeta: { source: "ai", model: "unchanged" }, visible: true, format: { title: { offsetX: 20 }, image: { hidden: true, locked: true, brightness: 90 } }, elements: [{ id: "e", type: "text", text: "Custom", x: 120, y: 450 }] },
  { id: "story", kind: "story", title: "Story", body: "Keep me", image: "/story.webp", visible: true, reviewed: true },
  { id: "blank", kind: "detail", title: "", body: "", image: "", visible: false, canvasMode: "blank" },
] };
const before = JSON.stringify(project), signatures = new Set();
assert.equal(designSkins.length, 6); assert.equal(new Set(skinIds).size, 6);
for (const skin of designSkins) {
  const single = applyDesignSkin(project, skin.id, "page", "story");
  assert.equal(single.sections[0], project.sections[0]); assert.equal(single.sections[2], project.sections[2]);
  assert.equal(single.sections[1].format.skin, skin.id);
  const all = applyDesignSkin(project, skin.id, "all", "hero");
  for (const [index, section] of all.sections.entries()) {
    const original = project.sections[index];
    for (const key of ["id", "title", "body", "image", "visible", "canvasMode", "reviewed"]) assert.equal(section[key], original[key]);
    assert.equal(section.elements, original.elements); assert.equal(section.imageMeta, original.imageMeta);
    assert.equal(validateSectionFormat(JSON.parse(JSON.stringify(section.format))).skin, skin.id);
    assert.equal(section.format.background, "#ffffff");
  }
  assert.equal(all.product, project.product); assert.equal(all.copyAudit, project.copyAudit);
  assert.equal(all.sections[0].format.image.hidden, true); assert.equal(all.sections[0].format.image.locked, true); assert.equal(all.sections[0].format.image.brightness, 90);
  signatures.add(JSON.stringify(all.sections[0].format));
}
assert.equal(signatures.size, 6); assert.equal(JSON.stringify(project), before);
assert.throws(() => applyDesignSkin(project, "unknown", "all", "hero"));
assert.throws(() => applyDesignSkin(project, skinIds[0], "unknown", "hero"));
assert.throws(() => applyDesignSkin(project, skinIds[0], "page", "missing"));
assert.throws(() => validateSectionFormat({ skin: "unknown" }));
console.log("PASS: six distinct skins, single/all-page scope, save validation, immutable content/photos/extras/audits, hidden/locked state and invalid input guards.");
