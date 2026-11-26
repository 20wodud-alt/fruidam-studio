# 작업 일지 — 2026-11-26 (산지록 브랜드 전환 및 쿠팡 고전환율 상세페이지 개편)

## 1. 브랜드 로고 및 문구 교체 (`열매담` → `산지록` / `SANJIROK`)
- **로고 이미지 교체**: `public/fruitdam-logo.png`를 영문 `SANJIROK` 로고(투명 배경 PNG, `861×213`)로 교체
- **컴포넌트 비율/스타일 정리**:
  - `components/brand-logo.tsx`, `components/brand-logo.module.css`
  - `components/brand-cover.tsx`
- **브랜드 문구 일괄 교체** (총 9개 파일, 33건 `열매담` → `산지록`, `열매담 FRUIDAM` → `산지록 SANJIROK`):
  - `app/layout.tsx`, `app/about/page.tsx`, `app/account/setup/page.tsx`, `app/studio/page.tsx`
  - `components/brand-cover.tsx`, `components/brand-story.tsx`, `components/commerce-app.tsx`, `components/outline-studio.tsx`, `components/service-header.tsx`

## 2. 쿠팡 고전환율 상세페이지 레이아웃 & 카피 개편
- **레이아웃 시스템 개편** (`components/detail-page.tsx`):
  - `fruit-editorial` 적용 과일 상품에서도 스킨/자유 캔버스가 아닐 경우 쿠팡 전환형 레이아웃(`useCoupangRhythm`)이 동작하도록 수정
  - 히어로 포스터 배경 그라데이션 + 3종 신뢰 배지(`01 산지 직송`, `02 엄격 선별`, `03 안전 포장`)
  - 고대비 컬러 `CHECK POINT` 카드(`benefits`, 항상 4개 포인트 보장 및 흰 밑줄 겹침 제거)
  - `detail` 섹션 4종 교차 변주(좌측 분할 ↔ 2단 비교표 ↔ 우측 분할 ↔ 다크 매크로)
  - `story` 섹션 3종 교차 변주(배너 ↔ `STEP` 타임라인 ↔ 산지 노트)
  - `options` 2열 카드(`OPTION 01/02` 배지 크기 버그 수정) + 대형 가격 배너
  - `shipping` 2열 체크리스트 + `faq` Q/A 파서 개선(단일 줄바꿈·인라인 Q/A 분리) + `교환·반품·취소 안내` 박스
  - 시각 섹션(`story`, `detail`, `shipping`) 이미지 미지정 시 등록 상품 사진 자동 연결
- **카피 & 이미지 생성 가이드 개선**:
  - `lib/studio.ts`: 15개 섹션에 `shipping` 편입, `STORAGE TIP` 사진 연결, 마지막 섹션을 브랜드 스토리가 아닌 구매·품질 약속 CTA로 변경
  - `lib/copy-rhythm.ts`, `lib/reference-style-guide.ts`: 일반 본문 90~160자(3~4줄), `benefits` 4개 항목 일치, `faq` 4문항 이상 작성, 밝은 하이키 스튜디오 촬영 가이드로 개선
  - `lib/copywriter.ts`, `lib/fruit-composition.ts`: 4개 포인트 보장, 풍부한 3~4줄 본문 및 4개 Q&A 로컬 템플릿 반영

## 3. Next.js 보안 업그레이드 (별도 Worktree)
- `fruidam-studio-next-upgrade` (브랜치 `chore/next-16.4.6-security`, 커밋 `ce57d2c`)에서 `next` `16.4.3` → `16.4.6` 업그레이드 및 `npm run build` / `tsc --noEmit` 검증 완료 (현재 브랜치에는 미병합 상태).

## 4. 검증 내역
- `npx tsc --noEmit`: 통과
- `node tests/brand-cover.cjs`: `PASS`
- `node tests/copy-rhythm.cjs`: `PASS`
- `node tests/design-skins.cjs`: `PASS`
- `node tests/fruit-composition.mjs`: `PASS`
