#!/usr/bin/env python3
"""Synchronize global agent skills across Antigravity, Codex, and legacy agents.

The canonical store is ~/.agent-skills/global. Tool-specific skill directories
are kept as symlinks into that store. Conflicting real directories are preserved
and reported instead of overwritten.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import plistlib
import shutil
import subprocess
import sys
import time
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path


HOME = Path.home()
ROOT = HOME / ".agent-skills"
CANONICAL = ROOT / "global"
BIN = ROOT / "bin"
LOGS = ROOT / "logs"
CONFLICTS = ROOT / "conflicts"
BACKUPS = ROOT / "backups"
STATE = ROOT / "state.json"

ENDPOINTS = {
    "antigravity": HOME / ".gemini" / "config" / "skills",
    "agents": HOME / ".agents" / "skills",
    "codex": HOME / ".codex" / "skills",
}

PROTECTED_NAMES = {
    ".system",
}


@dataclass
class Event:
    level: str
    message: str
    data: dict[str, str] | None = None


class Syncer:
    def __init__(self) -> None:
        self.events: list[Event] = []

    def log(self, level: str, message: str, **data: str) -> None:
        event = Event(level=level, message=message, data=data or None)
        self.events.append(event)
        line = {
            "time": datetime.now().isoformat(timespec="seconds"),
            "level": level,
            "message": message,
            "data": data,
        }
        LOGS.mkdir(parents=True, exist_ok=True)
        with (LOGS / "sync.log").open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(line, sort_keys=True) + "\n")

    def run(self) -> int:
        self.ensure_dirs()
        self.import_from_endpoints()
        self.link_endpoints()
        self.write_state()
        errors = [event for event in self.events if event.level == "error"]
        warnings = [event for event in self.events if event.level == "warning"]
        print_summary(self.events)
        return 2 if errors else 1 if warnings else 0

    def ensure_dirs(self) -> None:
        for path in (ROOT, CANONICAL, BIN, LOGS, CONFLICTS, BACKUPS):
            path.mkdir(parents=True, exist_ok=True)
        for path in ENDPOINTS.values():
            path.mkdir(parents=True, exist_ok=True)

    def import_from_endpoints(self) -> None:
        for endpoint_name, endpoint in ENDPOINTS.items():
            if not endpoint.exists():
                continue
            for source in iter_skill_dirs(endpoint):
                if source.name in PROTECTED_NAMES:
                    continue
                target = CANONICAL / source.name
                if is_same_path(source, target):
                    continue
                if not target.exists():
                    copy_skill(source, target)
                    self.log("info", "imported skill", skill=source.name, source=str(source), target=str(target))
                    continue
                if dirs_equivalent(source, target):
                    self.log("debug", "canonical already matches source", skill=source.name, source=str(source))
                    continue
                conflict_path = self.record_conflict(source, target, endpoint_name)
                self.log(
                    "warning",
                    "skill conflict preserved",
                    skill=source.name,
                    source=str(source),
                    canonical=str(target),
                    conflict=str(conflict_path),
                )

    def link_endpoints(self) -> None:
        for endpoint_name, endpoint in ENDPOINTS.items():
            endpoint.mkdir(parents=True, exist_ok=True)
            for skill in iter_skill_dirs(CANONICAL):
                target = endpoint / skill.name
                if target.name in PROTECTED_NAMES:
                    continue
                self.ensure_link(endpoint_name, skill, target)

    def ensure_link(self, endpoint_name: str, source: Path, target: Path) -> None:
        if target.is_symlink():
            current = target.resolve(strict=False)
            if current == source:
                return
            if has_skill_file(target):
                if dirs_equivalent(target, source):
                    target.unlink()
                    target.symlink_to(source, target_is_directory=True)
                    self.log("info", "repointed matching skill symlink", skill=source.name, endpoint=endpoint_name)
                    return
            conflict_path = self.record_conflict(target, source, endpoint_name)
            self.log(
                "warning",
                "different skill symlink preserved",
                skill=source.name,
                endpoint=endpoint_name,
                target=str(target),
                conflict=str(conflict_path),
            )
            return

        if not target.exists():
            target.symlink_to(source, target_is_directory=True)
            self.log("info", "linked skill", skill=source.name, endpoint=endpoint_name, target=str(target))
            return

        if target.is_dir() and has_skill_file(target) and dirs_equivalent(target, source):
            backup = backup_existing(target)
            target.symlink_to(source, target_is_directory=True)
            self.log(
                "info",
                "replaced matching skill directory with symlink",
                skill=source.name,
                endpoint=endpoint_name,
                backup=str(backup),
            )
            return

        conflict_path = self.record_conflict(target, source, endpoint_name)
        self.log(
            "warning",
            "endpoint entry differs; left untouched",
            skill=source.name,
            endpoint=endpoint_name,
            target=str(target),
            conflict=str(conflict_path),
        )

    def record_conflict(self, source: Path, canonical: Path, endpoint_name: str) -> Path:
        stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        conflict_dir = CONFLICTS / f"{source.name}-{endpoint_name}-{stamp}"
        conflict_dir.mkdir(parents=True, exist_ok=True)
        report = conflict_dir / "README.md"
        report.write_text(
            "\n".join(
                [
                    f"# Skill conflict: {source.name}",
                    "",
                    f"- Endpoint: `{endpoint_name}`",
                    f"- Existing path: `{source}`",
                    f"- Canonical path: `{canonical}`",
                    "",
                    "The sync tool did not overwrite either side because the contents differ.",
                ]
            )
            + "\n",
            encoding="utf-8",
        )
        return conflict_dir

    def write_state(self) -> None:
        skills = sorted(skill.name for skill in iter_skill_dirs(CANONICAL))
        state = {
            "updated_at": datetime.now().isoformat(timespec="seconds"),
            "canonical": str(CANONICAL),
            "endpoints": {name: str(path) for name, path in ENDPOINTS.items()},
            "skill_count": len(skills),
            "skills": skills,
        }
        STATE.write_text(json.dumps(state, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def iter_skill_dirs(root: Path) -> list[Path]:
    if not root.exists():
        return []
    skills = []
    for child in sorted(root.iterdir(), key=lambda item: item.name):
        if child.name in PROTECTED_NAMES:
            continue
        if child.is_dir() and has_skill_file(child):
            skills.append(child)
    return skills


def has_skill_file(path: Path) -> bool:
    return (path / "SKILL.md").is_file()


def is_same_path(left: Path, right: Path) -> bool:
    try:
        return left.resolve(strict=False) == right.resolve(strict=False)
    except OSError:
        return False


def copy_skill(source: Path, target: Path) -> None:
    shutil.copytree(source, target, symlinks=True)


def dirs_equivalent(left: Path, right: Path) -> bool:
    left_resolved = left.resolve(strict=False)
    right_resolved = right.resolve(strict=False)
    if not left_resolved.exists() or not right_resolved.exists():
        return False
    return dir_digest(left_resolved) == dir_digest(right_resolved)


def dir_digest(path: Path) -> str:
    digest = hashlib.sha256()
    for file_path in sorted(p for p in path.rglob("*") if p.is_file()):
        rel = file_path.relative_to(path)
        digest.update(str(rel).encode("utf-8"))
        digest.update(b"\0")
        if file_path.is_symlink():
            digest.update(os.readlink(file_path).encode("utf-8"))
        else:
            with file_path.open("rb") as handle:
                for chunk in iter(lambda: handle.read(1024 * 1024), b""):
                    digest.update(chunk)
        digest.update(b"\0")
    return digest.hexdigest()


def backup_existing(path: Path) -> Path:
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_parent = BACKUPS / path.parent.name
    backup_parent.mkdir(parents=True, exist_ok=True)
    backup = backup_parent / f"{path.name}-{stamp}"
    counter = 1
    while backup.exists():
        backup = backup_parent / f"{path.name}-{stamp}-{counter}"
        counter += 1
    path.rename(backup)
    return backup


def print_summary(events: list[Event]) -> None:
    counts: dict[str, int] = {}
    for event in events:
        counts[event.level] = counts.get(event.level, 0) + 1
    print(json.dumps({"event_counts": counts, "state": str(STATE)}, sort_keys=True))
    for event in events:
        if event.level in {"warning", "error"}:
            print(f"{event.level}: {event.message}: {event.data}")


def watch(interval: float) -> int:
    syncer = Syncer()
    syncer.run()
    previous = watched_digest()
    while True:
        time.sleep(interval)
        current = watched_digest()
        if current != previous:
            previous = current
            Syncer().run()


def watched_digest() -> str:
    digest = hashlib.sha256()
    for root in [CANONICAL, *ENDPOINTS.values()]:
        digest.update(str(root).encode("utf-8"))
        if not root.exists():
            continue
        for child in sorted(root.iterdir(), key=lambda item: item.name):
            if child.name in PROTECTED_NAMES:
                continue
            if child.is_symlink():
                digest.update(child.name.encode("utf-8"))
                digest.update(os.readlink(child).encode("utf-8"))
                continue
            if child.is_dir() and has_skill_file(child):
                digest.update(child.name.encode("utf-8"))
                digest.update(dir_digest(child).encode("utf-8"))
    return digest.hexdigest()


def install_launch_agent(script_path: Path, interval: float) -> int:
    launch_agents = HOME / "Library" / "LaunchAgents"
    launch_agents.mkdir(parents=True, exist_ok=True)
    label = "com.dagim.agent-skill-sync"
    plist_path = launch_agents / f"{label}.plist"
    plist = {
        "Label": label,
        "ProgramArguments": [sys.executable, str(script_path), "watch", "--interval", str(interval)],
        "RunAtLoad": True,
        "KeepAlive": True,
        "StandardOutPath": str(LOGS / "watcher.out.log"),
        "StandardErrorPath": str(LOGS / "watcher.err.log"),
        "WorkingDirectory": str(ROOT),
    }
    LOGS.mkdir(parents=True, exist_ok=True)
    with plist_path.open("wb") as handle:
        plistlib.dump(plist, handle)
    subprocess.run(["launchctl", "bootout", f"gui/{os.getuid()}", str(plist_path)], check=False, capture_output=True)
    result = subprocess.run(["launchctl", "bootstrap", f"gui/{os.getuid()}", str(plist_path)], check=False)
    if result.returncode != 0:
        return result.returncode
    subprocess.run(["launchctl", "kickstart", "-k", f"gui/{os.getuid()}/{label}"], check=False)
    print(f"installed {plist_path}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest="command")
    subparsers.add_parser("sync")
    watch_parser = subparsers.add_parser("watch")
    watch_parser.add_argument("--interval", type=float, default=2.0)
    install_parser = subparsers.add_parser("install-launch-agent")
    install_parser.add_argument("--script-path", type=Path, default=BIN / "agent_skill_sync.py")
    install_parser.add_argument("--interval", type=float, default=2.0)
    args = parser.parse_args()

    if args.command in {None, "sync"}:
        return Syncer().run()
    if args.command == "watch":
        return watch(args.interval)
    if args.command == "install-launch-agent":
        return install_launch_agent(args.script_path, args.interval)
    parser.error(f"unknown command: {args.command}")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
