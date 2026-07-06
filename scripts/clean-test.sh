#!/usr/bin/env bash
# clean-test.sh — Wipe vault content and session caches before a roadmap test.
# Reads the vault path from the app config — no hardcoded paths.

set -euo pipefail

CONFIG="$HOME/Library/Application Support/com.ater.app/ater_config.json"

if [ ! -f "$CONFIG" ]; then
  echo "❌  Cannot find ater_config.json at: $CONFIG"
  echo "    Launch the app at least once to create it."
  exit 1
fi

# Parse paths from config (requires python3, always available on macOS)
VAULT=$(python3 -c "import json,sys; c=json.load(open(sys.argv[1])); print(c.get('obsidianVaultPath',''))" "$CONFIG")
INBOX=$(python3 -c "import json,sys; c=json.load(open(sys.argv[1])); print(c.get('inboxPath',''))" "$CONFIG")
NOTES_REL=$(python3 -c "import json,sys; c=json.load(open(sys.argv[1])); print(c.get('academicFolderPath','Notes'))" "$CONFIG")
NOTES="$VAULT/$NOTES_REL"

if [ -z "$VAULT" ]; then
  echo "❌  obsidianVaultPath is not set in ater_config.json."
  echo "    Open Settings in the app and set your vault path first."
  exit 1
fi

echo ""
echo "🧹  Ater Test Clean"
echo "    Vault  : $VAULT"
echo "    Inbox  : $INBOX"
echo "    Notes  : $NOTES"
echo ""

# 1. Delete every PDF in the Inbox (the uploaded test file)
if [ -d "$INBOX" ]; then
  PDF_COUNT=$(find "$INBOX" -maxdepth 1 -name "*.pdf" | wc -l | tr -d ' ')
  find "$INBOX" -maxdepth 1 -name "*.pdf" -delete
  echo "    ✅  Deleted $PDF_COUNT PDF(s) from Inbox"
else
  echo "    ⚠️   Inbox directory not found — skipping"
fi

# 2. Wipe all generated Markdown notes
if [ -d "$NOTES" ]; then
  NOTE_COUNT=$(find "$NOTES" -name "*.md" | wc -l | tr -d ' ')
  find "$NOTES" -name "*.md" -delete
  # Remove empty subdirectories left behind
  find "$NOTES" -type d -empty -delete 2>/dev/null || true
  echo "    ✅  Deleted $NOTE_COUNT atomic note(s) from Notes"
else
  echo "    ⚠️   Notes directory not found — skipping"
fi

# 3. Wipe the job-queue SQLite database (holds PDF processing jobs)
QUEUE_DB="$INBOX/ater_queue.db"
if [ -f "$QUEUE_DB" ]; then
  rm -f "$QUEUE_DB"
  echo "    ✅  Deleted job queue DB"
fi

# 4. Wipe the academic SQLite database (holds SRS and hub state)
ACADEMIC_DB="$VAULT/.ater/academic.db"
if [ -f "$ACADEMIC_DB" ]; then
  rm -f "$ACADEMIC_DB"
  echo "    ✅  Deleted academic DB"
fi

# 5. Wipe the session-plan cache (prevents stale plans from being re-served)
find "$HOME/.ater" -name "sessions.json" -delete 2>/dev/null || true
find "$HOME/.ater/ater" -type f -delete 2>/dev/null || true
echo "    ✅  Cleared session plan cache"

echo ""
echo "🏁  Clean complete. You can now upload a fresh PDF."
echo ""
