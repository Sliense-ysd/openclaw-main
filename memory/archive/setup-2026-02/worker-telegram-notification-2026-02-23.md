# Worker Agent - Telegram 通知 + 飞书追踪

**创建时间**: 2026-02-23 23:55
**目标**: 使用 Telegram 接收通知 + 飞书 Bitable 追踪任务状态

---

## 🔧 功能实现

### 功能 1: 接收任务通知

```python
# Worker Agent 中
def receive_task_notification():
    """接收任务通知"""
    # 这个功能是自动的，通过 Telegram Bot 实现
    # Worker Agent 会收到 Coordinator 发送的任务通知
    pass
```

### 功能 2: 检查任务池

```python
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

### 功能 3: 执行任务

```python
def execute_task(task):
    """执行任务"""
    import feishu_client
    
    task_id = task['fields']['任务 ID']
    
    try:
        # 1. 更新任务状态为"进行中"
        feishu_client.update_task_status(
            task_id=task_id,
            status="进行中"
        )
        
        # 2. 执行任务（根据任务类型）
        result = execute_task_by_type(task)
        
        # 3. 更新任务状态为"完成"
        feishu_client.update_task_status(
            task_id=task_id,
            status="完成",
            result=result
        )
        
        # 4. 通知 Coordinator
        notify_coordinator(task_id, result)
        
        return {"status": "success", "result": result}
    
    except Exception as e:
        # 更新任务状态为"失败"
        feishu_client.update_task_status(
            task_id=task_id,
            status="失败",
            error=str(e)
        )
        
        return {"status": "error", "error": str(e)}

def notify_coordinator(task_id, result):
    """通知 Coordinator 任务完成"""
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

### 功能 4: 进度更新

```python
def update_task_progress(task_id, progress):
    """更新任务进度"""
    import feishu_client
    
    result = feishu_client.update_task_status(
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
    # 示例：调用 Semrush API
    import requests
    
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
    # 示例：查询 X.com API
    # import requests
    
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

## 🎯 任务接收流程

### Worker Agent 如何接收任务

1. **Coordinator Agent 分配任务**
   - 向 Worker Agent 的 Telegram Bot 发送消息
   - 消息包含任务 ID、任务类型、任务描述、优先级

2. **Worker Agent 接收通知**
   - Worker Agent 通过 Telegram Bot 接收消息
   - Worker Agent 自动检查飞书 Bitable

3. **Worker Agent 执行任务**
   - Worker Agent 执行任务
   - 更新任务状态到飞书 Bitable
   - 通知 Coordinator 任务完成

---

## 🎯 下一步：部署和测试

### 部署步骤

1. ✅ 修改 Coordinator Agent 的 SOUL.md
2. ✅ 修改 10 个 Worker Agents 的 SOUL.md
3. ✅ 配置心跳机制（HEARTBEAT.md）
4. ✅ 测试任务分配和通知机制

### 测试步骤

1. ⏳ 测试 Coordinator 的任务分配和通知功能
2. ⏳ 测试 Worker 的任务接收和执行功能
3. ⏳ 测试飞书 Bitable API 调用
4. ⏳ 测试心跳机制
5. ⏳ 测试任务完成通知

---

**创建时间**: 2026-02-23 23:55
