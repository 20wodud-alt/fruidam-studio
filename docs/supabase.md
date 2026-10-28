# FRUIDAM Supabase 저장소

The Next.js server stores projects in Supabase. Deployed images, generation metadata and preferences use the private fruidam-assets Storage bucket. API keys remain in Vercel server environment variables. Local originals and backups are preserved. See [Vercel deployment](vercel.md).

## 테이블과 접근 범위

- `public."FRUIDAM_projects"`: 상품 정보·기획안·리뷰·검수 결과·보고서 등 프로젝트 문서, 목록 순서와 저장 revision.
- `public."FRUIDAM_sections"`: 프로젝트별 섹션의 문구·사진 URL·서식·스킨·추가 요소·숨김/잠금 상태 및 순서. 프로젝트 삭제 시 해당 섹션만 함께 삭제합니다.
- `FRUIDAM_load_projects` / `FRUIDAM_apply_changes`: 읽기와 원자적 변경 적용 함수.

대소문자를 유지한 테이블명이므로 SQL에서는 큰따옴표를 사용합니다. RLS를 켜고 `anon`·`authenticated` 역할의 테이블 및 함수 권한을 제거했습니다. 현재 서버만 secret/service_role 키로 접근합니다. 키에 `NEXT_PUBLIC_` 접두사를 붙이지 않습니다.

## 처음 연결할 때

1. 새 Supabase 프로젝트 이름을 `FRUIDAM`으로 만듭니다.
2. `.env.example`을 참고해 Git에서 제외된 `.env.local`에 프로젝트 URL과 서버 전용 키를 저장합니다. 설정 중에는 `FRUIDAM_STORAGE=local`을 유지합니다.
3. `npm run db:setup`으로 SQL 마이그레이션을 적용합니다. 이 명령은 환경변수 `SUPABASE_ACCESS_TOKEN` 또는 기존 `~/.supabase/access-token`을 사용하며 대상 이름이 FRUIDAM인지 확인합니다. 토큰을 출력하지 않습니다.
4. `npm run db:import`로 `data/studio.json`을 백업하고 DB에 이전합니다. 같은 ID의 다른 작업이 이미 있으면 덮어쓰지 않고 중단합니다. 이전 후 전체 문서·섹션·순서를 대조하고 `data/supabase-import-summary.json`에 건수와 백업 경로를 남깁니다. 원본 파일은 지우지 않습니다.
5. `npm run db:check`로 연결을 확인한 후 `FRUIDAM_STORAGE=supabase`로 전환하고 서버를 다시 실행합니다. 상단 저장소 표시는 성공한 `/api/studio` 응답에 따라 `SUPABASE`로 표시됩니다.

서버 전용 환경변수:

```dotenv
FRUIDAM_STORAGE=supabase
SUPABASE_URL=https://프로젝트참조.supabase.co
SUPABASE_SECRET_KEY=서버전용키
```

구형 프로젝트에서는 `SUPABASE_SERVICE_ROLE_KEY`도 지원합니다. URL·키 일부만 설정되면 연결 오류로 처리합니다. `FRUIDAM_STORAGE=local`을 명시한 경우에만 로컬 저장소를 선택합니다. Supabase 장애가 나도 로컬로 조용히 전환하거나 자동 재시도하지 않습니다.

## 저장 동작

기존 `studioAccess` 인터페이스를 유지합니다. 읽은 스냅샷과 변경본을 비교해 바뀐 프로젝트와 실제 삭제 대상만 서버에 전송합니다. 함수 한 번으로 프로젝트 문서와 섹션을 트랜잭션에 저장합니다. revision 충돌 시 변경을 되돌리고 새로 읽도록 안내합니다. 로컬 프로세스의 저장 큐와 PostgreSQL advisory transaction lock을 함께 사용합니다.

`FRUIDAM_STORAGE=local`은 비상 확인용으로 이전 JSON을 여는 설정이며, 클라우드에 새로 저장된 변경이 과거 로컬 파일에 자동 복제되는 것은 아닙니다. 다른 저장소로 전환하려면 현재 데이터를 먼저 내보내야 합니다.

## 검사

```text
node tests/supabase-storage.cjs
npm run db:check
npx tsc --noEmit
npm run lint
```

DB 연결·저장은 Gemini 토큰을 사용하지 않습니다. DB 저장량과 네트워크 사용량은 Supabase 플랜 한도에 포함되며 유료 플랜으로 자동 변경하지 않습니다.
