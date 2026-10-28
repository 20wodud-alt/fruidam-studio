// scrollIntoView also scrolls overflow:hidden ancestors. An offset image can
// therefore shift every page inside the canvas. Scroll only the outer viewport.
export function scrollCanvasToElement(viewport: HTMLElement | null, element: Element | null | undefined, { block = "start", behavior = "smooth" }: { block?: "start" | "center"; behavior?: ScrollBehavior } = {}) {
  if (!viewport || !element || !viewport.contains(element)) return;
  const bounds = viewport.getBoundingClientRect(), target = element.getBoundingClientRect();
  const padding = parseFloat(getComputedStyle(viewport).paddingTop) || 0;
  const space = block === "center" && target.height < viewport.clientHeight ? (viewport.clientHeight - target.height) / 2 : padding;
  viewport.scrollTo({ top: Math.max(0, viewport.scrollTop + target.top - bounds.top - viewport.clientTop - space), left: viewport.scrollLeft, behavior });
}
