"use client";
import { prepareImageUpload } from "@/lib/client-upload";
/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";
import { ArrowRight, Check, FileText, ImagePlus, LoaderCircle, Paperclip, Sparkles, X } from "lucide-react";
import { emptyDesignBrief, type DesignBrief } from "@/lib/studio";
import { PhotoDirectionFields } from "./photo-direction";

export function DesignBriefFields({ value, onChange, onBusyChange }: { value?: DesignBrief; onChange: (patch: Partial<DesignBrief>) => void; onBusyChange?: (busy: boolean) => void }) {
  const design = value || emptyDesignBrief;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const documentRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const reviewRef = useRef<HTMLInputElement>(null);
  const target = useRef<"brief" | "reviews" | "reference" | "reviewImage">("brief");
  const locked = useRef(false);
  function begin() { if (locked.current) return false; locked.current = true; setBusy(true); onBusyChange?.(true); setError(""); setNotice(""); return true; }
  function end() { locked.current = false; setBusy(false); onBusyChange?.(false); }
  function pickDocument(kind: "brief" | "reviews") { target.current = kind; if (documentRef.current) { documentRef.current.accept = kind === "brief" ? ".txt,.md" : ".txt,.csv,.xlsx"; documentRef.current.click(); } }
  function pickImage(kind: "reference" | "reviewImage") { target.current = kind; if (imageRef.current) { imageRef.current.multiple = kind === "reference"; imageRef.current.click(); } }
  async function importDocument(file?: File) {
    if (!file || !begin()) return;
    const kind = target.current;
    try {
      const data = new FormData(); data.append("file", file);
      const response = await fetch("/api/import-text", { method: "POST", body: data }); const result = await response.json(); if (!response.ok) throw new Error(result.error);
      const limit = kind === "brief" ? 3000 : 12000;
      onChange(kind === "brief" ? { brief: result.text.slice(0, limit), briefFileName: result.name } : { reviews: result.text, reviewFileName: result.name, reviewImage: "" });
      setNotice(result.truncated || result.text.length > limit ? `문서 내용을 앞 ${limit.toLocaleString()}자까지 가져왔어요.` : "파일 내용을 가져왔어요. 아래에서 직접 수정할 수 있어요.");
    } catch (e) { setError(e instanceof Error ? e.message : "문서를 가져오지 못했어요."); }
    finally { end(); if (documentRef.current) documentRef.current.value = ""; }
  }
  async function importImages(files: FileList | null, kind = target.current) {
    if (!files?.length || !begin()) return;
    try {
      const count = kind === "reference" ? 10 - design.references.length : 1;
      if (count < 1) throw new Error("레퍼런스는 최대 10장까지 추가할 수 있어요.");
      const urls: string[] = [];
      for (const file of Array.from(files).slice(0, count)) {
        const data = new FormData(); data.append("file", await prepareImageUpload(file));
        const response = await fetch("/api/uploads", { method: "POST", body: data }); const result = await response.json(); if (!response.ok) throw new Error(result.error); urls.push(result.url);
      }
      onChange(kind === "reference" ? { references: [...design.references, ...urls] } : { reviewImage: urls[0], reviewFileName: files[0].name.slice(0,200), reviews: "" });
    } catch (e) { setError(e instanceof Error ? e.message : "사진을 첨부하지 못했어요."); }
    finally { end(); if (imageRef.current) imageRef.current.value = ""; }
  }
  async function importReview(files:FileList|null) {
    const file=files?.[0];if(!file)return;
    if(file.type.startsWith("image/") || /\.(png|jpe?g|webp|avif)$/i.test(file.name)) await importImages(files,"reviewImage");
    else {target.current="reviews";await importDocument(file);}
    if(reviewRef.current)reviewRef.current.value="";
  }
  return <section className="design-brief-fields" aria-label="디자인 기획안 및 참고 자료">
    <input type="file" ref={documentRef} hidden onChange={e => void importDocument(e.target.files?.[0])} />
    <input type="file" ref={imageRef} hidden accept="image/jpeg,image/png,image/webp,image/avif" onChange={e => void importImages(e.target.files)} />
    <input type="file" ref={reviewRef} hidden aria-label="리뷰파일 선택" accept=".txt,.csv,.xlsx,image/jpeg,image/png,image/webp,image/avif" onChange={e => void importReview(e.target.files)} />
    <div className="brief-section-heading"><span><LayoutMark />디자인 기획안</span><small>선택</small></div>
    <p className="brief-description">머릿속에 그린 페이지가 있나요? 원하는 흐름과 문구를 남겨주세요.</p>
    <div className="brief-input-box"><label className="sr-only" htmlFor="design-brief-text">디자인 기획안</label><textarea id="design-brief-text" maxLength={3000} rows={6} value={design.brief} onChange={e => onChange({ brief: e.target.value })} placeholder={"섹션 01: 첫 화면\n메인 문구: 매일의 식탁에 작은 즐거움\n서브 문구: 제철의 맛을 정성껏 담았어요\n이미지 연출: 밝은 식탁 위에 놓인 제품, 부드러운 자연광\n섹션 02: 주요 특징 …"} /><div className="brief-input-toolbar"><button type="button" disabled={busy} onClick={() => pickDocument("brief")}><Paperclip size={12} />파일 첨부</button><details className="brief-guide"><summary><Sparkles size={12} />작성 가이드</summary><div><strong>이렇게 적어보세요</strong><p>메인 문구: 첫 화면에 넣을 제목<br />서브 문구: 제목 아래 들어갈 설명<br />이미지 연출: 원하는 사진 분위기<br />섹션별로 전달하고 싶은 내용을 자유롭게 남기세요.</p><small>메인·서브 문구는 구성안의 히어로에 반영돼요. 이미지 연출 지시는 편집 참고용으로 보관합니다.</small></div></details><span>{design.brief.length.toLocaleString()}/3,000자</span></div></div>
    {design.briefFileName && <div className="attached-file"><FileText size={12} /><span>{design.briefFileName}</span><button type="button" aria-label="기획안 첨부 이름 제거" onClick={() => onChange({ briefFileName: "" })}><X size={12} /></button></div>}
    <PhotoDirectionFields value={design.photoDirection} onChange={photoDirection=>onChange({photoDirection})}/>
    <div className="brief-field-label">디자인 구성<div className="brief-layout-options"><button type="button" className={design.layout === "editorial" ? "selected" : ""} onClick={() => onChange({ layout: "editorial" })}><span className="layout-icon editorial"><i /><i /><i /></span><span>스토리가 있는 구성<small>큰 사진과 여유 있는 흐름</small></span>{design.layout === "editorial" && <Check size={13} />}</button><button type="button" className={design.layout === "minimal" ? "selected" : ""} onClick={() => onChange({ layout: "minimal" })}><span className="layout-icon minimal"><i /><i /><i /></span><span>간결한 구성<small>핵심 정보와 정돈된 여백</small></span>{design.layout === "minimal" && <Check size={13} />}</button></div></div>
    <div className="brief-field-heading"><span>리뷰</span><small>문구 검수 참고용</small></div>
    <div className="review-attachment-box"><FileText size={21} /><div><strong>{design.reviewFileName || "참고할 상품 리뷰가 있나요?"}</strong><small>문서·이미지 중 한 파일 · TXT/CSV/XLSX 2MB, 이미지 8MB</small></div><button type="button" disabled={busy} onClick={() => reviewRef.current?.click()}><Paperclip size={12} />리뷰파일</button></div>
    {design.reviewImage && <div className="review-image-attachment"><a href={design.reviewImage} target="_blank" rel="noreferrer"><img src={design.reviewImage} alt="참고 리뷰 스크린샷" /></a><span>리뷰 스크린샷</span><button type="button" aria-label="리뷰 스크린샷 제거" onClick={() => onChange({ reviewImage: "", reviewFileName:"" })}><X size={13} /></button></div>}
    <details className="review-text-entry" open={Boolean(design.reviews) || undefined}><summary>리뷰 내용 직접 입력 · 수정{design.reviews && <span>{design.reviews.length.toLocaleString()}자</span>}</summary><textarea aria-label="참고 리뷰 내용" rows={4} maxLength={12000} value={design.reviews} onChange={e => onChange({ reviews: e.target.value })} placeholder="실제 리뷰를 붙여넣거나 첨부한 파일의 내용을 수정해주세요." /><p>첨부 리뷰는 검수 참고용이며 완성본에 자동으로 게시하지 않아요.</p>{design.reviewFileName && !design.reviewImage && <button type="button" className="text-button" onClick={() => onChange({ reviews: "", reviewFileName: "" })}>첨부 리뷰 내용 지우기</button>}</details>
    <div className="brief-field-heading"><span>레퍼런스</span><small>{design.references.length}/10</small></div><p className="brief-description">색감과 분위기는 페이지 전체에, 레이아웃은 원하는 섹션에 참고해보세요.</p>
    <div className="reference-dropzone" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); void importImages(e.dataTransfer.files, "reference"); }}>{design.references.length ? <div className="reference-thumbnails">{design.references.map((url, index) => <div key={`${url}-${index}`}><a href={url} target="_blank" rel="noreferrer"><img src={url} alt={`레퍼런스 ${index + 1}`} /></a><button type="button" aria-label={`레퍼런스 ${index + 1} 제거`} onClick={() => onChange({ references: design.references.filter((_, i) => i !== index) })}><X size={11} /></button></div>)}</div> : <div className="reference-example"><span><FileText size={21} /><i /><i /></span><ArrowRight size={15} /><span><ImagePlus size={23} /><i /><i /></span></div>}<button type="button" className="reference-upload-button" disabled={busy || design.references.length >= 10} onClick={() => pickImage("reference")}><ImagePlus size={15} />{design.references.length ? "참고 이미지 추가" : "참고하고 싶은 상세페이지가 있나요?"}</button><small>JPG · PNG · WebP · AVIF / 최대 10장 · 장당 8MB</small></div>
    <div className="brief-field-heading"><span>쿠팡 상품 참고 링크</span><small>최대 3개 · 선택</small></div>
    <p className="brief-description">상품에 맞는 공개 페이지의 구성과 후킹 흐름을 참고해요. 시나노골드는 등록된 기본 링크 2개를 우선 참고합니다. 판매량 순위는 실제 확인될 때만 사용해요.</p>
    <div className="coupang-reference-fields">{[0,1,2].map(index => <input key={index} aria-label={`쿠팡 참고 링크 ${index+1}`} type="url" maxLength={2000} placeholder="https://www.coupang.com/vp/products/…" value={design.coupangReferences?.[index] || ""} onChange={e=>{const links=[...(design.coupangReferences || [])];while(links.length<=index)links.push("");links[index]=e.target.value;onChange({coupangReferences:links});}} />)}</div>
    <p className="brief-description">AI 검색 설정을 켜면 상품명·링크를 Gemini에 보내며 검색 비용이 발생할 수 있어요. 접근이 막힌 페이지는 위에 스크린샷을 첨부해주세요. 새 사진 생성 시 참고 이미지 중 한 장을 추가 전송해 구도·색감을 참고하며 이미지 입력 비용이 늘 수 있어요.</p>
    <p className="brief-bottom-note">기획안과 참고 자료는 작업에 함께 저장되며, 완성본 이미지에는 포함되지 않아요.</p>
    {busy && <p className="brief-status"><LoaderCircle className="spin" size={13} />자료를 가져오고 있어요.</p>}{error && <p className="brief-error" role="alert">{error}</p>}{notice && <p className="brief-status" role="status"><Check size={13} />{notice}</p>}
  </section>;
}
function LayoutMark() { return <span className="brief-mark"><Sparkles size={14} /></span>; }
