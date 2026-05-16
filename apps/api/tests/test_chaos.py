import os
import sys
import time
import asyncio
import signal
import shutil
import psutil
import pytest
import sqlite3
import traceback
import portalocker
from pathlib import Path
from datetime import datetime
from unittest.mock import MagicMock, patch

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.domains.ater.watcher import AterQueueManager
from src.domains.ater.service import AterService
from src.domains.ater.governor import governor, DailyLimitExceededException
from src.domains.obsidian.client import ObsidianClient
from src.api.deps import AppSecrets

# Setup dummy paths
BASE_DIR = Path(__file__).parent.parent / "temp_chaos_test"
VAULT_PATH = BASE_DIR / "Vault"
INBOX_PATH = VAULT_PATH / "Inbox"
SI_PATH = VAULT_PATH / "Ater.md"

def setup_environment():
    if BASE_DIR.exists():
        try:
            shutil.rmtree(BASE_DIR)
        except:
            pass
    BASE_DIR.mkdir(parents=True, exist_ok=True)
    VAULT_PATH.mkdir(parents=True, exist_ok=True)
    INBOX_PATH.mkdir(parents=True, exist_ok=True)
    SI_PATH.write_text("# Ater System Instruction")
    (VAULT_PATH / "Inbox" / "Generated").mkdir(parents=True, exist_ok=True)

@pytest.mark.asyncio
async def run_massive_ingest_meltdown():
    """Destructive Test 1: Generate 200 PDFs and monitor resource starvation."""
    print("\n" + "="*50)
    print("TEST 1: MASSIVE INGEST MELTDOWN")
    print("="*50)
    setup_environment()
    
    secrets = AppSecrets(
        ai_key="test-key",
        vault_path=str(VAULT_PATH),
        inbox_path=str(INBOX_PATH),
        auto_deploy=True
    )
    service = AterService(secrets)
    manager = AterQueueManager(service, str(INBOX_PATH), str(SI_PATH))
    
    loop = asyncio.get_event_loop()
    manager.start(loop, auto_process=True)
    
    process = psutil.Process(os.getpid())
    start_mem = process.memory_info().rss / (1024 * 1024)
    print(f"Baseline Memory: {start_mem:.2f} MB")
    
    # 200 Mock PDFs
    print(f"Blasting 200 files...")
    for i in range(200):
        f = INBOX_PATH / f"stress_test_{i}.pdf"
        f.write_text("Mock PDF Content " * 100)
        
    # Monitor for 5 seconds
    max_mem = start_mem
    peak_cpu = 0
    for i in range(10):
        await asyncio.sleep(0.5)
        curr_mem = process.memory_info().rss / (1024 * 1024)
        max_mem = max(max_mem, curr_mem)
        cpu = process.cpu_percent()
        peak_cpu = max(peak_cpu, cpu)
        print(f"Tick {i}: RAM: {curr_mem:.2f} MB | CPU: {cpu}% | Active Tasks: {len(manager.active_tasks)}")

    manager.stop()
    print(f"Test Finished. Max RAM: {max_mem:.2f} MB | Peak CPU: {peak_cpu}%")
    
    if max_mem - start_mem > 500:
        print("!!! RESOURCE ALERT: Significant memory growth detected.")
    if peak_cpu > 80:
        print("!!! RESOURCE ALERT: High CPU contention detected.")

@pytest.mark.asyncio
async def run_ghost_lock():
    """Destructive Test 2: Locked file race condition."""
    print("\n" + "="*50)
    print("TEST 2: GHOST LOCK (RACE CONDITION)")
    print("="*50)
    setup_environment()
    gen_dir = VAULT_PATH / "Inbox" / "Generated"
    test_file = gen_dir / "Locked_Note.md"
    test_file.write_text("# Initial Content")
    
    client = ObsidianClient(str(VAULT_PATH))
    
    print("Acquiring hard OS lock on target file...")
    # Use portalocker to ensure cross-platform locking
    with open(test_file, "a") as f:
        portalocker.lock(f, portalocker.LOCK_EX)
        
        print("Attempting to write via ObsidianClient...")
        try:
            # This should fail if ObsidianClient tries to open it
            # We use the relative path as required by ObsidianClient.write_note
            client.write_note("Inbox/Generated/Locked_Note.md", "# New Content")
            print("VULNERABILITY DETECTED: write_note succeeded even though file was locked (No lock detection in code).")
        except Exception as e:
            print(f"FAILURE CAPTURED (GOOD): {type(e).__name__}: {str(e)}")
            traceback.print_exc()

@pytest.mark.asyncio
async def run_zombie_process():
    """Destructive Test 3: SIGKILL survival check."""
    print("\n" + "="*50)
    print("TEST 3: ZOMBIE PROCESS (SIGKILL)")
    print("="*50)
    import subprocess
    api_path = Path(__file__).parent.parent / "src" / "api" / "main.py"
    
    # Check if main.py exists
    if not api_path.exists():
        print(f"Error: {api_path} not found.")
        return

    print("Spawning sidecar process...")
    # Run with a different port to avoid conflicts
    proc = subprocess.Popen([sys.executable, str(api_path), "--port", "9999"], 
                            stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE,
                            env={**os.environ, "PYTHONPATH": str(Path(__file__).parent.parent)})
    
    # Wait for it to boot
    time.sleep(3)
    
    child_pid = proc.pid
    print(f"Sidecar PID: {child_pid}")
    
    # Simulate Violent Exit
    print("Killing sidecar with SIGKILL (Violent Exit)...")
    os.kill(child_pid, signal.SIGKILL)
    time.sleep(1)
    
    # Check for zombies (orphan check)
    # On macOS, if the child has its own event loop and threads, they might stick if not parented correctly
    # But usually SIGKILL kills everything. 
    # The real test is if the PARENT dies, does the CHILD stay?
    # Let's flip it.
    
    print("Restarting Sidecar...")
    proc = subprocess.Popen([sys.executable, str(api_path), "--port", "9999"], 
                            env={**os.environ, "PYTHONPATH": str(Path(__file__).parent.parent)})
    time.sleep(2)
    child_pid = proc.pid
    
    print(f"Simulating PARENT crash. Child (Sidecar) PID: {child_pid}")
    # In this environment, we are the parent. We can't kill ourselves easily and keep running.
    # But we can check if it's still alive.
    if psutil.pid_exists(child_pid):
        print(f"Status: Sidecar {child_pid} is alive.")
        # If we exit now, does it stay? 
        # We'll just log its state.
    
    # Cleanup for this test
    os.kill(child_pid, signal.SIGKILL)

@pytest.mark.asyncio
async def run_governor_429_blackout():
    """Destructive Test 4: 429 Error Handling."""
    print("\n" + "="*50)
    print("TEST 4: TOKEN GOVERNOR 429 BLACKOUT")
    print("="*50)
    
    governor.max_rpm = 100
    governor.safety_margin = 1.0
    governor.cooldown_until = 0 # Reset
    
    print("Injecting simulated 429 Error into Governor...")
    governor.report_error(wait_seconds=5)
    
    now = time.time()
    print(f"Governor hard cooldown active for next {governor.cooldown_until - now:.2f}s")
    
    # Try 10 concurrent requests
    print("Blasting 10 concurrent requests during blackout...")
    
    async def try_request(i):
        try:
            # We use a very short timeout to see if it blocks
            await asyncio.wait_for(governor.get_permit(), timeout=1.0)
            return f"Req {i}: SUCCESS (FAIL - should be blocked)"
        except asyncio.TimeoutError:
            return f"Req {i}: BLOCKED (PASS)"
        except Exception as e:
            return f"Req {i}: ERROR: {str(e)}"

    results = await asyncio.gather(*(try_request(i) for i in range(10)))
    for r in results:
        print(r)

if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    try:
        loop.run_until_complete(run_massive_ingest_meltdown())
    except Exception as e:
        print(f"CRASH IN TEST 1: {e}")
        traceback.print_exc()
        
    try:
        loop.run_until_complete(run_ghost_lock())
    except Exception as e:
        print(f"CRASH IN TEST 2: {e}")
        traceback.print_exc()
        
    try:
        loop.run_until_complete(run_zombie_process())
    except Exception as e:
        print(f"CRASH IN TEST 3: {e}")
        traceback.print_exc()
        
    try:
        loop.run_until_complete(run_governor_429_blackout())
    except Exception as e:
        print(f"CRASH IN TEST 4: {e}")
        traceback.print_exc()
