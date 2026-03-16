import os
import subprocess
import sys
import shutil
import platform
from pathlib import Path

def get_target_triple():
    system = platform.system().lower()
    machine = platform.machine().lower()
    
    if system == "darwin":
        if machine == "arm64":
            return "aarch64-apple-darwin"
        return "x86_64-apple-darwin"
    elif system == "windows":
        return "x86_64-pc-windows-msvc"
    elif system == "linux":
        return "x86_64-unknown-linux-gnu"
    return f"{machine}-unknown-{system}"

def build():
    # 1. Configuration
    triple = get_target_triple()
    entry_point = "src/api/main.py"
    binary_name = "life-os-api"
    dist_path = Path("dist")
    tauri_bin_dir = Path("../desktop/src-tauri/binaries")
    
    print(f"[*] Building sidecar for {triple}...")
    
    # 2. PyInstaller command
    # --onefile: bundle into a single executable
    # --name: the name of the executable
    # --additional-hooks-dir: for specific packages if needed
    cmd = [
        "pyinstaller",
        "--onefile",
        "--name", binary_name,
        "--clean",
        # Include any hidden imports if necessary
        "--hidden-import", "uvicorn.protocols.http.httptools_impl",
        "--hidden-import", "uvicorn.protocols.http.h11_impl",
        "--hidden-import", "uvicorn.protocols.websockets.websockets_impl",
        "--hidden-import", "uvicorn.lifespan.on",
        entry_point
    ]
    
    try:
        subprocess.run(cmd, check=True)
        print("[+] PyInstaller build complete.")
    except subprocess.CalledProcessError as e:
        print(f"[-] PyInstaller failed: {e}")
        sys.exit(1)
    
    # 3. Move to Tauri binaries directory
    tauri_bin_dir.mkdir(parents=True, exist_ok=True)
    
    source_binary = dist_path / binary_name
    if platform.system() == "Windows":
        source_binary = source_binary.with_suffix(".exe")
        
    target_binary = tauri_bin_dir / f"{binary_name}-{triple}"
    if platform.system() == "Windows":
        target_binary = target_binary.with_suffix(".exe")
    
    print(f"[*] Moving binary to {target_binary}...")
    shutil.copy2(source_binary, target_binary)
    print("[+] Sidecar packaging successful.")

if __name__ == "__main__":
    build()
