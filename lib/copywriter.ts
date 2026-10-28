import {applyCopyRhythm} from "./copy-rhythm";
import type { Product, Section } from "./studio";
export const researchReferences = [
  { title: "쿠팡 한라봉 공개 상품 정보", url: "https://www.coupang.com/np/search?q=%ED%95%9C%EB%9D%BC%EB%B4%89" },
  { title: "쿠팡 나주 배 상품 정보", url: "https://www.coupang.com/vp/products/6209270439" },
];
export function reviewInsights(reviews = "") {
  const rules = [ ["맛·향", /맛|달|새콤|시다|향|당도/], ["크기·중량", /크기|작|크다|중량|무게|양이/], ["포장·상태", /포장|박스|상처|무르|상태|멍/], ["옵션·구성", /구성|옵션|수량|개수|선물/], ["활용·보관", /보관|사용|활용|먹기/]] as const;
  return rules.filter(([, regex]) => regex.test(reviews)).map(([name]) => name);
}
export function writeLocalCopy(product: Product, sections: Section[]): Section[] {
  const features = product.features.split("\n").map(s => s.replace(/^\s*[-•\d.)]+\s*/, "").trim()).filter(Boolean);
  const name = product.name;
  const feature = (i: number) => features[i % Math.max(1, features.length)] || `${name}의 특징을 사진과 함께 꼼꼼하게 살펴보세요.`;
  const food = /식품|농수산|과일|한라봉|사과|배|귤/.test(`${product.category} ${name}`);
  const options = product.options.split("\n").filter(Boolean);
  const insights = reviewInsights(product.design?.reviews);
  const reviewFAQ = insights.includes("크기·중량") ? "Q. 크기와 구성을 어떻게 고르면 좋을까요?\n필요한 수량과 용도를 먼저 생각하고, 옵션에 안내된 중량·구성을 비교해보세요." : insights.includes("포장·상태") ? "Q. 받아볼 상품의 상태가 궁금해요.\n상세 사진과 실제 리뷰를 함께 확인하고, 상품을 받으면 상태부터 꼼꼼하게 살펴보세요." : "Q. 어떤 옵션을 선택하면 좋을까요?\n필요한 수량과 사용 목적에 맞춰 구성을 비교해보세요.";
  let detailIndex = 0, storyIndex = 0, benefitIndex = 0;
  const details = ["첫인상을 만드는\n분명한 차이", "작은 디테일에서\n선택의 이유를 찾으세요", "가까이 볼수록\n더 또렷해지는 매력", "마지막까지 살펴보는\n나만의 선택 기준", "사진으로 먼저 만나는\n상품의 표정", "필요한 만큼,\n알맞은 구성을 골라보세요", "일상에 자연스럽게\n어울리는 한 가지", "나에게 맞는 선택은\n자세히 볼수록 쉬워집니다"];
  const stories = ["좋은 선택에는\n분명한 이유가 있습니다", "일상의 한 장면에\n자연스럽게 더해보세요", "부담 없이 시작하는\n나만의 좋은 선택", "상품을 이해하는 시간,\n선택이 더 선명해집니다", "고르는 순간부터\n쓰는 순간까지 생각하세요"];
  return applyCopyRhythm(sections.map((section, i) => {
    let title = section.title, body = section.body;
    if (section.kind === "hero") { title = name; body = food ? `평범한 식탁에도, 마음을 전하는 자리에도.\n${feature(0)}` : `매일의 선택에 좋은 이유를 더하세요.\n${feature(0)}`; }
    else if (section.kind === "detail") { title = details[detailIndex % details.length]; body = `${feature(detailIndex)}\n${detailIndex % 2 ? "상품의 세부 모습은 사진으로, 구성은 옵션으로 확인해보세요." : "나에게 중요한 기준과 잘 맞는지, 천천히 살펴보세요."}`; detailIndex++; }
    else if (section.kind === "story") { title = stories[storyIndex % stories.length]; body = `${feature(storyIndex)}\n${food ? "매일 즐기는 자리부터 소중한 순간까지, 취향에 맞는 구성을 선택하세요." : "가까이 두는 상품인 만큼, 나만의 기준으로 꼼꼼하게 선택하세요."}`; storyIndex++; }
    else if (section.kind === "benefits") { title = benefitIndex++ ? "선택하기 전,\n이 포인트를 기억하세요" : "복잡한 설명 대신,\n핵심만 또렷하게"; body = features.length ? features.join("\n") : `${name}의 사진과 구성을 확인하세요.\n사용 목적에 맞는 옵션을 선택하세요.\n실제 사용자의 리뷰도 함께 살펴보세요.`; }
    else if (section.kind === "options") { title = "나에게 필요한 만큼,\n딱 맞는 구성으로"; body = options.length ? options.join("\n") : `${name} 기본 구성\n주문 페이지에서 선택 가능한 옵션을 확인하세요.`; }
    else if (section.kind === "faq") { title = insights.length ? "리뷰에서 궁금했던 점,\n선택 전에 확인하세요" : "궁금한 점까지 확인하면\n선택은 더 쉬워집니다"; body = `${reviewFAQ}\n\nQ. 상품에 대해 더 알고 싶어요.\n상품 사진·주요 특징·옵션을 확인하고, 더 궁금한 점은 판매처에 문의해주세요.`; }
    if (sections.length > 1 && i === sections.length - 1) { title = food ? "오늘의 식탁에,\n좋은 선택 하나" : "나의 일상에,\n좋은 선택 하나"; body = `${feature(0)}\n지금 필요한 구성을 선택해보세요.`; }
    if (i === 0 && section.kind === "hero") {
      title = product.design?.brief?.match(/^(?:메인\s*문구|헤드라인)\s*[:：]\s*(.+)$/m)?.[1]?.trim() || title;
      body = product.design?.brief?.match(/^(?:서브\s*문구|서브\s*카피)\s*[:：]\s*(.+)$/m)?.[1]?.trim() || body;
    }
    return { ...section, title: title.slice(0, 150), body: body.slice(0, 5000) };
  }));
}
