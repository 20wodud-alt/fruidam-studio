"use client";
import { useEffect } from "react";
import type { ShortcutAction } from "@/lib/editor-shortcuts";
export function useEditorShortcuts(onAction: (action: ShortcutAction, step?: number) => void, canPaste: () => boolean, onExternalPaste: (files: File[], text: string) => void) {
  useEffect(() => {
    function typing(target: EventTarget | null) { return target instanceof Element && Boolean(target.closest('textarea,input:not([type="range"]):not([type="color"]):not([type="checkbox"]):not([type="radio"]),[contenteditable="true"]')); }
    function handler(e: KeyboardEvent) {
      if (e.defaultPrevented || e.isComposing || e.key === "Process" || document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      const key = e.key.toLowerCase(), primary = e.ctrlKey || e.metaKey;
      let action: ShortcutAction | undefined;
      if (primary && key === "s" && !e.shiftKey) action = "save";
      else if (primary && e.altKey && key === "e") action = "export";
      else if (typing(e.target)) return;
      else if (primary) {
        if (key === "g") action = e.shiftKey ? "ungroup" : "group";
        else if (key === "2") action = e.altKey ? "unlock" : "lock";
        else if (key === "z") action = e.shiftKey ? "redo" : "undo";
        else if (key === "y") action = "redo";
        else if (key === "c") action = e.shiftKey ? "copyStyle" : "copy";
        else if (key === "x") action = "cut";
        else if (key === "v") { if (e.shiftKey) action = "pasteStyle"; else if (canPaste()) action = "paste"; }
        else if (key === "d") action = "duplicate";
        else if (key === "b") action = "bold";
        else if (key === "i") action = "italic";
        else if (key === "u") action = "underline";
        else if (e.shiftKey && key === "l") action = "left";
        else if (e.shiftKey && key === "e") action = "center";
        else if (e.shiftKey && key === "r") action = "right";
        else if (e.shiftKey && e.code === "Period") action = "fontLarger";
        else if (e.shiftKey && e.code === "Comma") action = "fontSmaller";
        else if (e.code === "BracketLeft") action = e.shiftKey ? "first" : "up";
        else if (e.code === "BracketRight") action = e.shiftKey ? "last" : "down";
        else if (e.shiftKey && key === "h") action = "hide";
        else if (["=", "+"].includes(key)) action = "zoomIn";
        else if (["-", "_"].includes(key)) action = "zoomOut";
        else if (key === "0") action = "fit";
        else if (key === "1") action = "actual";
        else if (key === "/") action = "help";
      } else if (e.altKey && key === "arrowup") action = "up";
      else if (e.altKey && key === "arrowdown") action = "down";
      else if (!e.altKey) {
        if (key === "?" || key === "f1") action = "help";
        else if (key === "escape") action = "deselect";
        else if ((key === "delete" || key === "backspace") && !(e.target instanceof Element && e.target.closest("input,select,textarea"))) action = "delete";
        else if (!(e.target instanceof Element && e.target.closest("input,select,textarea,button"))) action = ({ arrowleft: "nudgeLeft", arrowright: "nudgeRight", arrowup: "nudgeUp", arrowdown: "nudgeDown" } as Record<string, ShortcutAction>)[key];
        if (!action && !e.shiftKey) action = ({ v: "toolPages", t: "toolText", i: "toolPhotos", p: "toolLayout", g: "toolElements", l: "toolLayers", c: "toolColor" } as Record<string, ShortcutAction>)[key];
      }
      if (!action) return;
      if ((action === "copy" || action === "cut") && window.getSelection()?.toString()) return;
      e.preventDefault();
      if (e.repeat && ["duplicate", "delete", "cut", "paste", "help", "save", "export"].includes(action)) return;
      onAction(action, e.shiftKey ? 10 : 1);
    }
    function paste(e: ClipboardEvent) {
      if (typing(e.target) || document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      const files = Array.from(e.clipboardData?.files || []).filter(file => file.type.startsWith("image/"));
      const text = e.clipboardData?.getData("text/plain") || "";
      if (files.length || text.trim()) { e.preventDefault(); onExternalPaste(files, text); }
    }
    window.addEventListener("keydown", handler); window.addEventListener("paste", paste);
    return () => { window.removeEventListener("keydown", handler); window.removeEventListener("paste", paste); };
  }, [onAction, canPaste, onExternalPaste]);
}
