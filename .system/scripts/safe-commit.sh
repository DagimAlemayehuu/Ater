#!/usr/bin/env bash

# Safe Commit Script with 3-Strike Circuit Breaker
# Prevents AI Agents from getting stuck in infinite loops.

FAIL_COUNT_FILE=".tmp_commit_fails"
MAX_FAILS=3

# Read current failure count
if [ -f "$FAIL_COUNT_FILE" ]; then
  FAILS=$(cat "$FAIL_COUNT_FILE")
else
  FAILS=0
fi

# Try to commit
git commit "$@"
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  FAILS=$((FAILS + 1))
  echo "$FAILS" > "$FAIL_COUNT_FILE"
  echo "❌ Commit failed. Strike $FAILS of $MAX_FAILS."

  if [ $FAILS -ge $MAX_FAILS ]; then
    echo "🛑 CIRCUIT BREAKER TRIPPED! 3 consecutive failures."
    echo "Forcing a DRAFT commit to break the loop..."
    git commit --no-verify -m "DRAFT: STUCK. Circuit breaker tripped after $MAX_FAILS failures."
    rm "$FAIL_COUNT_FILE"
    exit 1
  fi
  exit $EXIT_CODE
else
  # Success! Reset counter
  if [ -f "$FAIL_COUNT_FILE" ]; then
    rm "$FAIL_COUNT_FILE"
  fi
  echo "✅ Commit successful!"
  exit 0
fi
