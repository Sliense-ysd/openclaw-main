# OpenClaw Autonomy Lessons (2026-02-27)

## Context
Goal: run OpenClaw in full-autonomy mode with no manual approval bottlenecks, stable model routing, and continuous multi-agent dispatch.

## Issues Seen and Root Causes
1. Control UI still prompted for approval.
- Root cause: `openclaw-control-ui` device token lacked `operator.write` scope (UI looked "admin-capable" but write operations were blocked).

2. Backlink agent appeared stale / no-reply.
- Root cause: one-shot cron run got stuck, repeated writes in same run, lock file persisted in agent session directory.

3. Model status looked inconsistent in some sessions.
- Root cause: old session context and previous run history showed old model, even after default routing switched.

4. Patrol orchestration timed out.
- Root cause: patrol prompt expected full task completion from all specialists in one run, which is too long for dispatch cycle.

5. Coding agent dispatch failed early.
- Root cause: workspace skeleton missing (`memory/TODO.md`, `memory/active-task.md`).

## Fixes Applied
1. Rotated device token scopes for `openclaw-control-ui` to include:
- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`

2. Removed stuck one-shot cron and restarted gateway to clear lock contention.

3. Verified model routing is unified on `bailian/kimi-k2.5` for defaults and all agents.

4. Updated patrol cron to:
- run every 15 minutes
- quick-dispatch only (no long wait)
- verify `active-task.md` freshness

5. Bootstrapped coding workspace task files.

## Never-Repeat Checklist
Run this after any major OpenClaw change:

```bash
openclaw gateway probe --timeout 30000 --json
openclaw approvals get --json
openclaw devices list --json
~/.openclaw/provider-switch.sh status
openclaw cron list
openclaw status
```

If config was edited, always:

```bash
openclaw gateway restart
openclaw gateway probe --timeout 30000 --json
```

## Skill Reference
Canonical runbook skill:
- `~/.codex/skills/openclaw-autonomy-hardening/SKILL.md`
