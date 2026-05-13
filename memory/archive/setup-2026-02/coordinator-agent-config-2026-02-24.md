# Coordinator Agent 配置 - 2026-02-24

**创建时间**: 2026-02-24 00:45
**Agent**: main（Coordinator）

---

## 📋 任务分配功能

### 功能 1: 任务分配

```python
# Coordinator Agent 中的任务分配函数
def assign_task(task_type, task_data, priority=3):
    """分配任务到 Worker Agent"""
    import feishu_client
    
    # 1. 创建任务到飞书 Bitable
    task_result = feishu_client.create_task(
        task_type=task_type,
        task_data=task_data,
        priority=priority,
        creator="Coordinator"
    )
    
    if task_result.get('code') != 0:
        return {"error": task_result.get('msg')}
    
    task_id = task_result['data']['records'][0]['fields']['任务 ID']
    
    # 2. 通知 Worker Agent（通过 sessions_send）
    agent_session_key = f"agent:{task_type}:main"
    
    message = f"""
📋 新任务

任务 ID: {task_id}
任务类型: {task_type}
任务标题: {task_data.get("title", "")}
任务描述: {task_data.get("description", "")}
优先级: {priority}

请开始执行任务。
    """
    
    result = sessions_send(
        sessionKey=agent_session_key,
        message=message,
        timeoutSeconds=60
    )
    
    return {
        "status": "success",
        "task_id": task_id,
        "notification_sent": result.get('code') == 0
    }
```

### 功能 2: 任务汇总

```python
def get_task_summary(status=None, assignee=None, task_type=None):
    """获取任务汇总"""
    import feishu_client
    
    tasks = feishu_client.get_tasks(
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

### 功能 3: 跨 Agent 任务查询

```python
def get_cross_agent_tasks(task_ids):
    """查询多个 Agent 的任务"""
    import feishu_client
    
    tasks = feishu_client.get_tasks()
    
    filtered_tasks = [
        t for t in tasks.get('data', {}).get('items', [])
        if t['fields']['任务 ID'] in task_ids
    ]
    
    return filtered_tasks
```

---

## 🎯 任务类型到 Agent 的映射

| 任务类型 | Agent ID | 说明 |
|---------|---------|------|
| backlink | agent:backlink:main | 外链专员 |
| social | agent:social:main | 社媒专家 |
| research | agent:research:main | 需求调研 |
| product | agent:product:main | 产品经理 |
| growth | agent:growth:main | 增长黑客 |
| operations | agent:operations:main | 运营 |
| logistics | agent:logistics:main | 后勤 |
| coding | agent:coding:main | 技术专家 |

---

## 🔧 使用示例

### 示例 1: 分配外链任务

```python
assign_task(
    task_type="backlink",
    task_data={
        "title": "分析 X 新词监控结果",
        "description": "分析今天的外链监控结果，找出需要提交的外链",
        "assignee": "agent:backlink:main"
    },
    priority=2
)
```

### 示例 2: 分配社媒任务

```python
assign_task(
    task_type="social",
    task_data={
        "title": "检查品牌提及",
        "description": "检查 X.com 上的品牌提及，汇总到飞书",
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

## 🎯 创建配置文件

### 文件位置：`~/.openclaw/feishu.json`

**内容**：
```json
{
  "app_id": "cli_a916c81a1538dcc4dYazkCCGWVAdo5ugIMPB5crW6s2kOzmO",
  "app_secret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "bitable_app_token": "bas_a916c86e50381cda15OYXVrArOpZSLLCYRKvVhS1SrI2gGWn",
  "bitable_table_id": "cli_a916c81a1538dcc4dYazkCCGWVAdo5ugIMPB5crW6s2kOzmO"
}
```

---

## 📋 总结

### 已完成的功能
- ✅ 任务分配
- ✅ 任务汇总
- ✅ 跨 Agent 任务查询
- ✅ 任务类型到 Agent 映射

### 需要添加的功能
- [ ] 通知 Coordinator 任务完成
- [ ] 跨 Agent 任务查询

---

**创建时间**: 2026-02-24 00:45
