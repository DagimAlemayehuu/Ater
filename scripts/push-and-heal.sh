#!/bin/bash
# scripts/push-and-heal.sh
# Pushes the current branch to origin and monitors the CI pipeline.
# If CI fails, prints context for the Antigravity repair agent.

set -e

BRANCH=$(git branch --show-current)
echo "=== Pushing branch '$BRANCH' to origin ==="
git push origin "$BRANCH"

# Check if gh CLI is available and authenticated
if ! command -v gh &> /dev/null; then
  echo "[i] gh CLI not found. Skipping CI watch."
  exit 0
fi

if ! gh auth status &> /dev/null; then
  echo "[i] gh CLI not authenticated. Skipping CI watch."
  exit 0
fi

echo "=== Monitoring GitHub Actions CI Run ==="
# Wait a few seconds for GitHub to register the push and trigger the action
sleep 5

# Retrieve the latest run for the branch
RUN_ID=$(gh run list --branch "$BRANCH" --limit 1 --json databaseId -q '.[0].databaseId')

if [ -z "$RUN_ID" ]; then
  echo "[!] No active GitHub Actions run found for branch '$BRANCH'."
  exit 1
fi

echo "Watching run $RUN_ID... (url: https://github.com/DagimAlemayehuu/Ater/actions/runs/$RUN_ID)"
gh run watch "$RUN_ID"

CONCLUSION=$(gh run view "$RUN_ID" --json conclusion -q '.conclusion')

if [ "$CONCLUSION" = "success" ]; then
  echo "[+] CI passed successfully!"
  exit 0
else
  echo "[-] CI failed with conclusion: $CONCLUSION"
  echo "=== Fetching CI Failure Logs ==="
  
  # Print the failed jobs and log snippet
  gh run view "$RUN_ID" --log-failed
  
  echo ""
  echo "================================================================================"
  echo "[ANTIGRAVITY_REPAIR] CI Failure Context"
  echo "Repository: $(pwd)"
  echo "Branch: $BRANCH"
  echo "Run URL: https://github.com/DagimAlemayehuu/Ater/actions/runs/$RUN_ID"
  echo "================================================================================"
  echo ""
  
  exit 1
fi
