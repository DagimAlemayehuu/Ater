#!/usr/bin/env bash
set -u

# Watches every open PR, waits until the required Gatekeeper CI check is green,
# then creates one review prompt per PR head SHA. If the Antigravity SDK is
# installed, the watcher launches the review agent. Otherwise it opens
# Antigravity and leaves the prompt file ready to paste/run.

SEEN_FILE="${GATEKEEPER_SEEN_FILE:-.gatekeeper_seen_prs}"
CURRENT_FILE="${GATEKEEPER_CURRENT_FILE:-.gatekeeper_current_prs}"
LOG_FILE="${GATEKEEPER_LOG_FILE:-.gatekeeper_watcher.log}"
PROMPT_DIR="${GATEKEEPER_PROMPT_DIR:-.gatekeeper_reviews}"
POLL_SECONDS="${GATEKEEPER_POLL_SECONDS:-30}"
MODEL="${GATEKEEPER_MODEL:-Gemini 3.5 Pro (Low)}"
REQUIRED_CHECK="${GATEKEEPER_REQUIRED_CHECK:-Gatekeeper Required}"
OPEN_APP="${GATEKEEPER_OPEN_APP:-1}"

mkdir -p "$PROMPT_DIR"
touch "$SEEN_FILE" "$LOG_FILE"

log() {
  printf '%s %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$*" | tee -a "$LOG_FILE"
}

json_get() {
  jq -r "$1"
}

pr_required_check_green() {
  jq -e --arg check "$REQUIRED_CHECK" '
    .statusCheckRollup
    | map(select(.__typename == "CheckRun" and .name == $check))
    | any(.status == "COMPLETED" and .conclusion == "SUCCESS")
  ' >/dev/null
}

pr_has_pending_required_check() {
  jq -e --arg check "$REQUIRED_CHECK" '
    .statusCheckRollup
    | map(select(.__typename == "CheckRun" and .name == $check))
    | any(.status != "COMPLETED")
  ' >/dev/null
}

write_prompt() {
  local pr_json="$1"
  local pr_number title url head_ref base_ref head_sha prompt_file

  pr_number="$(printf '%s' "$pr_json" | json_get '.number')"
  title="$(printf '%s' "$pr_json" | json_get '.title')"
  url="$(printf '%s' "$pr_json" | json_get '.url')"
  head_ref="$(printf '%s' "$pr_json" | json_get '.headRefName')"
  base_ref="$(printf '%s' "$pr_json" | json_get '.baseRefName')"
  head_sha="$(printf '%s' "$pr_json" | json_get '.headRefOid')"
  prompt_file="$PROMPT_DIR/pr-${pr_number}-${head_sha}.md"

  cat > "$prompt_file" <<PROMPT
Use the GatekeeperReview skill.

Review PR #${pr_number}: ${title}
URL: ${url}
Base branch: ${base_ref}
Head branch: ${head_ref}
Head SHA: ${head_sha}

The required GitHub check "${REQUIRED_CHECK}" has completed successfully.

You are acting as Ater Gatekeeper. Do not merge. Do not write implementation code.
Audit the PR strictly:
1. Inspect the diff against main.
2. Verify the CI results and note any skipped or duplicated checks.
3. Run or recommend the relevant local verification commands.
4. Identify correctness, security, regression, test, release, and documentation risks.
5. If changes are required, write one precise @jules PR comment.
6. If it is safe, provide a plain-English executive summary for human merge approval.

Expected final output:
- Verdict: approve / request changes / close and split
- What changed in plain English
- Why it is or is not safe
- Verification evidence
- Remaining risks
PROMPT

  printf '%s' "$prompt_file"
}

launch_antigravity_review() {
  local prompt_file="$1"

  if python3 - <<'PY' >/dev/null 2>&1
import google.antigravity  # noqa: F401
PY
  then
    python3 - "$prompt_file" "$MODEL" <<'PY' >>"$LOG_FILE" 2>&1 &
import asyncio
import sys
from pathlib import Path
from google.antigravity import Agent, LocalAgentConfig, CapabilitiesConfig

prompt_path = Path(sys.argv[1])
model = sys.argv[2]
prompt = prompt_path.read_text(encoding="utf-8")

async def main():
    config = LocalAgentConfig(
        system_instructions=(
            "You are GatekeeperReview for the Ater repository. "
            "Use the requested model profile if supported by the local runtime: "
            f"{model}."
        ),
        capabilities=CapabilitiesConfig(),
    )
    async with Agent(config) as agent:
        response = await agent.chat(prompt)
        async for token in response:
            sys.stdout.write(token)
            sys.stdout.flush()
        print()

asyncio.run(main())
PY
    return 0
  fi

  if [ -n "${ANTIGRAVITY_LS_ADDRESS:-}" ]; then
    log "Antigravity language-server environment detected, but no supported agentapi chat command is configured. Prompt ready: $prompt_file"
  else
    log "Antigravity SDK is not installed and ANTIGRAVITY_LS_ADDRESS is not set. Prompt ready: $prompt_file"
  fi

  if [ "$OPEN_APP" = "1" ]; then
    open -a "Antigravity" "$prompt_file" >/dev/null 2>&1 || true
  fi
  return 1
}

log "Gatekeeper watcher initialized. Polling all open PRs every ${POLL_SECONDS}s; required check: ${REQUIRED_CHECK}; model hint: ${MODEL}."

while true; do
  if ! gh pr list --state open \
      --json number,title,url,headRefName,baseRefName,headRefOid,isDraft,statusCheckRollup \
      > "$CURRENT_FILE.tmp" 2>>"$LOG_FILE"; then
    log "Failed to query open PRs with gh. Check authentication/network."
    sleep "$POLL_SECONDS"
    continue
  fi

  mv "$CURRENT_FILE.tmp" "$CURRENT_FILE"

  jq -c '.[]' "$CURRENT_FILE" | while IFS= read -r pr_json; do
    pr_number="$(printf '%s' "$pr_json" | json_get '.number')"
    head_sha="$(printf '%s' "$pr_json" | json_get '.headRefOid')"
    title="$(printf '%s' "$pr_json" | json_get '.title')"
    is_draft="$(printf '%s' "$pr_json" | json_get '.isDraft')"
    seen_key="${pr_number}:${head_sha}"

    if [ "$is_draft" = "true" ]; then
      log "Skipping draft PR #${pr_number}: ${title}"
      continue
    fi

    if grep -qxF "$seen_key" "$SEEN_FILE"; then
      continue
    fi

    if printf '%s' "$pr_json" | pr_has_pending_required_check; then
      log "PR #${pr_number} still waiting for ${REQUIRED_CHECK}: ${title}"
      continue
    fi

    if printf '%s' "$pr_json" | pr_required_check_green; then
      prompt_file="$(write_prompt "$pr_json")"
      log "CI green for PR #${pr_number}; launching Gatekeeper review prompt: $prompt_file"
      launch_antigravity_review "$prompt_file" || true
      printf '%s\n' "$seen_key" >> "$SEEN_FILE"
    else
      log "PR #${pr_number} is open but ${REQUIRED_CHECK} is not green: ${title}"
    fi
  done

  sleep "$POLL_SECONDS"
done
