"use client";

import { useId, useRef, useState } from "react";
import { MoveHorizontal } from "lucide-react";

const clamp = (value: number) => Math.max(10, Math.min(120, Math.round(value * 10) / 10));

export function FontSizeControl({ value, onChange, label = "요소 글자 크기" }: { value: number; onChange: (value: number) => void; label?: string }) {
  const helpId = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const gesture = useRef<{ x: number; value: number; next: number } | null>(null);

  function save() {
    if (draft !== null && draft.trim() && Number.isFinite(Number(draft))) onChange(clamp(Number(draft)));
    setDraft(null);
  }

  return <div className="ep-field ep-font-size">
    <span>글자 크기</span>
    <div className="ep-font-size-input">
      <button type="button" aria-label={label === "요소 글자 크기" ? "글자 크기 드래그 조절" : `${label} 드래그 조절`} title="좌우로 드래그하여 크기 조절 · Shift: 5씩 조절"
        onPointerDown={event => {
          if (event.button !== 0) return;
          event.preventDefault();
          const start = draft?.trim() && Number.isFinite(Number(draft)) ? clamp(Number(draft)) : value;
          gesture.current = { x: event.clientX, value: start, next: start };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={event => {
          const start = gesture.current;
          if (!start) return;
          start.next = clamp(start.value + Math.round((event.clientX - start.x) / 3) * (event.shiftKey ? 5 : 1));
          setDraft(String(start.next));
        }}
        onPointerUp={event => {
          const start = gesture.current;
          gesture.current = null;
          if (start) onChange(start.next);
          setDraft(null);
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => { gesture.current = null; setDraft(null); }}
        onLostPointerCapture={() => { gesture.current = null; setDraft(null); }}
        onKeyDown={event => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            onChange(clamp(value + (event.key === "ArrowRight" ? 1 : -1) * (event.shiftKey ? 5 : 1)));
          }
        }}><MoveHorizontal size={15} /></button>
      <input aria-label={label} aria-describedby={helpId} type="text" inputMode="decimal" value={draft ?? String(value)}
        onFocus={event => event.currentTarget.select()}
        onChange={event => { if (/^\d{0,3}(\.\d?)?$/.test(event.target.value)) setDraft(event.target.value); }}
        onBlur={save}
        onKeyDown={event => {
          if (event.key === "Enter") { event.preventDefault(); save(); }
          if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); setDraft(null); }
          if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            event.preventDefault();
            const current = draft?.trim() ? Number(draft) : value;
            const next = clamp(current + (event.key === "ArrowUp" ? 1 : -1) * (event.shiftKey ? 5 : 1));
            setDraft(null); onChange(next);
          }
        }} />
      <small>px</small>
    </div>
    <small id={helpId} className="ep-font-size-help">숫자 입력 · ↔ 드래그</small>
  </div>;
}
