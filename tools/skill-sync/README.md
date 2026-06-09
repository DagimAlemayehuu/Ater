# Agent Skill Sync

Synchronizes global skills across:

- Antigravity: `~/.gemini/config/skills`
- Codex: `~/.codex/skills`
- Legacy/shared agents: `~/.agents/skills`

The canonical store is `~/.agent-skills/global`.

Run once:

```sh
python3 ~/.agent-skills/bin/agent_skill_sync.py sync
```

Install the real-time macOS watcher:

```sh
python3 ~/.agent-skills/bin/agent_skill_sync.py install-launch-agent
```

State and logs:

- `~/.agent-skills/state.json`
- `~/.agent-skills/logs/sync.log`
- `~/.agent-skills/conflicts/`
- `~/.agent-skills/backups/`
