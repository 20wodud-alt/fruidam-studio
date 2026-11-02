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
