import type { Metadata } from "next";
import "./globals.css";
import "./fonts.css";
import "./fruitdam.css";
import "./planning.css";
import "./outline-studio.css";
import "./element-tools.css";
import "./design-skins.css";
import "./shortcuts.css";
import "./free-editor.css";
import "./creation-workflow.css";
import "./image-direction.css";
import "./editor-upgrades.css";
import "./editor-contrast.css";
import "./copy-audit.css";
import "./market-export.css";
import "./review-comparison.css";

export const metadata: Metadata = {
  title: "열매담 FRUIDAM — 좋은 과일을 만나, 나의 판매를 시작하다",
  description: "과일 상세페이지 제작부터 산지 직매장 위탁 공급과 발주·배송 관리까지. 농가와 셀러의 시작을 연결하는 열매담.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
