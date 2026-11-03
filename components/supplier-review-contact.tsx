export function SupplierReviewContact({ email }: { email?: string }) {
  return <section className="fd-panel" aria-label="입점 신청 운영자 안내">
    <h2>입점 신청 운영자</h2>
    <p>알림 수신 주소: <strong>{email || "미설정"}</strong></p>
    <p className="fd-caption">아래 신청 목록에서 업체를 검토하고 승인·수수료를 설정하세요. 이메일 자동 알림은 아직 발송되지 않습니다.</p>
  </section>;
}
