#!/usr/bin/env python3
"""Validate .sdlc/run.json shape and cross-file consistency."""

from __future__ import annotations

import json
import sys
from pathlib import Path

RUN_JSON = Path(".sdlc/run.json")
VALID_STATUSES = {
    "initialized",
    "planned",
    "implementing",
    "implemented",
    "verifying",
    "verified",
    "ready-for-release",
    "archived",
    "blocked",
}


def err(message: str) -> bool:
    print(f"[-] {message}", file=sys.stderr)
    return False


def ok(message: str) -> bool:
    print(f"[+] {message}")
    return True


def main() -> int:
    passed = True
    if not RUN_JSON.exists():
        print("[-] Missing .sdlc/run.json", file=sys.stderr)
        return 1
    try:
        data = json.loads(RUN_JSON.read_text())
    except Exception as exc:
        print(f"[-] Invalid JSON: {exc}", file=sys.stderr)
        return 1

    status = data.get("status")
    if status not in VALID_STATUSES:
        passed &= err(f"status {status!r} is not valid")
    else:
        ok(f"status is {status}")

    for key in ("phases", "blockers", "associatedChanges"):
        if key in data and not isinstance(data[key], list):
            passed &= err(f"{key} must be a list")

    active = data.get("activeChange")
    if status not in ("initialized", "archived") and not active:
        passed &= err("activeChange is required for active workflow statuses")
    if active and status != "archived" and not Path("openspec/changes", active).is_dir():
        passed &= err(f"activeChange directory missing: openspec/changes/{active}")

    for change in data.get("associatedChanges") or []:
        if not Path("openspec/changes", change).is_dir():
            passed &= err(f"associated change directory missing: {change}")

    for phase in data.get("phases") or []:
        if "id" not in phase or "status" not in phase or "name" not in phase:
            passed &= err(f"phase missing id/name/status: {phase}")
        if not isinstance(phase.get("verification", []), list):
            passed &= err(f"phase {phase.get('id')} verification must be a list")

    if passed:
        print("run.json is valid.")
        return 0
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
