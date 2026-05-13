---
name: AdsPower
slug: adspower
version: 1.2.0
description: Control AdsPower fingerprint browser profiles via local API and CDP protocol.
changelog: Auto bootstrap local API via control API and support dynamic local API port
metadata: {"clawdbot":{"emoji":"🕵️","requires":{"bins":["node"]},"os":["darwin","win32"]}}
---

## Scope

This skill:
- ✅ Manages AdsPower browser profiles (list / active / start / stop)
- ✅ Connects to profiles via CDP for browser automation
- ✅ Provides fingerprint-masked browsing for agent tasks

This skill does NOT:
- ❌ Create or delete AdsPower profiles (use AdsPower GUI)
- ❌ Modify profile fingerprint settings
- ❌ Store any credentials or cookies

## Quick Reference

| Action | Command |
|--------|---------|
| Check API | `node adspower.js status` |
| List profiles | `node adspower.js list` |
| Check profile active status | `node adspower.js active <profile_id>` |
| Start profile | `node adspower.js start <profile_id>` |
| Stop profile | `node adspower.js stop <profile_id>` |
| Connect & inspect | `node adspower.js connect <profile_id> [--keep-open]` |

Script path: `/Users/shengdongyang/.openclaw/workspace/skills/adspower/adspower.js`
Do not use: `~/.openclaw/skills/adspower/adspower.js` (this path may not exist)

## AdsPower Local API

Control API: `http://127.0.0.1:20725`（默认，可用 `ADSPOWER_CTRL_API` 覆盖）  
Local API: 动态端口（通常 `50325`），由 `POST /api/startLocalAPI` 返回（可选用 `ADSPOWER_API` 固定）

Auth:
- `ADSPOWER_API_KEY`：用于 local API 的 `api-key` 头（`list/start/stop/active/connect` 必需）
- `ADSPOWER_AUTH_TOKEN`：用于 control API `Authorization: Bearer <token>`（可选，脚本会自动从 AdsPower 进程提取）
- 在 shell 中设置：
  ```bash
  export ADSPOWER_API_KEY="<your_adspower_api_key>"
  ```
- `status` 可在无 key 下运行，其他命令需要 `ADSPOWER_API_KEY`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/browser/start?serial_number=<id>` | GET | Start profile, returns CDP `ws` URL |
| `/api/v1/browser/stop?serial_number=<id>` | GET | Stop profile |
| `/api/v1/browser/active?serial_number=<id>` | GET | Check if profile is running |
| `/api/v1/user/list?page=1&page_size=100` | GET | List all profiles |
| `/status` | GET | API health check |

Response format:
```json
{
  "code": 0,
  "msg": "success",
  "data": { ... }
}
```

`code: 0` = success, non-zero = error.

Start response includes:
```json
{
  "data": {
    "ws": {
      "puppeteer": "ws://127.0.0.1:xxxx/devtools/browser/...",
      "selenium": "127.0.0.1:xxxx"
    },
    "debug_port": "xxxx",
    "webdriver": "/path/to/chromedriver"
  }
}
```

## Agent 操作流程

### 标准流程

1. **检查 AdsPower 状态和配置**
   ```bash
   export ADSPOWER_API_KEY="<your_adspower_api_key>"
   node ~/.openclaw/workspace/skills/adspower/adspower.js status
   ```

2. **列出可用 profile**
   ```bash
   node ~/.openclaw/workspace/skills/adspower/adspower.js list
   ```

3. **启动 profile 获取 CDP URL**
   ```bash
   node ~/.openclaw/workspace/skills/adspower/adspower.js start <serial_number>
   ```
   输出中的 `cdpUrl` 即为 Playwright/OpenClaw 连接地址。

4. **通过 CDP 连接浏览器并执行任务**
   使用 OpenClaw `browser open` 命令或 Playwright `chromium.connectOverCDP(cdpUrl)` 连接。

5. **操作完毕关闭 profile**
   ```bash
   node ~/.openclaw/workspace/skills/adspower/adspower.js stop <serial_number>
   ```

### OpenClaw 指令模板

在 OpenClaw 中可直接下达类似指令：

```text
Use skill adspower. Start profile serial_number=9, get cdpUrl, connect browser via CDP,
open https://whoer.net, report title and URL, then stop the profile.
```

如果你希望 `connect` 命令只做连接测试并自动清理：

```bash
node ~/.openclaw/workspace/skills/adspower/adspower.js connect <serial_number>
```

如果你希望连接后保持 profile 打开（后续继续操作）：

```bash
node ~/.openclaw/workspace/skills/adspower/adspower.js connect <serial_number> --keep-open
```

### Playwright 连接示例

```javascript
const { chromium } = require('playwright');

const browser = await chromium.connectOverCDP('ws://127.0.0.1:xxxx/devtools/browser/...');
const context = browser.contexts()[0];
const page = context.pages()[0] || await context.newPage();
await page.goto('https://example.com');
// ... 操作
await browser.close(); // 断开 CDP 连接（不关闭 AdsPower profile）
```

注意：`browser.close()` 只断开 CDP 连接，不会关闭 AdsPower 中的浏览器。要关闭浏览器需调用 `stop` 命令。

## 错误处理

| 错误 | 原因 | 解决 |
|------|------|------|
| `Missing ADSPOWER_API_KEY` | 未设置 API key | `export ADSPOWER_API_KEY=...` |
| `Require api-key` | key 未传递或无效 | 检查 key 是否正确，重新导出环境变量 |
| `AdsPower API unreachable` | AdsPower 未启动或端口错误 | 打开 AdsPower 客户端；新版会先走 `20725` 启动本地 API，再连接动态端口（通常 `50325`） |
| `SunBrowser ... not ready / updating` | 内核浏览器未下载完成 | 在 AdsPower 客户端中下载/更新 SunBrowser 后重试 |
| `User_id is not open` | profile 已被关闭 | 脚本已做幂等处理，可忽略 |
| `code: -1, msg: "..."` | profile 不存在或已被删除 | 用 `list` 确认 profile ID |
| `Too many request per second` | 调用频率过高 | 脚本会自动重试，仍失败则降低并发 |
| CDP 连接超时 | profile 启动慢或端口被占 | 等待几秒后重试 |
| `browser.contexts()` 为空 | CDP 连接异常 | stop 后重新 start |

## Core Rules

### 1. 操作完必须关闭
每次使用完 profile 后必须调用 `stop` 关闭浏览器，避免资源泄漏。

### 2. 不自动删除 profile
禁止通过 API 删除 profile。profile 的创建和删除只能在 AdsPower GUI 中操作。

### 3. 串行使用 profile
同一个 profile 不能同时被多个任务使用。启动前先检查是否已在运行。

### 4. 错误时优雅退出
如果操作过程中出错，确保调用 `stop` 关闭 profile 后再退出。
