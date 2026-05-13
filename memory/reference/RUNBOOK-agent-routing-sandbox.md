# Agent Routing & Sandbox Runbook

Last updated: 2026-02-27

## Fixed Baseline

- `agents.defaults.sandbox.mode = off`
- `main.groupChat.mentionPatterns` only includes main aliases
- Specialist aliases only live in their own agent `mentionPatterns`
- Any "partial fail then retry success" must be reported as final success

## Why This Baseline

- Prevent cross-trigger in Telegram groups (`@内容运营` should not wake main)
- Avoid sandbox path isolation errors for cross-workspace/global paths
- Keep specialist execution consistent for X/Twitter monitoring tasks

## Mandatory Runtime Fallback for X Links

1. Try xAI search (`search-x.js`) first
2. If unavailable, fallback to `r.jina.ai` mirror fetch
3. Only declare "cannot access" when both paths fail

## Quick Health Checks

### 1) Mention Routing Check

Expected behavior:

- `@内容运营` -> operations only
- `@OperationsDDawsonBot` -> operations only
- `@主agent` -> main only

### 2) Sandbox Path Check (all agents)

Run the same absolute-path read probe against all agents:

```bash
node <<'NODE'
const {execSync} = require('child_process');
const agents=['main','coding','research','product','growth','operations','backlink'];
for (const a of agents) {
  const cmd=`openclaw agent --agent ${a} --message "请读取 /Users/shengdongyang/.openclaw/skills/xai/SKILL.md 的第一行，并只回复这一行" --timeout 50 --json`;
  try {
    const out=execSync(cmd,{encoding:'utf8',timeout:80000,maxBuffer:1024*1024*8});
    const escaped=/Path escapes sandbox root/.test(out);
    console.log(`${a}: ${escaped ? 'FAIL' : 'OK'}`);
  } catch (e) {
    const s=(e.stdout||'')+(e.stderr||'');
    const escaped=/Path escapes sandbox root/.test(s);
    console.log(`${a}: ${escaped ? 'FAIL' : 'ERROR/TIMEOUT'}`);
  }
}
NODE
```

### 3) Historical Sandbox Error Sweep

```bash
rg -n "Path escapes sandbox root" ~/.openclaw/agents/*/sessions/*.jsonl
```

## Change Control Rules

- Any change to `openclaw.json` mention routing must be followed by gateway restart.
- Any change to sandbox policy must be followed by full-agent path probe.
- After recovery, send a final success correction message to the target group if users previously saw a failure.
