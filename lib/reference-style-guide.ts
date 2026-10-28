import type { Section } from "./studio";

// Curated from the user's 01.jpg; reusable direction, not copied seller claims.
// Keep this concise: the original 16,034px image is not resent on each request.
export const fruitEditorialCopyGuide = "참고 스타일: 큰 제품컷과 여백 있는 짧은 설명을 교차 배치. 첫 화면은 한 가지 감각적 가치, 본문은 질문→확인된 특징→먹는 장면으로 전개. 메인은 12~28자 내외의 두 줄, 설명은 구체적인 근거를 담은 짧은 2줄. 핵심 구절은 마지막 줄에 배치하고 Check Point 같은 작은 배지로 단락을 구분. 같은 형용사·감탄사를 반복하지 말고 산지→외형→과육·식감→선별→활용→옵션 순으로 서로 다른 역할을 부여. 레퍼런스의 브랜드·문장·원산지·인증·후숙·세척법·배송 조건은 가져오지 않음. 추천 대상과 배송·교환 섹션은 만들지 않음.";
export const fruitEditorialPhotoGuide = "Editorial visual grammar: natural side light, warm neutral linen or stone, simple ceramic dishes, restrained wooden utensils and a few leaves. Alternate an abundant whole-fruit still life, tight surface/flesh macro, a plausible orchard scene, and a candid serving moment. Vary eye-level, close crop and overhead viewpoints; generous breathing room, realistic skin and moisture. Adapt fruit color/shape, props and preparation to the actual product references. Compose original photographs, never recreate the reference seller's exact arrangement or packaging. No baked-in text, badges or logos; headings are editable app text.";

export function applyFruitEditorialStyle(sections: Section[]): Section[] {
  const labels: Record<Section["kind"], string> = {hero:"FRUIDAM SELECT",story:"FRUIT STORY",detail:"Check Point",benefits:"Check Point",options:"Option & Size",faq:"Q & A",shipping:"INFO"};
  return sections.map(section => ({
    ...section,
    presentation: "fruit-editorial",
    kicker: section.kicker ?? labels[section.kind],
    format: {
      ...section.format,
      title: {font:"sans",weight:700,fontSize:section.kind==="hero"?64:46,lineHeight:1.3,color:"#20251f",...section.format?.title},
      body: {font:"sans",fontSize:19,lineHeight:1.6,color:"#62685f",...section.format?.body},
      background: section.format?.background || "#ffffff",
    },
  }));
}

// Exported with the page's existing CSS so HTML and PNG keep the same layout.
export const fruitEditorialStyles = `
.product-page .dp-section.fruit-editorial{background:#fff}
.product-page .fruit-editorial.dp-story,.product-page .fruit-editorial.dp-options{padding:78px 0 0}
.product-page .fruit-editorial.dp-benefits{padding:78px 65px}
.product-page .fruit-editorial h2{max-width:740px;margin-left:auto;margin-right:auto;padding-left:36px;padding-right:36px}
.product-page .fruit-editorial .dp-heading-line{display:block}
.product-page .fruit-editorial .dp-heading-emphasis{background:linear-gradient(transparent 68%,var(--light) 68%,var(--light) 96%,transparent 96%);box-decoration-break:clone;-webkit-box-decoration-break:clone;padding:0 .08em}
.product-page .fruit-editorial .dp-kicker{display:table;border:1px solid #475543;border-radius:30px;padding:4px 20px;margin:0 auto 28px;color:#475543;font-size:13px;letter-spacing:.5px;line-height:1.6}
.product-page .fruit-editorial.dp-hero .dp-kicker{border:0;padding:0;letter-spacing:2px}
.product-page .fruit-editorial .dp-body{padding:0 32px}
.product-page .fruit-editorial.dp-story .dp-image{height:520px;border-radius:0;margin-top:38px}
.product-page .fruit-editorial.dp-detail .dp-image{max-height:740px;margin-top:38px}
.product-page .fruit-editorial .dp-point{background:#fff;border-top:1px solid #dce5d8;border-radius:0;min-height:0;padding:24px 12px}
.product-page .fruit-editorial .dp-point p{font-size:20px}
.product-page .fruit-editorial .dp-option{margin-left:65px;margin-right:65px}
`;
