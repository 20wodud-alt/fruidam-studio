import { emptyDesignBrief, normalizeSectionLength, themes, type DesignBrief, type Product } from "./studio";
import { normalizeCoupangReferences } from "./fruit-reference";
export function image(value: unknown): string {
  if (typeof value !== "string" || !(/^\/api\/uploads\/[a-f0-9-]+\.webp$/.test(value) || ["/sample-product.svg", "/sample-detail.svg", ""].includes(value))) throw new Error("올바른 상품 이미지를 선택해주세요.");
  return value;
}
export function text(value: unknown, limit: number) { if (typeof value !== "string" || value.length > limit) throw new Error("입력 내용이 올바르지 않거나 너무 길어요."); return value.trim(); }
function design(value: unknown): DesignBrief {
  if (value === undefined) return { ...emptyDesignBrief, references: [] };
  if (!value || typeof value !== "object") throw new Error("디자인 기획안을 확인해주세요.");
  const info = value as Record<string, unknown>;
  if (!Array.isArray(info.references) || info.references.length > 10 || !["editorial", "minimal"].includes(String(info.layout))) throw new Error("레퍼런스 또는 디자인 구성을 확인해주세요.");
  let photoDirection: DesignBrief["photoDirection"];
  if(info.photoDirection!==undefined){const p=info.photoDirection as Record<string,unknown>;if(!p || !["original","mixed"].includes(String(p.mode)) || typeof p.people!=="boolean")throw new Error("사진 연출 설정을 확인해주세요.");photoDirection={mode:p.mode as "original"|"mixed",people:p.people,instructions:text(p.instructions,2000)};}
  return { coupangReferences: normalizeCoupangReferences(info.coupangReferences), photoDirection, brief: text(info.brief, 3000), briefFileName: text(info.briefFileName, 200), reviews: text(info.reviews, 12000), reviewFileName: text(info.reviewFileName, 200), reviewImage: image(info.reviewImage), references: info.references.map(image), layout: info.layout as DesignBrief["layout"] };
}
export function product(value: Record<string, unknown>): Product {
  if (!value || typeof value !== "object") throw new Error("상품 정보를 입력해주세요.");
  const name = text(value.name, 100);
  if (!name) throw new Error("상품명을 입력해주세요.");
  if (!Array.isArray(value.images) || value.images.length > 10) throw new Error("사진은 최대 10장까지 사용할 수 있어요.");
  if (!Object.hasOwn(themes, String(value.theme)) || !["15", "25", "short", "standard"].includes(String(value.length))) throw new Error("디자인과 길이를 선택해주세요.");
  return { name, category: text(value.category, 100), features: text(value.features, 3000), price: text(value.price, 100), options: text(value.options, 2000), images: value.images.map(image), theme: value.theme as Product["theme"], length: normalizeSectionLength(value.length), design: design(value.design) };
}
