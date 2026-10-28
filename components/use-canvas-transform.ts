"use client";
import { useEffect, useRef, useState, type RefObject } from "react";
import { duplicateTargets, groupedTargets, measureElement, moveTargets, resizeTargets, targetFormat, type ElementMetric } from "@/lib/canvas-operations";
import type { StudioProject } from "@/lib/studio";
type Props = { project: StudioProject; selectedId: string; targets: string[]; zoom: number; viewportRef: RefObject<HTMLDivElement | null>; documentRef: RefObject<HTMLDivElement | null>; onCommit: (project: StudioProject) => void; onSelect: (id: string, targets: string[], active?: string) => void };
export function useCanvasTransform(props: Props) {
  const latest = useRef(props); const suppressClick = useRef(false); const [preview, setPreview] = useState<StudioProject | null>(null); const [dragging, setDragging] = useState(false);
  const [box, setBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  useEffect(() => { latest.current = props; });
  useEffect(() => {
    const viewport = props.viewportRef.current; if (!viewport) return;
    let disposeGesture: (() => void) | undefined;
    function down(event: PointerEvent) {
      if (event.button !== 0 || !(event.target instanceof Element) || event.target.closest("textarea,input,[contenteditable=true]")) return;
      const p = latest.current, handle = event.target.closest<HTMLElement>("[data-resize]"), element = event.target.closest<HTMLElement>("[data-element]");
      if (!handle && (!element || !p.documentRef.current?.contains(element))) return;
      const sectionId = element?.closest<HTMLElement>("[data-section]")?.dataset.section || p.selectedId;
      const section = p.project.sections.find(s => s.id === sectionId); if (!section) return;
      const target = element?.dataset.element || p.targets[0]; if (!target) return;
      let targets = sectionId === p.selectedId ? [...p.targets] : [];
      if (!handle) {
        const group = groupedTargets(section, target);
        targets = event.shiftKey ? (targets.includes(target) ? targets.filter(t => !group.includes(t)) : Array.from(new Set([...targets, ...group]))) : targets.includes(target) ? targets : group;
        if (!targets.length) targets = [target];
      }
      p.onSelect(sectionId, targets, targets.includes(target) ? target : targets.at(-1)); suppressClick.current = true; event.preventDefault();
      const metrics: Record<string, ElementMetric> = {}; const ratio = p.zoom / 100;
      const parent = p.documentRef.current?.querySelector<HTMLElement>(`[data-section="${sectionId}"]`), sectionRect = parent?.getBoundingClientRect();
      if (!parent || !sectionRect) return;
      for (const key of targets) { const item = parent.querySelector<HTMLElement>(`[data-element="${key}"]`); if (item) metrics[key] = measureElement(item,sectionRect,ratio); }
      const unlocked = targets.filter(t => !targetFormat(section, t).locked);
      const copy = !handle && (event.ctrlKey || event.metaKey || event.altKey);
      const duplicated = copy ? duplicateTargets(section, unlocked, metrics) : null;
      const workingSection = duplicated?.section || section, workingTargets = duplicated?.targets || unlocked;
      const startX = event.clientX, startY = event.clientY;
      let changed = false, final: StudioProject | null = null;
      const groupWidth = Math.max(30, ...Object.values(metrics).map(m => m.x + m.width)) - Math.min(...Object.values(metrics).map(m => m.x));
      const groupHeight = Math.max(30, ...Object.values(metrics).map(m => m.y + m.height)) - Math.min(...Object.values(metrics).map(m => m.y));

      function move(e: PointerEvent) {
        if (!workingTargets.length) return;
        let dx = (e.clientX - startX) / ratio, dy = (e.clientY - startY) / ratio;
        if (!handle && e.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
        if (Math.abs(dx) + Math.abs(dy) < 2 && !copy) return;
        if(!changed){viewport!.setPointerCapture(event.pointerId);setDragging(true);}
        changed = true;
        const direction = handle?.dataset.resize || "se";
        let next = workingSection;
        if (handle) {
          let sx = /e|w/.test(direction) ? Math.max(.2, 1 + dx * (direction.includes("w") ? -1 : 1) / Math.max(30, groupWidth)) : 1, sy = /n|s/.test(direction) ? Math.max(.2, 1 + dy * (direction.includes("n") ? -1 : 1) / Math.max(30, groupHeight)) : 1;
          if (e.shiftKey) sx = sy = Math.max(sx, sy);
          next = resizeTargets(workingSection, workingTargets, metrics, sx, sy, direction.includes("w") ? dx : 0, direction.includes("n") ? dy : 0);
        } else next = moveTargets(workingSection, workingTargets, dx, dy);
        final = { ...p.project, sections: p.project.sections.map(s => s.id === sectionId ? next : s) }; setPreview(final);
      }
      function end(e: PointerEvent) {
        if (e.type !== "pointercancel" && workingTargets.length && (changed || copy)) { const next = final || { ...p.project, sections: p.project.sections.map(s => s.id === sectionId ? workingSection : s) }; p.onCommit(next); p.onSelect(sectionId, workingTargets, copy ? workingTargets.at(-1) : targets.includes(target) ? target : targets.at(-1)); }
        setPreview(null); setDragging(false); try { viewport!.releasePointerCapture(event.pointerId); } catch {}
        window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", end); window.removeEventListener("pointercancel", end); setTimeout(() => { suppressClick.current = false; }, 0); disposeGesture = undefined;
      }
      window.addEventListener("pointermove", move); window.addEventListener("pointerup", end); window.addEventListener("pointercancel", end);
      disposeGesture = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", end); window.removeEventListener("pointercancel", end); };
    }
    viewport.addEventListener("pointerdown", down);
    return () => { viewport.removeEventListener("pointerdown", down); disposeGesture?.(); };
    // The gesture reads the current document through latest, and stays attached during preview renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const p = props; let frame = 0;
    function measure() { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => {
      const viewport = p.viewportRef.current; if (!viewport) return;
      const section = p.documentRef.current?.querySelector(`[data-section="${p.selectedId}"]`); const rects = p.targets.map(t => section?.querySelector<HTMLElement>(`[data-element="${t}"]`)?.getBoundingClientRect()).filter((r): r is DOMRect => Boolean(r && r.width && r.height));
      if (!rects.length) { setBox(null); return; } const v = viewport.getBoundingClientRect(), left = Math.min(...rects.map(r => r.left)), top = Math.min(...rects.map(r => r.top)); setBox({ left: left - v.left + viewport.scrollLeft, top: top - v.top + viewport.scrollTop, width: Math.max(...rects.map(r => r.right)) - left, height: Math.max(...rects.map(r => r.bottom)) - top });
    }); }
    measure(); window.addEventListener("resize", measure); const observer = new ResizeObserver(measure); if (p.documentRef.current) observer.observe(p.documentRef.current);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", measure); observer.disconnect(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.project, props.selectedId, props.targets.join("|"), props.zoom, preview]);
  return { preview, dragging, box, suppressClick };
}
