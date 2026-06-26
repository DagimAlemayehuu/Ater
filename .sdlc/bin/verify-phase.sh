#!/usr/bin/env python3
# .sdlc/bin/verify-phase.sh
# Runs local verification commands and logs results to run.json.

import os
import sys
import json
import subprocess

def run_step(name, command):
    print(f"=== Running {name}: {command} ===")
    try:
        result = subprocess.run(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        success = result.returncode == 0
        output_snippet = (result.stdout + result.stderr)[-500:]  # Grab last 500 chars
        print(f"Result: {'PASS' if success else 'FAIL'}")
        if not success:
            print("--- Error Output ---")
            print(result.stdout + result.stderr)
        return success, output_snippet
    except Exception as e:
        print(f"Error executing command: {e}")
        return False, str(e)

def main():
    # Detect available steps
    # We will define a list of standard verification checks
    steps = [
        ("lint", "pnpm lint"),
        ("typecheck", "pnpm typecheck"),
        ("vitest", "pnpm --filter @ater/desktop test"),
        ("pytest", "cd apps/api && uv run python -m pytest tests/"),
        ("cargo-test", "cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml"),
        ("build", "pnpm build")
    ]
    
    results = {}
    all_passed = True
    
    for name, command in steps:
        # Run only if dependencies/tooling exists
        # In a real environment, we'd skip if the command is not configured or not relevant,
        # but here we'll try running them. We can waive pytest/cargo if directories are missing,
        # but they exist in Ater.
        success, output = run_step(name, command)
        results[name] = {
            "success": success,
            "output": output
        }
        if not success:
            all_passed = False
            # Check if this command failed but was critical
            # For Ater, all these are critical

    # Load and update run.json
    run_data = {}
    if os.path.exists(".sdlc/run.json"):
        try:
            with open(".sdlc/run.json", "r") as f:
                run_data = json.load(f)
        except Exception:
            pass

    # Update verification log
    run_data["lastVerification"] = {
        "status": "passed" if all_passed else "failed",
        "results": results
    }

    try:
        with open(".sdlc/run.json", "w") as f:
            json.dump(run_data, f, indent=2)
    except Exception as e:
        print(f"Failed to update run.json: {e}", file=sys.stderr)

    if not all_passed:
        print("Verification failed!")
        sys.exit(1)
    
    print("Verification passed!")
    sys.exit(0)

if __name__ == "__main__":
    main()
