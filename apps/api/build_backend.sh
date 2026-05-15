#!/bin/bash

# Ater Backend Build Script (Nuitka)
# This script compiles the FastAPI backend into a standalone machine-code binary.

# Detect OS and architecture for Tauri sidecar naming
OS_TYPE=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH_TYPE=$(uname -m)

if [ "$OS_TYPE" == "darwin" ]; then
    TARGET="api-x86_64-apple-darwin"
    if [ "$ARCH_TYPE" == "arm64" ]; then
        TARGET="api-aarch64-apple-darwin"
    fi
elif [ "$OS_TYPE" == "linux" ]; then
    TARGET="api-x86_64-unknown-linux-gnu"
else
    # Assuming Windows if not Darwin or Linux
    TARGET="api-x86_64-pc-windows-msvc.exe"
fi

echo "🚀 Compiling Ater Backend for $TARGET using Nuitka..."

# Ensure we are in the api directory
cd "$(dirname "$0")"

# Build using Nuitka
# --standalone: includes all dependencies
# --onefile: packages everything into a single binary
# --remove-output: cleans up the build directory
# --nofollow-import-to: (optional) skip certain large packages if needed
python3 -m nuitka \
    --standalone \
    --onefile \
    --remove-output \
    --output-filename=ater-api \
    src/api/main.py

# Move the binary to the Tauri binaries directory
mkdir -p ../desktop/src-tauri/binaries/
mv ater-api ../desktop/src-tauri/binaries/$TARGET

echo "✅ Backend compiled and moved to apps/desktop/src-tauri/binaries/$TARGET"
