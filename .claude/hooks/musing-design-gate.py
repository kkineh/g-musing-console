#!/usr/bin/env python3
"""뮤징 디자인 루프 게이트.

mark    PostToolUse 훅: 디자인 파일 수정을 '검증 대기'로 기록
stop    Stop 훅: 마지막 수정 이후 PASS가 없으면 종료를 막음
record  musing-designer가 판정 기록. PASS·SKIP은 --files로 넘긴 파일만 대기에서 푼다
        (다른 세션이 같은 저장소에서 작업 중이어도 그 세션의 대기를 지우지 않게).
        SKIP은 사용자가 명시적으로 검증을 건너뛰라고 했을 때만, --summary에 사용자 지시를 적어 기록
start-round 디자이너 라운드 시작 표시 (진행 중에는 Stop을 막지 않음)
pending 대기 파일 출력
history 판정 기록 출력
"""
import argparse
import json
import os
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]  # musing-console. 상위 워크스페이스(musing/)에서 연 세션에서도 같은 저장소를 본다
STATE = ROOT / ".omc" / "state" / "musing-design"
PENDING = STATE / "pending.json"
REVIEWS = STATE / "reviews.jsonl"
DESIGN_PATH = re.compile(r"^src/(app|components)/.+\.(tsx|css)$")  # app/의 .ts는 서버 액션·라우트라 제외
MAX_STOP_BLOCKS = 3  # 같은 대기 상태로 종료를 막는 최대 횟수 (무한 루프 방지)
IN_REVIEW = STATE / "in_review.json"
REVIEW_TIMEOUT = 30 * 60  # 디자이너 라운드가 이보다 오래 걸리면 진행 중 표시를 무시


def _load_pending() -> dict:
    """{"files": {경로: 마지막 수정 시각}, "stop_blocks": n}"""
    try:
        p = json.loads(PENDING.read_text())
    except (OSError, ValueError):
        return {"files": {}}
    if isinstance(p.get("files"), list):  # 예전 형식: 파일 목록 + 전체 last_edit 하나
        p["files"] = {f: p.get("last_edit", 0) for f in p["files"]}
    p.pop("last_edit", None)
    p.setdefault("files", {})
    return p


def _save_pending(p: dict) -> None:
    STATE.mkdir(parents=True, exist_ok=True)
    PENDING.write_text(json.dumps(p, ensure_ascii=False, indent=2))


def _cleared_at() -> dict:
    """파일마다 마지막으로 PASS·SKIP으로 풀린 시각."""
    cleared: dict = {}
    if REVIEWS.exists():
        for line in REVIEWS.read_text().splitlines():
            try:
                e = json.loads(line)
            except ValueError:
                continue
            if e.get("verdict") in ("PASS", "SKIP"):
                # cleared가 없는 예전 기록은 그때 대기 전체를 풀었으므로 files 전체로 본다
                for f in e.get("cleared", e.get("files", [])):
                    cleared[f] = max(cleared.get(f, 0), e.get("at", 0))
    return cleared


def _scan() -> dict:
    """Edit/Write 훅을 거치지 않은 수정(Bash 등)도 잡기 위해 git 작업 트리를 스캔해 대기 목록에 합친다."""
    import subprocess

    p = _load_pending()
    try:
        out = subprocess.run(
            ["git", "-C", str(ROOT), "ls-files", "-m", "-o", "--exclude-standard"],
            capture_output=True, text=True, timeout=10,
        ).stdout.split()
    except (OSError, subprocess.SubprocessError):
        return p
    cleared = _cleared_at()
    changed = False
    for rel in out:
        f = ROOT / rel
        if not (DESIGN_PATH.match(rel) and f.exists()):
            continue
        mtime = f.stat().st_mtime
        if mtime > cleared.get(rel, 0) and mtime > p["files"].get(rel, 0):
            p["files"][rel] = mtime
            changed = True
    if changed:
        p.setdefault("stop_blocks", 0)
        _save_pending(p)
    return p


def _rel(path: str) -> str | None:
    try:
        rel = Path(path).resolve().relative_to(ROOT.resolve()).as_posix()
    except ValueError:
        return None
    return rel if DESIGN_PATH.match(rel) else None


def cmd_mark() -> None:
    data = json.load(sys.stdin)
    rel = _rel((data.get("tool_input") or {}).get("file_path", ""))
    if not rel:
        return
    p = _load_pending()
    first = not p["files"]
    p["files"][rel] = time.time()
    p["stop_blocks"] = 0
    _save_pending(p)
    if first:
        print(json.dumps({"hookSpecificOutput": {
            "hookEventName": "PostToolUse",
            "additionalContext": (
                f"[musing-design] 디자인 파일 수정 감지: {rel}. 작업 단락이 끝나면 musing-design 스킬 절차대로 "
                "musing-designer 검증 루프를 PASS까지 돌려야 해요 (musing-console/.claude/skills/musing-design/SKILL.md)."
            ),
        }}, ensure_ascii=False))


def _in_review() -> bool:
    try:
        return time.time() - json.loads(IN_REVIEW.read_text())["at"] < REVIEW_TIMEOUT
    except (OSError, ValueError, KeyError):
        return False


def cmd_start_round(args) -> None:
    STATE.mkdir(parents=True, exist_ok=True)
    IN_REVIEW.write_text(json.dumps({"at": time.time(), "round": args.round}))
    print(f"라운드 {args.round} 검증 진행 중으로 표시했어요 (record하면 해제돼요).")


def cmd_stop() -> None:
    json.load(sys.stdin)
    if _in_review():
        return  # 디자이너 라운드가 돌고 있는 동안은 기다릴 수 있게 통과
    p = _scan()
    if not p["files"]:
        return
    blocks = p.get("stop_blocks", 0)
    if blocks >= MAX_STOP_BLOCKS:
        return  # 계속 막으면 세션이 끝나지 않으므로 통과시키되 대기 상태는 남긴다
    p["stop_blocks"] = blocks + 1
    _save_pending(p)
    print(json.dumps({
        "decision": "block",
        "reason": (
            f"[musing-design] 검증 안 된 디자인 변경이 있어요 ({len(p['files'])}개 파일, 종료 차단 {blocks + 1}/{MAX_STOP_BLOCKS}). "
            "musing-design 스킬 절차대로 musing-designer 루프를 PASS까지 돌리거나, 3라운드 후에도 실패하면 사용자에게 남은 FAIL을 보고하세요. "
            f"대기 파일: {', '.join(sorted(p['files'])[:10])}"
        ),
    }, ensure_ascii=False))


def _norm(path: str) -> str:
    """절대 경로·musing-console/ 접두사가 붙은 경로도 저장소 기준 상대 경로로."""
    path = path.strip()
    if os.path.isabs(path):
        try:
            return Path(path).resolve().relative_to(ROOT.resolve()).as_posix()
        except ValueError:
            return path
    return path.removeprefix("musing-console/").removeprefix("./")


def cmd_record(args) -> None:
    p = _scan()
    reviewed = sorted({_norm(f) for f in args.files})
    now = time.time()
    cleared = []
    if args.verdict in ("PASS", "SKIP"):
        cleared = [f for f in reviewed if p["files"].get(f, 0) <= now]
    entry = {
        "at": now,
        "verdict": args.verdict,
        "round": args.round,
        "summary": args.summary,
        "open": args.open,
        "files": reviewed,
        "cleared": cleared,
    }
    STATE.mkdir(parents=True, exist_ok=True)
    IN_REVIEW.unlink(missing_ok=True)
    with REVIEWS.open("a") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    for f in cleared:
        p["files"].pop(f, None)
    if cleared:
        p["stop_blocks"] = 0
    _save_pending(p)
    rest = sorted(p["files"])
    msg = f"{args.verdict} 기록: {len(cleared)}개 파일 대기 해제" if cleared else f"{args.verdict} 기록"
    print(f"{msg}. 남은 대기 {len(rest)}개" + (f": {', '.join(rest)}" if rest else "") + ".")


def cmd_pending() -> None:
    p = _scan()
    print("\n".join(sorted(p["files"])) or "(대기 없음)")


def cmd_history() -> None:
    if REVIEWS.exists():
        print(REVIEWS.read_text().rstrip())


def main() -> None:
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    for name in ("mark", "stop", "pending", "history"):
        sub.add_parser(name)
    sr = sub.add_parser("start-round")
    sr.add_argument("--round", type=int, required=True)
    r = sub.add_parser("record")
    r.add_argument("--verdict", choices=["PASS", "REVISE", "SKIP"], required=True)
    r.add_argument("--round", type=int, required=True)
    r.add_argument("--summary", required=True)
    r.add_argument("--open", default="")
    r.add_argument("--files", nargs="+", required=True,
                   help="이번 라운드에서 검증한 파일 (저장소 기준 경로). PASS·SKIP은 이 파일들만 대기에서 푼다")
    args = ap.parse_args()
    if args.cmd == "record":
        cmd_record(args)
    elif args.cmd == "start-round":
        cmd_start_round(args)
    else:
        {"mark": cmd_mark, "stop": cmd_stop, "pending": cmd_pending, "history": cmd_history}[args.cmd]()


if __name__ == "__main__":
    main()
