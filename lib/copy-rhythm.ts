import type { Section } from "./studio";
export const twoLineCopyGuide = "카피 분량 및 구성(쿠팡 고전환율 기준): 모든 제목은 핵심 한 가지를 12~26자 안팎의 힘 있는 두 줄로 작성합니다. 일반 설명 본문(story, detail, shipping)은 너무 짧지 않게 총 90~160자(3~4줄)의 완결된 문장으로 충분히 설득력 있게 작성하여, 특징·선별 기준·먹는 순간의 가치까지 구체적으로 전달하세요. 핵심 포인트(benefits) 섹션은 반드시 4개 항목(4줄, 각 25~45자의 완결 문장)으로 작성해 제목의 '네 가지/4가지'와 개수를 정확히 일치시키세요. 옵션(options)은 입력된 옵션 수와 정보를 그대로 유지하고, FAQ는 최소 3개 이상의 질문과 2줄 이상의 친절한 답변으로 작성합니다. 가격·중량·수량·품종·원산지 등 확인된 정보는 생략하지 말고, 확인되지 않은 당도 수치나 허위 효능은 지어내지 마세요. 사용자가 별도 줄 수/항목 수를 명시한 요청은 그 지시를 우선합니다.";
export function tidyCopyLines(value:string) {
  return value.split(/\r?\n/).map(line=>line.replace(/[\t \u00a0]+/g," ").trim()).filter(Boolean).join("\n");
}
export function applyCopyRhythm(sections:Section[]):Section[] {
  return sections.map(section=>({...section,title:tidyCopyLines(section.title),body:tidyCopyLines(section.body),...(section.kicker===undefined?{}:{kicker:tidyCopyLines(section.kicker)}),reviewed:false,format:{...section.format,title:{...section.format?.title,lineHeight:1.25},body:{...section.format?.body,lineHeight:1.6,letterSpacing:0},kicker:{...section.format?.kicker,lineHeight:1.4,letterSpacing:.4}},elements:section.elements?.map(e=>["text","badge"].includes(e.type)?{...e,text:tidyCopyLines(e.text),format:{...e.format,lineHeight:e.type==="badge"?1.35:1.6,letterSpacing:0}}:e)}));
}
export const copyRhythmStyles=`
.product-page h2{text-wrap:balance;word-break:keep-all}
.product-page .dp-body,.product-page .dp-point p,.product-page .dp-extra{text-wrap:balance;word-break:keep-all;overflow-wrap:break-word}
.product-page .dp-body{line-height:1.6}
.product-page .dp-kicker{margin-bottom:20px}
.product-page .dp-detail>.dp-body{margin-top:0;margin-bottom:0}
.product-page .fruit-editorial .dp-kicker{margin-bottom:20px}
`;
