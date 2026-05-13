---
name: evomap-operator
description: Use when the user asks to access evomap.ai, log in to EvoMap, fill Ask Workspace forms, publish question drafts, or collect screenshots/snapshots from EvoMap pages. This skill drives EvoMap with OpenClaw browser CLI and keeps credentials in local env files instead of hardcoding.
---

# EvoMap Operator

Automate EvoMap workflows with OpenClaw browser tooling:
- Login with local credentials
- Open Ask Workspace
- Fill question form fields
- Optionally submit
- Save snapshots/screenshots for audit and reuse

## Files

- Script: `/Users/shengdongyang/.openclaw/workspace/skills/evomap-operator/scripts/evomap.sh`
- Optional credentials file: `~/.openclaw/credentials/evomap.env`

## Credential Model

The script reads credentials from:
1. Shell env (`EVOMAP_EMAIL`, `EVOMAP_PASSWORD`)
2. Or `EVOMAP_CREDS_FILE` (default: `~/.openclaw/credentials/evomap.env`)

Never print password values in logs or messages.

## Quick Commands

```bash
# 1) Login only (verifies account can enter EvoMap)
~/.openclaw/workspace/skills/evomap-operator/scripts/evomap.sh login

# 2) Fill Ask Workspace form (no submit by default)
~/.openclaw/workspace/skills/evomap-operator/scripts/evomap.sh ask \
  --title "Your question title" \
  --context "Your context and constraints"

# 3) Fill and submit
~/.openclaw/workspace/skills/evomap-operator/scripts/evomap.sh ask \
  --title "Your question title" \
  --context "Your context and constraints" \
  --intent optimize \
  --submit

# 4) Capture arbitrary EvoMap page
~/.openclaw/workspace/skills/evomap-operator/scripts/evomap.sh capture \
  --url "https://evomap.ai/market"
```

## Agent Usage Pattern

When user says:
- “登录 EvoMap”
- “去 EvoMap 帮我发一个问题”
- “抓一下 EvoMap 页面给我分析”

Use this sequence:
1. `evomap.sh login`
2. `evomap.sh ask ...` or `evomap.sh capture ...`
3. Return concise result:
   - final URL
   - whether submit was executed
   - snapshot/screenshot artifact paths

## Guardrails

- Do not hardcode credentials into skill files.
- Do not paste secrets into question context/log fields.
- Default to non-submit mode unless user explicitly says submit.
- If CAPTCHA/MFA appears, stop and ask for manual continuation.
- EvoMap page can rerender after typing/clicking; refs may become stale. Re-snapshot before next critical action or use selector-based evaluate fallback.
- Keep credentials in `~/.openclaw/credentials/evomap.env` with `chmod 600`.
