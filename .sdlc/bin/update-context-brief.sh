#!/usr/bin/env python3
"""Regenerate .sdlc/context-brief.md from durable SDLC/OpenSpec state."""

from __future__ import annotations

import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

RUN_JSON = Path(".sdlc/run.json")
OUT = Path(".sdlc/context-brief.md")


def read_json(path: Path) -> dict:
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text())
    except Exception:
        return {}


def git_branch() -> str:
    try:
        return subprocess.check_output(["git", "branch", "--show-current"], text=True).strip()
    except Exception:
        return ""


def bullets_from_section(path: Path, heading: str) -> list[str]:
    if not path.exists():
        return []
    text = path.read_text()
    match = re.search(
        rf"^##\s+{re.escape(heading)}\s*$([\s\S]*?)(?=^##\s+|\Z)",
        text,
        re.MULTILINE,
    )
    if not match:
        return []
    return [
        line.strip()
        for line in match.group(1).splitlines()
        if line.strip().startswith("- ")
    ]


def task_summary(change: str) -> str:
    path = change_base(change) / "tasks.md"
    if not path.exists():
        return "tasks.md missing"
    text = path.read_text()
    total = len(re.findall(r"(?m)^\s*-\s*\[[ x/]\]\s+", text))
    done = len(re.findall(r"(?m)^\s*-\s*\[x\]\s+", text, flags=re.IGNORECASE))
    return f"{done}/{total} tasks complete"


def artifact_links(change: str) -> list[str]:
    base = change_base(change)
    links = []
    for rel in ("proposal.md", "design.md", "spec.md", "tasks.md"):
        path = base / rel
        if path.exists():
            links.append(f"- `{path}`")
    specs = sorted((base / "specs").glob("*/spec.md")) if (base / "specs").exists() else []
    for path in specs:
        links.append(f"- `{path}`")
    return links


def change_base(change: str) -> Path:
    active = Path("openspec/changes") / change
    if active.exists():
        return active
    archived = sorted(Path("openspec/changes/archive").glob(f"*-{change}"))
    if archived:
        return archived[-1]
    return active


def next_command(run: dict) -> str:
    change = run.get("activeChange")
    status = run.get("status")
    if not change:
        return "sdlc-plan <change-description>"
    if status in ("planned",):
        return f"sdlc-orchestrate {change}"
    if status in ("implementing", "blocked"):
        return f"sdlc-orchestrate {change}"
    if status in ("implemented", "verifying", "verified", "ready-for-release"):
        return f"sdlc-verify {change}"
    return f"sdlc-plan or sdlc-orchestrate {change}, depending on status"


def main() -> int:
    run = read_json(RUN_JSON)
    if len(sys.argv) > 1 and sys.argv[1]:
        run["activeChange"] = sys.argv[1]
    if len(sys.argv) > 2 and sys.argv[2]:
        run["currentPhase"] = sys.argv[2]
    note = sys.argv[3] if len(sys.argv) > 3 else ""

    active = run.get("activeChange") or ""
    associated = run.get("associatedChanges") or []
    changes = [active] + associated if active else associated

    lines = [
        "# Context Brief",
        "",
        f"Updated: {datetime.now(timezone.utc).isoformat()}",
        "",
        "## Current Objective",
        f"- Status: `{run.get('status', 'unknown')}`",
        f"- Active change: `{active or 'None'}`",
        f"- Associated changes: `{', '.join(associated) if associated else 'None'}`",
        f"- Current phase: `{run.get('currentPhase') or 'None'}`",
        f"- Git branch: `{git_branch() or 'unknown'}`",
        f"- GitHub issue: `{run.get('githubIssue') or 'None'}`",
        "",
        "## OpenSpec Artifacts",
    ]

    if changes:
        for change in changes:
            lines.append(f"- `{change}`: {task_summary(change)}")
            lines.extend(artifact_links(change))
    else:
        lines.append("- No active OpenSpec change.")

    lines.extend(["", "## Phase State"])
    phases = run.get("phases") or []
    if phases:
        for phase in phases:
            lines.append(
                f"- Phase {phase.get('id')}: {phase.get('name')} "
                f"({phase.get('status')}, attempts={phase.get('attempts', 0)})"
            )
    else:
        lines.append("- No phases recorded.")

    lines.extend(["", "## Verification State"])
    last = run.get("lastVerification") or {}
    if last:
        lines.append(f"- Last verification: `{last.get('status', 'unknown')}`")
        if last.get("profile"):
            lines.append(f"- Profile: `{last.get('profile')}`")
        if last.get("finishedAt"):
            lines.append(f"- Finished: `{last.get('finishedAt')}`")
    else:
        lines.append("- Last verification: not run")

    lines.extend(["", "## Decisions Made"])
    decisions = []
    for change in changes:
        decisions.extend(bullets_from_section(Path("openspec/changes") / change / "design.md", "Decisions"))
        decisions.extend(bullets_from_section(Path("openspec/changes") / change / "proposal.md", "Decisions"))
    lines.extend(decisions or ["- No explicit decisions extracted."])

    lines.extend(["", "## Blockers"])
    blockers = run.get("blockers") or []
    lines.extend([f"- {b}" for b in blockers] or ["- None recorded."])

    lines.extend(["", "## Next Agent Should", f"- Execute: `{next_command(run)}`"])
    if note:
        lines.append(f"- Caller note: {note}")

    OUT.write_text("\n".join(lines) + "\n")
    print(f"Updated {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
