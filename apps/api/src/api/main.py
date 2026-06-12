"""
Ater - FastAPI Sidecar Entry Point

This process is spawned by Tauri on desktop launch and communicates
exclusively via localhost HTTP. All secret keys are passed per-request
via HTTP headers (X-Gemini-Key, X-Vault-Path).
"""

import signal
import sys
import os
import argparse
import logging
from pathlib import Path
import uvicorn
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from starlette.types import ASGIApp as _ASGIApp, Receive as _Receive, Send as _Send, Scope as _Scope

# Force sys.stdout and sys.stderr to UTF-8 to prevent ascii codec errors
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
if hasattr(sys.stderr, 'reconfigure'):
    try:
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Add project root to sys.path
if getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS'):
    root_dir = Path(sys._MEIPASS)
    workspace_dir = Path(sys._MEIPASS)
else:
    root_dir = Path(__file__).parent.parent.parent.absolute()
    workspace_dir = Path(__file__).resolve().parent.parent.parent.parent.parent.absolute()

if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

# Configure Logging
log_dir = Path.home() / ".ater" / "logs"
log_dir.mkdir(parents=True, exist_ok=True)
log_file = log_dir / "sidecar.log"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(log_file, encoding="utf-8")
    ]
)
logger = logging.getLogger("Ater")
logger.info(f"Ater Sidecar starting. Logs: {log_file}")

from src.domains.obsidian.router import router as obsidian_router
from src.domains.academics.router import router as academics_router
from src.api.routers.ai import router as ai_router
from src.api.routers.ater import router as ater_router, validate_vault_path
from src.api.routers.notebooklm import router as notebooklm_router
from src.api.lifespan import ServerLifespanManager
import src.api.state as state

# Register Signal Handlers
ServerLifespanManager.register_signal_handlers()

app = FastAPI(
    title="Ater Python Sidecar",
    description="FastAPI backend sidecar for Ater. Handles AI and Obsidian logic.",
    version="0.1.0",
    lifespan=ServerLifespanManager.lifespan,
)

# CORS: Only allow the Tauri webview origin (tauri://localhost) and local dev (localhost:1420)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "tauri://localhost",
        "http://localhost:1420",
        "http://127.0.0.1:1420",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ── Vault Path Cache Middleware (pure ASGI — does NOT touch request body) ────
class _VaultPathCacheMiddleware:
    def __init__(self, app_asgi: _ASGIApp):
        self.app = app_asgi

    async def __call__(self, scope: _Scope, receive: _Receive, send: _Send):
        if scope["type"] == "http":
            for k, v in scope.get("headers", []):
                if k.lower() == b"x-vault-path":
                    vp = v.decode("utf-8", errors="ignore").strip()
                    if vp:
                        state._cached_vault_path = vp
                    break
        await self.app(scope, receive, send)

app.add_middleware(_VaultPathCacheMiddleware)

# --- PDF JS Asset Endpoints ---
import base64
from fastapi import Response

@app.get("/api/obsidian/assets/pdf.min.js")
async def get_pdf_js():
    from src.domains.obsidian.assets_data import PDF_JS_B64
    content = base64.b64decode(PDF_JS_B64)
    return Response(content=content, media_type="application/javascript")

@app.get("/api/obsidian/assets/pdf.worker.min.js")
async def get_pdf_worker_js():
    from src.domains.obsidian.assets_data import PDF_WORKER_B64
    content = base64.b64decode(PDF_WORKER_B64)
    return Response(content=content, media_type="application/javascript")

@app.get("/api/obsidian/assets/pdf_viewer.min.css")
async def get_pdf_css():
    from src.domains.obsidian.assets_data import PDF_CSS_B64
    content = base64.b64decode(PDF_CSS_B64)
    return Response(content=content, media_type="text/css")

# Mount routers
app.include_router(obsidian_router, prefix="/api", dependencies=[Depends(validate_vault_path)])
app.include_router(academics_router, prefix="/api", dependencies=[Depends(validate_vault_path)])
app.include_router(ai_router, prefix="/api")
app.include_router(ater_router, prefix="/api")
app.include_router(notebooklm_router, prefix="/api")

@app.get("/api/health")
async def health_check():
    """
    Standard health check for the sidecar.
    """
    return {"status": "ok", "version": "0.1.0"}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ater Sidecar API")
    parser.add_argument("--port", type=int, default=int(os.environ.get("API_PORT", "8765")), help="Port to run the API on")
    parser.add_argument("--host", type=str, default=os.environ.get("API_HOST", "127.0.0.1"), help="Host to bind to")
    args = parser.parse_args()

    # Start watchdog before app initializes
    ServerLifespanManager.start_watchdog()

    logger.info(f"Starting sidecar on {args.host}:{args.port}")
    uvicorn.run(
        app,
        host=args.host,
        port=args.port,
        workers=1,
        reload=False,
        log_level="warning",   # Reduce noise
        access_log=False,       # No per-request logs
    )
