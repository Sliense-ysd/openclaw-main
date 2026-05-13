# OpenClaw Incident Prevention - 2026-02-28

## Symptom
- 多个 cron 任务缺少 `agentId`，导致任务落到 `default/main`，出现“任务被错误 agent 执行”。

## Root cause
- 任务创建命令使用了 `openclaw cron add ... --announce --channel telegram`，但未显式包含 `--agent`（且部分未显式 `--to`）。
- OpenClaw 按最终 CLI 参数执行，不会从自然语言指派自动补全 `agentId`。

## Exact fix
1. 回填缺失任务 agent + to：
   - `d4fe69e5-ec48-47b6-bfb7-443ce15dd9d1` -> `operations`
   - `afbe78a9-8ecb-4071-a0ba-a51de42c709a` -> `backlink`
   - `ad9fc897-0bda-4f33-8fcb-1a0055b0366f` -> `research`
   - `26b4b353-57c2-44f3-8bb0-c53bbc04e493` -> `coding`
   - `27dab393-eda3-447e-9815-292b6cdc5077` -> `main`
   - 全部补齐：`--announce --channel telegram --to -1003759411912`
2. 命令层强制护栏：
   - 将 `/opt/homebrew/bin/openclaw` 改为 wrapper，调用真实入口 `/opt/homebrew/lib/node_modules/openclaw/openclaw.mjs`。
   - 对 `openclaw cron add/edit` 做参数校验：缺少 `--agent` 直接 `exit 64`。
3. 提示层护栏：
   - 在所有工作区 `AGENTS.md` 追加 `Cron 指令护栏（强制）`，要求 cron add/edit 必带 `--agent`，公告时显式 `--channel` + `--to`。

## Verification evidence
- `openclaw cron list` 中上述 5 个任务已不再显示 `Agent=default`。
- guard 拦截验证：
  - `openclaw cron edit test-id --name test` -> 被拦截，退出码 `64`。
  - `openclaw cron edit test-id --agent operations --name test` -> 通过 guard，进入 OpenClaw 参数处理（返回 unknown id，退出码 `1`）。
- `openclaw --version` 正常输出：`2026.2.26`。

## Guardrail added
- 强制规则：任何 `cron add/edit` 命令不带 `--agent` 一律不执行。
- 运营规范：涉及公告投递时必须显式指定 `--channel` 与 `--to`，禁止依赖上下文默认值。
