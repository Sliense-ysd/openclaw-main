---
name: openclaw-ops-guardrails
description: Use when the user asks to avoid repeating OpenClaw operation mistakes, standardize API switching, fix provider endpoint mismatches, clean context safely, or run post-change verification checks.
---

# OpenClaw Ops Guardrails

This skill captures recurring incidents and enforces a safe runbook for:
- Provider/API endpoint correctness
- Per-agent model switching verification
- Context bloat reporting and controlled cleanup
- Secret handling discipline

## Files

- Script: `/Users/shengdongyang/.openclaw/workspace/skills/openclaw-ops-guardrails/scripts/ops-guardrails.sh`
- Incident notes: `/Users/shengdongyang/.openclaw/workspace/skills/openclaw-ops-guardrails/references/incidents-2026-02-27.md`

## Core Commands

```bash
# 1) Validate Coding Plan endpoint + current routing
~/.openclaw/workspace/skills/openclaw-ops-guardrails/scripts/ops-guardrails.sh preflight

# 2) Report token/context pressure for one agent
~/.openclaw/workspace/skills/openclaw-ops-guardrails/scripts/ops-guardrails.sh context-report --agent backlink

# 3) Safe context prune (requires explicit --yes)
~/.openclaw/workspace/skills/openclaw-ops-guardrails/scripts/ops-guardrails.sh context-prune --agent backlink --yes
```

## Rules That Must Not Be Skipped

1. Before switching provider/model, run `preflight`.
2. After switching, verify both layers:
   - provider probe
   - agent probe
3. Never hardcode secrets in skill/script; use env files with `chmod 600`.
4. Context cleanup must backup first, then prune only target agent sessions.
5. Default behavior is non-destructive unless `--yes` is provided.

## When Triggered

Use this skill for requests like:
- “怎么避免下次再配错 API”
- “帮我检查现在 OpenClaw API 配置是否正确”
- “上下文太满了，安全清理一下”
- “把这次问题沉淀成流程”

