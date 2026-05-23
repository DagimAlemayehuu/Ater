# -*- mode: python ; coding: utf-8 -*-
import os
import sys
from pathlib import Path
from PyInstaller.utils.hooks import collect_submodules

# Add the apps/api directory to sys.path so we can collect submodules of 'src'
# This is required because collect_submodules needs 'src' to be importable
api_root = Path(os.getcwd()) / 'apps' / 'api'
if str(api_root) not in sys.path:
    sys.path.insert(0, str(api_root))

hiddenimports = [
    'uvicorn.logging',
    'uvicorn.loops',
    'uvicorn.loops.auto',
    'uvicorn.protocols',
    'uvicorn.protocols.http',
    'uvicorn.protocols.http.auto',
    'uvicorn.protocols.websockets',
    'uvicorn.protocols.websockets.auto',
    'uvicorn.lifespan',
    'uvicorn.lifespan.on',
    'uvicorn.lifespan.off',
    'fastapi',
    'pydantic',
    'langchain_core',
    'langchain_community',
    'langchain_community.document_loaders',
    'langchain_community.document_loaders.pdf',
    'langchain_community.document_loaders.parsers.pdf',
    'langchain_google_genai',
    'langchain_openai',
    'langchain_anthropic',
    'langchain_groq',
    'loguru',
    'aiosqlite',
    'sqlalchemy',
    'python_multipart',
    'markdown2',
    'bs4',
    'google.genai',
    'google.generativeai',
    'psutil',
    'pypdf',
    'ruamel.yaml',
    'tokenizers',
]

# Add all submodules of src dynamically
try:
    hiddenimports += collect_submodules('src')
    print(f"Successfully collected {len(hiddenimports)} hidden imports including submodules of 'src'")
except Exception as e:
    print(f"Warning: Failed to collect submodules of 'src': {e}")

a = Analysis(
    ['ater-api.py'],
    pathex=['.'],
    binaries=[],
    datas=[],
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
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
