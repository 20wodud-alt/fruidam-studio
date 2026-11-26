import { BrandCover, brandCoverStyles } from "./brand-cover";
import { skinStyles } from "@/lib/design-skins";
import { Fragment } from "react";
import { TextContent } from "./text-content";
import { PageBoundary, PageResizeHandle } from "./page-boundary";
import type { InsertPageKind } from "@/lib/page-operations";
import { copyRhythmStyles } from "@/lib/copy-rhythm";
import { cardLayoutStyles } from "@/lib/card-layout";
import { fruitEditorialStyles } from "@/lib/reference-style-guide";
/* eslint-disable @next/next/no-img-element */
import type { StudioProject, Section } from "@/lib/studio";
import { themes } from "@/lib/studio";
import { defaultKickers, photoCSS, textCSS } from "@/lib/element-style";
export const detailStyles = `
.product-page{width:860px;background:#fff;color:#292c29;font-family:'Noto Sans KR',sans-serif;--accent:#a35d35;--light:#f5eee5;overflow:hidden;text-align:center;line-height:1.7}
.product-page *{box-sizing:border-box}.product-page .dp-section{position:relative;scroll-margin-top:20px}.product-page .dp-section.selected{outline:3px solid #b48ae3;outline-offset:-3px}.product-page .dp-section h2{font-size:38px;line-height:1.4;letter-spacing:-1.6px;margin:0 0 24px;font-weight:700;white-space:pre-line;word-break:keep-all;overflow-wrap:anywhere}.product-page p{margin:0;white-space:pre-line;overflow-wrap:anywhere}.product-page .dp-kicker{font-size:12px;font-weight:bold;letter-spacing:3px;color:var(--accent);margin-bottom:26px}.product-page .dp-body{font-size:19px;color:#74746c;line-height:1.9;max-width:660px;margin:0 auto;white-space:pre-line}.product-page .dp-hero{padding-top:55px}.product-page .dp-topline{display:flex;justify-content:space-between;margin:0 64px 62px;border-bottom:1px solid #d7d0c5;padding-bottom:12px;font-size:12px;color:var(--accent)}.product-page .dp-hero h2{font-size:65px;line-height:1.2;max-width:690px;margin:20px auto 26px;letter-spacing:-3px}.product-page .dp-hero .dp-body{font-size:18px;color:var(--accent);margin-bottom:42px;padding:0 50px}.product-page .dp-image{width:100%;height:auto;display:block;object-fit:cover}.product-page .dp-hero .dp-image{height:740px}.product-page .dp-hero-foot{padding:17px;background:var(--accent);color:white;font-size:15px;letter-spacing:1px}.product-page .dp-story{padding:86px 64px;background:var(--light)}.product-page .dp-story .dp-image{height:410px;object-fit:cover;margin-top:38px;border-radius:220px 220px 8px 8px}.product-page .dp-benefits{padding:85px 65px}.product-page .dp-points{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:40px;text-align:left}.product-page .dp-point{background:var(--light);padding:30px;border-radius:4px;min-height:150px}.product-page .dp-point b{display:block;color:var(--accent);font-size:13px;letter-spacing:2px;margin-bottom:15px}.product-page .dp-point p{font-size:21px;line-height:1.65}.product-page .dp-detail{padding:70px 0 0}.product-page .dp-detail>.dp-body,.product-page .dp-detail>h2{padding:0 65px}.product-page .dp-detail .dp-image{max-height:800px;margin-top:42px}.product-page .dp-options{padding:85px 65px;background:var(--light)}.product-page .dp-option{background:#fff;border:1px solid #dedbd2;margin-top:12px;padding:24px;text-align:left;font-size:20px;display:flex;gap:20px}.product-page .dp-option>span{font-size:12px;color:var(--accent);padding-top:4px}.product-page .dp-price{font-size:32px;color:var(--accent);font-weight:bold;margin:32px 0 5px}.product-page .dp-shipping,.product-page .dp-faq{padding:75px 70px;text-align:left}.product-page .dp-shipping{border-bottom:1px solid #e4e1da}.product-page .dp-shipping h2,.product-page .dp-faq h2{font-size:30px}.product-page .dp-shipping .dp-body,.product-page .dp-faq .dp-body{font-size:18px;margin:0}.product-page .dp-shipping .dp-kicker,.product-page .dp-faq .dp-kicker{margin-bottom:16px}.product-page .dp-no-image{height:400px;display:flex;align-items:center;justify-content:center;background:var(--light);color:var(--accent);font-size:15px;letter-spacing:2px}.product-page .dp-footer{padding:40px 30px;border-top:1px solid #e9e5df;color:#a6a397;font-size:12px;letter-spacing:2px}.product-page .dp-image+figcaption{font-size:10px;color:#a19a8c;background:var(--light);padding:8px}

.product-page.layout-minimal .dp-story,.product-page.layout-minimal .dp-benefits,.product-page.layout-minimal .dp-options{padding:55px 65px}.product-page.layout-minimal .dp-hero .dp-image{height:560px}.product-page.layout-minimal .dp-hero h2{font-size:54px}.product-page.layout-minimal .dp-story .dp-image{border-radius:4px;height:330px;margin-top:25px}.product-page.layout-minimal .dp-points{grid-template-columns:1fr;gap:0}.product-page.layout-minimal .dp-point{min-height:0;background:#fff;border-bottom:1px solid #e7e7e7;padding:22px 10px;display:flex;gap:25px;align-items:center}.product-page.layout-minimal .dp-point b{margin:0;white-space:nowrap}.product-page.layout-minimal .dp-point p{font-size:19px}.product-page.layout-minimal .dp-shipping,.product-page.layout-minimal .dp-faq{padding:50px 65px}
 .product-page .dp-elements{padding:0 55px;margin:30px auto;max-width:820px}.product-page .dp-extra{font-size:22px;line-height:1.7;white-space:pre-wrap;overflow-wrap:anywhere;margin:18px 0}.product-page .dp-extra-badge{font-size:16px;display:inline-flex;align-items:center;justify-content:center;min-width:110px;min-height:48px;padding:13px 24px;border-radius:40px;color:#fff;white-space:pre-wrap;overflow-wrap:anywhere;max-width:100%;line-height:1.5;margin:14px 8px}.product-page .dp-extra-badge.circle{border-radius:50%;width:125px;height:125px;padding:15px}.product-page .dp-extra-badge.box{border-radius:5px}.product-page .dp-extra-divider{height:1px;background:currentColor;margin:32px 0;width:100%}.product-page .dp-edit-target{cursor:pointer;position:relative}.product-page .dp-edit-target:hover{outline:2px dashed #a6b7a1;outline-offset:5px}.product-page .dp-edit-target.is-element-selected{outline:3px solid #658d6d;outline-offset:6px;box-shadow:0 0 0 7px #fff7}.product-page .dp-edit-target:focus-visible{outline:3px solid #658d6d;outline-offset:6px}.product-page img.dp-edit-target.is-element-selected{outline-offset:-4px;box-shadow:none}
.product-page .dp-canvas-photo>.dp-image,.product-page .dp-canvas-blank>.dp-image{margin-top:0;max-height:none}.product-page .dp-canvas-blank,.product-page .dp-canvas-photo{background:#fff}
${fruitEditorialStyles}
${copyRhythmStyles}
${cardLayoutStyles}
${skinStyles}
${brandCoverStyles}
.product-page .dp-text-list{display:block;text-align:left}
.product-page .dp-text-list>[role=listitem]{display:grid;grid-template-columns:auto minmax(0,1fr);gap:.5em;margin:.2em 0}
.product-page .dp-list-marker{font-variant-numeric:tabular-nums;min-width:1em}
.product-page .dp-curve-row{display:block}
.product-page .dp-curve-line{display:inline-block;white-space:nowrap;line-height:1.3}
.product-page sup{font-size:.7em;line-height:0;vertical-align:super}

/* Coupang high-CTR layout rhythm & mobile readability (scoped to preserve custom skins & canvas modes) */
.product-page .dp-section:not([data-skin]):not(.dp-canvas-blank):not(.dp-canvas-photo) h2{font-size:44px;line-height:1.32;letter-spacing:-1.6px;font-weight:800;margin:0 0 22px}
.product-page .dp-section:not([data-skin]):not(.dp-canvas-blank):not(.dp-canvas-photo)>.dp-kicker{display:inline-block;font-size:15px;font-weight:700;letter-spacing:1.2px;color:var(--accent);background:var(--light);padding:6px 20px;border-radius:999px;margin-bottom:22px}
.product-page .dp-section:not([data-skin]):not(.dp-canvas-blank):not(.dp-canvas-photo) .dp-body{font-size:21px;color:#3d423c;line-height:1.72;max-width:680px}
.product-page .dp-section:not([data-skin]):not(.dp-canvas-blank):not(.dp-canvas-photo).dp-hero{padding-top:48px;background:linear-gradient(180deg,var(--light) 0%,#ffffff 58%)}
.product-page .dp-section:not([data-skin]):not(.dp-canvas-blank):not(.dp-canvas-photo).dp-hero .dp-topline{margin:0 56px 40px;border-bottom:2px solid var(--light);padding-bottom:14px;font-size:15px;font-weight:700}
.product-page .dp-section:not([data-skin]):not(.dp-canvas-blank):not(.dp-canvas-photo).dp-hero h2{font-size:68px;line-height:1.2;max-width:740px;margin:16px auto 22px;letter-spacing:-2.8px}
.product-page .dp-section:not([data-skin]):not(.dp-canvas-blank):not(.dp-canvas-photo).dp-hero .dp-body{font-size:22px;color:#2c312b !important;font-weight:500;margin-bottom:28px;padding:0 48px}
.product-page .dp-section:not([data-skin]):not(.dp-canvas-blank):not(.dp-canvas-photo).dp-hero .dp-image{height:700px}
.product-page .dp-section:not([data-skin]):not(.dp-canvas-blank):not(.dp-canvas-photo).dp-hero .dp-hero-foot{padding:20px 24px;font-size:18px;font-weight:700;letter-spacing:.5px}
.product-page .dp-section:not([data-skin]):not(.dp-canvas-blank):not(.dp-canvas-photo).dp-detail-split-left,
.product-page .dp-section:not([data-skin]):not(.dp-canvas-blank):not(.dp-canvas-photo).dp-detail-split-right,
.product-page .dp-section:not([data-skin]):not(.dp-canvas-blank):not(.dp-canvas-photo).dp-story-note{padding:76px 56px;text-align:left;background:#fff}
.product-page .dp-section:not([data-skin]):not(.dp-canvas-blank):not(.dp-canvas-photo).dp-detail-split-right{background:var(--light)}
.product-page .dp-split-wrap{display:grid;grid-template-columns:1.05fr .95fr;gap:36px;align-items:center}
.product-page .dp-detail-split-right .dp-split-wrap{grid-template-columns:.95fr 1.05fr}
.product-page .dp-detail-split-right .dp-split-media{order:2}
.product-page .dp-split-wrap .dp-image{width:100% !important;height:420px !important;border-radius:16px;margin-top:0 !important}
.product-page .dp-split-text h2,.product-page .dp-split-text .dp-body{padding-inline:0 !important;text-align:left !important;margin:0;max-width:none}.product-page .dp-split-text .dp-kicker{margin-left:0 !important}
.product-page .dp-section:not([data-skin]):not(.dp-canvas-blank):not(.dp-canvas-photo).dp-detail-compare{padding:84px 56px;background:var(--light)}
.product-page .dp-compare-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:32px;text-align:left}
.product-page .dp-compare-col{border-radius:16px;padding:28px;background:#fff;border:1.5px solid #e2dfd7}
.product-page .dp-compare-col.is-best{border:2.5px solid var(--accent);box-shadow:0 10px 28px rgba(0,0,0,.06)}
.product-page .dp-compare-head{font-size:20px;font-weight:800;padding-bottom:14px;margin-bottom:16px;border-bottom:1.5px solid #eee;color:#6f736d}
.product-page .dp-compare-col.is-best .dp-compare-head{color:var(--accent);border-bottom-color:var(--light)}
.product-page .dp-compare-col ul{margin:0;padding-left:20px}
.product-page .dp-compare-col li{font-size:19px;line-height:1.65;margin-bottom:10px;color:#292c29}
.product-page .dp-section:not([data-skin]):not(.dp-canvas-blank):not(.dp-canvas-photo).dp-detail-macro{padding:84px 0 0;background:#1f2420;color:#fff}
.product-page .dp-detail-macro h2{color:#fff !important;padding:0 56px}
.product-page .dp-detail-macro .dp-body{color:#d8ddd7 !important;padding:0 56px}
.product-page .dp-detail-macro .dp-image{height:640px;margin-top:40px}
.product-page .dp-section:not([data-skin]):not(.dp-canvas-blank):not(.dp-canvas-photo).dp-story-timeline{padding:84px 56px;background:#fff;text-align:left}
.product-page .dp-timeline-list{display:flex;flex-direction:column;gap:16px;margin-top:32px}
.product-page .dp-step-item{display:grid;grid-template-columns:120px 1fr;gap:20px;align-items:center;background:var(--light);padding:24px 28px;border-radius:14px;border-left:5px solid var(--accent)}
.product-page .dp-step-num{font-size:18px;font-weight:800;color:var(--accent);font-variant-numeric:tabular-nums}
.product-page .dp-step-item p{font-size:21px;line-height:1.6;color:#292c29;font-weight:500}
.product-page .dp-section:not([data-skin]):not(.dp-canvas-blank):not(.dp-canvas-photo).dp-options{padding:88px 56px;background:var(--light)}
.product-page .dp-option-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:32px}
.product-page .dp-option-grid .dp-option{flex-direction:column;align-items:flex-start;gap:12px;margin:0;padding:30px;border-radius:16px;border:2px solid #e2dfd7;background:#fff}
.product-page .dp-option-grid .dp-option:nth-child(2){border-color:var(--accent)}
.product-page .dp-option-grid .dp-option>span{flex:0 0 auto !important;width:auto;height:auto;display:inline-block;background:var(--accent);color:#fff;font-size:13px;font-weight:800;letter-spacing:.5px;padding:6px 14px;border-radius:8px;margin-bottom:4px}
.product-page .dp-price-banner{margin-top:28px;padding:24px 32px;border-radius:16px;background:var(--accent);color:#fff;display:flex;justify-content:space-between;align-items:center}
.product-page .dp-price-banner span{font-size:18px;font-weight:700}
.product-page .dp-price-banner .dp-price{color:#fff;font-size:36px;margin:0}
.product-page .dp-section:not([data-skin]):not(.dp-canvas-blank):not(.dp-canvas-photo).dp-shipping{padding:80px 56px;background:#f7f8f6;text-align:left}
.product-page .dp-shipping-steps{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:28px}
.product-page .dp-shipping-steps .dp-step-item{grid-template-columns:1fr;gap:8px;background:#fff;border:1.5px solid #e2dfd7;border-left:5px solid var(--accent)}
.product-page .dp-section:not([data-skin]):not(.dp-canvas-blank):not(.dp-canvas-photo).dp-faq{padding:80px 56px;background:#fff;text-align:left}
.product-page .dp-faq-list{display:flex;flex-direction:column;gap:18px;margin-top:28px}
.product-page .dp-faq-card{border-radius:16px;overflow:hidden;border:1.5px solid #e5e3dc}
.product-page .dp-faq-q{display:flex;align-items:center;gap:14px;padding:22px 26px;background:var(--light);font-size:21px;font-weight:700;color:#20251f}
.product-page .dp-faq-a{display:flex;align-items:flex-start;gap:14px;padding:22px 26px;background:#fff;font-size:20px;line-height:1.65;color:#3d423c}
.product-page .dp-qa-badge{flex:0 0 36px;height:36px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:17px}
.product-page .dp-qa-badge.is-q{background:var(--accent);color:#fff}
.product-page .dp-qa-badge.is-a{background:#e8ebe6;color:#292c29}
.product-page .dp-guarantee-bar{margin-top:28px;padding:20px 28px;border-radius:12px;border:2px dashed var(--accent);background:var(--light);color:var(--accent);font-size:19px;font-weight:800;text-align:center}
.product-page .dp-hero-badges{display:flex;justify-content:center;gap:14px;margin:0 auto 34px;padding:0 40px;flex-wrap:wrap}
.product-page .dp-hero-badge{display:inline-flex;align-items:center;gap:8px;border-radius:999px;border:1.5px solid var(--accent);background:#fff;color:#20251f;font-weight:700;font-size:16px;padding:10px 22px;box-shadow:0 4px 12px rgba(0,0,0,.05)}
.product-page .dp-hero-badge small{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:var(--accent);color:#fff;font-size:11px;font-weight:800}
.product-page .dp-section:not([data-skin]):not(.dp-canvas-blank):not(.dp-canvas-photo).dp-benefits{padding:84px 56px;background:var(--accent);color:#fff}
.product-page .dp-section:not([data-skin]):not(.dp-canvas-blank):not(.dp-canvas-photo).dp-benefits>.dp-kicker{background:rgba(255,255,255,.18);color:#fff}
.product-page .dp-section:not([data-skin]):not(.dp-canvas-blank):not(.dp-canvas-photo).dp-benefits h2{color:#fff !important}.product-page .dp-benefits .dp-heading-emphasis,.product-page .dp-detail-macro .dp-heading-emphasis{background:none !important;padding:0 !important}
.product-page .dp-section:not([data-skin]):not(.dp-canvas-blank):not(.dp-canvas-photo).dp-benefits .dp-points{grid-template-columns:1fr;gap:16px;margin-top:34px}
.product-page .dp-section:not([data-skin]):not(.dp-canvas-blank):not(.dp-canvas-photo).dp-benefits .dp-point{background:#fff;color:#20251f;border-radius:14px;padding:26px 30px;min-height:0;display:grid;grid-template-columns:110px 1fr;gap:20px;align-items:center;border:0;box-shadow:0 8px 24px rgba(0,0,0,.12)}
.product-page .dp-section:not([data-skin]):not(.dp-canvas-blank):not(.dp-canvas-photo).dp-benefits .dp-point b{margin:0;background:var(--light);color:var(--accent);padding:10px 12px;border-radius:10px;text-align:center;font-size:14px;letter-spacing:1px}
.product-page .dp-section:not([data-skin]):not(.dp-canvas-blank):not(.dp-canvas-photo).dp-benefits .dp-point p{font-size:20px;line-height:1.55;font-weight:600;color:#20251f}
.product-page .dp-policy-box{margin-top:28px;border-radius:16px;background:#f9f6f3;border:1.5px solid #e6dfd8;padding:34px 36px;text-align:left}
.product-page .dp-policy-pill{display:inline-block;background:var(--accent);color:#fff;font-size:16px;font-weight:800;padding:8px 24px;border-radius:999px;margin-bottom:22px}
.product-page .dp-policy-group{margin-top:16px}
.product-page .dp-policy-group strong{display:block;font-size:19px;color:#20251f;margin-bottom:8px}
.product-page .dp-policy-group ul{margin:0;padding-left:18px;color:#4a4e48;font-size:16px;line-height:1.75}
.product-page .dp-point-thumb{width:144px;height:104px;border-radius:10px;object-fit:cover;display:block}
.product-page .dp-section:not([data-skin]):not(.dp-canvas-blank):not(.dp-canvas-photo).dp-benefits .dp-point.has-thumb{grid-template-columns:144px 1fr;gap:22px;padding:18px 24px}
.product-page .dp-point-copy{display:flex;flex-direction:column;align-items:flex-start;gap:8px;text-align:left}
.product-page .dp-section:not([data-skin]):not(.dp-canvas-blank):not(.dp-canvas-photo).dp-story-banner{padding:84px 56px;background:linear-gradient(180deg,#fff 0%,var(--light) 100%)}
.product-page .dp-story-checks{display:flex;flex-direction:column;gap:12px;max-width:640px;margin:28px auto 0;text-align:left}
.product-page .dp-story-check{display:flex;align-items:center;gap:14px;background:#fff;border:1.5px solid #e6dfd8;border-radius:12px;padding:16px 22px;font-size:20px;font-weight:600;color:#20251f}
.product-page .dp-story-check i{flex:0 0 28px;height:28px;border-radius:50%;background:var(--accent);color:#fff;font-style:normal;font-size:14px;font-weight:800;display:inline-flex;align-items:center;justify-content:center}
.product-page .dp-story-callout{max-width:640px;margin:22px auto 34px;padding:18px 26px;border-radius:12px;background:var(--accent);color:#fff;font-size:20px;font-weight:800;line-height:1.5}
.product-page .dp-section:not([data-skin]):not(.dp-canvas-blank):not(.dp-canvas-photo).dp-story-note{padding:84px 56px;background:var(--light)}
.product-page .dp-story-note .dp-split-wrap{background:#fff;padding:34px;border-radius:20px;box-shadow:0 14px 36px rgba(0,0,0,.07)}
.product-page .dp-spec-table{margin-top:26px;border-radius:14px;overflow:hidden;border:1.5px solid #e2dfd7;background:#fff;text-align:left}
.product-page .dp-spec-row{display:grid;grid-template-columns:180px 1fr;border-bottom:1px solid #eee;font-size:17px;line-height:1.6}
.product-page .dp-spec-row:last-child{border-bottom:0}
.product-page .dp-spec-row b{background:#f7f5f2;padding:14px 20px;color:#20251f;font-weight:700}
.product-page .dp-spec-row span{padding:14px 20px;color:#444b41}
.product-page .dp-section:not([data-skin]):not(.dp-canvas-blank):not(.dp-canvas-photo).dp-detail-notice{padding:84px 56px;background:#fff}
.product-page .dp-notice-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:30px;text-align:left}
.product-page .dp-notice-card{border-radius:16px;padding:26px;background:var(--light);border:1.5px solid #e5dfd6}
.product-page .dp-notice-card strong{display:block;font-size:20px;color:var(--accent);margin-bottom:10px}
.product-page .dp-notice-card p{font-size:18px;line-height:1.65;color:#292c29}
.product-page .dp-notice-strip{margin-top:18px;padding:18px 24px;border-radius:12px;background:var(--accent);color:#fff;font-size:18px;font-weight:700;text-align:center}

`;
export function DetailPage({ includeBrandCover = true, project, selected, onSelect, selectedElement, selectedElements, onSelectElement, onEditText, onInsertPage, onResizePage, onDeletePage }: { includeBrandCover?: boolean; project: StudioProject; selected?: string; onSelect?: (id: string) => void; selectedElement?: string; selectedElements?: string[]; onDeletePage?:(id:string)=>void; onInsertPage?:(afterId:string,kind:InsertPageKind)=>void; onResizePage?:(id:string,height:number)=>void; onEditText?: (sectionId:string,target:string)=>void; onSelectElement?: (sectionId: string, elementId: string) => void }) {
  const { product, sections } = project; const theme = themes[product.theme];
  function target(section: Section, key: string) {
    if (!onSelectElement) return {};
    return { "data-element": key, className: `dp-edit-target ${selected === section.id && (selectedElement === key || selectedElements?.includes(key)) ? "is-element-selected" : ""}`, role: "button", tabIndex: 0, onDoubleClick:(e:React.MouseEvent<HTMLElement>)=>{if(key==="image" || section.elements?.find(x=>`extra:${x.id}`===key)?.type==="image" || section.elements?.find(x=>`extra:${x.id}`===key)?.type==="divider")return;e.stopPropagation();onEditText?.(section.id,key);}, "aria-label": `${({ title: "제목", body: "본문", kicker: "서브 카피", image: "사진" } as Record<string, string>)[key] || "추가 요소"} 선택`, onClick: (e: React.MouseEvent<HTMLElement>) => { e.stopPropagation(); onSelectElement(section.id, key); }, onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onSelectElement(section.id, key); } } };
  }
  function image(section: Section) {
    const attributes = target(section, "image");
    const resolvedImage = section.image || (product.images.length && (section.kind === "story" || section.kind === "detail" || section.kind === "shipping") ? product.images[sections.indexOf(section) % product.images.length] : ""); return resolvedImage ? <><img {...attributes} className={`dp-image ${attributes.className || ""}`} style={photoCSS(section.format?.image)} src={resolvedImage} alt={section.title || product.name} />{project.supplyProductId && section.imageMeta && !section.format?.image?.hidden && <figcaption>AI 연출 이미지 · 실제 상품 사진을 함께 확인해주세요</figcaption>}{!section.imageMeta && (section.image.startsWith("/sample-") || section.image.startsWith("/fruit-") || section.image.startsWith("/photos/fruit-")) && !section.format?.image?.hidden && <figcaption>샘플 과일 사진 · 판매 상품 사진으로 교체해주세요</figcaption>}</> : <div {...attributes} className={`dp-no-image ${attributes.className || ""}`} style={photoCSS(section.format?.image)}>상품 사진을 추가해주세요</div>;
  }
  function extras(section: Section) {
    if (!section.elements?.length) return null;
    return <div className="dp-elements" style={section.elements.every(e => e.absolute) ? {margin:0,padding:0} : undefined}>{section.elements.map(element => {
      const attributes = target(section, `extra:${element.id}`);
      const format = element.type === "image" ? element.photoFormat : element.format;
      const position: React.CSSProperties = element.absolute ? { position: "absolute", left: (element.x || 0) + (format?.offsetX || 0), top: (element.y || 0) + (format?.offsetY || 0), width: element.widthPx || 200, maxWidth: "none", margin: 0, zIndex: element.type === "image" ? element.photoFormat?.zIndex ?? 5 : element.format?.zIndex ?? 5 } : {};

      if (element.type === "image") return element.image ? <img key={element.id} {...attributes} className={`dp-extra-photo ${attributes.className || ""}`} src={element.image} alt={element.text || "추가한 상품 사진"} style={{ display: "block", width: "100%", height: 400, objectFit: "cover", margin: "22px auto", ...photoCSS(element.photoFormat), ...position }} /> : <div key={element.id} {...attributes} className={`dp-no-image ${attributes.className || ""}`} style={{...photoCSS(element.photoFormat), ...position}}>사진을 선택해주세요</div>;
      return <div key={element.id} {...attributes} className={`${element.type === "badge" ? `dp-extra-badge ${element.shape || "pill"}` : element.type === "divider" ? "dp-extra-divider" : "dp-extra"} ${attributes.className || ""}`} style={{ ...(element.type === "badge" ? { background: element.background || theme.accent } : {}), ...textCSS(element.format), ...position }}>{element.type === "divider" ? null : <TextContent text={element.text} format={element.format}/>}</div>;
    })}</div>;
  }
  return <div className={`product-page layout-${product.design?.layout || "editorial"}`} style={{ "--accent": theme.accent, "--light": theme.light } as React.CSSProperties}>
    {includeBrandCover && project.supplyProductId && <BrandCover/>}
      {onInsertPage && <PageBoundary afterId="" index={0} disabled={sections.length>=30} onInsert={onInsertPage}/>}
    {(() => {
      let detailIdx = 0;
      let storyIdx = 0;
      return sections.filter(s => s.visible).map(section => {
        const titleAttributes = target(section, "title"), bodyAttributes = target(section, "body"), kickerAttributes = target(section, "kicker");
        const useCoupangRhythm = !section.canvasMode && !section.format?.skin;
        let variantClass = "";
        if (useCoupangRhythm) {
          if (section.kind === "detail") variantClass = ["dp-detail-split-left", "dp-detail-compare", "dp-detail-split-right", "dp-detail-macro", "dp-detail-notice"][detailIdx++ % 5];
          else if (section.kind === "story") variantClass = ["dp-story-banner", "dp-story-timeline", "dp-story-note"][storyIdx++ % 3];
        }
        const heading = <h2 {...titleAttributes} style={textCSS(section.format?.title)}>{section.presentation === "fruit-editorial" && section.kind !== "hero" ? section.title.split("\n").map((line,i,lines)=><span className="dp-heading-line" key={i}>{i===lines.length-1 ? <span className="dp-heading-emphasis"><TextContent text={line} format={section.format?.title}/></span> : <TextContent text={line} format={section.format?.title}/>}</span>) : <TextContent text={section.title} format={section.format?.title}/>}</h2>;
        const kicker = <p {...kickerAttributes} className={`dp-kicker ${kickerAttributes.className || ""}`} style={textCSS(section.format?.kicker)}>{<TextContent text={section.kicker ?? defaultKickers[section.kind]} format={section.format?.kicker}/>}</p>;
        const body = <p {...bodyAttributes} className={`dp-body ${bodyAttributes.className || ""}`} style={textCSS(section.format?.body)}><TextContent text={section.body} format={section.format?.body}/></p>;
        const renderStepList = (stepClass: string, prefix = "STEP") => {
          const lines = section.body.split("\n").map(l => l.trim()).filter(Boolean);
          return <div {...bodyAttributes} className={`${stepClass} ${bodyAttributes.className || ""}`} style={{ ...textCSS(section.format?.body), display: section.format?.body?.hidden ? "none" : undefined }}>
            {(lines.length ? lines : [section.body]).map((line, i) => <div className="dp-step-item" key={i}><span className="dp-step-num">{prefix} {String(i + 1).padStart(2, "0")}</span><p><TextContent text={line} format={{ ...section.format?.body, listStyle: "none", offsetX: undefined, offsetY: undefined, widthPx: undefined, rotation: undefined, opacity: undefined, zIndex: undefined }} /></p></div>)}
          </div>;
        };
        const renderCompareCards = () => {
          const lines = section.body.split("\n").map(l => l.trim()).filter(Boolean);
          const mid = Math.ceil(lines.length / 2);
          const normalLines = lines.slice(0, mid);
          const bestLines = lines.slice(mid);
          return <div {...bodyAttributes} className={`dp-compare-grid ${bodyAttributes.className || ""}`} style={{ ...textCSS(section.format?.body), display: section.format?.body?.hidden ? "none" : undefined }}>
            <div className="dp-compare-col is-normal"><div className="dp-compare-head">일반 유통 과일</div><ul>{(normalLines.length ? normalLines : ["크기·상태 편차가 큼"]).map((t, i) => <li key={i}>{t}</li>)}</ul></div>
            <div className="dp-compare-col is-best"><div className="dp-compare-head">{product.name || "산지 직송 선별"}</div><ul>{(bestLines.length ? bestLines : [section.body]).map((t, i) => <li key={i}>{t}</li>)}</ul></div>
          </div>;
        };
        const renderFaqCards = () => {
          const rawLines = section.body.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
          const qaItems: { q: string; a: string[] }[] = [];
          for (const line of rawLines) {
            if (/^Q[.\s:]/i.test(line) || qaItems.length === 0) {
              const clean = line.replace(/^Q[.\s:]*/i, "");
              const qMark = clean.indexOf("?");
              if (qMark !== -1 && qMark < clean.length - 1) {
                qaItems.push({ q: clean.slice(0, qMark + 1).trim(), a: [clean.slice(qMark + 1).replace(/^A[.\s:]*/i, "").trim()] });
              } else {
                qaItems.push({ q: clean, a: [] });
              }
            } else {
              qaItems[qaItems.length - 1].a.push(line.replace(/^A[.\s:]*/i, ""));
            }
          }
          return <div {...bodyAttributes} className={`dp-faq-list ${bodyAttributes.className || ""}`} style={{ ...textCSS(section.format?.body), display: section.format?.body?.hidden ? "none" : undefined }}>
            {qaItems.map((item, i) => <div className="dp-faq-card" key={i}><div className="dp-faq-q"><span className="dp-qa-badge is-q">Q</span><p>{item.q}</p></div>{item.a.length > 0 && <div className="dp-faq-a"><span className="dp-qa-badge is-a">A</span><p>{item.a.join("\n")}</p></div>}</div>)}
          </div>;
        };
        const isSplit = variantClass === "dp-detail-split-left" || variantClass === "dp-detail-split-right" || variantClass === "dp-story-note";
        return <Fragment key={section.id}><section data-section={section.id} data-skin={section.format?.skin} className={`dp-section dp-${section.kind} ${variantClass} ${section.canvasMode ? `dp-canvas-${section.canvasMode}` : ""} ${section.presentation || ""} ${selected === section.id && (!onSelectElement || !selectedElement || selectedElement === "section") ? "selected" : ""}`} style={{ minHeight:section.format?.minHeight, background: useCoupangRhythm && section.format?.background === "#ffffff" ? undefined : section.format?.background, paddingTop: section.format?.padding, paddingBottom: section.format?.padding }} role={onSelect && !onSelectElement ? "button" : undefined} tabIndex={onSelect && !onSelectElement ? 0 : undefined} aria-label={onSelect && !onSelectElement ? `${section.title} 섹션 선택` : undefined} onKeyDown={onSelect && !onSelectElement ? e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(section.id); } } : undefined} onClick={() => onSelectElement ? onSelectElement(section.id, "section") : onSelect?.(section.id)}>
          {section.canvasMode ? <>{section.kicker?.trim() && kicker}{section.title.trim() && heading}{section.body.trim() && body}{extras(section)}{(section.image || section.canvasMode==="photo") && image(section)}</>
          : section.kind === "hero" ? <><div className="dp-topline"><span>{product.category}</span><span>산지 직송 · 꼼꼼한 선별</span></div>{kicker}{heading}{body}<div className="dp-hero-badges"><div className="dp-hero-badge"><small>01</small>산지 직송</div><div className="dp-hero-badge"><small>02</small>엄격 선별</div><div className="dp-hero-badge"><small>03</small>안전 포장</div></div>{extras(section)}{image(section)}<div className="dp-hero-foot">{product.name} · 지금 가장 신선한 구성</div></>
          : isSplit ? <div className="dp-split-wrap"><div className="dp-split-media">{image(section)}</div><div className="dp-split-text">{kicker}{heading}{body}{extras(section)}</div></div>
          : <>{kicker}{heading}
            {section.kind === "benefits" ? (() => { const rawPts = section.body.split("\n").map(line => line.trim()).filter(Boolean); const extraPts = [`${product.name}의 신선한 원물 컨디션을 확인하세요.`, "하나씩 살펴 고른 꼼꼼한 선별 기준", "가정용부터 선물용까지 알맞은 구성 선택", "안전한 완충 포장으로 문 앞까지 배송"]; const pts = rawPts.length >= 4 ? rawPts : [...rawPts, ...extraPts.slice(rawPts.length, 4)]; return <div {...bodyAttributes} data-count={pts.length} className={`dp-points ${bodyAttributes.className || ""}`} style={{...textCSS(section.format?.body), display: section.format?.body?.hidden ? "none" : undefined }}>{pts.map((line, i) => { const thumb = useCoupangRhythm && product.images.length ? product.images[i % product.images.length] : ""; return <div className={`dp-point ${thumb ? "has-thumb" : ""}`} key={i}>{thumb ? <img className="dp-point-thumb" src={thumb} alt="" /> : <b>POINT {String(i + 1).padStart(2, "0")}</b>}<div className="dp-point-copy">{thumb && <b>POINT {String(i + 1).padStart(2, "0")}</b>}<p style={textCSS({...section.format?.body,offsetX:undefined,offsetY:undefined,widthPx:undefined,rotation:undefined,opacity:undefined,zIndex:undefined})}><TextContent text={line} format={{...section.format?.body,listStyle:"none",superscript:section.format?.body?.superscript}}/></p></div></div>; })}</div>; })()
            : section.kind === "options" ? <><div {...bodyAttributes} className={`${useCoupangRhythm ? "dp-option-grid" : ""} ${bodyAttributes.className || ""}`} style={{...textCSS(section.format?.body), display: section.format?.body?.hidden ? "none" : undefined }}>{section.body.split("\n").map(line => line.trim()).filter(Boolean).map((line, i) => <div key={i} className="dp-option"><span>OPTION {String(i + 1).padStart(2, "0")}</span><p style={textCSS({...section.format?.body,offsetX:undefined,offsetY:undefined,widthPx:undefined,rotation:undefined,opacity:undefined,zIndex:undefined})}><TextContent text={line} format={{...section.format?.body,listStyle:"none",superscript:section.format?.body?.superscript}}/></p></div>)}</div>{product.price && (useCoupangRhythm ? <div className="dp-price-banner"><span>선택 가능 기준가</span><p className="dp-price">{product.price}</p></div> : <p className="dp-price">{product.price}</p>)}{useCoupangRhythm && <div className="dp-spec-table"><div className="dp-spec-row"><b>상품명</b><span>{product.name}</span></div><div className="dp-spec-row"><b>카테고리</b><span>{product.category}</span></div><div className="dp-spec-row"><b>구성 옵션</b><span>{product.options.split("\n").filter(Boolean).join(" / ") || "기본 구성"}</span></div><div className="dp-spec-row"><b>보관 방법</b><span>수령 후 서늘한 곳 또는 냉장 보관</span></div></div>}</>
            : variantClass === "dp-detail-compare" ? renderCompareCards()
            : variantClass === "dp-detail-notice" ? <><div {...bodyAttributes} className={`dp-notice-grid ${bodyAttributes.className || ""}`} style={{...textCSS(section.format?.body), display: section.format?.body?.hidden ? "none" : undefined }}><div className="dp-notice-card"><strong>구성 및 선별 기준</strong><p>{section.body.split("\n")[0] || `${product.name} 정품 선별`}</p></div><div className="dp-notice-card"><strong>중량 및 포장 안내</strong><p>{section.body.split("\n")[1] || "이동 중 눌림을 줄이는 안전 포장으로 출고됩니다."}</p></div></div><div className="dp-notice-strip">생물 특성상 개당 크기·모양·개수에 약간의 차이가 있을 수 있습니다</div></>
            : variantClass === "dp-story-banner" ? <><div {...bodyAttributes} className={`dp-story-checks ${bodyAttributes.className || ""}`} style={{...textCSS(section.format?.body), display: section.format?.body?.hidden ? "none" : undefined }}>{section.body.split("\n").map(l=>l.trim()).filter(Boolean).map((line, i) => <div className="dp-story-check" key={i}><i>✓</i><span>{line}</span></div>)}</div><div className="dp-story-callout">{product.name} · 산지 선별 기준을 직접 확인하세요</div></>
            : variantClass === "dp-story-timeline" ? renderStepList("dp-timeline-list", "STEP")
            : useCoupangRhythm && section.kind === "shipping" ? renderStepList("dp-shipping-steps", "CHECK")
            : useCoupangRhythm && section.kind === "faq" ? <>{renderFaqCards()}<div className="dp-guarantee-bar">수령 직후 상품 상태를 확인하시고, 이상 시 사진과 함께 문의해주세요</div><div className="dp-policy-box"><span className="dp-policy-pill">교환 · 반품 · 취소 안내</span><div className="dp-policy-group"><strong>교환 / 반품이 가능한 경우</strong><ul><li>상품의 불량, 파손, 오배송이 확인된 경우 수령 후 사진 촬영과 함께 고객센터로 접수해 주세요.</li><li>임의로 폐기하여 사진 확인이 불가할 경우 처리가 어려울 수 있습니다.</li></ul></div><div className="dp-policy-group"><strong>교환 / 반품이 어려운 경우</strong><ul><li>신선식품 특성상 고객의 단순 변심 또는 주관적 기호(크기·색상·개당 편차 등)에 의한 경우</li><li>수취인 정보 오기재, 장기 부재, 보관 방법 미준수로 상품 가치가 훼손된 경우</li></ul></div></div></>
            : body}
            {extras(section)}{(section.image || (product.images.length && (section.kind === "story" || section.kind === "detail" || section.kind === "shipping"))) && image(section)}
          </>}
          {onResizePage && selected===section.id && <PageResizeHandle id={section.id} onResize={onResizePage}/>}
        </section>{onInsertPage && <PageBoundary afterId={section.id} index={sections.indexOf(section)+1} onDelete={onDeletePage} canDelete={sections.filter(s=>s.visible).length>1} disabled={sections.length>=30} onInsert={onInsertPage}/>}</Fragment>;
      });
    })()}<div className="dp-footer">{product.name} · THANK YOU FOR YOUR CHOICE</div>
  </div>;
}
