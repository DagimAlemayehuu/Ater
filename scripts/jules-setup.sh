#!/usr/bin/env bash
set -euo pipefail

# Jules clones this repository into /app before running the setup script.
cd "${JULES_REPO_DIR:-/app}"

echo "==> Installing system packages for Node, Python, and Tauri builds"
if command -v apt-get >/dev/null 2>&1; then
  APT_GET="apt-get"
  if command -v sudo >/dev/null 2>&1; then
    APT_GET="sudo apt-get"
  fi

  $APT_GET update
  $APT_GET install -y --no-install-recommends \
    build-essential \
    ca-certificates \
    curl \
    file \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    libssl-dev \
    libwebkit2gtk-4.1-dev \
    libxdo-dev \
    pkg-config \
    python3-dev \
    python3-venv \
    wget
fi

echo "==> Ensuring Rust is available for the Tauri workspace"
if ! command -v cargo >/dev/null 2>&1; then
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal
  # shellcheck source=/dev/null
  source "$HOME/.cargo/env"
fi

echo "==> Enabling pnpm 9 through Corepack"
corepack enable
corepack prepare pnpm@9.0.0 --activate

echo "==> Installing JavaScript workspace dependencies"
pnpm install --frozen-lockfile

echo "==> Ensuring uv is available for the FastAPI sidecar"
if ! command -v uv >/dev/null 2>&1; then
  curl -LsSf https://astral.sh/uv/install.sh | sh
  export PATH="$HOME/.local/bin:$PATH"
fi

echo "==> Installing Python sidecar dependencies"
(
  cd apps/api
  uv sync --dev --frozen
)

echo "==> Verifying baseline tooling"
pnpm --version
node --version
uv --version
cargo --version

echo "==> Jules setup complete"

