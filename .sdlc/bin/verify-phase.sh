#!/usr/bin/env python3
"""Run SDLC verification commands and record fresh evidence in run.json."""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

RUN_JSON = Path(".sdlc/run.json")
VERIFICATION_MD = Path(".sdlc/verification.md")


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_run() -> dict:
    if not RUN_JSON.exists():
        return {}
    try:
        return json.loads(RUN_JSON.read_text())
    except Exception as exc:
        raise SystemExit(f"Cannot parse {RUN_JSON}: {exc}")


def save_run(data: dict) -> None:
    RUN_JSON.write_text(json.dumps(data, indent=2) + "\n")


def fenced_commands(text: str) -> list[str]:
    return re.findall(r"`([^`\n]+)`", text)


def section(text: str, heading: str) -> str:
    pattern = re.compile(
        rf"^##+\s+{re.escape(heading)}\s*$([\s\S]*?)(?=^##+\s+|\Z)",
        re.MULTILINE,
    )
    match = pattern.search(text)
    return match.group(1) if match else ""


def commands_from_verification(profile: str) -> list[str]:
    if not VERIFICATION_MD.exists():
        return []
    text = VERIFICATION_MD.read_text()
    if profile == "fast":
        strategy = section(text, "Test Strategy")
        match = re.search(r"\*\*Fast PR gate\*\*:\s*(.+)", strategy)
        if match:
            return fenced_commands(match.group(1))
    if profile == "full":
        local = section(text, "Local Commands")
        commands = []
        for line in local.splitlines():
            if any(
                label in line.lower()
                for label in ("lint", "typecheck", "unit tests", "build")
            ):
                commands.extend(fenced_commands(line))
        return commands
    return []


def commands_from_phase(run: dict, phase_id: int | None) -> list[str]:
    if phase_id is None:
        phase_id = run.get("currentPhase")
    if phase_id is None:
        return []
    for phase in run.get("phases", []):
        if str(phase.get("id")) == str(phase_id):
            return list(phase.get("verification") or [])
    return []


def run_command(command: str) -> dict:
    print(f"=== {command} ===")
    started = now()
    result = subprocess.run(
        command,
        shell=True,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=os.environ.copy(),
    )
    combined = (result.stdout or "") + (result.stderr or "")
    if combined:
        print(combined)
    return {
        "command": command,
        "status": "passed" if result.returncode == 0 else "failed",
        "exitCode": result.returncode,
        "startedAt": started,
        "finishedAt": now(),
        "outputTail": combined[-4000:],
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--phase", type=int)
    parser.add_argument("--profile", choices=["phase", "fast", "full"], default="phase")
    parser.add_argument("--command", action="append", default=[])
    parser.add_argument("--allow-empty", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    run = load_run()
    commands = list(args.command)
    if not commands:
        if args.profile == "phase":
            commands = commands_from_phase(run, args.phase)
        else:
            commands = commands_from_verification(args.profile)
    if not commands and not args.allow_empty:
        print(
            "No verification commands found. Add phase verification to run.json "
            "or commands to .sdlc/verification.md.",
            file=sys.stderr,
        )
        return 1

    if args.dry_run:
        print("Verification commands:")
        for command in commands:
            print(f"- {command}")
        if not commands:
            print("- none")
        return 0

    results = [run_command(command) for command in commands]
    status = "passed" if all(r["status"] == "passed" for r in results) else "failed"

    run["lastVerification"] = {
        "status": status,
        "profile": args.profile,
        "phase": args.phase if args.phase is not None else run.get("currentPhase"),
        "startedAt": results[0]["startedAt"] if results else now(),
        "finishedAt": now(),
        "results": results,
    }
    save_run(run)

    print(f"Verification {status}.")
    return 0 if status == "passed" else 1


if __name__ == "__main__":
    raise SystemExit(main())
