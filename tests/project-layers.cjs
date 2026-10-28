/* eslint-disable @typescript-eslint/no-require-imports -- isolated project layer state fixtures */
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm"), ts = require("typescript"), assert = require("node:assert/strict");
const cache = new Map();
function load(file) {
  const absolute = path.resolve(file);
  if (absolute.endsWith(`${path.sep}fonts.ts`)) return { fontCatalog: [], fontFamilies: {} };
  if (cache.has(absolute)) return cache.get(absolute);
  const loaded = { exports: {} }; cache.set(absolute, loaded.exports);
  const code = ts.transpileModule(fs.readFileSync(absolute, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInThisContext(`(function(exports,require){${code}\n})`)(loaded.exports, name => name.startsWith(".") ? load(path.resolve(path.dirname(absolute), `${name}.ts`)) : require(name));
  return loaded.exports;
}
const { projectLayers, applyLayerAction } = load("lib/project-layers.ts");
const project = { sections: [
  { id: "first", kind: "hero", title: "Main title", body: "Description", image: "/api/uploads/aa.webp", imageMeta: { source: "ai" }, visible: true, elements: [{ id: "photo", type: "image", image: "/api/uploads/bb.webp", text: "Extra photo" }, { id: "badge", type: "badge", text: "Badge" }] },
  { id: "second", kind: "benefits", title: "Points", body: "One\nTwo\nThree", image: "", visible: true },
  { id: "blank", kind: "story", title: "", body: "", image: "", visible: false, canvasMode: "blank" },
] };
const snapshot = JSON.stringify(project);
assert.equal(projectLayers(project.sections[0]).length, 6);
assert(projectLayers(project.sections[1]).find(layer => layer.target === "body").name.includes("3"));
assert.equal(projectLayers(project.sections[2]).length, 0);
let updated = applyLayerAction(project, "second", "title", "visibility");
assert.equal(projectLayers(updated.sections[1]).find(layer => layer.target === "title").hidden, true);
assert.equal(updated.sections[0], project.sections[0]); assert.equal(updated.sections[2], project.sections[2]);
updated = applyLayerAction(project, "first", "extra:photo", "lock");
assert.equal(projectLayers(updated.sections[0]).find(layer => layer.target === "extra:photo").locked, true);
assert.throws(() => applyLayerAction(updated, "first", "extra:photo", "delete"));
updated = applyLayerAction(updated, "first", "extra:photo", "lock");
updated = applyLayerAction(updated, "first", "extra:photo", "delete");
assert.equal(updated.sections[0].elements.length, 1); assert.equal(updated.sections[0].elements[0].id, "badge");
updated = applyLayerAction(project, "first", "image", "delete");
assert.equal(updated.sections[0].image, ""); assert.equal(updated.sections[0].imageMeta, undefined); assert.equal(updated.sections[0].format.image.hidden, true);
assert(!projectLayers(updated.sections[0]).some(layer => layer.target === "image"));
for (const target of ["title", "body", "kicker"]) {
  updated = applyLayerAction(project, "first", target, "delete");
  assert.equal(updated.sections[0][target], ""); assert(!projectLayers(updated.sections[0]).some(layer => layer.target === target));
}
updated = applyLayerAction(project, "second", "section", "visibility"); assert.equal(updated.sections[1].visible, false);
assert.throws(() => applyLayerAction(updated, "first", "section", "visibility"));
assert.equal(applyLayerAction(project, "missing", "title", "delete"), project);
assert.equal(applyLayerAction(project, "first", "extra:missing", "delete"), project);
assert.equal(JSON.stringify(project), snapshot);
console.log("PASS: page layer inventory, hidden/locked elements, scoped deletion, metadata cleanup, blank pages, last-page guard and immutable history.");
