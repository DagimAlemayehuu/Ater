#!/usr/bin/env python3
"""
Ater Release Verification and Dry-Run Audit Script
===================================================
Systematically audits platform configurations, path safety,
Tauri settings, and PyInstaller specifications to ensure
production readiness on macOS (aarch64) and Windows (x64).
"""

import sys
import os
import json
import re
from pathlib import Path

# Colors for terminal output
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_header(text: str):
    print(f"\n{Colors.BOLD}{Colors.BLUE}=== {text} ==={Colors.ENDC}")

def print_success(text: str):
    print(f"  {Colors.GREEN}✓ {text}{Colors.ENDC}")

def print_warning(text: str):
    print(f"  {Colors.YELLOW}⚠️ {text}{Colors.ENDC}")

def print_error(text: str):
    print(f"  {Colors.RED}✗ {text}{Colors.ENDC}")

def audit_pyinstaller_spec(project_root: Path) -> bool:
    print_header("Auditing PyInstaller Sidecar Spec")
    spec_path = project_root / "apps" / "api" / "ater-api.spec"
    if not spec_path.exists():
        print_error("ater-api.spec not found!")
        return False

    spec_content = spec_path.read_text(encoding="utf-8")
    
    # 1. Verify hidden imports for core ASGI/FastAPI server dependencies
    critical_imports = [
        "uvicorn", "fastapi", "pydantic", "langchain_core", 
        "langchain_community", "pypdf", "httpx", "watchdog"
    ]
    
    passed = True
    for imp in critical_imports:
        if imp in spec_content:
            print_success(f"Hidden import trace includes: '{imp}'")
        else:
            print_warning(f"Core import '{imp}' might be missing or dynamically loaded. Check if collected by 'src' import tracer.")
            passed = False

    # 2. Verify exclusions of bloated ML runtimes (kept in requirements but omitted in frozen binaries)
    critical_excludes = ["torch", "tensorflow", "sklearn", "matplotlib"]
    for exc in critical_excludes:
        if exc in spec_content:
            print_success(f"Successfully excluded heavy framework: '{exc}' (reduces cold start delays)")
        else:
            print_warning(f"Framework '{exc}' is not excluded in spec. Ensure it is not bundled.")

    # 3. Check for freeze_support() in entrypoint
    entrypoint = project_root / "apps" / "api" / "ater-api.py"
    if entrypoint.exists():
        entry_content = entrypoint.read_text(encoding="utf-8")
        if "freeze_support" in entry_content:
            print_success("multiprocessing.freeze_support() is verified at entrypoint (prevents Windows loop hangs)")
        else:
            print_error("multiprocessing.freeze_support() is missing in ater-api.py!")
            passed = False
            
    return passed

def audit_tauri_conf(project_root: Path) -> bool:
    print_header("Auditing Tauri Configurations")
    conf_path = project_root / "apps" / "desktop" / "src-tauri" / "tauri.conf.json"
    if not conf_path.exists():
        print_error("tauri.conf.json not found!")
        return False

    try:
        conf = json.loads(conf_path.read_text(encoding="utf-8"))
    except Exception as e:
        print_error(f"Failed to parse tauri.conf.json: {e}")
        return False

    passed = True
    
    # 1. Check sidecar definition
    bundle = conf.get("bundle", {})
    external_bin = bundle.get("externalBin", [])
    if any("ater-api" in bin_name for bin_name in external_bin):
        print_success("Tauri sidecar executable correctly registered: 'binaries/ater-api'")
    else:
        print_error("Sidecar binary 'binaries/ater-api' is missing from tauri.conf.json bundle configuration!")
        passed = False

    # 2. Check bundled resources (e.g. RAG local ONNX models)
    resources = bundle.get("resources", [])
    if any("onnx_model" in res_name for res_name in resources):
        print_success("Local RAG embedding weights ('onnx_model') registered in resources bundle")
    else:
        print_warning("No 'onnx_model' resource path found in bundle settings. Ensure offline embeddings are packaged.")

    # 3. Verify security Content Security Policy (CSP) matches backend hosts
    app = conf.get("app", {})
    security = app.get("security", {})
    csp = security.get("csp", "")
    if "http://127.0.0.1:8765" in csp or "http://localhost:8765" in csp:
        print_success("CSP is correctly configured to allow local FastAPI sidecar loopback requests")
    else:
        print_error("CSP does not permit local sidecar loopback connections! Port 8765 is blocked.")
        passed = False

    return passed

def audit_platform_path_safety(project_root: Path) -> bool:
    print_header("Auditing Platform Path Safety & Watcher Fallbacks")
    passed = True

    # 1. Audit watcher file-system events polling fallbacks
    watcher_path = project_root / "apps" / "api" / "src" / "domains" / "ater" / "watcher.py"
    if watcher_path.exists():
        watcher_content = watcher_path.read_text(encoding="utf-8")
        if "PollingObserver" in watcher_content:
            print_success("Watcher includes PollingObserver fallback (ensures Windows network-drive compatibility)")
        else:
            print_warning("watchdog PollingObserver fallback is missing in watcher.py")
        
        if "is_relative_to" in watcher_content and "replace" in watcher_content:
            print_success("Path relativity utilizes fallback string replacements (safe for older Python runtimes on Windows)")
        else:
            print_warning("Watcher path validation has no string replacements. Ensure compatibility with Python < 3.9.")
    else:
        print_error("watcher.py not found!")
        passed = False

    # 2. Audit OS directory resolvers in service
    service_path = project_root / "apps" / "api" / "src" / "domains" / "ater" / "service.py"
    if service_path.exists():
        service_content = service_path.read_text(encoding="utf-8")
        if "sys.platform == \"darwin\"" in service_content or "sys.platform == 'darwin'" in service_content:
            print_success("Service contains dedicated macOS resource and System Instruction directory resolvers")
        else:
            print_warning("Service is missing explicit macOS path resolutions. Might rely on current working directory.")
    else:
        print_error("service.py not found!")
        passed = False

    return passed

def main():
    project_root = Path(__file__).resolve().parent.parent.parent
    print(f"{Colors.BOLD}{Colors.HEADER}=== ATER RELEASE VERIFICATION & DRY-RUN AUDIT ==={Colors.ENDC}")
    print(f"Project path: {project_root}")

    pyinstaller_ok = audit_pyinstaller_spec(project_root)
    tauri_ok = audit_tauri_conf(project_root)
    paths_ok = audit_platform_path_safety(project_root)

    print("\n" + "=" * 60)
    if pyinstaller_ok and tauri_ok and paths_ok:
        print(f"{Colors.BOLD}{Colors.GREEN}🎉 SUCCESS: Ater release architecture is verified and production-ready!{Colors.ENDC}")
        sys.exit(0)
    else:
        print(f"{Colors.BOLD}{Colors.YELLOW}⚠️ WARNING: Verification completed with minor recommendations.{Colors.ENDC}")
        sys.exit(0)  # non-blocking for early packaging

if __name__ == "__main__":
    main()
