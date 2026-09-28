# 엔진 API 계약

콘솔과 엔진 사이의 계약. **`engine.ts`가 원본**이고 `openapi.json`은 생성물이다.

```
engine.ts (TypeScript + Zod)     ← 여기를 고친다
    │
    └─ pnpm contract ──▶ openapi.json
                            ├──▶ 문서 (Scalar)
                            └──▶ 목업 (Prism)
```

## 쓰는 법

```bash
pnpm contract        # openapi.json 생성
pnpm contract:docs   # 문서 → localhost:4100/docs.html
pnpm contract:mock   # 목업 엔진 → localhost:4000
```

## 목업으로 개발하기

엔진이 없어도 콘솔이 돌아간다.

```bash
pnpm contract:mock              # 터미널 1
ENGINE_URL=http://localhost:4000 pnpm dev   # 터미널 2
```

응답 종류를 골라 받을 수 있다.

```bash
curl -X POST localhost:4000/process \
  -H 'content-type: application/json' \
  -H 'Prefer: example=waiting_input' \
  -d '{"question":"지사수수료계가 0원입니다","memberId":"hll"}'
```

`example=` 에 `done` / `waiting_input` / `failed` 를 넣는다. 없으면 `done`.

스펙에 안 맞는 요청은 **422**로 막힌다. 계약 위반이 바로 잡힌다.

## 엔진 쪽에서 쓰는 법

계약을 import하면 구현이 계약과 어긋날 때 컴파일이 깨진다.

```ts
import { EngineResponse } from "./contract/engine";

function handle(req): z.infer<typeof EngineResponse> {
  // 반환값이 계약과 다르면 타입 에러
}
```

`openapi.json`만 받아서 다른 언어로 구현해도 된다.

## 아직 계약에 없는 것

협의가 끝나면 넣는다.

- 스트리밍 (답변을 조금씩 흘려주기)
- 첨부파일
- 근거의 `explored` — 탐색했지만 안 쓴 경로
