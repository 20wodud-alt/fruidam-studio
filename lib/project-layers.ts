import { elementText } from "./element-style";
import { setTargetFormat, targetFormat } from "./canvas-operations";
import type { Section, StudioProject } from "./studio";

export type LayerAction = "visibility" | "lock" | "delete";
export type ProjectLayer = { target: string; kind: "text" | "image" | "badge" | "divider"; name: string; preview: string; image?: string; hidden: boolean; locked: boolean };

export function projectLayers(section: Section): ProjectLayer[] {
  const entries: ProjectLayer[] = [];
  for (const target of ["kicker", "title", "body", "image"]) {
    const value = target === "image" ? section.image : target === "kicker" && section.canvasMode ? section.kicker || "" : elementText(section, target);
    if (!value.trim()) continue;
    const format = targetFormat(section, target);
    const name = target === "title" ? "메인 제목" : target === "kicker" ? "서브 카피" : target === "image" ? "대표 사진" : section.kind === "benefits" ? `포인트 · ${section.body.split("\n").filter(line => line.trim()).length}개` : section.kind === "options" ? "상품 옵션" : "본문";
    entries.push({ target, kind: target === "image" ? "image" : "text", name, preview: target === "image" ? "페이지에 사용한 사진" : value, image: target === "image" ? value : undefined, hidden: Boolean(format.hidden), locked: Boolean(format.locked) });
  }
  for (const [index, element] of (section.elements || []).entries()) {
    const format = targetFormat(section, `extra:${element.id}`);
    const kind = element.type;
    entries.push({ target: `extra:${element.id}`, kind, name: `${({ text: "추가 글", image: "추가 사진", badge: "배지", divider: "구분선" })[kind]} ${index + 1}`, preview: element.text || (kind === "image" ? "추가한 이미지" : kind === "divider" ? "단락을 구분하는 선" : "내용 없음"), image: element.image, hidden: Boolean(format.hidden), locked: Boolean(format.locked) });
  }
  return entries;
}

export function applyLayerAction(project: StudioProject, sectionId: string, target: string, action: LayerAction): StudioProject {
  const original = project.sections.find(section => section.id === sectionId);
  if (!original) return project;
  if (target === "section") {
    if (action !== "visibility") return project;
    if (original.visible && project.sections.filter(section => section.visible).length <= 1) throw new Error("표시할 페이지가 하나 이상 필요해요.");
    return { ...project, sections: project.sections.map(section => section.id === sectionId ? { ...section, visible: !section.visible } : section) };
  }
  if (!projectLayers(original).some(layer => layer.target === target)) return project;
  const format = targetFormat(original, target);
  let changed = original;
  if (action === "lock") changed = setTargetFormat(original, target, { locked: !format.locked });
  else if (action === "visibility") changed = setTargetFormat(original, target, { hidden: !format.hidden });
  else {
    if (format.locked) throw new Error("잠금을 해제한 뒤 삭제해주세요.");
    if (target.startsWith("extra:")) changed = { ...original, elements: original.elements?.filter(element => `extra:${element.id}` !== target), reviewed: false };
    else {
      changed = { ...setTargetFormat(original, target, { hidden: true }), [target]: "", reviewed: false };
      if (target === "image") changed.imageMeta = undefined;
    }
  }
  return { ...project, sections: project.sections.map(section => section.id === sectionId ? changed : section) };
}
