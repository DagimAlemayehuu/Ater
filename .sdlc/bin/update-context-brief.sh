#!/usr/bin/env python3
# .sdlc/bin/update-context-brief.sh
# Updates .sdlc/context-brief.md from durable artifacts.

import os
import sys
import json
import subprocess

def run_cmd(cmd):
    try:
        return subprocess.check_output(cmd, shell=True, text=True).strip()
    except Exception:
        return ""

def main():
    # Attempt to resolve active change
    active_change = ""
    resolve_script = ".sdlc/bin/resolve-active-change.sh"
    if os.path.exists(resolve_script):
        active_change = run_cmd(f"bash {resolve_script}")
    
    # Read current state from run.json
    run_data = {}
    if os.path.exists(".sdlc/run.json"):
        try:
            with open(".sdlc/run.json", "r") as f:
                run_data = json.load(f)
        except Exception:
            pass

    status = run_data.get("status", "initialized")
    github_issue = run_data.get("githubIssue", "")
    current_phase = run_data.get("currentPhase", "")
    last_verification = run_data.get("lastVerification", "")

    # Overwrite with command line arguments if provided
    # Usage: update-context-brief.sh [active_change] [current_phase] [verification_result] [note]
    if len(sys.argv) > 1 and sys.argv[1]:
        active_change = sys.argv[1]
    if len(sys.argv) > 2 and sys.argv[2]:
        current_phase = sys.argv[2]
    if len(sys.argv) > 3 and sys.argv[3]:
        last_verification = sys.argv[3]
    
    note = sys.argv[4] if len(sys.argv) > 4 else ""

    # Parse specs and decisions
    decisions = []
    open_questions = []
    spec_link = "None"
    
    if active_change:
        change_dir = f"openspec/changes/{active_change}"
        spec_path = f"{change_dir}/spec.md"
        if os.path.exists(spec_path):
            spec_link = f"[{active_change} spec.md](file://{os.path.abspath(spec_path)})"
            # Read spec.md to extract Decisions and Open Questions
            try:
                with open(spec_path, "r") as f:
                    lines = f.readlines()
                
                in_decisions = False
                in_questions = False
                for line in lines:
                    if line.startswith("## Decisions"):
                        in_decisions = True
                        in_questions = False
                        continue
                    elif line.startswith("## Open Questions"):
                        in_questions = True
                        in_decisions = False
                        continue
                    elif line.startswith("##") or line.startswith("# "):
                        in_decisions = False
                        in_questions = False
                    
                    if in_decisions and line.strip() and not line.startswith("##"):
                        decisions.append(line.strip())
                    if in_questions and line.strip() and not line.startswith("##"):
                        open_questions.append(line.strip())
            except Exception as e:
                decisions.append(f"Error reading decisions: {str(e)}")

    # Format output
    brief_content = f"""# Context Brief

## Current Objective
- Active implementation/verification for change: `{active_change or 'None'}`
- Current phase: `{current_phase or 'None'}`
- Git Branch: `{run_cmd("git branch --show-current")}`

## Active OpenSpec Change
- Link to spec: {spec_link}
- GitHub Issue: {github_issue or 'None'}

## Decisions Made
"""
    if decisions:
        brief_content += "\n".join(decisions) + "\n"
    else:
        brief_content += "- No new decisions recorded in spec.md.\n"

    brief_content += "\n## Files and Artifacts That Matter\n"
    brief_content += "- [AGENTS.md](file://{})\n".format(os.path.abspath("AGENTS.md"))
    brief_content += "- [docs/CONTEXT.md](file://{})\n".format(os.path.abspath("docs/CONTEXT.md"))
    brief_content += "- [docs/SOP.md](file://{})\n".format(os.path.abspath("docs/SOP.md"))
    if active_change:
        brief_content += f"- Active Change Directory: `openspec/changes/{active_change}`\n"

    brief_content += f"""
## Verification State
- Last Verification Result: {last_verification or 'Not run yet'}

## Open Questions
"""
    if open_questions:
        brief_content += "\n".join(open_questions) + "\n"
    else:
        brief_content += "- None.\n"

    # Next command suggestion
    next_cmd = "sdlc-plan <change-description>"
    if active_change:
        if current_phase == "Plan":
            next_cmd = f"sdlc-orchestrate {active_change}"
        elif current_phase == "Orchestrate":
            next_cmd = f"sdlc-verify {active_change}"
        elif current_phase == "Verify":
            next_cmd = f"sdlc-verify --archive {active_change}"

    brief_content += f"""
## Next Agent Should
- Execute: `{next_cmd}`
"""
    if note:
        brief_content += f"- Caller Note: {note}\n"

    # Write file
    with open(".sdlc/context-brief.md", "w") as f:
        f.write(brief_content)

    print("Updated .sdlc/context-brief.md successfully.")

if __name__ == "__main__":
    main()
