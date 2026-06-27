#!/usr/bin/env python3
"""Resolve the active OpenSpec change without relying on chat history."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path.cwd()
RUN_JSON = ROOT / ".sdlc" / "run.json"
STATE_MD = ROOT / ".sdlc" / "state.md"
CHANGES_DIR = ROOT / "openspec" / "changes"


def load_run() -> dict:
    if not RUN_JSON.exists():
        return {}
    try:
        return json.loads(RUN_JSON.read_text())
    except Exception as exc:
        raise SystemExit(f"Error: cannot parse {RUN_JSON}: {exc}")


def active_change_dirs() -> list[str]:
    if not CHANGES_DIR.exists():
        return []
    return sorted(
        p.name
        for p in CHANGES_DIR.iterdir()
        if p.is_dir() and p.name != "archive" and not p.name.startswith(".")
    )


def change_exists(name: str) -> bool:
    return bool(name) and (CHANGES_DIR / name).is_dir()


def current_branch() -> str:
    try:
        return subprocess.check_output(
            ["git", "branch", "--show-current"], text=True
        ).strip()
    except Exception:
        return ""


def state_active_change() -> str:
    if not STATE_MD.exists():
        return ""
    match = re.search(r"(?im)^Active Change:\s*(.+?)\s*$", STATE_MD.read_text())
    return match.group(1).strip() if match else ""


def branch_candidates(branch: str) -> list[str]:
    if not branch:
        return []
    names = [branch]
    if branch.startswith("feature/"):
        names.append(branch.split("/", 1)[1])
    return names


def emit(name: str, args: argparse.Namespace, source: str, run: dict) -> None:
    if args.json:
        print(
            json.dumps(
                {
                    "change": name,
                    "source": source,
                    "status": run.get("status"),
                    "associatedChanges": run.get("associatedChanges", []),
                },
                indent=2,
            )
        )
    else:
        print(name)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("change", nargs="?")
    parser.add_argument(
        "--status",
        help="Comma-separated allowed run statuses, e.g. planned,implementing,implemented",
    )
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    run = load_run()
    allowed_statuses = {
        s.strip() for s in (args.status or "").split(",") if s.strip()
    }

    if args.change:
        if not change_exists(args.change):
            print(
                f"Error: change directory not found: openspec/changes/{args.change}",
                file=sys.stderr,
            )
            return 1
        emit(args.change, args, "argument", run)
        return 0

    if allowed_statuses and run.get("status") not in allowed_statuses:
        print(
            f"Error: run.json status {run.get('status')!r} is not one of "
            f"{sorted(allowed_statuses)}.",
            file=sys.stderr,
        )
        return 1

    run_change = run.get("activeChange") or ""
    if change_exists(run_change):
        emit(run_change, args, "run.json", run)
        return 0

    state_change = state_active_change()
    if change_exists(state_change):
        emit(state_change, args, "state.md", run)
        return 0

    branch = current_branch()
    for candidate in branch_candidates(branch):
        if change_exists(candidate):
            emit(candidate, args, "git-branch", run)
            return 0

    changes = active_change_dirs()
    if len(changes) == 1:
        emit(changes[0], args, "single-active-change", run)
        return 0
    if len(changes) > 1:
        print(
            "Error: multiple active changes found; specify one explicitly: "
            + ", ".join(changes),
            file=sys.stderr,
        )
        return 1

    print("Error: no active OpenSpec changes found.", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
