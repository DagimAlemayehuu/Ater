import multiprocessing
import uvicorn
import argparse
import sys
import os
import logging
from pathlib import Path

# Configure emergency logging for startup issues
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

if __name__ == "__main__":
    # REQUIRED for PyInstaller on Windows to prevent infinite spawn loops
    multiprocessing.freeze_support() 
    
    try:
        parser = argparse.ArgumentParser(description="Ater Sidecar API")
        parser.add_argument("--port", type=int, default=8765, help="Port to run the sidecar on")
        parser.add_argument("--host", type=str, default="127.0.0.1", help="Host to bind to")
        args = parser.parse_args()
        
        logger.info(f"Starting Ater Sidecar on {args.host}:{args.port}")
        
        # Verify we can import the app
        try:
            from src.api.main import app
            logger.info("Successfully imported FastAPI app from src.api.main")
        except ImportError as e:
            logger.error(f"Failed to import FastAPI app: {e}")
            logger.error(f"Current sys.path: {sys.path}")
            logger.error(f"Current working directory: {os.getcwd()}")
            sys.exit(1)
            
        uvicorn.run(
            app, 
            host=args.host, 
            port=args.port,
            log_level="info",
            access_log=False
        )
    except Exception as e:
        logger.error(f"Fatal error during sidecar startup: {e}", exc_info=True)
        sys.exit(1)
