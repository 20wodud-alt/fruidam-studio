# 과일 실사 사진 출처

2026-11-03 사용자 요청에 따라 서비스의 과일 일러스트를 실사 사진으로 교체했다. 홈, 상품 카드·상세, 로그인, 셀러 배너, 공급처 안내, 기본 샘플 상세페이지에 적용한다. 실제 공급처가 올린 상품 사진은 각 공급상품의 자료를 사용한다.

| 로컬 파일 | 촬영자 | 원본 |
| --- | --- | --- |
| public/photos/fruit-apple.webp | Julia Ly | https://unsplash.com/photos/a-red-apple-with-water-droplets-on-it-9d3YVnzH7Q4 |
| public/photos/fruit-citrus.webp | mohamed hassouna | https://unsplash.com/photos/orange-fruit-lot-in-close-up-photography-mPCzSjyxrIk |
| public/photos/fruit-grape.webp | Kier in Sight Archives | https://unsplash.com/fr/photos/une-grappe-de-raisin-vert-assise-sur-une-table-NMkWw9Hq9Sg |
| public/photos/fruit-orchard.webp | insung yoon | https://unsplash.com/photos/orange-fruit-on-green-leaves-POTdW_6N-Ok |

다운로드 당시 원본 페이지의 무료 사용 표시와 [Unsplash License](https://unsplash.com/license)를 확인했다. 과수원 사진의 원본 위치는 서귀포로 기재되어 있다. 사진은 샘플·서비스 소개용이며 특정 공급처·품종·등급의 상품 사진이라는 보증을 의미하지 않는다.

WebP로 최적화해 서비스 내부에서 제공하며 외부 이미지 서버를 런타임에 호출하지 않는다. 기존 작업에 저장된 `/sample-product.svg`, `/sample-detail.svg`, `/fruit-apple.svg`, `/fruit-citrus.svg`, `/fruit-grape.svg` 경로도 사진을 내장한 호환 SVG로 교체해 저장 문서를 수정하지 않고 실사로 표시한다. 기존 작업에서 과일 사진을 사용한 샘플 캡션을 유지한다.

사용한 원본 이미지 주소:

- https://images.unsplash.com/photo-1739079316621-367e6e138781
- https://images.unsplash.com/photo-1605693681813-beef2f8fe022
- https://images.unsplash.com/photo-1756364171636-7996379c51d4
- https://images.unsplash.com/photo-1581501171927-1b2a5c1625df

로컬 샘플 이미지는 명시적 경로 목록으로만 검증·처리하며 사용자 입력으로 임의 파일이나 원격 URL을 읽지 않는다. AI 이미지 참고 입력과 로컬 사진 도구에서도 같은 경로 목록을 사용한다.

## 열매담 이야기 브랜드 이미지 (2026-11-03)

- 파일: `public/photos/fruidam-harvest-story.webp` (1600×900, 178,372바이트).
- 용도: `/about` 열매담 이야기의 첫 화면. 기존 사이트 사진을 대체하지 않고 신규 브랜드 자산으로 추가했다.
- 제작: 기본 제공 `image_gen` 도구로 새로 생성. 특정 실존 농가나 등록 상품의 실사 증빙이 아닌 AI 브랜드 연출이며 화면에도 이를 표시한다. 원본 PNG는 기본 생성 폴더에 보존하고 WebP 사본을 저장소에 포함했다.
- 원본: `C:/Users/20wod/.codex/generated_images/01a19a13-aaa3-7293-95ac-888545be7740/exec-54c486f1-473a-42b0-93aa-f2d36228b527.png`.
- 아이콘: 기존 `lucide-react` 선형 아이콘을 조합. 로고는 기존 열매담 붓글씨 로고 유지.
- 보조 과수원 사진: 위의 기존 `fruit-orchard.webp`를 재사용.

최종 생성 프롬프트:

> Use case: photorealistic-natural. Asset type: premium Korean fruit marketplace brand-story website hero photograph, landscape wide composition. Primary request: a warm, understated editorial photograph in a real-looking Korean apple orchard at early morning in autumn, a farmer's gently weathered hands holding a shallow wooden harvest crate filled with fresh red and gold apples with a few green leaves, focus on the hands and fruit on the right half, soft distant mountains and orchard foliage on the left half with darker defocused green negative space for white web typography. No visible face, no text, no typography, no logos, no watermark, no labels, no collage, no illustrations. Natural soft sun, tactile fruit skins, honest rural atmosphere, restrained forest green and warm ivory palette, luxury independent food magazine art direction, realistic anatomy and fruit. This is a conceptual brand image, not a specific real farm or product. Output a single wide landscape image.
