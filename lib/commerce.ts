export type Role = "seller" | "supplier" | "admin";
export type PlanId = "single" | "basic" | "season" | "team";
export const plans = [
  { id: "single" as const, name: "건별 결제", price: 9900, count: 1, description: "필요한 상품 하나부터", unit: "/ 건" },
  { id: "basic" as const, name: "기본 구독", price: 39000, count: 5, description: "꾸준한 판매의 시작", unit: "/ 월" },
  { id: "season" as const, name: "성수기 플랜", price: 79000, count: 10, description: "제철의 기회를 더 넓게", unit: "/ 월" },
  { id: "team" as const, name: "단체 플랜", price: 199000, count: 25, description: "5명이 함께하는 판매", unit: "부터 / 월" },
];
export const won = (amount: number) => new Intl.NumberFormat("ko-KR").format(amount) + "원";
export type Member = { id: string; email: string; name: string; role: Role; createdAt: string; approved: boolean; commission: number; plan?: PlanId; credits: number; periodEnd?: string; unlocked: string[]; projects: string[]; trialProject?: string; teamId?: string; awaitingSignup?:boolean };
export type SupplyOption = { id: string; label: string; price: number; stock: number; grade?:string; weight?:string; size?:string; fruitCount?:string; customLabel?:boolean };
export type SupplyProduct = { id: string; supplierId: string; supplier: string; name: string; category: string; origin: string; features: string; image: string; options: SupplyOption[]; cutoff: string; shipping: string; status: "pending" | "approved" | "paused"; updatedAt: string; demo?: boolean; images?:string[]; badge?:string; variety?:string; taxStatus?:"unspecified"|"tax_free"|"taxable"; dispatchType?:string; carrier?:string; productionYear?:number; storageType?:string; storageInstructions?:string; jejuSurcharge?:number; remoteSurcharge?:number; shippingLabel?:"included"|"free" };
export function supplyImages(product:SupplyProduct){return [...new Set([product.image,...(product.images||[])].filter(Boolean))].slice(0,10);}
export function optionName(option:Pick<SupplyOption,"label"|"grade"|"weight"|"size"|"fruitCount">){return option.label.trim() || [[option.grade,option.weight].filter(Boolean).join(" "),option.size,option.fruitCount].filter(Boolean).join(" / ");}
export const taxLabels={unspecified:"미입력",tax_free:"비과세",taxable:"과세"};
export type OrderStatus = "payment_pending" | "paid" | "preparing" | "shipping" | "delivered" | "cancel_requested" | "cancelled";
export const orderLabels: Record<OrderStatus, string> = { payment_pending: "결제 대기", paid: "결제 완료", preparing: "출고 준비", shipping: "배송 중", delivered: "배송 완료", cancel_requested: "취소 요청", cancelled: "취소 완료" };
export type SupplyOrder = { id: string; sellerId: string; supplierId: string; productId: string; productName: string; optionId: string; optionLabel: string; quantity: number; unitPrice: number; amount: number; commission: number; recipient: string; phone: string; address: string; note: string; status: OrderStatus; createdAt: string; carrier?: string; tracking?: string; deliveredAt?: string; settledAt?: string; paymentKey?: string; refundPending?: boolean; shippingRegion?:"mainland"|"jeju"|"remote"; shippingSurcharge?:number };
export type Claim = { id: string; orderId: string; sellerId: string; supplierId: string; type: string; description: string; photo: string; resolution: "refund" | "reship"; status: "open" | "reviewing" | "resolved"; reply?: string; createdAt: string };
export type Notice = { id: string; memberId: string; title: string; body: string; createdAt: string; read: boolean };
export type Purchase = { id: string; memberId: string; plan: PlanId; amount: number; productId?: string; status: "pending" | "paid" | "cancelled"; paymentKey?: string; createdAt: string };
export type CommerceState = { members: Member[]; products: SupplyProduct[]; orders: SupplyOrder[]; claims: Claim[]; notices: Notice[]; purchases: Purchase[]; imageUsage: Record<string, number>; downloads: Record<string, string[]>; projectProducts: Record<string, string>; version: 1 };
export const emptyCommerce = (): CommerceState => ({ version: 1, members: [], products: [], orders: [], claims: [], notices: [], purchases: [], imageUsage: {}, downloads: {}, projectProducts: {} });
export function subscribed(member: Member, now = Date.now()) { return !!member.periodEnd && new Date(member.periodEnd).getTime() > now; }
export function canOrder(member: Member, productId: string) { return subscribed(member) || member.unlocked.includes(productId); }
export function publicMember(member: Member) { return { ...member }; }
export const sampleProducts: SupplyProduct[] = [
  { id: "sample-apple", supplierId: "sample", supplier: "산지 직매장 입점 예시", name: "아삭함을 담은 제철 사과", category: "사과·배", origin: "국내산 · 산지 등록 예시", features: "상품 사진과 특징을 등록하면\n나만의 판매 페이지로 연결됩니다.", image: "/photos/fruit-apple.webp", options: [{ id: "3kg", label: "가정용 3kg", price: 0, stock: 0 }, { id: "5kg", label: "가정용 5kg", price: 0, stock: 0 }], cutoff: "12:00", shipping: "공급처 출고 일정에 따라 배송", status: "approved", updatedAt: "2026-11-02", demo: true },
  { id: "sample-citrus", supplierId: "sample", supplier: "산지 직매장 입점 예시", name: "햇살을 머금은 감귤", category: "감귤·만감류", origin: "국내산 · 산지 등록 예시", features: "등록된 상품 정보로 상세페이지를 만들고\n판매 후 공급처에 발주하세요.", image: "/photos/fruit-citrus.webp", options: [{ id: "3kg", label: "가정용 3kg", price: 0, stock: 0 }], cutoff: "12:00", shipping: "공급처 직접 배송", status: "approved", updatedAt: "2026-11-02", demo: true },
  { id: "sample-grape", supplierId: "sample", supplier: "산지 직매장 입점 예시", name: "싱그러운 포도 한 상자", category: "포도·기타", origin: "국내산 · 산지 등록 예시", features: "실제 상품 사진과 AI 연출을 활용해\n상품의 이야기를 전하세요.", image: "/photos/fruit-grape.webp", options: [{ id: "2kg", label: "선물용 2kg", price: 0, stock: 0 }], cutoff: "12:00", shipping: "공급처 직접 배송", status: "approved", updatedAt: "2026-11-02", demo: true },
];
