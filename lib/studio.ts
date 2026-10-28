import type { SkinId } from "./design-skins";
import { applyFruitEditorialStyle } from "./reference-style-guide";
import { fruitReferenceContext } from "./fruit-reference";
import type { FontId } from "./fonts";
import { writeLocalCopy } from "./copywriter";
export type SectionKind = "hero" | "story" | "benefits" | "detail" | "options" | "shipping" | "faq";
export type PhotoDirection = { mode: "original" | "mixed"; people: boolean; instructions: string };
export type DesignBrief = { coupangReferences?: string[]; photoDirection?: PhotoDirection; brief: string; briefFileName: string; reviews: string; reviewFileName: string; reviewImage: string; references: string[]; layout: "editorial" | "minimal" };
export const emptyDesignBrief: DesignBrief = { brief: "", briefFileName: "", reviews: "", reviewFileName: "", reviewImage: "", references: [], layout: "editorial" };
export type Product = {
  name: string; category: string; features: string;
  price: string; options: string; images: string[];
  theme: "orchard" | "lavender" | "charcoal" | "forest" | "rose" | "ocean"; length: "15" | "25";
  design?: DesignBrief;
};
export type TextFormat = { opacity?: number; zIndex?: number; strike?: boolean; superscript?: boolean; highlight?: string; strokeWidth?: number; strokeColor?: string; shadow?: boolean; shadowX?: number; shadowY?: number; shadowBlur?: number; shadowColor?: string; curve?: number; listStyle?: "none" | "bullet" | "number"; widthPx?:number; fontSize?: number; font?: FontId; weight?: number; italic?: boolean; underline?: boolean; align?: "left" | "center" | "right"; color?: string; lineHeight?: number; letterSpacing?: number; hidden?: boolean; offsetX?: number; offsetY?: number; rotation?: number; locked?: boolean; groupId?: string };
export type PhotoFormat = { widthPx?:number; height?: number; width?: number; radius?: number; fit?: "cover" | "contain"; position?: "top" | "center" | "bottom"; brightness?: number; contrast?: number; saturation?: number; opacity?: number; flipY?: boolean; grayscale?: boolean; zIndex?: number; flip?: boolean; hidden?: boolean; offsetX?: number; offsetY?: number; rotation?: number; locked?: boolean; groupId?: string };
export type SectionFormat = { skin?: SkinId; minHeight?:number; title?: TextFormat; body?: TextFormat; kicker?: TextFormat; image?: PhotoFormat; background?: string; padding?: number };
export type DesignElement = { id: string; type: "text" | "badge" | "divider" | "image"; text: string; format?: TextFormat; background?: string; shape?: "pill" | "circle" | "box"; image?: string; photoFormat?: PhotoFormat; absolute?: boolean; x?: number; y?: number; widthPx?: number };
export type GeneratedImage = {source:"ai";scene:"farm"|"harvest"|"sorting"|"lifestyle"|"detail";model:string;createdAt:string;originalImage:string};
export type Section = { canvasMode?:"blank"|"photo"; presentation?: "fruit-editorial"; imageDirection?: string; imageMeta?: GeneratedImage; id: string; kind: SectionKind; title: string; body: string; image: string; visible: boolean; reviewed?: boolean; kicker?: string; format?: SectionFormat; elements?: DesignElement[] };
export type CopyReport = { mode: "local" | "openai" | "gemini"; searchEntryPoint?: string; summary: string; reviewInsights: string[]; sources: { title: string; url: string }[]; generatedAt: string };
export type StudioProject = { id: string; product: Product; sections: Section[]; starred: boolean; createdAt: string; updatedAt: string; copyReport?: CopyReport; copyAudit?: import("./copy-audit").CopyAudit };
export const sectionNames: Record<SectionKind, string> = { hero: "히어로", story: "브랜드 스토리", benefits: "핵심 포인트", detail: "상품 디테일", options: "옵션 안내", shipping: "배송 안내", faq: "자주 묻는 질문" };
export const themes = { orchard: { name: "내추럴 오렌지", accent: "#a35d35", light: "#f5eee5" }, lavender: { name: "소프트 라벤더", accent: "#74608d", light: "#eeeaf5" }, charcoal: { name: "모던 차콜", accent: "#333936", light: "#eceeea" }, forest: {name:"프레시 그린",accent:"#426c4c",light:"#eff5ef"}, rose: {name:"로지 핑크",accent:"#b55468",light:"#fbf0f3"}, ocean: {name:"클리어 블루",accent:"#397c9b",light:"#eef6fa"} };
export const emptyProduct: Product = { name: "", category: "식품 · 농수산물", features: "", price: "", options: "", images: [], theme: "orchard", length: "15" };
export const demoProduct: Product = { name: "제주 햇살 한라봉", category: "식품 · 농수산물", features: "제주에서 자란 제철 한라봉\n손으로 하나씩 살펴 선별한 과일\n산뜻한 향과 풍부한 과즙\n선물하기 좋은 정성스러운 포장", price: "29,800원", options: "가정용 3kg\n선물용 5kg", images: ["/sample-product.svg", "/sample-detail.svg"], theme: "orchard", length: "15" };

export function normalizeSectionLength(value: unknown): Product["length"] { return value === "25" ? "25" : "15"; }

export function generateSections(product: Product): Section[] {
  const lines = product.features.split(/\n/).map(t => t.replace(/^\s*[-•\d.)]+\s*/, "").trim()).filter(Boolean);
  const photo = (index: number) => product.images.length ? product.images[index % product.images.length] : "";
  const feature = (index: number) => lines[index] || "이 부분에 소개할 상품의 특징을 추가해주세요.";
  const specs: Omit<Section, "id" | "visible">[] = [
    { kind: "hero", title: product.name, body: lines[0] || "당신의 일상에 새로운 즐거움을 더하세요.", image: product.images[0] || "" },
    { kind: "story", title: "좋은 선택의 시작", body: `${product.name}에 담긴 이야기를 만나보세요.\n${feature(0)}`, image: photo(1) },
    { kind: "benefits", title: "이런 점이 특별해요", body: lines.join("\n") || "상품의 특별한 장점을 입력해주세요.", image: "" },
    { kind: "detail", title: "포인트 01 · 처음 만나는 매력", body: feature(0), image: photo(0) },
    { kind: "detail", title: "포인트 02 · 선택을 만드는 디테일", body: feature(1), image: photo(1) },
    { kind: "detail", title: "포인트 03 · 더 알아보고 싶은 이유", body: feature(2), image: photo(2) },
    { kind: "detail", title: "포인트 04 · 마지막까지 살펴보세요", body: feature(3), image: photo(3) },
    { kind: "story", title: "사진으로 만나는 상품 이야기", body: `${product.name}의 모습과 구성을 사진으로 확인해보세요.`, image: photo(1) },
    { kind: "detail", title: "가까이에서 보는 상품", body: "사진에서 실제 상품의 형태와 세부 모습을 살펴보세요.", image: photo(2) },
    { kind: "benefits", title: "선택 전, 한 번 더 확인하세요", body: lines.slice(0, 4).join("\n") || "확인할 상품 정보를 추가해주세요.", image: "" },
    { kind: "options", title: "나에게 맞는 구성을 골라보세요", body: product.options || "기본 구성\n상세 옵션은 판매자에게 문의해주세요.", image: "" },
    { kind: "detail", title: "구성품을 살펴보세요", body: product.options || "구성품과 수량을 확인할 수 있도록 내용을 추가해주세요.", image: photo(0) },
    { kind: "story", title: "상품을 더 잘 알아가는 방법", body: "상품의 사용 방법이나 보관 시 알아둘 내용을 추가해주세요.", image: "" },
    { kind: "faq", title: "구매 전, 궁금한 점이 있나요?", body: "Q. 옵션은 어디서 선택하나요?\n구매 페이지에서 원하는 옵션을 선택해주세요.\n\nQ. 상품에 대해 더 궁금한 점이 있어요.\n구매하신 판매처의 고객센터로 문의해주세요.", image: "" },
    { kind: "story", title: "일상에 더하는 좋은 선택", body: `${product.name}\n${lines[0] || "상품을 소개할 마무리 문구를 추가해주세요."}`, image: photo(0) },
  ];
  if (product.length === "25") {
    const extra: Omit<Section, "id" | "visible">[] = [
      { kind: "story", title: "상품을 만든 이야기", body: "브랜드의 시작과 상품을 소개하게 된 배경을 추가해주세요.", image: photo(1) },
      { kind: "detail", title: "소재와 원재료를 살펴보세요", body: "소재·원재료·성분 등 확인된 상품 정보를 추가해주세요.", image: photo(2) },
      { kind: "detail", title: "크기와 형태를 한눈에", body: "실제 크기·용량·중량 등 구매에 필요한 정보를 추가해주세요.", image: photo(0) },
      { kind: "story", title: "이렇게 활용해보세요", body: "상품에 맞는 실제 활용 방법이나 사용 장면을 추가해주세요.", image: photo(1) },
      { kind: "detail", title: "나만의 방식으로 즐기는 시간", body: "사용 순서나 함께 활용할 수 있는 아이디어를 추가해주세요.", image: photo(2) },
      { kind: "detail", title: "사진 속 디테일을 확인하세요", body: "상품 사진에 보이는 특징을 구체적으로 설명해주세요.", image: photo(3) },
      { kind: "options", title: "옵션별 구성을 비교해보세요", body: product.options || "선택 가능한 옵션별 차이를 추가해주세요.", image: "" },
      { kind: "story", title: "사용 전 알아두면 좋은 점", body: "상품에 필요한 사용 조건이나 주의사항을 추가해주세요.", image: "" },
      { kind: "faq", title: "자주 궁금해하는 상품 정보", body: "Q. 상품에 대해 더 자세히 알고 싶어요.\n상품별로 자주 받는 질문과 확인된 답변을 추가해주세요.", image: "" },
      { kind: "benefits", title: "기억하고 싶은 상품의 매력", body: lines.join("\n") || "고객에게 전하고 싶은 상품의 매력을 추가해주세요.", image: "" },
    ];
    specs.splice(10, 0, ...extra);
  }
  const localSections = writeLocalCopy(product, specs.map(s => ({ ...s, id: crypto.randomUUID(), visible: true, reviewed: false })));
  const completed = fruitReferenceContext(product) ? applyFruitEditorialStyle(localSections) : localSections;
  const headline = product.design?.brief.match(/^(?:메인\s*문구|헤드라인)\s*[:：]\s*(.+)$/m)?.[1]?.trim();
  const subline = product.design?.brief.match(/^(?:서브\s*문구|서브\s*카피)\s*[:：]\s*(.+)$/m)?.[1]?.trim();
  if (headline) completed[0].title = headline.slice(0, 150);
  if (subline) completed[0].body = subline;
  return completed;
}
