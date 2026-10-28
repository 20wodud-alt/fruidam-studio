import type { Product, Section } from "./studio";

// Only exact copy-button requests qualify. Free-form editing keeps every tool
// available, including compound requests that change both copy and appearance.
export const fullCopyRequest = "전체 상세페이지 문구를 상품 정보와 리뷰를 반영해서 전문적으로 다시 작성해줘";
export const hookCopyRequest = "선택 후킹: 선택한 글 박스의 원문만 상품 정보에 맞는 후킹 멘트로 다시 작성해줘. 다른 글 박스나 페이지는 수정하지 마.";
export function needsEditorTools(request: string, hasEditorContext: boolean) {
  return hasEditorContext && request !== fullCopyRequest && request !== hookCopyRequest;
}

export function copyRequestContext(product: Product, sections: Section[], request: string, editorTools: boolean) {
  return {
    request,
    product: {
      name: product.name, category: product.category, features: product.features,
      price: product.price, options: product.options,
      ...(editorTools?{theme:product.theme,layout:product.design?.layout || "editorial",photoDirection:product.design?.photoDirection}:{}),
      brief: product.design?.brief || undefined,
      reviews: product.design?.reviews || undefined,
    },
    sections: sections.map(s => ({
      id: s.id, kind: s.kind, title: s.title, body: s.body, kicker: s.kicker || "",
      // Copy-only requests do not need coordinates, fonts or image styles.
      ...(editorTools ? { format: s.format, elements: s.elements } : {}),
    })),
  };
}
