"""
Ater Sidecar API — Entry Point

IMPORTANT: multiprocessing.freeze_support() MUST be the very first call
in the frozen binary. On Windows, PyInstaller + multiprocessing without
freeze_support() at the top level causes infinite subprocess spawn loops
that saturate the CPU and prevent the sidecar from ever binding.
"""
import multiprocessing
# freeze_support() MUST be called before ANY other imports when frozen.
# It is a no-op on non-Windows and in non-frozen mode.
multiprocessing.freeze_support()

import uvicorn
import argparse
import sys
import os
import logging
from pathlib import Path

# Configure emergency logging BEFORE importing src (catches import failures)
log_dir = Path.home() / ".ater" / "logs"
log_dir.mkdir(parents=True, exist_ok=True)
emergency_log = log_dir / "sidecar_startup.log"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(emergency_log, encoding="utf-8"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("AterStartup")
logger.info(f"=== Ater Sidecar Starting === Python {sys.version} | Frozen: {getattr(sys, 'frozen', False)}")
logger.info(f"Startup log: {emergency_log}")

# When frozen by PyInstaller, sys._MEIPASS is the temp extraction directory.
# We must add it to sys.path so that 'src.api.main' is importable.
if getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS'):
    meipass = sys._MEIPASS
    if meipass not in sys.path:
        sys.path.insert(0, meipass)
    logger.info(f"Running frozen binary. _MEIPASS: {meipass}")
    logger.info(f"sys.path: {sys.path[:5]}")

try:
    parser = argparse.ArgumentParser(description="Ater Sidecar API")
    parser.add_argument("--port", type=int, default=8765, help="Port to run the sidecar on")
    parser.add_argument("--host", type=str, default="127.0.0.1", help="Host to bind to")
    parser.add_argument("--health-check", action="store_true", help="Import the FastAPI app and exit")
    # parse_known_args avoids crash if Tauri passes extra args
    args, _ = parser.parse_known_args()

    logger.info(f"Starting Ater Sidecar on {args.host}:{args.port}")

    # Verify the FastAPI app is importable before committing to uvicorn.run()
    try:
        from src.api.main import app
        logger.info("FastAPI app imported successfully from src.api.main")
    except ImportError as e:
        logger.error(f"FATAL: Failed to import FastAPI app: {e}")
        logger.error(f"sys.path: {sys.path}")
        logger.error(f"CWD: {os.getcwd()}")
        sys.exit(1)
    except Exception as e:
        logger.error(f"FATAL: Unexpected error importing app: {e}", exc_info=True)
        sys.exit(1)

    if args.health_check:
        logger.info("Health check passed; exiting without starting uvicorn.")
        sys.exit(0)

    uvicorn.run(
        app,
        host=args.host,
        port=args.port,
        log_level="warning",   # Only warnings+ to stdout; prevents pipe buffer overflow
        access_log=False,       # Disable per-request logging
        workers=1,
    )
except Exception as e:
    logger.error(f"Fatal error during sidecar startup: {e}", exc_info=True)
    sys.exit(1)
