# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## Shared Skills

- OpenClaw-visible shared skills: `~/.openclaw/skills`
- Canonical skill library: `/Users/openclaw/Library/CloudStorage/坚果云-mryangsd@gmail.com/我的坚果云/ai-shared/skills`
- Current machine mapping: `~/.openclaw/skills` -> `/Users/openclaw/Library/CloudStorage/坚果云-mryangsd@gmail.com/我的坚果云/ai-shared/openclaw/skills`
- Preferred lookup order: first `~/.openclaw/skills`, then `ai-shared/skills` as a candidate library
- Shared rules and retrospective guidance: `/Users/openclaw/Library/CloudStorage/坚果云-mryangsd@gmail.com/我的坚果云/ai-shared/openclaw/docs/AGENT_SHARED_SKILLS.md`

## Workspace Path Cheat Sheet

- Governance doc: `/Users/openclaw/.openclaw/docs/AGENT_FILE_MEMORY_GOVERNANCE.md`
- Workspace root only holds: `AGENTS.md`, `SOUL.md`, `USER.md`, `TOOLS.md`, `MEMORY.md`, `HEARTBEAT.md`, `IDENTITY.md`, `ACTIVE.md`, `TODO.md`, `BOOTSTRAP.md`
- `memory/YYYY-MM-DD.md` = raw daily log
- `memory/reports/` = long reports and one-off analysis
- `memory/<topic>.md` = detailed topic notes
- `MEMORY.md` = curated index + long-term facts only
- Exact scheduled reviews use isolated cron; `HEARTBEAT.md` is only a small checklist

## Sensitive Paths And Output Rules

- Machine secrets root: `/Users/openclaw/.secrets`
- Compatibility alias: `/Users/openclaw/.secret`
- OpenClaw credentials: `/Users/openclaw/.openclaw/credentials`
- OpenClaw config: `/Users/openclaw/.openclaw/openclaw.json`
- Shared synced secrets source: `/Users/openclaw/Library/CloudStorage/坚果云-mryangsd@gmail.com/我的坚果云/ai-shared/secrets`

Rules:

- These paths may be referenced, but secret contents must not be echoed
- When asked to inspect them, prefer existence checks, key-name checks, and configured/not-configured status
- If a sample is unavoidable, use `****` or `<redacted>`
- Do not copy secrets into workspace markdown, reports, or outgoing messages

## Context Reset

- Active reset script: `~/.openclaw/scripts/utils/context-reset.py`
- Shared skill: `context-reset`
- Passive cleanup already exists:
  - `agents.defaults.contextPruning`
  - `session.maintenance`
- Preferred commands:
  - Clear all agent main sessions: `python3 ~/.openclaw/scripts/utils/context-reset.py --all-agents --scope main --archive-label main-reset`
  - Clear one user's direct context: `python3 ~/.openclaw/scripts/utils/context-reset.py --all-agents --scope direct --match 7018683809 --archive-label user-7018683809`
  - Preview first: add `--dry-run`

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.
