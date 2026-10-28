"use client";
import { useEffect, useRef } from "react";
import { Keyboard, X } from "lucide-react";
import { shortcutGroups } from "@/lib/editor-shortcuts";
export function ShortcutGuide({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null; const overflow = document.body.style.overflow; document.body.style.overflow = "hidden";
    ref.current?.querySelector<HTMLButtonElement>("button")?.focus();
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); onClose(); }
      if (e.key !== "Tab") return;
      const all = Array.from(ref.current?.querySelectorAll<HTMLElement>("button,[tabindex='0']") || []);
      if (e.shiftKey && document.activeElement === all[0]) { e.preventDefault(); all.at(-1)?.focus(); }
      else if (!e.shiftKey && document.activeElement === all.at(-1)) { e.preventDefault(); all[0]?.focus(); }
    }
    window.addEventListener("keydown", key, true);
    return () => { document.body.style.overflow = overflow; window.removeEventListener("keydown", key, true); previous?.focus(); };
  }, [onClose]);
  return <div className="shortcut-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><div ref={ref} role="dialog" aria-modal="true" aria-labelledby="shortcut-heading" className="shortcut-guide"><button className="shortcut-close" aria-label="단축키 안내 닫기" onClick={onClose}><X size={19} /></button><span className="shortcut-guide-icon"><Keyboard size={24} /></span><h2 id="shortcut-heading">손끝으로 더 빠르게 편집하세요.</h2><p>캔버스에서 요소를 선택한 뒤 사용하세요. Mac에서는 Ctrl 대신 ⌘를 사용합니다.</p><div className="shortcut-guide-groups">{shortcutGroups.map(group => <section key={group.name}><h3>{group.name}</h3>{group.items.map(([keys, label]) => <div key={keys}><span>{label}</span><kbd>{keys}</kbd></div>)}</section>)}</div><div className="shortcut-guide-note">입력창에서 복사·붙여넣기·실행 취소는 일반 텍스트 편집으로 동작합니다. 요소 복사와 서식 복사는 편집기 내부 클립보드에 보관됩니다. 페이지를 선택한 상태에서는 복제·삭제·순서 변경이 페이지에 적용됩니다. 일반 방향키는 요소를 1px, Shift와 함께 누르면 10px 이동합니다.</div></div></div>;
}
