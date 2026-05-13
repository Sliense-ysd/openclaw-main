# 飞书任务池完整设计 - 2026-02-23

**创建时间**: 2026-02-23 23:35
**目标**: 设计支持 10 个 Agent 协作的任务池架构

---

## 📊 10 个 Agent 协作场景

### Agent 分类

#### 1. 核心协调层（1 个）
- **Coordinator Agent (main)**：负责任务分配、汇总、协调

#### 2. 业务层（6 个）
- **Research Agent (research)**：需求调研
- **Product Agent (product)**：产品经理
- **Growth Agent (growth)**：增长黑客
- **Operations Agent (operations)**：运营
- **Logistics Agent (logistics)**：后勤
- **Social Agent (social)**：社媒专家

#### 3. 技术层（2 个）
- **Backlink Agent (backlink)**：外链专员
- **Coding Agent (coding)**：技术专家

---

## 🎯 任务池架构设计

### 方案：1 个飞书应用 + 多维表格

#### 应用结构

**应用名称**：OpenClaw 任务池

**多维表格数量**：1 个

**为什么只用 1 个多维表格**：
- ✅ 所有任务在同一表格中，便于查询和统计
- ✅ 支持多视图（可以创建不同的视图查看不同的任务）
- ✅ 跨 Agent 协作更简单（不需要跨表格查询）
- ✅ 数据一致性更好（避免数据分散）

---

### 多维表格字段设计（20 个字段）

#### 基础信息字段（4 个）

| 字段名称 | 类型 | 说明 |
|---------|------|------|
| 任务 ID | text | 唯一标识符（自动生成：task-YYYYMMDDHHmmss） |
| 任务标题 | text | 任务的简短标题 |
| 任务类型 | select | research/product/growth/operations/logistics/backlink/social/coding |
| 优先级 | number | 1-5（1 最高，5 最低） |

---

#### 执行信息字段（7 个）

| 字段名称 | 类型 | 说明 |
|---------|------|------|
| 分配给 | select | Agent ID（agent:research:main 等） |
| 状态 | select | 待分配/进行中/完成/失败/取消/暂停 |
| 进度 | number | 0-100%（任务完成进度） |
| 开始时间 | datetime | 任务开始执行的时间 |
| 更新时间 | datetime | 任务最后更新时间 |
| 完成时间 | datetime | 任务完成的时间 |
| 预计完成时间 | datetime | 预计任务完成的时间 |

---

#### 任务详情字段（5 个）

| 字段名称 | 类型 | 说明 |
|---------|------|------|
| 任务描述 | text | 任务的详细描述（支持 Markdown） |
| 任务标签 | multiselect | 需求/开发/运营/增长/外链/社媒/技术 |
| 任务来源 | select | Telegram/飞书/自动生成/用户手动创建 |
| 创建者 | text | 创建任务的人或 Agent |
| 依赖任务 | text | 此任务依赖的其他任务 ID（逗号分隔） |

---

#### 结果信息字段（4 个）

| 字段名称 | 类型 | 说明 |
|---------|------|------|
| 任务结果 | text | 任务执行结果（支持 Markdown 和 JSON） |
| 错误信息 | text | 错误时的错误信息（支持 Markdown） |
| 结果文件 | attachment | 任务产生的文件（如果有） |
| 结果链接 | url | 任务结果的链接（如果有） |

---

## 📊 多维表格视图设计

### 视图 1：按 Agent 分配

**视图名称**：按 Agent 分配

**过滤条件**：
- 分配给 = agent:research:main（或其他 Agent）

**显示字段**：
- 任务 ID、任务标题、任务类型、优先级
- 状态、进度、开始时间、预计完成时间
- 任务描述、任务标签、任务结果

**用途**：
- 每个 Agent 只看到分配给自己的任务
- 便于快速查找自己的任务

---

### 视图 2：按状态分组

**视图名称**：按状态分组

**分组条件**：
- 状态

**排序**：
- 优先级（升序）
- 创建时间（降序）

**显示字段**：
- 所有字段

**用途**：
- 快速查看待分配的任务
- 快速查看进行中的任务
- 快速查看完成的任务

---

### 视图 3：按任务类型分组

**视图名称**：按类型分组

**分组条件**：
- 任务类型

**排序**：
- 优先级（升序）
- 状态（升序）

**显示字段**：
- 所有字段

**用途**：
- 快速查看某种类型的所有任务
- 便于统计分析

---

### 视图 4：按优先级排序

**视图名称**：按优先级排序

**排序**：
- 优先级（升序）
- 状态（升序）
- 创建时间（降序）

**显示字段**：
- 任务 ID、任务标题、任务类型、优先级
- 分配给、状态、进度
- 开始时间、预计完成时间

**用途**：
- 快速查看最高优先级的任务
- 便于优先级管理

---

## 🔧 API 集成方案

### 方案 1：Coordinator Agent 集成

**Coordinator Agent 的功能**：

#### 功能 1：任务分配
```python
def assign_task(task_type, task_data, priority=3):
    """分配任务到任务池"""
    task = {
        "任务 ID": f"task-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "任务标题": task_data.get("title", ""),
        "任务类型": task_type,
        "优先级": priority,
        "分配给": f"agent:{task_type}:main",
        "状态": "待分配",
        "进度": 0,
        "任务描述": task_data.get("description", ""),
        "任务标签": task_data.get("tags", []),
        "任务来源": "Telegram",
        "创建者": "Coordinator",
        "创建时间": datetime.now().isoformat(),
        "更新时间": datetime.now().isoformat()
    }
    
    # 写入飞书 Bitable
    result = feishu_client.create_record(task)
    
    # 记录到本地日志
    log_to_file("tasks.log", f"Task assigned: {task['任务 ID']}")
    
    return result
```

#### 功能 2：任务汇总
```python
def get_task_summary(status=None, assignee=None, task_type=None):
    """获取任务汇总"""
    tasks = feishu_client.get_records(
        filters={
            "状态": status,
            "分配给": assignee,
            "任务类型": task_type
        }
    )
    
    summary = {
        "total": len(tasks),
        "waiting": len([t for t in tasks if t['状态'] == "待分配"]),
        "in_progress": len([t for t in tasks if t['状态'] == "进行中"]),
        "completed": len([t for t in tasks if t['状态'] == "完成"]),
        "failed": len([t for t in tasks if t['状态'] == "失败"])
    }
    
    return summary
```

#### 功能 3：跨 Agent 任务查询
```python
def get_cross_agent_tasks(task_ids):
    """查询多个 Agent 的任务"""
    tasks = feishu_client.get_records(
        filters={
            "任务 ID": task_ids  # ["task-001", "task-002", ...]
        }
    )
    
    return tasks
```

---

### 方案 2：Worker Agent 集成

**每个 Worker Agent 的功能**：

#### 功能 1：任务检查
```python
def check_my_tasks():
    """检查分配给本 Agent 的任务"""
    my_agent_id = get_current_agent_id()  # 例如：agent:research:main
    
    tasks = feishu_client.get_records(
        filters={
            "分配给": my_agent_id,
            "状态": ["待分配", "进行中"]
        }
    )
    
    # 按优先级和创建时间排序
    tasks = sorted(tasks, key=lambda t: (t['优先级'], t['创建时间']))
    
    return tasks
```

#### 功能 2：任务执行
```python
def execute_task(task):
    """执行任务"""
    try:
        # 更新任务状态为"进行中"
        feishu_client.update_record(task['任务 ID'], {
            "状态": "进行中",
            "进度": 0,
            "开始时间": datetime.now().isoformat()
        })
        
        # 执行任务（根据任务类型）
        result = execute_task_by_type(task)
        
        # 更新任务状态为"完成"
        feishu_client.update_record(task['任务 ID'], {
            "状态": "完成",
            "进度": 100,
            "完成时间": datetime.now().isoformat(),
            "任务结果": result
        })
        
        return {"status": "success", "result": result}
    
    except Exception as e:
        # 更新任务状态为"失败"
        feishu_client.update_record(task['任务 ID'], {
            "状态": "失败",
            "错误信息": str(e)
        })
        
        return {"status": "error", "error": str(e)}
```

#### 功能 3：进度更新
```python
def update_task_progress(task_id, progress):
    """更新任务进度"""
    feishu_client.update_record(task_id, {
        "进度": progress,
        "更新时间": datetime.now().isoformat()
    })
```

---

### 方案 3：心跳机制

**每个 Agent 的心跳配置**：

```python
# 心跳间隔
HEARTBEAT_INTERVAL = 5  # 每 5 分钟检查一次

def heartbeat():
    """心跳函数"""
    try:
        # 检查任务池
        tasks = check_my_tasks()
        
        if tasks:
            # 有待处理任务，执行第一个
            result = execute_task(tasks[0])
        else:
            # 没有任务，记录到日志
            log_to_file("heartbeat.log", "No tasks found")
        
        # 更新 Agent 状态
        update_agent_status("active")
    
    except Exception as e:
        # 更新 Agent 状态为错误
        update_agent_status("error", error=str(e))
        log_to_file("heartbeat.log", f"Heartbeat error: {str(e)}")

# 定时器
import schedule

schedule.every(HEARTBEAT_INTERVAL).minutes.do(heartbeat)

while True:
    schedule.run_pending()
    time.sleep(60)
```

---

## 🎯 完整的配置清单

### 飞书配置

#### 需要创建的
- [ ] 1 个飞书应用："OpenClaw 任务池"
- [ ] 1 个多维表格："OpenClaw 任务池表格"
- [ ] 4 个视图：按 Agent 分配、按状态分组、按类型分组、按优先级排序

#### 需要配置的
- [ ] App ID
- [ ] App Secret
- [ ] Bitable App Token
- [ ] Bitable App Table ID

#### 需要启用的权限
- [ ] bitable:app
- [ ] bitable:app:readonly

---

### OpenClaw 配置

#### 需要创建的
- [ ] 飞书 API 客户端：`~/.openclaw/feishu-client.py`
- [ ] 飞书配置文件：`~/.openclaw/feishu.json`
- [ ] 任务日志目录：`~/.openclaw/logs/tasks/`

#### 需要配置的
- [ ] main Agent 的 Coordinator 功能
- [ ] 10 个 Worker Agent 的 Worker 功能
- [ ] 10 个 Agent 的心跳机制

---

## 📋 总结

### 飞书配置
- **应用数量**：1 个
- **多维表格数量**：1 个
- **视图数量**：4 个
- **字段数量**：20 个

### OpenClaw 配置
- **Coordinator Agent**：1 个（main）
- **Worker Agents**：10 个
- **API 客户端**：1 个 Python 脚本
- **心跳机制**：每个 Agent 每 5 分钟检查一次

### 协作机制
- **任务分配**：Coordinator → 飞书 Bitable → Worker
- **任务查询**：Worker → 飞书 Bitable
- **任务更新**：Worker → 飞书 Bitable → Coordinator
- **跨 Agent 协作**：通过任务依赖关系实现

---

## 🎯 接下来的步骤

### Step 1：你创建飞书应用
1. 登录飞书开放平台
2. 创建应用："OpenClaw 任务池"
3. 启用 Bitable 权限
4. 获取 App ID 和 App Secret

### Step 2：你创建多维表格
1. 创建多维表格："OpenClaw 任务池表格"
2. 创建 20 个字段
3. 创建 4 个视图
4. 获取 Bitable App Token 和 Table ID

### Step 3：我创建 OpenClaw 集成
1. 创建飞书 API 客户端
2. 创建飞书配置文件
3. 实现 Coordinator 功能
4. 实现 Worker 功能
5. 实现心跳机制

### Step 4：测试
1. 测试任务分配
2. 测试任务执行
3. 测试跨 Agent 协作
4. 测试心跳机制

---

**创建时间**: 2026-02-23 23:35
