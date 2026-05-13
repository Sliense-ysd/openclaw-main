# Agent 清理和验证 - 2026-02-23

**清理时间**: 2026-02-23 22:05
**目标**: 清理错误的 Agent 定义，验证当前系统状态

---

## 🔍 清理计划

### Step 1: 验证当前状态

**Gateway 状态检查**：
```bash
curl -s http://127.0.0.1:18789/ 2>&1 | head -5
```

**3 个 Telegram Bot 状态检查**：
```bash
openclaw channels status
```

**Agents 状态检查**：
```bash
openclaw agents list
```

**Fallbacks 状态检查**：
```bash
openclaw models fallbacks list
```

---

## 🔧 清理工作流

### Step 2: 删除错误的 Agent 定义

**当前 Agents**（按 agents.list）：
1. ❌ work（只在 agents.json 中定义，没有实体目录）
2. ❌ coding（只在 agents.json 中定义，没有实体目录）
3. ❌ home（只在 agents.json 中定义，没有实体目录）

**原因分析**：
- 之前只创建了 Agent 定义，但没有创建 agent 目录
- 可能是为了避免手动编辑 JSON 的错误
- 可能是误解了官方推荐的"创建 Agent workspace"

**删除决策**：
- 删除 work、coding、home 的 Agent 定义（从 agents.json）
- 只保留 main Agent
- 或全部删除，重新用官方命令创建

**建议**：全部删除，用官方命令重建

---

### Step 3: 验证清理结果

**Gateway**：应该继续运行（18789）
**Bots**：3 个（default、research、coding）应该继续响应
**main Agent**：应该正常运行

---

## 📊 验证清单

- [ ] Gateway 运行正常
- [ ] 3 个 Telegram Bot 正常工作
- [ ] main Agent 正常响应
- [ ] 4 个 fallback 模型已配置

---

## 🚨 风险提示

**删除全部 Agent 定义的风险**：
- ❌ 所有配置都清空
- ❌ 如果 Gateway 重启，需要手动启动
- ⚠️ 配置可能丢失，需要重新设置

---

## 🎯 确认后再删除

**要我现在删除吗？**
- 删除 work、coding、home Agent 定义？
- 还是只保留 main Agent？
- 还是全部删除，重新用官方命令重建？
