@AGENTS.md

## 디자인

`src/app`·`src/components`의 UI/UX 작업(레이아웃, 스타일, 문구, 컴포넌트)은 `.claude/skills/musing-design/SKILL.md`를 따른다: 구현 → `musing-designer` 에이전트가 검증·수정 → PASS까지 새 디자이너로 반복(최대 3라운드). 기준: `.claude/skills/musing-design/principles.md`. 결정 대기(K) 항목에 걸리면 정하지 말고 사용자에게 묻는다. 검증 안 된 디자인 수정이 있으면 훅이 세션 종료를 막는다.
