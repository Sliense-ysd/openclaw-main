# X 新词监控任务分配 - 2026-02-24

**创建时间**: 2026-02-24 00:35
**目标**: 将 X 新词监控任务分配给对应的 Agent

---

## 📊 任务分配方案

### 任务 1: X 新词监控（社媒）

**任务信息**:
```
任务类型: operations（运营）
任务标题: X 新词监控
任务描述: 监控 X.com AI tab 的新模型发布和技术突破，记录到飞书 Bitable，汇总到飞书
任务标签: 社媒,监控,自动任务
分配给: agent:operations:main
优先级: 1（最高）
```

**分配给**: 运营 Agent（agent:operations:main）

**理由**:
- X 新词监控属于社媒监控的一部分
- 运营 Agent 负责社媒动态监控
- 任务需要每日定时执行
- 需要结果汇总到飞书

---

## 🔧 任务执行流程

### Step 1: Coordinator 分配任务

**方式 1：通过 Telegram Bot**
```
用户 → Telegram Bot (default)
    ↓
Coordinator Agent (main)
    ↓
创建任务到飞书 Bitable
```

**方式 2：通过飞书 Bitable（手动）**
- Coordinator 直接在飞书 Bitable 中创建任务
- 运营 Agent 检查任务池并执行

---

### Step 2: 运营 Agent 执行任务

**执行流程**：
```
运营 Agent (agent:operations:main)
    ↓
1. 检查任务池（每 5 分钟）
    ↓
2. 找到 X 新词监控任务
    ↓
3. 执行任务：
    - 访问 X.com AI tab
    - 提取新模型/技术突破信息
    - 记录到飞书 Bitable
    ↓
4. 更新任务状态为"完成"
    ↓
5. 通知 Coordinator
```

---

## 🎯 任务详情

### 任务 1: X 新词监控

**任务 ID**: task-20260224000001

**任务标题**: X 新词监控

**任务类型**: operations（运营）

**任务描述**:
```
监控 X.com AI tab 的新模型发布和技术突破，记录到飞书 Bitable。

监控内容：
1. 大语言模型（LLM）发布
   - 模型名称（例如：GPT-5.3-Codex-Spark）
   - 公司（例如：OpenAI、Anthropic）
   - 发布时间

2. 技术突破
   - 新算法或框架
   - 开源项目
   - 技术论文

3. 关键词监控
   - AI 相关关键词
   - 产品发布日期
   - 事件发布

4. 竞品动态
   - 竞品新模型
   - 竞品新功能
   - 市场动态

监控频率：每天凌晨 1 点（通过 cron）

输出格式：飞书 Bitable 表格
- 表名：X 新词监控
- 字段：监控时间、模型名称、公司、发布时间、技术突破、关键词、竞品动态、备注
```

**任务标签**: ["社媒", "监控", "自动任务"]

**分配给**: agent:operations:main（运营 Agent）

**优先级**: 1（最高）

---

## 📋 执行要求

### 对运营 Agent 的要求

**必要功能**:
1. **浏览器访问**: 能够访问 X.com AI tab
2. **数据提取**: 提取模型名称、公司、发布时间等信息
3. **飞书集成**: 写入飞书 Bitable
4. **心跳机制**: 每 5 分钟检查任务池
5. **状态更新**: 更新任务进度和完成状态

**技能要求**:
- 使用 Playwright 访问 X.com AI tab
- 使用飞书 Bitable API 写入数据
- 处理各种异常情况（网络错误、页面结构变化）

---

## 🎯 成功标准

### 任务完成的标准

- ✅ 成功访问 X.com AI tab
- ✅ 提取所有新模型和突破信息
- ✅ 成功写入飞书 Bitable
- ✅ 任务状态更新为"完成"
- ✅ 通知 Coordinator 任务完成

---

## 🔧 技术实现

### 运营 Agent 的实现

#### 心跳配置

```python
# HEARTBEAT.md
interval_minutes: 5  # 每 5 分钟检查一次任务池

on_heartbeat:
  - check_tasks()  # 检查分配给本 Agent 的任务
  - update_status()  # 更新 Agent 状态
  - report_completion()  # 汇报完成的任务（如果有）
```

#### 任务执行

```python
# 任务执行函数
def execute_x_monitor_task():
    """执行 X 新词监控任务"""
    try:
        # 1. 使用 Playwright 访问 X.com AI tab
        from playwright.sync_api import sync_playwright
        
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto('https://x.com/i/grok')
            
            # 2. 提取新模型和突破信息
            model_info = extract_model_info(page)
            breakthrough_info = extract_breakthrough_info(page)
            
            # 3. 写入飞书 Bitable
            feishu_client = feishu_client.FeishuClient()
            result = write_to_feishu_bitable(model_info, breakthrough_info)
            
            # 4. 更新任务状态
            update_task_status(task_id="task-20260224000001", status="完成", result=result)
            
            return {"status": "success", "result": result}
    
    except Exception as e:
        # 更新任务状态为"失败"
        update_task_status(task_id="task-20260224000001", status="失败", error=str(e))
        return {"status": "error", "error": str(e)}
```

---

## 📊 预期输出

### 飞书 Bitable 表格结构

**表名**: X 新词监控

| 字段 | 类型 | 说明 |
|------|------|------|
| 监控时间 | 日期 | 监控执行时间 |
| 模型名称 | 文本 | LLM 模型名称 |
| 公司 | 文本 | 模型所属公司 |
| 发布时间 | 日期 | 模型发布时间 |
| 技术突破 | 文本 | 技术突破描述 |
| 关键词 | 多选 | 监控的关键词 |
| 竞品动态 | 文本 | 竞品新模型或功能 |
| 备注 | 文本 | 其他信息 |

---

## 🎯 下一步

### 立即执行

1. [ ] Coordinator 分配任务到运营 Agent
2. [ ] 运营 Agent 开始执行任务
3. [ ] 任务状态跟踪
4. [ ] 任务完成验证

---

## 📋 备注

**任务来源**: cron 任务（X 新词监控）
**分配方式**: Coordinator 分配给运营 Agent
**执行方式**: 运营 Agent 定时执行（每天凌晨 1 点）
**任务频率**: 每天一次

---

**创建时间**: 2026-02-24 00:35
