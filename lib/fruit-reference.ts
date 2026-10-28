import { fruitEditorialCopyGuide } from "./reference-style-guide";
import { koreanFarmerCopyDirection } from "./korean-farm-direction";
import type { Product } from "./studio";

export const shinanoReferences = [
  "https://www.coupang.com/vp/products/9768778041?itemId=29307267751&vendorItemId=96220793205",
  "https://www.coupang.com/vp/products/9787207899?itemId=29303472513&vendorItemId=96218960471",
];

export function normalizeCoupangReferences(value: unknown): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 3) throw new Error("쿠팡 참고 링크는 최대 3개까지 입력해주세요.");
  return Array.from(new Set(value.filter(v => v !== "").map(v => {
    if (typeof v !== "string" || v.length > 2000) throw new Error("쿠팡 상품 링크를 확인해주세요.");
    let url: URL;
    try { url = new URL(v.trim()); } catch { throw new Error("쿠팡 상품 링크를 확인해주세요."); }
    if (url.protocol !== "https:" || !["www.coupang.com", "coupang.com"].includes(url.hostname) || url.port || url.username || url.password || !/^\/vp\/products\/\d+\/?$/.test(url.pathname)) throw new Error("https://www.coupang.com/vp/products/ 형태의 상품 링크를 입력해주세요.");
    const clean = new URL(`https://www.coupang.com${url.pathname.replace(/\/$/, "")}`);
    for (const key of ["itemId", "vendorItemId"]) {
      const id = url.searchParams.get(key);
      if (id && /^\d+$/.test(id)) clean.searchParams.set(key, id);
    }
    return clean.toString();
  })));
}

// Creative questions to investigate, never product facts or claimed sales ranks.
const profiles: [RegExp, string, string][] = [
  [/사과|시나노|apple/i, "사과", "품종·식감·산미·껍질 상태·크기 편차; 통과일, 얇은 슬라이스, 절단면 접사"],
  [/한라봉|천혜향|레드향|황금향|귤|오렌지|감귤|자몽|레몬|라임|유자|금귤|시트러스/i, "감귤류", "품종·산미·껍질·과즙·손질; 잎 달린 과일, 껍질 벗기는 손, 과육 접사"],
  [/샤인머스캣|포도|거봉|머루|grape/i, "포도", "품종·씨 유무·껍질·알 크기·송이 상태; 송이 전경, 알 접사, 작은 접시에 나눈 장면"],
  [/복숭아|천도|자두|살구|앵두|체리|cherry|peach/i, "핵과류", "품종·숙도·무름·식감 차이; 표면 접사, 반으로 가른 과육, 손에 든 크기 비교"],
  [/딸기|블루베리|라즈베리|블랙베리|오디|산딸기|berry/i, "베리류", "알 크기·눌림·선도·손질; 바구니, 낱알 매크로, 식탁에서 즐기는 장면"],
  [/수박|멜론|참외|melon/i, "박과 과일", "크기·숙도·과육·손질; 통과일, 단면, 한입 크기 플레이팅"],
  [/망고|파인애플|파파야|용과|패션후르츠|두리안|리치|람부탄|구아바/i, "열대 과일", "품종·숙도·손질·향·과육; 통과일과 손질 전후, 과육 접사"],
  [/키위|바나나|아보카도|무화과|석류|단감|대봉|곶감|홍시|연시|감(?=\s|$)|대추|매실/i, "숙도와 손질이 중요한 과일", "품종별 숙도·식감·손질·먹는 시점; 원물, 단면, 자연스러운 일상 컷"],
  [/배|pear/i, "배", "품종·식감·과즙·크기 편차; 표면 질감, 잘라 놓은 과육, 담백한 식탁 컷"],
];
export function fruitReferenceContext(product: Product) {
  const profile = profiles.find(([pattern]) => pattern.test(product.name));
  if (!profile && !/과일|fruit/i.test(product.category)) return undefined;
  const references = normalizeCoupangReferences(product.design?.coupangReferences);
  const urls = references.length ? references : /시나[노나]\s*골드/i.test(product.name) ? shinanoReferences : [];
  return {
    fruit: profile?.[1] || product.name,
    investigate: profile?.[2] || "정확한 품종·숙도·선도·과육·손질·옵션 차이; 원물, 디테일, 일상 활용 컷",
    referenceUrls: urls,
    query: `site:coupang.com ${product.name} 판매량순 상세페이지 리뷰`,
    rankingRule: "판매량순이 명시된 실제 목록과 확인 시점이 없으면 판매량 순위 미확인. 검색 노출 순서·광고·리뷰 수를 판매량으로 간주하지 않음.",
  };
}

export function fruitCopyInstructions(fruit: ReturnType<typeof fruitReferenceContext>, useSearch: boolean, planPhotos: boolean) {
  if (!fruit) return "";
  return `${fruitEditorialCopyGuide}
과일별 참고 전략: ${JSON.stringify(fruit)}. 조사할 질문과 연출 아이디어이며 상품의 확인된 특징이 아닙니다.
${useSearch ? "같은 과일·같은 품종의 쿠팡 판매량순 공개 목록과 상품 페이지를 우선 조사하세요. 참고 링크는 검색 대상으로만 취급하며 접근하지 못한 페이지·이미지를 읽었다고 말하지 마세요. 전 과일을 검색하지 말고 이 상품에 가까운 최대 3개 페이지만 비교하세요. 노출 순서나 링크 쿼리의 rank는 판매량 순위가 아닙니다. 확인할 수 없으면 summary에 판매량 순위 미확인이라고 쓰세요. 실제로 읽은 페이지에서 후킹 방식, 정보 순서, 사진 역할, 리뷰의 구매 불안을 요약해 새 카피로 재구성하세요. 접근 차단 시 반복 조회나 우회 없이 제공 자료를 사용하세요." : "외부 검색 없이 제공 상품 자료만 쓰세요. 참고 링크를 읽었다고 표현하지 마세요."}
품종마다 핵심 질문을 달리하되 사실은 제공 자료로 확인하세요. 첫 화면의 한 가지 후킹→핵심 가치→산지 이야기→식감·과육 디테일→선별→활용 장면→옵션·FAQ 등으로 각 섹션의 역할을 구분하고 같은 장점·제목을 반복하지 마세요. 메인은 짧고 선명하게, 서브는 근거를 뒷받침하는 2~3줄로 쓰세요. 당도 수치나 무농약·산지 직송 등은 제공 자료가 없으면 쓰지 마세요. 경쟁 사진·문구·모델·브랜드를 복제하지 마세요.
${planPhotos ? koreanFarmerCopyDirection + " 각 섹션에 imageDirection을 80~180자 정도(최대 400자)로 적으세요. 내용과 맞는 장면·구도·빛·소품을 제안하고 전체가 같은 사진이 되지 않도록 원물 전경·산지·수확·선별·과육 접사·식탁·자연스러운 가상 성인 모델컷의 역할을 나누세요. 사람 허용 여부와 별도 사진 연출 지시를 우선하세요. 실제 확인하지 못한 경쟁 이미지의 시각적 특징을 관찰한 것처럼 쓰지 마세요. 이미지는 새로 연출하며 타사 사진의 복제 지시를 하지 마세요. 사진이 필요 없는 섹션은 빈 문자열로 쓰세요." : ""}`;
}
