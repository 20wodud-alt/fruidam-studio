"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AlignCenter, AlignLeft, AlignRight, ArrowDownToLine, ArrowUpToLine, Check, Crop, Eraser, FlipHorizontal2, FlipVertical2, ImageUp, LockKeyhole, Maximize2, Minimize2, RotateCcw, Sparkles, UnlockKeyhole, X } from "lucide-react";
import type { PhotoFormat } from "@/lib/studio";

export type CropRect = { x: number; y: number; width: number; height: number };
type Props = { image: string; format: PhotoFormat; onChange: (format: Partial<PhotoFormat>) => void; onReplace: () => void; onEdited: (url: string) => void; onAlign: (axis: "left" | "center" | "right") => void; busy: boolean };

export function ImageTools({ image, format, onChange, onReplace, onEdited, onAlign, busy }: Props) {
  const [tab, setTab] = useState("edit");
  const [crop, setCrop] = useState(false);
  const [background, setBackground] = useState(false);
  const [color, setColor] = useState("#ffffff");
  const [tolerance, setTolerance] = useState(32);
  const [preview, setPreview] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const request = useRef<AbortController | null>(null);
  const edited = useRef(onEdited);
  useEffect(() => { edited.current = onEdited; });
  useEffect(() => () => request.current?.abort(), []);
  async function process(action: "crop" | "sharpen" | "background", rect?: CropRect) {
    if (lock.current) return;
    lock.current = true; setWorking(true); setError("");
    const controller = new AbortController(); request.current = controller;
    try {
      const response = await fetch("/api/image-tools", { signal: controller.signal, method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image, action, rect, color, tolerance }) });
      const result = await response.json();
      if (controller.signal.aborted) return;
      if (!response.ok) throw new Error(result.error || "사진을 처리하지 못했어요.");
      if (action === "background") setPreview(result.url);
      else { edited.current(result.url); setCrop(false); }
    } catch (e) { if (controller.signal.aborted) return; setError(e instanceof Error ? e.message : "사진을 처리하지 못했어요."); }
    finally { lock.current = false; setWorking(false); }
  }
  const disabled = busy || working || !image;
  return <section className="image-tools" aria-label="이미지 편집 도구">
    <header><strong>이미지</strong><button aria-label="이미지 스타일 초기화" title="이미지 스타일 초기화" onClick={() => onChange({ fit: "cover", position: "center", radius: 0, flip: false, flipY: false, grayscale: false, brightness: 100, contrast: 100, saturation: 100, opacity: 100, rotation: 0, offsetX: 0, offsetY: 0, zIndex: 1, locked: false })}><RotateCcw size={14}/></button><button aria-label="이미지 잠금" aria-pressed={Boolean(format.locked)} title="위치·크기 잠금" onClick={() => onChange({ locked: !format.locked })}>{format.locked ? <LockKeyhole size={14}/> : <UnlockKeyhole size={14}/>}</button></header>
    <nav aria-label="이미지 도구 탭">{[["edit", "편집"], ["opacity", "불투명도"], ["align", "정렬"], ["order", "순서"]].map(([key, name]) => <button key={key} aria-pressed={tab === key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>{name}</button>)}</nav>
    {tab === "edit" && <>
      <button className="it-replace" disabled={busy || working} onClick={onReplace}>{image && <img src={image} alt="선택한 이미지"/>}<span>파일로 이미지 교체</span><ImageUp size={15}/></button>
      <div className="it-label">맞춤</div><div className="it-two"><button aria-pressed={(format.fit || "cover") === "cover"} onClick={() => onChange({ fit: "cover" })}><Maximize2 size={13}/>채우기</button><button aria-pressed={format.fit === "contain"} onClick={() => onChange({ fit: "contain" })}><Minimize2 size={13}/>맞추기</button></div><p className="it-help">채우기는 영역을 꽉 채우고, 맞추기는 사진 전체를 보여줘요.</p>
      <div className="it-label">크롭</div><button className="it-wide" disabled={disabled} onClick={() => { setError(""); setCrop(true); }}><Crop size={14}/>이미지 크롭</button>
      <div className="it-label">반전</div><div className="it-two"><button aria-pressed={Boolean(format.flip)} onClick={() => onChange({ flip: !format.flip })}><FlipHorizontal2 size={14}/>좌우</button><button aria-pressed={Boolean(format.flipY)} onClick={() => onChange({ flipY: !format.flipY })}><FlipVertical2 size={14}/>상하</button></div>
      <label className="it-range"><span>모서리 둥글기<small>{format.radius || 0}px</small></span><input aria-label="이미지 모서리 둥글기" type="range" min={0} max={250} value={format.radius || 0} onChange={e => onChange({ radius: Number(e.target.value) })}/></label>
      <label className="it-toggle"><span>흑백 효과</span><input aria-label="이미지 흑백 효과" type="checkbox" checked={Boolean(format.grayscale)} onChange={e => onChange({ grayscale: e.target.checked })}/></label>
      <button className="it-wide" disabled={disabled} onClick={() => { setBackground(true); setPreview(""); setError(""); }}><Eraser size={14}/>단색 배경 제거</button>
      <button className="it-wide" disabled={disabled} onClick={() => void process("sharpen")}><Sparkles size={14}/>선명하게 보정</button><p className="it-help">로컬 선명도 보정 · AI 생성이나 해상도 복원은 하지 않아요.</p>
    </>}
    {tab === "opacity" && <label className="it-range"><span>불투명도<small>{format.opacity ?? 100}%</small></span><input aria-label="이미지 불투명도" type="range" min={10} max={100} value={format.opacity ?? 100} onChange={e => onChange({ opacity: Number(e.target.value) })}/></label>}
    {tab === "align" && <><p className="it-help">현재 페이지를 기준으로 선택한 이미지를 정렬해요.</p><div className="it-three">{([["left", AlignLeft, "왼쪽"], ["center", AlignCenter, "가운데"], ["right", AlignRight, "오른쪽"]] as const).map(([axis, Icon, name]) => <button key={axis} onClick={() => onAlign(axis)}><Icon size={15}/>{name}</button>)}</div></>}
    {tab === "order" && <><p className="it-help">겹친 요소 사이에서 이미지가 보이는 순서를 조절해요.</p><div className="it-two"><button onClick={() => onChange({ zIndex: Math.min(50, (format.zIndex ?? 1) + 1) })}><ArrowUpToLine size={14}/>앞으로</button><button onClick={() => onChange({ zIndex: Math.max(0, (format.zIndex ?? 1) - 1) })}><ArrowDownToLine size={14}/>뒤로</button></div><div className="it-two"><button onClick={() => onChange({ zIndex: 50 })}>맨 앞으로</button><button onClick={() => onChange({ zIndex: 0 })}>맨 뒤로</button></div></>}
    {working && <p className="it-help" role="status">내 컴퓨터에서 사진을 처리하고 있어요…</p>}{error && <p className="it-error" role="alert">{error}</p>}
    {crop && <ImageCropDialog image={image} busy={working} error={error} onClose={() => setCrop(false)} onApply={rect => void process("crop", rect)}/>}
    {background && <ImageToolDialog label="단색 배경 제거" busy={working} onClose={() => setBackground(false)}><div className="it-dialog-card"><header><strong>단색 배경 제거</strong><button disabled={working} aria-label="배경 제거 닫기" onClick={() => setBackground(false)}><X size={18}/></button></header><p>선택한 색과 연결된 가장자리 배경을 지워요. 흰색 촬영 배경 등에 사용하세요. 복잡한 농장 배경은 자동 분리하지 않아요.</p><div className="it-bg-preview"><img src={preview || image} alt="배경 제거 미리보기"/></div><label className="it-bg-color">지울 배경색<input type="color" value={color} onChange={e => { setColor(e.target.value); setPreview(""); }}/></label><label className="it-range"><span>색상 허용 범위<small>{tolerance}</small></span><input aria-label="배경 제거 색상 허용 범위" type="range" min={5} max={100} value={tolerance} onChange={e => { setTolerance(Number(e.target.value)); setPreview(""); }}/></label>{error && <p className="it-error" role="alert">{error}</p>}<footer><button disabled={working} onClick={() => setBackground(false)}>취소</button><button disabled={disabled} onClick={() => void process("background")}>{working ? "처리 중…" : "미리보기"}</button><button className="primary" disabled={!preview || working} onClick={() => { onEdited(preview); setBackground(false); }}><Check size={14}/>적용</button></footer></div></ImageToolDialog>}
  </section>;
}

function ImageCropDialog({ image, busy, error, onClose, onApply }: { image: string; busy: boolean; error: string; onClose: () => void; onApply: (rect: CropRect) => void }) {
  const [rect, setRect] = useState<CropRect>({ x: 10, y: 10, width: 80, height: 80 });
  const stage = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ x: number; y: number; rect: CropRect; resize: boolean } | null>(null);
  function field(key: keyof CropRect, value: number) {
    setRect(current => { const next = { ...current, [key]: value }; next.width = Math.max(5, Math.min(next.width, 100 - next.x)); next.height = Math.max(5, Math.min(next.height, 100 - next.y)); return next; });
  }
  return <ImageToolDialog label="이미지 크롭" busy={busy} onClose={onClose}><div className="it-dialog-card"><header><strong>이미지 크롭</strong><button disabled={busy} aria-label="이미지 크롭 닫기" onClick={onClose}><X size={18}/></button></header><p>선택 영역을 드래그해 이동하고 오른쪽 아래 모서리로 크기를 조절하세요.</p><div className="it-crop-stage" ref={stage}><img src={image} alt="크롭할 원본 이미지" draggable={false}/><div className="it-crop-selection" style={{ left: `${rect.x}%`, top: `${rect.y}%`, width: `${rect.width}%`, height: `${rect.height}%` }} onPointerDown={e => { if (busy || e.button !== 0) return; e.preventDefault(); gesture.current = { x: e.clientX, y: e.clientY, rect, resize: (e.target as Element).closest("button") !== null }; e.currentTarget.setPointerCapture(e.pointerId); }} onPointerMove={e => {
    const start = gesture.current, bounds = stage.current?.getBoundingClientRect(); if (!start || !bounds) return;
    const dx = (e.clientX - start.x) / bounds.width * 100, dy = (e.clientY - start.y) / bounds.height * 100;
    setRect(start.resize ? { ...start.rect, width: Math.max(5, Math.min(100 - start.rect.x, start.rect.width + dx)), height: Math.max(5, Math.min(100 - start.rect.y, start.rect.height + dy)) } : { ...start.rect, x: Math.max(0, Math.min(100 - start.rect.width, start.rect.x + dx)), y: Math.max(0, Math.min(100 - start.rect.height, start.rect.y + dy)) });
  }} onPointerUp={() => { gesture.current = null; }} onPointerCancel={() => { gesture.current = null; }}><button aria-label="크롭 영역 크기 조절"/></div></div><div className="it-crop-fields">{([["x", "왼쪽"], ["y", "위쪽"], ["width", "너비"], ["height", "높이"]] as const).map(([key, label]) => <label key={key}>{label} %<input aria-label={`크롭 ${label}`} type="number" min={key === "width" || key === "height" ? 5 : 0} max={key === "x" || key === "y" ? 95 : 100} value={Math.round(rect[key])} disabled={busy} onChange={e => field(key, Math.max(key === "x" || key === "y" ? 0 : 5, Math.min(key === "x" || key === "y" ? 95 : 100, Number(e.target.value))))}/></label>)}</div>{error && <p className="it-error" role="alert">{error}</p>}<footer><button disabled={busy} onClick={onClose}>취소</button><button disabled={busy} onClick={() => setRect({ x: 0, y: 0, width: 100, height: 100 })}>전체 선택</button><button className="primary" disabled={busy} onClick={() => onApply(rect)}><Check size={14}/>{busy ? "처리 중…" : "크롭 적용"}</button></footer></div></ImageToolDialog>;
}

function ImageToolDialog({ label, busy, onClose, children }: { label: string; busy: boolean; onClose: () => void; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const node = dialog.current; node?.showModal(); return () => node?.close(); }, []);
  return createPortal(<dialog ref={dialog} role="dialog" aria-modal="true" aria-label={label} className="it-dialog" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>{children}</dialog>, document.body);
}
