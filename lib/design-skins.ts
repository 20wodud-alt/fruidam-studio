import type { Section, StudioProject } from "./studio";
import type { FontId } from "./fonts";

export const skinIds = ["orchard-note", "modern-editorial", "fresh-label", "point-card", "wide-gallery", "soft-classic"] as const;
export type SkinId = typeof skinIds[number];
export type SkinScope = "page" | "all";
export type DesignSkin = { id: SkinId; name: string; category: "story" | "clean" | "photo"; description: string; font: FontId; title: number; heading: number; align: "left" | "center"; padding: number; radius: number; imageWidth: number; heroHeight: number; imageHeight: number };
export const designSkins: DesignSkin[] = [
  { id: "orchard-note", name: "산지의 기록", category: "story", description: "차분한 명조와 섬세한 구분선", font: "serif", title: 62, heading: 42, align: "center", padding: 64, radius: 8, imageWidth: 88, heroHeight: 600, imageHeight: 440 },
  { id: "modern-editorial", name: "모던 매거진", category: "story", description: "왼쪽 정렬과 힘 있는 타이포", font: "sans", title: 76, heading: 48, align: "left", padding: 62, radius: 0, imageWidth: 100, heroHeight: 650, imageHeight: 480 },
  { id: "fresh-label", name: "프레시 라벨", category: "clean", description: "선명한 제목과 초록 라벨 포인트", font: "doHyeon", title: 68, heading: 48, align: "center", padding: 58, radius: 12, imageWidth: 92, heroHeight: 590, imageHeight: 440 },
  { id: "point-card", name: "클린 카드", category: "clean", description: "정돈된 정보와 가벼운 카드 프레임", font: "sans", title: 60, heading: 42, align: "center", padding: 56, radius: 18, imageWidth: 86, heroHeight: 550, imageHeight: 410 },
  { id: "wide-gallery", name: "와이드 갤러리", category: "photo", description: "큰 사진을 먼저 보여주는 구성", font: "sans", title: 64, heading: 44, align: "center", padding: 0, radius: 0, imageWidth: 100, heroHeight: 760, imageHeight: 560 },
  { id: "soft-classic", name: "소프트 클래식", category: "photo", description: "우아한 글꼴과 둥근 사진 프레임", font: "gowunBatang", title: 62, heading: 44, align: "center", padding: 72, radius: 180, imageWidth: 86, heroHeight: 620, imageHeight: 460 },
];

export function applyDesignSkin(project: StudioProject, id: SkinId, scope: SkinScope, sectionId: string): StudioProject {
  const skin = designSkins.find(item => item.id === id);
  if (!skin || (scope !== "page" && scope !== "all")) throw new Error("디자인 스킨을 확인해주세요.");
  if (!project.sections.some(section => section.id === sectionId)) throw new Error("적용할 페이지를 선택해주세요.");
  const style = (section: Section): Section => {
    return { ...section, format: { ...section.format, skin: id, background: "#ffffff", padding: skin.padding,
      title: { ...section.format?.title, font: skin.font, fontSize: section.kind === "hero" ? skin.title : skin.heading, color: "#20251f", weight: skin.font === "doHyeon" ? 400 : 700, align: skin.align, lineHeight: 1.25, letterSpacing: -1, offsetX: 0, offsetY: 0, rotation: 0, widthPx: undefined },
      body: { ...section.format?.body, font: "sans", fontSize: 19, color: "#444b41", align: skin.align, lineHeight: 1.6, letterSpacing: 0, offsetX: 0, offsetY: 0, rotation: 0, widthPx: undefined },
      kicker: { ...section.format?.kicker, font: "sans", fontSize: 12, color: "#426c4c", align: skin.align, lineHeight: 1.4, letterSpacing: 1.5, offsetX: 0, offsetY: 0, rotation: 0, widthPx: undefined },
      image: { ...section.format?.image, widthPx: undefined, width: skin.imageWidth, height: section.kind === "hero" ? skin.heroHeight : skin.imageHeight, radius: skin.radius, fit: "cover", offsetX: 0, offsetY: 0, rotation: 0 },
    } };
  };
  return { ...project, sections: project.sections.map(section => scope === "all" || section.id === sectionId ? style(section) : section) };
}

// Included in DetailPage's shared CSS, also used by review and offline exports.
export const skinStyles = `
.product-page .dp-section[data-skin]{background:#fff;text-align:center}
.product-page .dp-section[data-skin] h2{max-width:740px;margin-inline:auto;padding-inline:40px}
.product-page .dp-section[data-skin]>.dp-body{max-width:720px;padding-inline:40px;margin-inline:auto}
.product-page .dp-section[data-skin]>.dp-image{display:block;margin-inline:auto;margin-top:32px}
.product-page .dp-section[data-skin].dp-hero>.dp-image{margin-top:34px}
.product-page .dp-section[data-skin].dp-hero>.dp-body{margin-bottom:0}
.product-page .dp-section[data-skin] .dp-heading-emphasis{background:none}
.product-page .dp-section[data-skin]>.dp-kicker{display:table;margin:0 auto 22px;padding:5px 16px;border:0;border-radius:0;background:#fff}
.product-page .dp-section[data-skin] .dp-topline{margin-bottom:38px}
.product-page .dp-section[data-skin] .dp-hero-foot{margin-top:30px;background:#fff;border-top:1px solid #dfe7da;color:#426c4c}
.product-page .dp-section[data-skin] .dp-option{margin-inline:34px;border-color:#dfe7da;border-radius:8px;background:#fff}
.product-page .dp-section[data-skin] .dp-points{margin-top:30px}
.product-page .dp-section[data-skin] .dp-point{background:#fff;border:1px solid #dfe7da;min-height:0}
.product-page .dp-section[data-skin=orchard-note]>.dp-kicker{border-block:1px solid #79906e;padding:7px 24px;letter-spacing:2px}
.product-page .dp-section[data-skin=orchard-note] .dp-point{border:0;border-top:1px solid #b9c9af;border-radius:0}
.product-page .dp-section[data-skin=orchard-note] .dp-hero-foot{font-family:serif;letter-spacing:2px}
.product-page .dp-section[data-skin=modern-editorial]>.dp-kicker{margin-left:64px;padding-left:0;border-bottom:3px solid #426c4c}
.product-page .dp-section[data-skin=modern-editorial] h2{padding-inline:0;max-width:732px}
.product-page .dp-section[data-skin=modern-editorial]>.dp-body{padding-inline:0;max-width:732px}
.product-page .dp-section[data-skin=modern-editorial] .dp-point{border:0;border-left:3px solid #426c4c;border-radius:0;padding-left:24px}
.product-page .dp-section[data-skin=modern-editorial] .dp-option{border:0;border-block:1px solid #dfe7da;border-radius:0}
.product-page .dp-section[data-skin=fresh-label]>.dp-kicker{border:1px solid #426c4c;border-radius:5px;letter-spacing:1px}
.product-page .dp-section[data-skin=fresh-label] .dp-point{border-radius:12px;border-top:3px solid #426c4c}
.product-page .dp-section[data-skin=fresh-label] .dp-point b{display:table;background:#fff;border:1px solid #a3b798;border-radius:20px;padding:3px 10px;font-size:11px}
.product-page .dp-section[data-skin=point-card] h2{max-width:710px}
.product-page .dp-section[data-skin=point-card] .dp-point{border-radius:16px;box-shadow:0 5px 16px #344d2e06}
.product-page .dp-section[data-skin=point-card]>.dp-kicker{border-radius:5px;border-left:3px solid #426c4c;padding:5px 14px}
.product-page .dp-section[data-skin=point-card] .dp-option{border-radius:14px;padding:24px}
.product-page .dp-section[data-skin=wide-gallery]{display:flex;flex-direction:column;padding-inline:0}
.product-page .dp-section[data-skin=wide-gallery]>.dp-image{order:-1;margin-top:0;margin-bottom:44px}
.product-page .dp-section[data-skin=wide-gallery]>.dp-topline{order:-2;margin-top:22px;margin-bottom:22px}
.product-page .dp-section[data-skin=wide-gallery] h2{max-width:760px}
.product-page .dp-section[data-skin=wide-gallery]>.dp-body{margin-bottom:38px}
.product-page .dp-section[data-skin=wide-gallery] .dp-points{margin:16px 64px 50px}
.product-page .dp-section[data-skin=wide-gallery] .dp-point{border:0;border-top:1px solid #c1d0b8;border-radius:0}
.product-page .dp-section[data-skin=soft-classic]>.dp-kicker{border:1px solid #a8b89f;border-radius:30px;padding:7px 24px}
.product-page .dp-section[data-skin=soft-classic] .dp-point{border-radius:24px}
.product-page .dp-section[data-skin=soft-classic] .dp-option{border:0;border-bottom:1px solid #d4dece;border-radius:0}
`;
