# Coordinator Agent - 任务分配功能

**创建时间**: 2026-02-23 23:50
**目标**: 实现 Coordinator Agent 的任务分配和协调功能

---

## 🔧 功能实现

### 功能 1: 任务分配

```python
# Coordinator Agent 中的任务分配函数
def assign_task(task_type, task_data, priority=3):
    """分配任务到任务池"""
    import feishu_client
    
    client = feishu_client.FeishuClient()
    
    result = client.create_task(
        task_type=task_type,
        task_data=task_data,
        priority=priority,
        creator="Coordinator"
    )
    
    if result.get('code') == 0:
        return {
            "status": "success",
            "task_id": result['data']['records'][0]['fields']['任务 ID']
        }
    else:
        return {
            "status": "error",
            "error": result.get('msg', 'Unknown error')
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

### 功能 3: 跨 Agent 任务查询

```python
def get_cross_agent_tasks(task_ids):
    """查询多个 Agent 的任务"""
    import feishu_client
    
    client = feishu_client.FeishuClient()
    
    tasks = client.get_tasks()
    
    filtered_tasks = [
        t for t in tasks.get('data', {}).get('items', [])
        if t['fields']['任务 ID'] in task_ids
    ]
    
    return filtered_tasks
```

---

## 🎯 任务类型映射

### 任务类型到 Agent 的映射

| 任务类型 | Agent ID | 说明 |
|---------|---------|------|
| research | agent:research:main | 需求调研 |
| product | agent:product:main | 产品经理 |
| growth | agent:growth:main | 增长黑客 |
| operations | agent:operations:main | 运营 |
| logistics | agent:logistics:main | 后勤 |
| backlink | agent:backlink:main | 外链专员 |
| social | agent:social:main | 社媒专家 |
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
        "tags": ["外链", "监控", "分析"],
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

## 🎯 下一步：Worker Agent 功能

### Worker Agent 需要实现的功能

1. **任务检查**
   - 定期检查分配给本 Agent 的任务
   - 按优先级排序
   - 只查看"待分配"和"进行中"的任务

2. **任务执行**
   - 执行任务
   - 更新进度
   - 完成任务

3. **进度更新**
   - 每完成 10% 更新一次进度
   - 避免频繁 API 调用

4. **心跳机制**
   - 每 5 分钟检查一次任务池
   - 更新 Agent 状态

---

**创建时间**: 2026-02-23 23:50
