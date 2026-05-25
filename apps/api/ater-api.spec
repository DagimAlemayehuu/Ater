# -*- mode: python ; coding: utf-8 -*-
import os
import sys
from pathlib import Path
from PyInstaller.utils.hooks import collect_submodules, collect_data_files

# Add the apps/api directory to sys.path so we can collect submodules of 'src'
# This is required because collect_submodules needs 'src' to be importable
api_root = Path(os.getcwd()) / 'apps' / 'api'
if str(api_root) not in sys.path:
    sys.path.insert(0, str(api_root))

hiddenimports = [
    # uvicorn internals — required for --onefile frozen binary
    'uvicorn.logging',
    'uvicorn.loops',
    'uvicorn.loops.auto',
    'uvicorn.loops.asyncio',
    'uvicorn.protocols',
    'uvicorn.protocols.http',
    'uvicorn.protocols.http.auto',
    'uvicorn.protocols.http.h11_impl',
    'uvicorn.protocols.websockets',
    'uvicorn.protocols.websockets.auto',
    'uvicorn.lifespan',
    'uvicorn.lifespan.on',
    'uvicorn.lifespan.off',
    'uvicorn.config',
    'uvicorn.main',
    # FastAPI / Pydantic
    'fastapi',
    'fastapi.middleware',
    'fastapi.middleware.cors',
    'pydantic',
    'pydantic.v1',
    'pydantic_core',
    'pydantic_core._pydantic_core',
    # Langchain core
    'langchain_core',
    'langchain_core.messages',
    'langchain_core.prompts',
    'langchain_core.output_parsers',
    'langchain_core.runnables',
    # Langchain community — PDF loaders (critical for Windows)
    'langchain_community',
    'langchain_community.document_loaders',
    'langchain_community.document_loaders.pdf',
    'langchain_community.document_loaders.parsers',
    'langchain_community.document_loaders.parsers.pdf',
    'langchain_community.document_loaders.base',
    'langchain_community.document_loaders.blob_loaders',
    'langchain_community.document_loaders.blob_loaders.schema',
    # PDF libraries — pypdf is the primary PDF loader
    'pypdf',
    'pypdf._reader',
    'pypdf._writer',
    'pypdf._page',
    'pypdf.filters',
    'pypdf.generic',
    'pypdf._crypt_filters',
    'pypdf.constants',
    'pypdf._doc_common',
    # AI providers
    'langchain_google_genai',
    'langchain_openai',
    'langchain_anthropic',
    'langchain_groq',
    'google.genai',
    'google.generativeai',
    'google.api_core',
    'google.auth',
    'google.auth.transport',
    'google.auth.transport.requests',
    'openai',
    'anthropic',
    'groq',
    # Utilities
    'loguru',
    'aiosqlite',
    'sqlalchemy',
    'sqlalchemy.dialects',
    'sqlalchemy.dialects.sqlite',
    'python_multipart',
    'multipart',
    'markdown2',
    'bs4',
    'psutil',
    'ruamel.yaml',
    'ruamel.yaml.comments',
    'tokenizers',
    'charset_normalizer',
    'charset_normalizer.md__mypyc',
    # Windows-specific: httpx / httpcore used by openai/anthropic sdks
    'httpx',
    'httpcore',
    'anyio',
    'anyio._backends._asyncio',
    'anyio._backends._trio',
    'sniffio',
    # starlette (FastAPI dependency)
    'starlette',
    'starlette.middleware',
    'starlette.middleware.cors',
    'starlette.types',
    'starlette.requests',
    'starlette.responses',
    # h11 HTTP protocol library
    'h11',
    # watchdog (file system events)
    'watchdog',
    'watchdog.events',
    'watchdog.observers',
    'watchdog.observers.polling',
]

# Dynamically collect ALL submodules from the src package
try:
    hiddenimports += collect_submodules('src')
    print(f"[spec] Collected {len(hiddenimports)} hidden imports including submodules of 'src'")
except Exception as e:
    print(f"[spec] Warning: Failed to collect submodules of 'src': {e}")

# Collect data files that are NOT auto-discovered by import tracing
datas = []

# langchain_community has template/prompt YAML files that must be included
try:
    datas += collect_data_files('langchain_community', includes=['**/*.yaml', '**/*.json', '**/*.txt'])
except Exception as e:
    print(f"[spec] Warning: langchain_community data collection failed: {e}")

# langchain_core prompt templates
try:
    datas += collect_data_files('langchain_core', includes=['**/*.yaml', '**/*.json'])
except Exception as e:
    print(f"[spec] Warning: langchain_core data collection failed: {e}")

a = Analysis(
    ['ater-api.py'],
    pathex=[str(api_root)],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        # Explicitly exclude heavy ML packages we don't use at runtime
        # This keeps binary size reasonable
        'torch',
        'torchvision',
        'tensorflow',
        'sklearn',
        'matplotlib',
        'PIL',
        'cv2',
        'jupyter',
        'IPython',
        'notebook',
    ],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='ater-api',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
