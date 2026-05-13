# Coordinator Agent - Telegram 通知 + 飞书追踪

**创建时间**: 2026-02-23 23:55
**目标**: 使用 Telegram 通知 + 飞书 Bitable 追踪的组合方案

---

## 🔧 功能实现

### 功能 1: 任务分配 + 通知

```python
# Coordinator Agent 中
def assign_and_notify(task_type, task_data, priority=3):
    """分配任务并通知 Worker Agent"""
    import sessions_send
    import feishu_client
    
    # 1. 创建任务到飞书 Bitable
    task_result = feishu_client.create_task(
        task_type=task_type,
        task_data=task_data,
        priority=priority
    )
    
    if task_result.get('code') != 0:
        return {"error": task_result.get('msg')}
    
    task_id = task_result['data']['records'][0]['fields']['任务 ID']
    
    # 2. 通知 Worker Agent（通过 Telegram）
    agent_session_key = f"agent:{task_type}:main"
    
    message = f"""
📋 新任务

任务 ID: {task_id}
任务类型: {task_type}
任务标题: {task_data.get('title', '')}
任务描述: {task_data.get('description', '')}
优先级: {priority}

请开始执行任务。
    """
    
    notification_result = sessions_send(
        sessionKey=agent_session_key,
        message=message,
        timeoutSeconds=60
    )
    
    return {
        "status": "success",
        "task_id": task_id,
        "notification_sent": notification_result.get('code') == 0
    }
```

### 功能 2: 任务汇总

```python
def get_task_summary(status=None, assignee=None, task_type=None):
    """获取任务汇总"""
    import feishu_client
    
    client = feishu_client.FeishuClient()
    
    tasks = client.get_tasks(
        status=status,
        assignee=assignee,
        task_type=task_type
    )
    
    summary = {
        "total": len(tasks.get('data', {}).get('items', [])),
        "waiting": len([t for t in tasks.get('data', {}).get('items', []) if t['fields']['状态'] == "待分配"]),
        "in_progress": len([t for t in tasks.get('data', {}).get('items', []) if t['fields']['状态'] == "进行中"]),
        "completed": len([t for t in tasks.get('data', {}).get('items', []) if t['fields']['状态'] == "完成"]),
        "failed": len([t for t in tasks.get('data', {}).get('items', []) if t['fields']['状态'] == "失败"])
    }
    
    return summary
```

---

## 🎯 任务类型映射

### 任务类型到 Agent 和 Bot 的映射

| 任务类型 | Agent ID | Bot | 说明 |
|---------|---------|-----|------|
| research | agent:research:main | ResearchDDawsonBot | 需求调研 |
| product | agent:product:main | ProductDDawsonBot | 产品经理 |
| growth | agent:growth:main | GrowthDDawsonBot | 增长黑客 |
| operations | agent:operations:main | OperationsDDawsonBot | 运营 |
| logistics | agent:logistics:main | （需要 Bot） | 后勤 |
| backlink | agent:backlink:main | BacklinkDDawsonBot | 外链专员 |
| social | agent:social:main | （需要 Bot） | 社媒专家 |
| coding | agent:coding:main | coding-bot | 技术专家 |

---

## 🔧 使用示例

### 示例 1: 分配外链任务

```python
assign_and_notify(
    task_type="backlink",
    task_data={
        "title": "分析 X 新词监控结果",
        "description": "分析今天的外链监控结果，找出需要提交的外链",
        "tags": ["外链", "监控", "分析"],
        "assignee": "agent:backlink:main"
    },
    priority=2
)
```

### 示例 2: 分配社媒任务

```python
assign_and_notify(
    task_type="social",
    task_data={
        "title": "检查品牌提及",
        "description": "检查 X.com 上的品牌提及，汇总到飞书",
        "tags": ["社媒", "监控", "品牌"],
        "assignee": "agent:social:main"
    },
    priority=3
)
```

### 示例 3: 查询任务汇总

```python
summary = get_task_summary(status="待分配")
print(f"待分配任务: {summary['waiting']}")
print(f"进行中任务: {summary['in_progress']}")
print(f"完成任务: {summary['completed']}")
```

---

## 🎯 消息模板

### 新任务通知

```python
def send_task_notification(task_type, task_data, task_id, priority):
    """发送任务通知"""
    import sessions_send
    
    agent_session_key = f"agent:{task_type}:main"
    
    message = f"""
📋 新任务

任务 ID: {task_id}
任务类型: {task_type}
任务标题: {task_data.get('title', '')}
任务描述: {task_data.get('description', '')}
优先级: {priority}

请开始执行任务。
    """
    
    sessions_send(
        sessionKey=agent_session_key,
        message=message
    )
```

### 任务完成通知

```python
def send_completion_notification(task_id, result):
    """发送任务完成通知"""
    import sessions_send
    
    coordinator_session_key = "agent:main:main"
    
    message = f"""
✅ 任务完成

任务 ID: {task_id}
结果: {result}
    """
    
    sessions_send(
        sessionKey=coordinator_session_key,
        message=message
    )
```

---

**创建时间**: 2026-02-23 23:55
