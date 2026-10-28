import type { Section } from "./studio";
export const twoLineCopyGuide = "카피 줄 구성: 모든 제목은 핵심 한 가지를 12~28자 안팎의 짧은 두 줄로, 일반 설명 본문은 총 40~60자 안팎의 두 줄로 작성합니다. 본문은 한 줄 20~30자 안팎의 완결된 설명으로 쓰고 문장 중간에 불필요한 빈 줄을 넣지 않습니다. 짧은 배지·서브 카피는 한 줄로 간결하게 유지합니다. 포인트·옵션은 항목 수와 옵션 정보를 유지하고 각 항목의 설명만 짧게 두 줄 이내로 씁니다. FAQ는 모든 질문을 유지하며 문항별 질문 한 줄+답변 한 줄을 기본으로 합니다. 가격·중량·수량·품종·원산지 등 확인된 정보와 필요한 조건은 생략하거나 바꾸지 마세요. 길면 추상적 수식어와 반복 표현을 덜어내고 내용이 모자라면 정보를 만들어 채우지 마세요. 문단 사이 빈 줄·반복 공백·억지 띄어쓰기를 금지합니다. 사용자가 별도 줄 수/항목 수를 명시한 요청은 그 지시를 우선합니다.";
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
