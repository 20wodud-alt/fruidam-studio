"use client";
import { useState } from "react";
import { AlignCenter, AlignLeft, AlignRight, ArrowDownToLine, ArrowUpToLine, Bold, Highlighter, Italic, List, ListOrdered, LockKeyhole, RotateCcw, Strikethrough, Superscript, Underline, UnlockKeyhole } from "lucide-react";
import { fontCatalog } from "@/lib/fonts";
import type { TextFormat } from "@/lib/studio";
import { FontSizeControl } from "./font-size-control";

export function TextTools({ format, size, title, structured, onChange, onAlign }: { format: TextFormat; size: number; title: boolean; structured: boolean; onChange: (patch: TextFormat) => void; onAlign: (axis: "left" | "center" | "right") => void }) {
  const [tab, setTab] = useState("edit");
  return <section className="text-tools image-tools" aria-label="텍스트 편집 도구">
    <header><strong>텍스트</strong><button aria-label="텍스트 효과 초기화" title="텍스트 효과 초기화" onClick={() => onChange({ opacity: 100, strokeWidth: 0, shadow: false, curve: 0, highlight: undefined, strike: false, superscript: false, listStyle: "none" })}><RotateCcw size={14}/></button><button aria-label="텍스트 잠금" title="위치·크기 잠금" aria-pressed={Boolean(format.locked)} onClick={() => onChange({ locked: !format.locked })}>{format.locked ? <LockKeyhole size={14}/> : <UnlockKeyhole size={14}/>}</button></header>
    <nav aria-label="텍스트 도구 탭">{[["edit", "편집"], ["opacity", "불투명도"], ["align", "정렬"], ["order", "순서"]].map(([key, name]) => <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>{name}</button>)}</nav>
    {tab === "edit" && <>
      <select className="tt-font" aria-label="텍스트 도구 글꼴" value={format.font || "sans"} onChange={e => onChange({ font: e.target.value as TextFormat["font"] })}>{fontCatalog.map(font => <option key={font.id} value={font.id}>{font.name}</option>)}</select>
      <div className="tt-size-row"><button aria-label="글자 크기 줄이기" onClick={() => onChange({ fontSize: Math.max(10, size - 1) })}>−</button><FontSizeControl label="텍스트 도구 글자 크기" value={size} onChange={fontSize => onChange({ fontSize })}/><button aria-label="글자 크기 늘리기" onClick={() => onChange({ fontSize: Math.min(120, size + 1) })}>+</button></div>
      <div className="tt-button-row">{([
        ["굵게", Bold, (format.weight ?? (title ? 700 : 400)) >= 700, { weight: (format.weight ?? (title ? 700 : 400)) >= 700 ? 400 : 700 }],
        ["기울임", Italic, Boolean(format.italic), { italic: !format.italic }],
        ["밑줄", Underline, Boolean(format.underline), { underline: !format.underline }],
        ["취소선", Strikethrough, Boolean(format.strike), { strike: !format.strike }],
        ["위 첨자", Superscript, Boolean(format.superscript), { superscript: !format.superscript }],
      ] as const).map(([name, Icon, active, patch]) => <button key={name} aria-label={`텍스트 ${name}`} title={name} aria-pressed={active} onClick={() => onChange(patch)}><Icon size={15}/></button>)}</div>
      <div className="tt-button-row">{([["left", AlignLeft, "왼쪽"], ["center", AlignCenter, "가운데"], ["right", AlignRight, "오른쪽"]] as const).map(([align, Icon, name]) => <button key={align} aria-label={`글 문단 ${name} 정렬`} title={`${name} 정렬`} aria-pressed={(format.align || "center") === align} onClick={() => onChange({ align })}><Icon size={15}/></button>)}<button disabled={structured} aria-label="글머리 기호 목록" title={structured ? "포인트·옵션은 기존 번호를 유지해요" : "글머리 기호"} aria-pressed={format.listStyle === "bullet"} onClick={() => onChange({ listStyle: format.listStyle === "bullet" ? "none" : "bullet" })}><List size={15}/></button><button disabled={structured} aria-label="번호 목록" title="번호 목록" aria-pressed={format.listStyle === "number"} onClick={() => onChange({ listStyle: format.listStyle === "number" ? "none" : "number" })}><ListOrdered size={15}/></button></div>
      <div className="tt-colors"><label>글자색<input aria-label="텍스트 도구 글자색" type="color" value={format.color || "#292c29"} onChange={e => onChange({ color: e.target.value })}/></label><label><Highlighter size={13}/>강조색<input aria-label="텍스트 강조색" type="color" value={format.highlight || "#fff0a6"} onChange={e => onChange({ highlight: e.target.value })}/></label><button aria-label="텍스트 강조색 제거" title="강조색 제거" disabled={!format.highlight} onClick={() => onChange({ highlight: undefined })}>지우기</button></div>
      <Effect label="외곽선" checked={Boolean(format.strokeWidth)} onChange={enabled => onChange({ strokeWidth: enabled ? 1 : 0 })}><Slider label="외곽선 두께" value={format.strokeWidth || 1} min={.5} max={6} step={.5} suffix="px" onChange={strokeWidth => onChange({ strokeWidth })}/><label className="tt-colors">외곽선 색상<input aria-label="외곽선 색상" type="color" value={format.strokeColor || "#426c4c"} onChange={e => onChange({ strokeColor: e.target.value })}/></label></Effect>
      <Effect label="그림자" checked={Boolean(format.shadow)} onChange={shadow => onChange({ shadow })}><Slider label="그림자 가로" value={format.shadowX ?? 2} min={-20} max={20} suffix="px" onChange={shadowX => onChange({ shadowX })}/><Slider label="그림자 세로" value={format.shadowY ?? 3} min={-20} max={20} suffix="px" onChange={shadowY => onChange({ shadowY })}/><Slider label="그림자 흐림" value={format.shadowBlur ?? 4} min={0} max={30} suffix="px" onChange={shadowBlur => onChange({ shadowBlur })}/><label className="tt-colors">그림자 색상<input aria-label="그림자 색상" type="color" value={format.shadowColor || "#a2aaa0"} onChange={e => onChange({ shadowColor: e.target.value })}/></label></Effect>
      <Effect label="곡선" checked={Boolean(format.curve)} disabled={structured} onChange={enabled => onChange({ curve: enabled ? 35 : 0 })}><Slider label="텍스트 곡률" value={format.curve || 0} min={-80} max={80} onChange={curve => onChange({ curve })}/><p className="it-help">짧은 제목이나 배지에 사용하세요. 줄바꿈한 문장은 줄별로 휘어져요.</p></Effect>
    </>}
    {tab === "opacity" && <Slider label="텍스트 불투명도" value={format.opacity ?? 100} min={0} max={100} suffix="%" onChange={opacity => onChange({ opacity })}/>}
    {tab === "align" && <><p className="it-help">글 박스의 위치를 현재 페이지 기준으로 맞춰요. 문단 정렬은 편집 탭에서 조절하세요.</p><div className="it-three">{([["left", AlignLeft, "왼쪽"], ["center", AlignCenter, "가운데"], ["right", AlignRight, "오른쪽"]] as const).map(([axis, Icon, name]) => <button key={axis} onClick={() => onAlign(axis)}><Icon size={15}/>{name}</button>)}</div></>}
    {tab === "order" && <><p className="it-help">사진이나 다른 글과 겹칠 때 표시되는 순서를 조절해요.</p><div className="it-two"><button onClick={() => onChange({ zIndex: Math.min(50, (format.zIndex ?? 5) + 1) })}><ArrowUpToLine size={14}/>앞으로</button><button onClick={() => onChange({ zIndex: Math.max(0, (format.zIndex ?? 5) - 1) })}><ArrowDownToLine size={14}/>뒤로</button></div><div className="it-two"><button onClick={() => onChange({ zIndex: 50 })}>맨 앞으로</button><button onClick={() => onChange({ zIndex: 0 })}>맨 뒤로</button></div></>}
  </section>;
}

function Effect({ label, checked, disabled, onChange, children }: { label: string; checked: boolean; disabled?: boolean; onChange: (enabled: boolean) => void; children: React.ReactNode }) {
  return <div className="tt-effect"><label className="it-toggle"><span>{label}</span><input aria-label={`텍스트 ${label}`} type="checkbox" checked={checked} disabled={disabled} onChange={e => onChange(e.target.checked)}/></label>{checked && !disabled && <div className="tt-effect-settings">{children}</div>}</div>;
}
function Slider({ label, value, min, max, step = 1, suffix = "", onChange }: { label: string; value: number; min: number; max: number; step?: number; suffix?: string; onChange: (value: number) => void }) {
  return <label className="it-range"><span>{label}<small>{value}{suffix}</small></span><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}/></label>;
}
