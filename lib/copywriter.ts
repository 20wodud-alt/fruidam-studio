import {applyCopyRhythm} from "./copy-rhythm";
import type { Product, Section } from "./studio";
import { fruitReferenceContext } from "./fruit-reference";
import { writeFruitCopy } from "./fruit-composition";
export const researchReferences = [
  { title: "쿠팡 한라봉 공개 상품 정보", url: "https://www.coupang.com/np/search?q=%ED%95%9C%EB%9D%BC%EB%B4%89" },
  { title: "쿠팡 나주 배 상품 정보", url: "https://www.coupang.com/vp/products/6209270439" },
];
export function reviewInsights(reviews = "") {
  const rules = [ ["맛·향", /맛|달|새콤|시다|향|당도/], ["크기·중량", /크기|작|크다|중량|무게|양이/], ["포장·상태", /포장|박스|상처|무르|상태|멍/], ["옵션·구성", /구성|옵션|수량|개수|선물/], ["활용·보관", /보관|사용|활용|먹기/]] as const;
  return rules.filter(([, regex]) => regex.test(reviews)).map(([name]) => name);
}
function formatOptionGuide(opt: string): string {
  if (/선물/.test(opt)) return `${opt} — 감사한 분께 전하기 좋은 정돈된 구성`;
  if (/가정|실속|못난이|알뜰/.test(opt)) return `${opt} — 매일 넉넉하게 꺼내 먹기 좋은 실속 구성`;
  if (/10kg|대용량/.test(opt)) return `${opt} — 온 가족·나눔용으로 오래 두고 즐기는 넉넉한 양`;
  if (/5kg/.test(opt)) return `${opt} — 2~4인 가구가 일주일 내외로 즐기기 좋은 표준 구성`;
  if (/2kg|3kg/.test(opt)) return `${opt} — 1~2인 가구 또는 첫 구매로 부담 없는 구성`;
  return `${opt} — 필요량과 용도에 맞춰 선택`;
}
export function writeLocalCopy(product: Product, sections: Section[]): Section[] {
  if(fruitReferenceContext(product))return applyCopyRhythm(writeFruitCopy(product,sections));
  const features = product.features.split("\n").map(s => s.replace(/^\s*[-•\d.)]+\s*/, "").trim()).filter(Boolean);
  const name = product.name;
  const feature = (i: number) => features[i % Math.max(1, features.length)] || `${name}의 특징을 사진과 함께 꼼꼼하게 살펴보세요.`;
  const food = /식품|농수산|과일|한라봉|사과|배|귤/.test(`${product.category} ${name}`);
  const options = product.options.split("\n").filter(Boolean);
  const insights = reviewInsights(product.design?.reviews);
  const reviewFAQ = insights.includes("크기·중량") ? "Q. 크기와 구성을 어떻게 고르면 좋을까요?\n필요한 수량과 용도를 먼저 생각하고, 옵션에 안내된 중량·구성을 비교해보세요." : insights.includes("포장·상태") ? "Q. 받아볼 상품의 상태가 궁금해요.\n상세 사진과 실제 리뷰를 함께 확인하고, 상품을 받으면 상태부터 꼼꼼하게 살펴보세요." : "Q. 어떤 옵션을 선택하면 좋을까요?\n필요한 수량과 사용 목적에 맞춰 구성을 비교해보세요.";
  let detailIndex = 0, storyIndex = 0, benefitIndex = 0;
  const details = ["입안 가득 퍼지는\n기분 좋은 풍미", "하나씩 살펴 고른\n까다로운 선별 기준", "우리 집 식탁부터\n마음 전할 자리까지", "가까이 볼수록\n또렷한 원물의 상태", "받아보실 구성과\n중량을 확인하세요", "필요한 만큼,\n알맞은 구성을 골라보세요"];
  const stories = ["매번 실패하던 과일,\n이제 기준을 바꾸세요", "매일 꺼내 먹기 좋은\n부담 없는 과일 시간", "마지막 한 개까지\n신선하게 즐기는 법", "고르는 순간부터\n먹는 순간까지 생각하세요"];
  return applyCopyRhythm(sections.map((section, i) => {
    let title = section.title, body = section.body;
    if (section.kind === "hero") { title = name; body = food ? `망설임 없이 고르는 산지의 정성,\n${feature(0)}` : `기준이 분명한 선택,\n${feature(0)}`; }
    else if (section.kind === "detail") { title = details[detailIndex % details.length]; body = `${feature(detailIndex)}\n${detailIndex % 2 ? "상품의 세부 모습은 사진으로, 구성은 옵션으로 확인해보세요." : "나에게 중요한 기준과 잘 맞는지, 천천히 살펴보세요."}`; detailIndex++; }
    else if (section.kind === "story") { title = stories[storyIndex % stories.length]; body = `${feature(storyIndex)}\n${food ? "매일 즐기는 자리부터 소중한 순간까지, 취향에 맞는 구성을 선택하세요." : "가까이 두는 상품인 만큼, 나만의 기준으로 꼼꼼하게 선택하세요."}`; storyIndex++; }
    else if (section.kind === "shipping") { title = "상처 없이 도착하도록,\n포장부터 꼼꼼하게"; body = food ? "신선식품은 이동 중 충격 관리가 핵심입니다.\n완충재를 더해 안전하게 발송하며, 수령 직후 상태 확인을 권장합니다." : "파손과 오염을 줄이는 안전 포장으로 출고됩니다.\n수령 후 구성품과 상태를 먼저 확인해주세요."; }
    else if (section.kind === "benefits") {
      title = benefitIndex++ ? "장바구니 담기 전,\n핵심 4가지를 확인하세요" : "망설임 없이 고르는\n네 가지 매력 포인트";
      const fallbackPts = [`${name}의 사진과 구성을 꼼꼼히 확인하세요.`, "사용 목적과 인원에 맞는 옵션을 선택하세요.", "꼼꼼한 선별과 완충 포장으로 안전하게 준비합니다.", "실제 구매 후기와 보관 안내도 함께 살펴보세요."];
      body = Array.from({ length: 4 }, (_, idx) => features[idx] || fallbackPts[idx]).join("\n");
    }
    else if (section.kind === "options") { title = "필요한 만큼만,\n후회 없는 옵션 선택"; body = options.length ? options.map(formatOptionGuide).join("\n") : `${name} 기본 구성\n주문 페이지에서 선택 가능한 옵션을 확인하세요.`; }
    else if (section.kind === "faq") {
      title = insights.length ? "리뷰에서 궁금했던 점,\n선택 전에 확인하세요" : "구매 전 자주 묻는 질문,\n한눈에 확인하세요";
      body = `${reviewFAQ}\n\nQ. 크기나 외관에 개체 차이가 있을 수 있나요?\nA. 농산물은 생물 특성상 개당 크기와 모양에 약간의 차이가 있을 수 있습니다.\n\nQ. 수령 후 보관은 어떻게 해야 하나요?\nA. 수령 즉시 상태를 확인하시고, 서늘한 곳 또는 냉장 보관으로 신선도를 지켜주세요.\n\nQ. 배송 중 파손이나 이상이 있을 때는 어떻게 하나요?\nA. 수령 직후 상품 상태를 사진으로 남겨 판매처 고객센터로 문의해주세요.`;
    }
    if (sections.length > 1 && i === sections.length - 1) { title = food ? "산지에서 식탁까지,\n안심하고 고르세요" : "고민을 줄여주는\n가장 깔끔한 선택"; body = `${feature(0)}\n${product.price ? `${product.price}부터, ` : ""}선별과 포장을 꼼꼼히 확인하고 지금 필요한 구성을 골라보세요.`; }
    if (i === 0 && section.kind === "hero") {
      title = product.design?.brief?.match(/^(?:메인\s*문구|헤드라인)\s*[:：]\s*(.+)$/m)?.[1]?.trim() || title;
      body = product.design?.brief?.match(/^(?:서브\s*문구|서브\s*카피)\s*[:：]\s*(.+)$/m)?.[1]?.trim() || body;
    }
    return { ...section, title: title.slice(0, 150), body: body.slice(0, 5000) };
  }));
}
