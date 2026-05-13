# OpenClaw Incident Notes (2026-02-27)

## Incident 1: Coding Plan endpoint confusion
- Symptom: API key works in one client but fails in another.
- Root cause: Mixed Coding Plan endpoints with non-Coding DashScope endpoints.
- Guardrail:
  - OpenAI compat: `https://coding.dashscope.aliyuncs.com/v1`
  - Anthropic compat: `https://coding.dashscope.aliyuncs.com/apps/anthropic`
  - Coding key format: `sk-sp-...` only for Coding Plan.

## Incident 2: Switch changed config but runtime not validated
- Symptom: Model switched in JSON but agent runtime failed later.
- Root cause: Missing post-switch probe.
- Guardrail:
  - Run provider probe immediately after switch.
  - Run agent probe (`openclaw agent --agent <id> --message '请仅回复 ok'`).

## Incident 3: Kimi model tool-call incompatibility in current flow
- Symptom: `Invalid request: tool_call_id is not found` on agent probe.
- Root cause: Provider/model behavior mismatch with current tool-call pattern.
- Guardrail:
  - Keep known-good fallback ready.
  - Do not roll out globally before per-agent probe passes.

## Incident 4: Context token overgrowth
- Symptom: Sessions near context window limit.
- Root cause: Long-lived session history and repeated task logs.
- Guardrail:
  - Backup target agent sessions first.
  - Prune only target agent session keys when requested.
  - Persist only clean/stable facts to `MEMORY.md` / `memory/*.md`.

## Incident 5: Browser automation reference instability
- Symptom: `Element not found` after typing/clicking.
- Root cause: UI rerender invalidates previous snapshot refs.
- Guardrail:
  - Re-snapshot before critical next action, or use selector-based evaluate.
  - Keep artifacts (before/after snapshots + screenshot) for audit.

## Incident 6: Secret leakage risk
- Symptom: Credentials accidentally included in scripts/logs.
- Root cause: Inline plain-text usage.
- Guardrail:
  - Read from env file: `~/.openclaw/credentials/*.env`
  - `chmod 600` on credential files
  - Never print secret values in command output.

