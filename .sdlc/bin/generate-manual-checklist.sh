#!/usr/bin/env python3
"""Generate .sdlc/manual-checklist.md from OpenSpec scenarios."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
from pathlib import Path

RUN_JSON = Path(".sdlc/run.json")
OUT = Path(".sdlc/manual-checklist.md")


def resolve_change(arg: str | None) -> str:
    if arg:
        return arg
    try:
        return subprocess.check_output(
            [".sdlc/bin/resolve-active-change.sh"], text=True
        ).strip()
    except Exception:
        if RUN_JSON.exists():
            return json.loads(RUN_JSON.read_text()).get("activeChange") or ""
    return ""


def scenario_blocks(change: str) -> list[tuple[str, str]]:
    base = Path("openspec/changes") / change
    files = []
    files.extend(base.glob("spec.md"))
    files.extend(base.glob("specs/*/spec.md"))
    blocks = []
    for path in sorted(files):
        text = path.read_text()
        req = "Unknown requirement"
        for line in text.splitlines():
            r = re.match(r"^###\s+Requirement:\s*(.+)", line)
            if r:
                req = r.group(1).strip()
            s = re.match(r"^####\s+Scenario:\s*(.+)", line)
            if s:
                blocks.append((req, s.group(1).strip()))
    return blocks


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("change", nargs="?")
    parser.add_argument("--preview", default="<command or URL>")
    parser.add_argument("--branch", default="")
    args = parser.parse_args()

    change = resolve_change(args.change)
    if not change:
        print("Could not resolve active change.")
        return 1

    run = json.loads(RUN_JSON.read_text()) if RUN_JSON.exists() else {}
    branch = args.branch or run.get("branch") or "<branch/worktree>"
    preview = args.preview
    if isinstance(run.get("preview"), dict):
        preview = run["preview"].get("command") or run["preview"].get("url") or preview
    elif run.get("preview"):
        preview = str(run["preview"])

    lines = [
        f"# Manual Verification: {change}",
        "",
        "## Preview",
        f"- [ ] Running updated branch/worktree: {branch}",
        f"- [ ] App/service started with: {preview}",
        "",
        "## Checks",
    ]

    scenarios = scenario_blocks(change)
    if scenarios:
        for req, scenario in scenarios:
            lines.append(f"- [ ] {req} / {scenario}: verify the user-observable behavior matches the scenario.")
    else:
        lines.append("- [ ] Verify the primary user-facing behavior described in the OpenSpec proposal.")

    lines.extend(
        [
            "",
            "## Regression Checks",
            "- [ ] Existing critical workflow still works for the affected area.",
            "",
            "## Result",
            "- [ ] All required manual checks passed",
        ]
    )

    OUT.write_text("\n".join(lines) + "\n")
    print(f"Generated {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
