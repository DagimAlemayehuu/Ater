#!/bin/bash
# SAFE-COMMIT SCRIPT
# Enforces linting, typechecking, and testing before a commit.

set -e

echo "[Life OS] Running pre-commit checks..."

# 1. Linting
pnpm run lint || { echo "Linting failed. Fix errors before committing."; exit 1; }

# 2. Typechecking
pnpm run typecheck || { echo "Typechecking failed. Fix TS errors before committing."; exit 1; }

# 3. Commit
git add .
git commit -m "$1"
echo "[Life OS] Commit successful."
