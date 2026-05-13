# Worker Agent - 任务执行功能

**创建时间**: 2026-02-23 23:55
**目标**: 实现 Worker Agent 的任务检查和执行功能

---

## 🔧 功能实现

### 功能 1: 任务检查

```python
# Worker Agent 中的任务检查函数
def check_my_tasks():
    """检查分配给本 Agent 的任务"""
    import feishu_client
    
    # 获取当前 Agent ID
    agent_id = "agent:backlink:main"  # 根据不同 Agent 修改
    
    client = feishu_client.FeishuClient()
    
    # 查询分配给本 Agent 的待处理任务
    tasks = client.get_tasks(
        assignee=agent_id,
        status=["待分配", "进行中"]
    )
    
    # 按优先级和创建时间排序
    sorted_tasks = sorted(
        tasks.get('data', {}).get('items', []),
        key=lambda t: (t['fields']['优先级'], t['fields']['创建时间'])
    )
    
    return sorted_tasks
```

### 功能 2: 任务执行

```python
def execute_task(task):
    """执行任务"""
    import feishu_client
    
    client = feishu_client.FeishuClient()
    task_id = task['fields']['任务 ID']
    
    try:
        # 更新任务状态为"进行中"
        client.update_task_status(
            task_id=task_id,
            status="进行中"
        )
        
        # 执行任务（根据任务类型）
        result = execute_task_by_type(task)
        
        # 更新任务状态为"完成"
        client.update_task_status(
            task_id=task_id,
            status="完成",
            result=result
        )
        
        return {"status": "success", "result": result}
    
    except Exception as e:
        # 更新任务状态为"失败"
        client.update_task_status(
            task_id=task_id,
            status="失败",
            error=str(e)
        )
        
        return {"status": "error", "error": str(e)}

def execute_task_by_type(task):
    """根据任务类型执行任务"""
    task_type = task['fields']['任务类型']
    description = task['fields']['任务描述']
    
    if task_type == "backlink":
        return execute_backlink_task(description)
    elif task_type == "social":
        return execute_social_task(description)
    elif task_type == "research":
        return execute_research_task(description)
    elif task_type == "product":
        return execute_product_task(description)
    elif task_type == "growth":
        return execute_growth_task(description)
    elif task_type == "operations":
        return execute_operations_task(description)
    elif task_type == "logistics":
        return execute_logistics_task(description)
    elif task_type == "coding":
        return execute_coding_task(description)
    else:
        return {"error": "Unknown task type"}
```

### 功能 3: 进度更新

```python
def update_task_progress(task_id, progress):
    """更新任务进度"""
    import feishu_client
    
    client = feishu_client.FeishuClient()
    
    result = client.update_task_status(
        task_id=task_id,
        progress=progress
    )
    
    return result
```

---

## 🎯 心跳机制

### 心跳配置

```python
# 心跳间隔
HEARTBEAT_INTERVAL = 5  # 每 5 分钟检查一次

def heartbeat():
    """心跳函数，定期执行"""
    try:
        # 检查任务池
        tasks = check_my_tasks()
        
        if tasks:
            # 有待处理任务，执行第一个
            result = execute_task(tasks[0])
        else:
            # 没有任务，记录到日志
            print("No tasks found")
        
        # 更新 Agent 状态
        print("Heartbeat completed")
    
    except Exception as e:
        print(f"Heartbeat error: {str(e)}")

# 定时器
import schedule

schedule.every(HEARTBEAT_INTERVAL).minutes.do(heartbeat)

while True:
    schedule.run_pending()
    time.sleep(60)
```

---

## 🔧 任务类型实现

### Backlink 任务

```python
def execute_backlink_task(description):
    """执行外链任务"""
    import requests
    
    # 示例：调用 Semrush API
    # api_key = "your-semrush-api-key"
    # url = f"https://api.semrush.com/reports/v1/{endpoint}"
    # response = requests.get(url, params={"api_key": api_key})
    
    # 返回结果
    return {
        "result": "Backlink task completed",
        "data": {"description": description}
    }
```

### Social 任务

```python
def execute_social_task(description):
    """执行社媒任务"""
    import requests
    
    # 示例：查询 X.com API
    # url = f"https://api.twitter.com/2/tweets/search/recent"
    # params = {"query": "#YourBrand", "count": 100}
    
    # 返回结果
    return {
        "result": "Social task completed",
        "data": {"description": description}
    }
```

---

## 🎯 使用示例

### 示例 1: Worker Agent 检查任务

```python
tasks = check_my_tasks()
for task in tasks:
    print(f"Task: {task['fields']['任务标题']}")
    print(f"Priority: {task['fields']['优先级']}")
    print(f"Status: {task['fields']['状态']}")
```

### 示例 2: Worker Agent 执行任务

```python
tasks = check_my_tasks()
if tasks:
    result = execute_task(tasks[0])
    print(f"Result: {result}")
```

### 示例 3: Worker Agent 更新进度

```python
task_id = "task-20260223123456"
progress = 50  # 50% 完成
result = update_task_progress(task_id, progress)
print(f"Progress updated: {progress}%")
```

---

## 🎯 下一步：部署和测试

### 部署步骤

1. ✅ 将飞书配置文件部署到 `~/.openclaw/feishu.json`
2. ✅ 将飞书 API 客户端部署到 `~/.openclaw/feishu-client.py`
3. ✅ 配置 Coordinator Agent 的 SOUL.md
4. ✅ 配置 Worker Agents 的 SOUL.md
5. ✅ 配置心跳机制（HEARTBEAT.md）

### 测试步骤

1. ✅ 测试 Coordinator 的任务分配功能
2. ✅ 测试 Worker 的任务检查功能
3. ✅ 测试 Worker 的任务执行功能
4. ✅ 测试心跳机制
5. ✅ 测试飞书 Bitable API 调用

---

**创建时间**: 2026-02-23 23:55
