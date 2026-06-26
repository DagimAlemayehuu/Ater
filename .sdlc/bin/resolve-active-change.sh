#!/bin/bash
# .sdlc/bin/resolve-active-change.sh
# Resolves the active OpenSpec change without guessing.

set -e

# If argument is passed, validate it exists in openspec/changes/
if [ -n "$1" ]; then
  CHANGE_DIR="openspec/changes/$1"
  if [ -d "$CHANGE_DIR" ]; then
    echo "$1"
    exit 0
  else
    echo "Error: Change directory '$CHANGE_DIR' not found." >&2
    exit 1
  fi
fi

# 1. Check .sdlc/run.json activeChange
if [ -f ".sdlc/run.json" ]; then
  ACTIVE_JSON=$(python3 -c "import json; print(json.load(open('.sdlc/run.json')).get('activeChange') or '')" 2>/dev/null || true)
  if [ -n "$ACTIVE_JSON" ] && [ -d "openspec/changes/$ACTIVE_JSON" ]; then
    echo "$ACTIVE_JSON"
    exit 0
  fi
fi

# 2. Check .sdlc/state.md Active Change
if [ -f ".sdlc/state.md" ]; then
  ACTIVE_STATE=$(grep -i "Active Change:" .sdlc/state.md | cut -d':' -f2- | xargs || true)
  if [ -n "$ACTIVE_STATE" ] && [ -d "openspec/changes/$ACTIVE_STATE" ]; then
    echo "$ACTIVE_STATE"
    exit 0
  fi
fi

# 3. Check current git branch
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || true)
if [ -n "$CURRENT_BRANCH" ] && [ -d "openspec/changes/$CURRENT_BRANCH" ]; then
  echo "$CURRENT_BRANCH"
  exit 0
fi

# 4. List active OpenSpec changes
CHANGES=()
if [ -d "openspec/changes" ]; then
  for dir in openspec/changes/*; do
    if [ -d "$dir" ] && [ "$(basename "$dir")" != "archive" ]; then
      CHANGES+=("$(basename "$dir")")
    fi
  done
fi

if [ ${#CHANGES[@]} -eq 1 ]; then
  echo "${CHANGES[0]}"
  exit 0
elif [ ${#CHANGES[@]} -gt 1 ]; then
  echo "Error: Multiple active changes found (${CHANGES[*]}). Specify one explicitly." >&2
  exit 1
else
  echo "Error: No active OpenSpec changes found." >&2
  exit 1
fi
