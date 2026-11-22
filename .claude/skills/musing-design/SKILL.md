---
name: musing-design
description: musing-console의 모든 디자인 작업(UI·UX·스타일·레이아웃·문구·컴포넌트 시각 변경)에 뮤징 디자이너 검증 루프를 적용한다. Use when editing src/app or src/components UI files, redesigning screens, changing styles/copy, or when the musing-design gate reports pending files. `/musing-design [대상]`으로 수동 실행.
argument-hint: "[파일·화면 (생략 시 대기 중인 변경 전체)]"
allowed-tools: Agent Bash Read Edit Write Glob Grep
---

# 뮤징 디자인 루프

디자인 작업은 **구현 → musing-designer 검증·수정 → 재검증**을 PASS까지 반복한다.
기준은 `principles.md`(같은 폴더)다. 경로와 명령은 모두 `musing-console/` 루트 기준이다.
상위 워크스페이스(`musing/`)에서 연 세션이면 `cd musing-console` 후 실행한다.

## 디자인 작업의 범위

`src/app/**`, `src/components/**`의 `.tsx`·`.css` 변경 (`app/`의 `.ts`는 서버 액션·라우트라 제외).
훅(`.claude/hooks/musing-design-gate.py mark`)이 이 경로의 수정을 "검증 대기"로 기록하고,
PASS 없이 세션을 끝내려 하면 Stop 훅이 막는다.

## 절차

1. 구현자(메인 에이전트)는 principles.md를 읽고 변경을 만든다. 스스로 PASS를 판정하지 않는다.
   작업이 principles.md에 없는 판단을 요구하면 구현 전에 AskUserQuestion으로 사용자에게 묻고, 답을 규칙으로 넣은 뒤 구현한다.
2. 대기 파일 확인: `python3 .claude/hooks/musing-design-gate.py pending`
3. 라운드 N(1부터)마다 먼저 `musing-design-gate.py start-round --round N`을 실행하고, **새** musing-designer 에이전트를 띄운다
   (이전 라운드 문맥을 넘기지 않는다 — 고친 사람이 자기 결과를 승인하지 않게):
   ```
   Agent(subagent_type="musing-designer", prompt="라운드 N. 대상: <파일 목록>. principles.md 기준으로 검증·수정하고 기록해.")
   ```
   `musing-designer` 타입이 등록되지 않은 세션이면 `subagent_type="general-purpose"`, `model="opus"`로 띄우고
   프롬프트 첫 줄에 "너는 musing-console/.claude/agents/musing-designer.md에 정의된 musing-designer다. 그 파일을 먼저 읽고 그대로 따른다."를 넣는다.
4. `REVISE`면 N+1로 3번을 반복한다. `PASS`면 끝.
   **수렴 규칙:** 전체 범위 검증은 2라운드까지만. 3라운드는 "직전 라운드와 구현자가 고친 곳(git diff)
   + 전체 파일의 치명 항목(M1·M2·U5)"만 FAIL로 판정하고 나머지는 [의견]으로 보고하게 프롬프트에 적는다.
   (moco에서 매 라운드 전체를 새로 본 디자이너가 사소한 지적을 계속 내 6라운드 연속 REVISE로 수렴하지 않았다.)
5. 3라운드 후에도 PASS가 아니면 멈추고 남은 FAIL과 이유를 사용자에게 보고한다.
6. 끝나면 사용자에게: 라운드 수, 라운드별 고친 것, `사용자 결정 필요` 항목.
   `사용자 결정 필요`가 있으면 AskUserQuestion으로 묻고, 답을 principles.md 해당 절에 규칙으로 넣고
   "결정 기록"에 사용자 원문과 함께 적는다. 결정에 따라 코드를 바꿔야 하면 그것도 디자인 작업이라 다시 이 루프를 돈다.

## 게이트 명령

| 명령 | 용도 |
|---|---|
| `musing-design-gate.py start-round --round N` | 라운드 시작 표시. 진행 중(최대 30분)에는 Stop을 막지 않고, record가 해제 |
| `musing-design-gate.py pending` | 마지막 PASS 이후 수정된 디자인 파일 |
| `musing-design-gate.py record --verdict ... --round N --summary ... --files <파일들>` | 디자이너가 판정 기록. PASS는 `--files`의 파일만 대기에서 푼다 |
| `musing-design-gate.py record --verdict SKIP --round 0 --summary "사용자 지시: ..." --files <파일들>` | 사용자가 **명시적으로** 검증을 건너뛰라고 했을 때만, 건너뛸 파일만 적는다 |

대기 목록은 저장소 하나에 하나라 같은 저장소의 다른 세션 파일도 `pending`에 보인다. 디자이너에게 대상 파일을
명시해서 넘기고, 자기 세션이 고친 파일만 `--files`에 넣는다. 다른 세션의 파일 때문에 Stop이 막히면 그 파일은
그 세션이 처리하므로, 막힘 메시지에 자기 파일이 없으면 사용자에게 알리고 넘어간다.
| `musing-design-gate.py history` | 판정 기록 보기 |
