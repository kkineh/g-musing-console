# musing console

SR(Service Request) 대응 자동화 서비스의 관리자 콘솔.

운영·기획팀이 개발팀에 직접 문의하지 않고도 코딩 에이전트를 통해 답을 찾을 수 있게
하는 것이 전체 목표이고, 이 저장소는 그중 **사용자 접점과 게이트웨이**를 맡는다.
실제 SR 처리(코드 분석, 수정, 응답 작성)는 별도의 엔진이 담당한다.

## 화면

| 경로 | 화면 | 하는 일 |
| --- | --- | --- |
| `/` | 질의 | SR을 입력하고 응답을 받는다. 되묻기가 오면 답한다 |
| `/history` | 처리 이력 | 지난 대화를 찾아보고 채점한다 |
| `/wiki` | 지식베이스 | 도메인 문서를 읽고 쓴다 |

## 구조

```
src/
├── app/            화면과 API 라우트 (파일 위치가 곧 URL)
├── components/     화면 조각
└── lib/
    ├── db.ts       Prisma 클라이언트
    ├── engine.ts   엔진 호출부 — 팀 경계가 드러나는 유일한 파일
    ├── chats.ts    대화·턴 조회
    └── wiki.ts     지식베이스 조회
prisma/
├── schema.prisma   대화·턴·채점·문서
└── seed.ts         화면 개발용 예시 데이터
contract/
├── engine.ts       계약 원본 (TypeScript + Zod)
├── openapi.json    생성물 — 문서와 목업이 이걸 읽는다
└── index.html      Scalar 문서 페이지
docs/
└── engine-contract.md   배경과 협의 사항 (형식은 contract/가 정본)
```

엔진은 이 저장소에 없다. `lib/engine.ts`가 HTTP로 부르고, `ENGINE_URL`이
설정되지 않으면 목업으로 동작해서 엔진 없이도 콘솔을 개발할 수 있다.

## 되묻기

musing의 주요 기능이다. 에이전트가 판단이 필요할 때 사용자에게 되묻고,
답을 받아 이어서 처리한다. 조회 기준이나 대상처럼 요청에 명시되지 않은 정보를
스스로 유추하지 않고 확인하는 것.

그래서 데이터 구조가 **대화(Chat) → 턴(Turn)**이다. 한 번 묻고 끝나는 게
아니라 여러 턴이 이어질 수 있고, 각 턴은 되묻기 대기 상태를 가질 수 있다.

자세한 흐름은 `docs/engine-contract.md` 참고.

## 시작하기

```bash
pnpm install
cp .env.example .env
pnpm db:migrate     # 스키마 적용
pnpm db:seed        # 예시 데이터
pnpm dev
```

`http://localhost:3000`

엔진 없이도 돌아간다. `ENGINE_URL`이 없으면 `lib/engine.ts`의 목업이 답한다.

## 엔진을 목업으로 붙여서 개발하기

계약에서 만든 목업 서버를 쓰면 실제 HTTP 왕복까지 확인할 수 있다.

```bash
pnpm contract:mock                            # 터미널 1 — localhost:4000
ENGINE_URL=http://localhost:4000 pnpm dev     # 터미널 2
```

응답 종류를 골라 받는다.

```bash
curl -X POST localhost:4000/process \
  -H 'content-type: application/json' \
  -H 'Prefer: example=waiting_input' \
  -d '{"question":"지사수수료계가 0원입니다","memberId":"hll"}'
```

`example=` 에 `done` / `waiting_input` / `failed`. 없으면 `done`.
스펙에 안 맞는 요청은 **422**로 막힌다.

## 스크립트

**개발**

| 명령 | 설명 | 주소 |
| --- | --- | --- |
| `pnpm dev` | 개발 서버 | `:3000` |
| `pnpm build` | 프로덕션 빌드 | |
| `pnpm start` | 빌드 결과 실행 | `:3000` |
| `pnpm typecheck` | 타입 검사 | |
| `pnpm lint` | 린트 | |

**DB**

| 명령 | 설명 | 주소 |
| --- | --- | --- |
| `pnpm db:migrate` | 마이그레이션 생성·적용 | |
| `pnpm db:seed` | 예시 데이터 (여러 번 돌려도 안전) | |
| `pnpm db:studio` | DB 브라우저 | `:5555` |
| `pnpm db:reset` | 전부 지우고 다시 | |

**계약** — 자세한 건 `contract/README.md`

| 명령 | 설명 | 주소 |
| --- | --- | --- |
| `pnpm contract` | `openapi.json` 생성 | |
| `pnpm contract:docs` | API 문서 (Scalar) | `:4100` |
| `pnpm contract:mock` | 목업 엔진 (Prism) | `:4000` |

## 포트

| 포트 | 무엇 |
| --- | --- |
| 3000 | 콘솔 |
| 4000 | 목업 엔진 |
| 4100 | API 문서 |
| 5555 | Prisma Studio |

## 기술 선택

- **Next.js** — 화면과 게이트웨이 API가 한 프로젝트에 있으면 배포 대상이 하나로
  끝난다. 게이트웨이가 하는 일이 얇은 어댑터라 별도 서버를 둘 이유가 없었다.
- **SQLite + Prisma** — 하루 몇 건 규모에서 시작한다. 파일 하나라 운영 부담이
  없고, 늘어나면 Postgres로 옮긴다(`schema.prisma`의 provider만 바꾸면 된다).
- **되묻기 우선** — 스키마를 처음부터 대화 구조로 잡았다. 나중에 얹으면
  이력·채점까지 전부 손봐야 한다.

## 환경 변수

| 이름 | 필수 | 설명 |
| --- | --- | --- |
| `DATABASE_URL` | O | SQLite 파일 경로 |
| `ENGINE_URL` | X | 엔진 주소. 없으면 목업으로 동작 |
