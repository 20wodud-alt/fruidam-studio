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
  title: "열매담 스튜디오 — 상품의 이야기를 한 장의 페이지로",
  description: "상품 정보와 사진으로 구성안을 만들고, 섹션을 편집해 완성하는 로컬 상세페이지 스튜디오.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
