#!/usr/bin/env python3
"""Enforce final SDLC release gates before integration/archive."""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

RUN_JSON = Path(".sdlc/run.json")
MANUAL = Path(".sdlc/manual-checklist.md")
LEDGER = Path(".sdlc/phase-ledger.md")


def fail(message: str) -> bool:
    print(f"[-] {message}", file=sys.stderr)
    return False


def ok(message: str) -> bool:
    print(f"[+] {message}")
    return True


def load_run() -> dict:
    if not RUN_JSON.exists():
        raise SystemExit("[-] Missing .sdlc/run.json")
    try:
        return json.loads(RUN_JSON.read_text())
    except Exception as exc:
        raise SystemExit(f"[-] Cannot parse .sdlc/run.json: {exc}")


def change_dir(name: str) -> Path:
    return Path("openspec/changes") / name


def tasks_complete(change: str) -> bool:
    path = change_dir(change) / "tasks.md"
    if not path.exists():
        return fail(f"{change}: missing tasks.md")
    text = path.read_text()
    unchecked = re.findall(r"(?m)^\s*-\s*\[\s\]\s+(.+)$", text)
    partial = re.findall(r"(?m)^\s*-\s*\[/\]\s+(.+)$", text)
    if unchecked or partial:
        for item in unchecked[:10] + partial[:10]:
            fail(f"{change}: incomplete task: {item}")
        return False
    return ok(f"{change}: all tasks checked")


def required_artifacts_exist(change: str) -> bool:
    base = change_dir(change)
    required = ["proposal.md", "tasks.md"]
    result = True
    for name in required:
        if not (base / name).exists():
            result &= fail(f"{change}: missing {name}")
    if not ((base / "design.md").exists() or (base / "spec.md").exists() or (base / "specs").exists()):
        result &= fail(f"{change}: missing design/spec artifact")
    if result:
        ok(f"{change}: required artifacts exist")
    return result


def manual_checklist_passed() -> bool:
    if not MANUAL.exists():
        return fail("missing .sdlc/manual-checklist.md")
    text = MANUAL.read_text()
    unchecked = re.findall(r"(?m)^\s*-\s*\[\s\]\s+(.+)$", text)
    if unchecked:
        for item in unchecked[:10]:
            fail(f"manual checklist incomplete: {item}")
        return False
    if "waived" in text.lower():
        return ok("manual checklist complete with recorded waiver")
    return ok("manual checklist complete")


def phases_passed(run: dict) -> bool:
    phases = run.get("phases", [])
    if not phases:
        return ok("no phase list recorded; treating as single-phase or externally tracked")
    result = True
    for phase in phases:
        if phase.get("status") not in ("completed", "passed"):
            result &= fail(f"phase {phase.get('id')}: status is {phase.get('status')!r}")
    if result:
        ok("all recorded phases completed")
    return result


def verification_passed(run: dict) -> bool:
    last = run.get("lastVerification") or {}
    if last.get("status") != "passed":
        return fail("lastVerification is missing or not passed")
    return ok("lastVerification passed")


def preview_recorded(run: dict) -> bool:
    preview = run.get("preview")
    if preview:
        return ok("preview recorded in run.json")
    if MANUAL.exists() and re.search(r"(?im)^-\s*\[x\].*app/service started", MANUAL.read_text()):
        return ok("preview confirmed in manual checklist")
    return fail("preview is not recorded")


def clean_git() -> bool:
    try:
        status = subprocess.check_output(["git", "status", "--short"], text=True).strip()
    except Exception as exc:
        return fail(f"cannot read git status: {exc}")
    if status:
        print(status)
        return fail("working tree has uncommitted changes")
    return ok("working tree clean")


def main() -> int:
    print("=== SDLC Release Readiness ===")
    run = load_run()
    result = True

    status = run.get("status")
    if status not in ("implemented", "verifying", "verified", "ready-for-release"):
        result &= fail(f"run.json status {status!r} is not release-ready")
    else:
        ok(f"run.json status is {status}")

    active = run.get("activeChange")
    if not active:
        result &= fail("run.json activeChange is empty")
    elif not change_dir(active).is_dir():
        result &= fail(f"active change not found: {active}")
    else:
        ok(f"active change exists: {active}")

    changes = [active] if active else []
    changes.extend(run.get("associatedChanges") or [])
    for change in changes:
        result &= required_artifacts_exist(change)
        result &= tasks_complete(change)

    result &= phases_passed(run)
    result &= verification_passed(run)
    result &= preview_recorded(run)
    result &= manual_checklist_passed()
    result &= clean_git()

    if not Path(".github/workflows").exists():
        result &= fail("missing .github/workflows directory")
    else:
        ok("CI workflow directory exists")

    if result:
        print("\nAll release gates passed.")
        return 0
    print("\nRelease gates failed.", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
