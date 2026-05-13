---
name: BotDiagnostics
slug: bot-diagnostics
version: 1.0.0
description: Diagnose OpenClaw bot no-reply incidents across pairing, allowlists, routing, mention-gating no-mention, model timeout/rate-limit, docker ENOENT, and gateway health.
changelog: Initial release with JSON CLI for single-agent diagnose, full sweep, and allowlist sync
metadata: {"clawdbot":{"emoji":"🩺","requires":{"bins":["node","openclaw"]},"os":["darwin","linux","win32"]}}
---

## Scope

Use this skill when a bot does not respond in Telegram/Feishu, or responds with intermittent failures.

This skill checks:
- Gateway health and channel readiness
- Agent -> Telegram account binding
- Account token presence
- DM allowlist (`allowFrom`) vs sender id
- Pending pairing requests
- Agent model/fallback status
- Optional live probe run
- Recent `gateway.err.log` failure patterns
- Recent gateway runtime log signals (`no-mention`, `spawn docker ENOENT`, `gateway 1006`)

This skill can also fix one common issue:
- Sync sender id into Telegram allowlist files via `sync-allow`

## Quick Reference

| Action | Command |
|---|---|
| Help | `node bot-doctor.js help` |
| Diagnose one agent | `node bot-doctor.js diagnose --agent backlink --user 7018683809 --probe` |
| Sweep all agents | `node bot-doctor.js sweep --user 7018683809` |
| Sweep all + live probes | `node bot-doctor.js sweep --user 7018683809 --probe --timeout 45` |
| Scan error log patterns | `node bot-doctor.js logs --log-lines 3000 --since-minutes 240` |
| Fix allowlist for one agent | `node bot-doctor.js sync-allow --agent backlink --user 7018683809` |
| Fix allowlist for all Telegram accounts | `node bot-doctor.js sync-allow --user 7018683809` |

Script path:
- `/Users/shengdongyang/.openclaw/workspace/skills/bot-diagnostics/bot-doctor.js`

## Standard Workflow

1. Confirm health:
   - `node bot-doctor.js logs`
   - `openclaw health`

2. Diagnose target agent:
   - `node bot-doctor.js diagnose --agent <agent_id> --user <telegram_user_id> --probe`

3. If `telegram_allow_from` is warning:
   - `node bot-doctor.js sync-allow --agent <agent_id> --user <telegram_user_id>`
   - Then retry private message.

4. If `pairing_queue` is warning with code:
   - `openclaw pairing approve telegram <code> --notify`

5. If probe fails with model timeout:
   - Inspect provider and fallback:
     - `openclaw models --agent <agent_id> status --json`
   - Reduce prompt size and retry.

6. If account token missing:
   - Configure `channels.telegram.accounts.<accountId>.botToken` in OpenClaw config and restart gateway.

7. If `gateway_runtime_log` warns with `no_mention > 0`:
   - Align `agents.list[].groupChat.mentionPatterns` with actual @aliases used in group.

8. If `gateway_runtime_log` warns with `spawn_docker_enoent > 0`:
   - Verify docker availability and sandbox compatibility for affected agents.

## Output Contract

All commands return JSON.

Top-level fields:
- `ok`: boolean
- `command`: executed command
- `timestamp`: ISO timestamp
- `result` or `agents`: detailed checks

Per-check fields:
- `name`: check id
- `status`: `ok | warn | error | skip`
- `message`: human-readable conclusion
- `detail`: structured evidence

Exit code:
- `0` when overall status is healthy
- `1` when errors are detected (or command fails)

## Prompt Templates (Codex / Claude Code)

Single agent:
```
Use skill bot-diagnostics.
Run diagnose for agent=backlink user=7018683809 with probe enabled.
Return only: root cause, evidence checks, and exact fix commands.
```

All agents:
```
Use skill bot-diagnostics.
Run sweep for user=7018683809.
Group agents by severity and provide only actionable fixes.
```

## Safety Rules

1. Prefer `diagnose` before any fix.
2. Use `sync-allow` only with explicit user id.
3. Do not modify bot tokens automatically.
4. Report evidence with check names, never with guess-only conclusions.
