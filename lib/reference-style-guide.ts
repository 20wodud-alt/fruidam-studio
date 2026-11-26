import type { Section } from "./studio";

// Curated from the user's 01.jpg; reusable direction, not copied seller claims.
// Keep this concise: the original 16,034px image is not resent on each request.
export const fruitEditorialCopyGuide = "참고 스타일(쿠팡 고전환율 기준): 첫 화면은 한 가지 감각적 가치와 산지 신뢰, 본문은 고객 고민 공감→확인된 특징·선별 기준→먹는 장면→포장·배송 안내→옵션 가이드→보관법·Q&A 순으로 전개합니다. 메인은 12~26자 내외의 두 줄, 설명 본문은 총 90~160자(3~4줄)로 충분히 설득력 있게 작성하세요. 핵심 포인트(benefits) 섹션은 반드시 4개 항목(4줄)으로 작성해 제목의 '네 가지/4가지'와 개수를 일치시키세요. FAQ 섹션은 최소 4개 이상의 질문과 답변(Q. ...\\nA. ...)을 작성하세요. 마지막 섹션은 브랜드 스토리가 아니라 구매 결정·품질 약속 마무리로 작성하세요. 같은 형용사·감탄사를 반복하지 말고, 레퍼런스의 브랜드·미확인 당도·허위 인증은 가져오지 않습니다.";
export const fruitEditorialPhotoGuide = "Clean commercial Korean e-commerce photography (Coupang fresh-fruit style): bright high-key natural daylight, pure white or clean bright ivory background with zero messy clutter, crisp fresh fruit colors, subtle clean shadow. Alternate a bright studio whole-and-halved fruit hero shot, crisp clean macro of fresh flesh, bright airy kitchen/table serving shot, and clean orchard daylight shot. Realistic skin and freshness, never dark muddy wood or cluttered backgrounds. No baked-in text, badges or logos; headings are editable app text.";

export function applyFruitEditorialStyle(sections: Section[]): Section[] {
  const labels: Record<Section["kind"], string> = {hero:"FRUIDAM SELECT",story:"FRUIT STORY",detail:"Check Point",benefits:"Check Point",options:"Option & Size",faq:"Q & A",shipping:"INFO"};
  return sections.map((section,index) => ({
    ...section,
    presentation: "fruit-editorial",
    kicker: section.kicker ?? labels[section.kind],
    format: {
      ...section.format,
      title: {font:"sans",weight:700,fontSize:section.kind==="hero"?64:46,lineHeight:1.3,color:"#20251f",...section.format?.title},
      body: {font:"sans",fontSize:19,lineHeight:1.6,color:"#62685f",...section.format?.body},
      background: section.format?.background || "#ffffff",
      image: {width:section.kind==="detail"&&index%2?88:100,height:section.kind==="hero"?680:section.kind==="story"?480:600,fit:"cover",position:"center",...section.format?.image},
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
