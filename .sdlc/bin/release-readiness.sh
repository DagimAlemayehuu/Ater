#!/usr/bin/env python3
# .sdlc/bin/release-readiness.sh
# Final check to verify all release gates are passed.

import os
import sys
import json
import re

def check_failed(reason):
    print(f"[-] GATE FAILED: {reason}", file=sys.stderr)
    return False

def check_passed(message):
    print(f"[+] GATE PASSED: {message}")
    return True

def main():
    print("=== Checking Release Readiness ===")
    all_passed = True

    # 1. Check if run.json exists
    if not os.path.exists(".sdlc/run.json"):
        all_passed &= check_failed("No .sdlc/run.json file found.")
    else:
        try:
            with open(".sdlc/run.json", "r") as f:
                run_data = json.load(f)
        except Exception as e:
            all_passed &= check_failed(f"Failed to parse .sdlc/run.json: {str(e)}")
            run_data = {}

        # 2. Check for active change
        active_change = run_data.get("activeChange")
        if not active_change:
            # Check if there are no active changes at all (meaning we are not currently working on one)
            print("[i] No active change in run.json. Checking if specs are all clean.")
        else:
            check_passed(f"Active change is: {active_change}")
            
            # 3. Check if OpenSpec tasks/spec are complete (no TBD or empty test mappings)
            spec_path = f"openspec/changes/{active_change}/spec.md"
            if os.path.exists(spec_path):
                try:
                    with open(spec_path, "r") as f:
                        spec_content = f.read()
                    
                    # Check for TBD or missing test mappings in the Acceptance Criteria table
                    if "TBD" in spec_content.upper():
                        all_passed &= check_failed(f"Spec '{spec_path}' contains placeholder TBD values.")
                    else:
                        check_passed(f"Spec '{spec_path}' has no placeholders.")
                except Exception as e:
                    all_passed &= check_failed(f"Failed to read spec: {str(e)}")
            else:
                all_passed &= check_failed(f"Spec file not found for active change: {spec_path}")

        # 4. Check if last verification passed
        last_verification = run_data.get("lastVerification")
        if not last_verification:
            all_passed &= check_failed("No verification runs logged in run.json.")
        elif last_verification.get("status") != "passed":
            all_passed &= check_failed("Last logged verification failed or was not clean.")
        else:
            check_passed("Last logged verification run passed successfully.")

    # 5. Check if CI workflow exists
    if not os.path.exists(".github/workflows/ci.yml"):
        all_passed &= check_failed("No CI workflow found at .github/workflows/ci.yml.")
    else:
        check_passed("GitHub Actions CI workflow found.")

    # 6. Check if manual checklist is present
    if not os.path.exists(".sdlc/manual-checklist.md"):
        all_passed &= check_failed("No manual checklist found at .sdlc/manual-checklist.md.")
    else:
        check_passed("Manual checklist file exists.")

    if not all_passed:
        print("\nRelease readiness checks failed. Please fix blockers before proceeding.", file=sys.stderr)
        sys.exit(1)
    
    print("\nAll release gates passed! Ready for PR/Merge.")
    sys.exit(0)

if __name__ == "__main__":
    main()
