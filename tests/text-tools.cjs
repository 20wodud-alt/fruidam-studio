/* eslint-disable @typescript-eslint/no-require-imports -- isolated text style persistence and export fixtures */
const fs = require("node:fs"), vm = require("node:vm"), ts = require("typescript"), assert = require("node:assert/strict");
const React = require("react"), { renderToStaticMarkup } = require("react-dom/server");
function load(file) {
  const loaded = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInThisContext(`(function(exports,require){${code}\n})`)(loaded.exports, name => name === "./fonts" ? { fontIds: ["sans"], fontFamilies: { sans: "sans-serif" } } : name.startsWith(".") ? load(require("node:path").resolve(require("node:path").dirname(file), `${name}.ts`)) : require(name));
  return loaded.exports;
}
const { validateTextFormat, validateElements } = load("lib/validate-element-style.ts");
const { textCSS } = load("lib/element-style.ts");
const { TextContent } = load("components/text-content.tsx");
const original = { fontSize: 77.5, opacity: 45, zIndex: 12, strike: true, underline: true, superscript: true, highlight: "#ffee66", strokeWidth: 1.5, strokeColor: "#123456", shadow: true, shadowX: -3, shadowY: 4, shadowBlur: 8, shadowColor: "#aabbcc", curve: -35, listStyle: "number" };
const saved = validateTextFormat(JSON.parse(JSON.stringify(original)));
for (const [key, value] of Object.entries(original)) assert.equal(saved[key], value);
const style = textCSS(saved);
assert.equal(style.opacity, .45); assert.equal(style.zIndex, 12); assert.equal(style.position, "relative"); assert.equal(style.WebkitTextStroke, "1.5px #123456"); assert.equal(style.textShadow, "-3px 4px 8px #aabbcc"); assert.equal(style.textDecoration, "underline line-through");
for (const invalid of [{ opacity: -1 }, { zIndex: 51 }, { strokeWidth: 7 }, { shadowBlur: 31 }, { shadowX: 21 }, { curve: 81 }, { highlight: "url(https://example.com)" }, { listStyle: "html" }]) assert.throws(() => validateTextFormat(invalid));
const extras = validateElements([{ id: "text", type: "text", text: "A", format: original }], value => value);
assert.equal(extras[0].format.curve, -35);
const markup = format => renderToStaticMarkup(React.createElement(TextContent, { text: "First line\nSecond <script> line", format }));
const list = markup({ listStyle: "number" }); assert.equal((list.match(/role="listitem"/g) || []).length, 2); assert(!list.includes("<ul")); assert(list.includes("&lt;script&gt;"));
const curved = markup({ curve: -35, highlight: "#ffee66", superscript: true }); assert.equal((curved.match(/class="dp-curve-line"/g) || []).length, 2); assert(curved.includes("rotate(")); assert(curved.includes("background-color:#ffee66")); assert(curved.includes("<sup>"));
assert(!markup({}).includes("dp-curve-line")); assert.equal(textCSS({ shadow: false }).textShadow, undefined);
console.log("PASS: text effects survive validation, extra text, render/export markup, bounds and HTML escaping.");
