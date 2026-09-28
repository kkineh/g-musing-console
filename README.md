# musing console

SR 대응 자동화 서비스의 관리자 콘솔. 실제 SR 처리는 별도의 엔진이 담당한다.

## 시작하기

```bash
pnpm install
cp .env.example .env
pnpm db:migrate
pnpm db:seed
pnpm dev
```

`ENGINE_URL`이 없으면 `lib/engine.ts`의 목업이 답하므로 엔진 없이도 돌아간다.

## 명령

| 명령 | 주소 |
| --- | --- |
| `pnpm dev` | `:3000` |
| `pnpm build` · `pnpm start` | `:3000` |
| `pnpm typecheck` · `pnpm lint` | |
| `pnpm db:migrate` · `pnpm db:seed` · `pnpm db:reset` | |
| `pnpm db:studio` | `:5555` |
| `pnpm contract` — `openapi.json` 생성 | |
| `pnpm contract:docs` — API 문서 | `:4100` |
| `pnpm contract:mock` — 목업 엔진 | `:4000` |

## 목업 엔진 붙이기

```bash
pnpm contract:mock                            # 터미널 1
ENGINE_URL=http://localhost:4000 pnpm dev     # 터미널 2
```

응답 종류를 헤더로 고른다. `done` / `waiting_input` / `failed`, 없으면 `done`.

```bash
curl -X POST localhost:4000/process \
  -H 'content-type: application/json' \
  -H 'Prefer: example=waiting_input' \
  -d '{"question":"지사수수료계가 0원입니다","memberId":"hll"}'
```

스펙에 안 맞는 요청은 422로 막힌다.

계약은 `contract/engine.ts`가 원본이고 `openapi.json`은 생성물이다 — `contract/README.md` 참고.

## 환경 변수

| 이름 | 필수 | 설명 |
| --- | --- | --- |
| `DATABASE_URL` | O | SQLite 파일 경로 |
| `ENGINE_URL` | X | 엔진 주소. 없으면 목업 |
