# 飞书配置全流程 - 2026-02-23

**创建时间**: 2026-02-23 23:30
**目标**: 规划飞书配置的完整流程，从申请账号到 API 配置

---

## 📋 飞书配置全流程

### 阶段 1：飞书账号申请（10-15 分钟）

#### 1.1 申请飞书个人账号

**访问**：https://open.feishu.cn/

**所需信息**：
- 手机号（中国大陆）
- 短信验证码
- 设置密码
- 完成实名认证

**完成标志**：
- ✅ 飞书账号创建成功
- ✅ 可以登录飞书开放平台

---

#### 1.2 申请飞书企业账号（推荐）

**访问**：https://open.feishu.cn/

**为什么推荐企业账号**：
- ✅ 更多的 API 配额
- ✅ 支持 Bitable 企业级功能
- ✅ 更好的协作支持
- ✅ 支持自定义域名

**申请方式**：
1. 在飞书开放平台中
2. 点击"创建企业"
3. 输入企业名称
4. 选择企业规模（可以选"个人工作室"）
5. 完成企业认证

**完成标志**：
- ✅ 飞书企业账号创建成功
- ✅ 企业 ID 获取成功

---

### 阶段 2：飞书开放平台配置（15-20 分钟）

#### 2.1 登录飞书开放平台

**访问**：https://open.feishu.cn/

**登录**：使用阶段 1 创建的账号

---

#### 2.2 创建飞书应用

**步骤**：
1. 点击"创建应用"
2. 输入应用名称："OpenClaw 任务池"
3. 选择应用类型："企业自建应用"
4. 选择应用类别："工具"
5. 点击"创建"

**完成标志**：
- ✅ 应用创建成功
- ✅ 获取到 App ID 和 App Secret

**重要信息**：
```
App ID: cli_xxxxxxxxxxxxxx
App Secret: xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**注意**：App Secret 只会显示一次，**立即复制保存**！

---

#### 2.3 启用 Bitable 权限

**步骤**：
1. 进入应用详情页面
2. 点击"权限管理"
3. 启用以下权限：
   - ✅ "bitable:app" - Bitable 应用权限
   - ✅ "bitable:app:readonly" - Bitable 只读权限

**完成标志**：
- ✅ Bitable 权限启用成功
- ✅ 权限范围配置完成

---

### 阶段 3：飞书 Bitable 配置（10-15 分钟）

#### 3.1 创建 Bitable（多维表格）

**步骤**：
1. 在飞书应用中
2. 点击"创建 Bitable"
3. 输入 Bitable 名称："OpenClaw 任务池"
4. 选择 Bitable 模板："空白 Bitable"
5. 点击"创建"

**完成标志**：
- ✅ Bitable 创建成功
- ✅ 获取到 Bitable App Token 和 App Table ID

**重要信息**：
```
Bitable App Token: bas_xxxxxxxxxxxxxxxxxxxxxxxxxx
Bitable App Table ID: tbl_xxxxxxxxxxxxxxxxxxxxxx
```

**注意**：这些 Token 只会显示一次，**立即复制保存**！

---

#### 3.2 创建数据表

**需要创建 3 个表**：

##### 表 1：任务主表

**表名**：任务

**字段设计**：
| 字段 ID | 字段名称 | 类型 | 说明 |
|---------|---------|------|------|
| 任务 ID | string | 唯一标识符（自动生成） |
| 任务类型 | select | research/product/growth/operations/logistics/backlink/social |
| 任务描述 | text | 任务的具体描述 |
| 分配给 | select | Agent ID（agent:research:main 等） |
| 状态 | select | 待分配/进行中/完成/失败/取消 |
| 优先级 | number | 1-5（1 最高，5 最低） |
| 创建时间 | datetime | 任务创建时间 |
| 更新时间 | datetime | 任务最后更新时间 |
| 完成时间 | datetime | 任务完成时间 |
| 结果 | text | 任务执行结果 |
| 错误信息 | text | 错误时的错误信息 |
| 创建者 | select | 创建任务的来源（Coordinator 或用户） |

**字段 ID 建议**：
```
field_xxxxxxxxxxxxxxxx1  # 任务 ID
field_xxxxxxxxxxxxxxxx2  # 任务类型
field_xxxxxxxxxxxxxxxx3  # 任务描述
field_xxxxxxxxxxxxxxxx4  # 分配给
field_xxxxxxxxxxxxxxxx5  # 状态
field_xxxxxxxxxxxxxxxx6  # 优先级
field_xxxxxxxxxxxxxxxx7  # 创建时间
field_xxxxxxxxxxxxxxxx8  # 更新时间
field_xxxxxxxxxxxxxxxx9  # 完成时间
field_xxxxxxxxxxxxxxxx10  # 结果
field_xxxxxxxxxxxxxxxx11  # 错误信息
field_xxxxxxxxxxxxxxxx12  # 创建者
```

---

##### 表 2：Agent 状态表

**表名**：Agent 状态

**字段设计**：
| 字段 ID | 字段名称 | 类型 | 说明 |
|---------|---------|------|------|
| Agent ID | string | Agent 唯一标识符 |
| 最后心跳 | datetime | Agent 最后心跳时间 |
| 当前任务 | string | 当前正在执行的任务 ID |
| 状态 | select | active/idle/error |
| 错误信息 | text | 错误时的错误信息 |

**字段 ID 建议**：
```
field_xxxxxxxxxxxxxxxx1  # Agent ID
field_xxxxxxxxxxxxxxxx2  # 最后心跳
field_xxxxxxxxxxxxxxxx3  # 当前任务
field_xxxxxxxxxxxxxxxx4  # 状态
field_xxxxxxxxxxxxxxxx5  # 错误信息
```

---

##### 表 3：任务队列表

**表名**：任务队列

**字段设计**：
| 字段 ID | 字段名称 | 类型 | 说明 |
|---------|---------|------|------|
| 队列 ID | string | 唯一标识符（自动生成） |
| 任务 ID | string | 关联到任务主表 |
| 任务类型 | select | 任务的类型 |
| 优先级 | number | 1-5（1 最高，5 最低） |
| 入队时间 | datetime | 任务进入队列的时间 |
| 处理状态 | select | waiting/processing/completed/failed |

**字段 ID 建议**：
```
field_xxxxxxxxxxxxxxxx1  # 队列 ID
field_xxxxxxxxxxxxxxxx2  # 任务 ID
field_xxxxxxxxxxxxxxxx3  # 任务类型
field_xxxxxxxxxxxxxxxx4  # 优先级
field_xxxxxxxxxxxxxxxx5  # 入队时间
field_xxxxxxxxxxxxxxxx6  # 处理状态
```

---

#### 3.3 测试 Bitable API

**使用飞书 API Explorer**：

**访问**：https://open.feishu.cn/api-explorer/

**测试查询**：
```json
{
  "app_id": "cli_xxxxxxxxxxxxxx",
  "app_secret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "table_id": "tbl_xxxxxxxxxxxxxxxxxxxxxx",
  "page_size": 10
}
```

**完成标志**：
- ✅ 能够成功查询 Bitable
- ✅ 能够成功写入 Bitable

---

### 阶段 4：OpenClaw 集成（15-20 分钟）

#### 4.1 配置飞书 API 凭证

**编辑 `~/.openclaw/feishu.json`**：
```json
{
  "app_id": "cli_xxxxxxxxxxxxxx",
  "app_secret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "bitable_app_token": "bas_xxxxxxxxxxxxxxxxxxxxxxxxxx",
  "bitable_table_id": "tbl_xxxxxxxxxxxxxxxxxxxxxx"
}
```

#### 4.2 创建飞书 API 工具

**创建 `~/.openclaw/feishu-client.py`**：
```python
#!/usr/bin/env python3
"""
飞书 Bitable 客户端
用于 Coordinator 和 Worker Agents 访问任务池
"""

import requests
import json
from datetime import datetime

class FeishuClient:
    def __init__(self, config_path="~/.openclaw/feishu.json"):
        with open(config_path, 'r') as f:
            self.config = json.load(f)
    
    def get_tasks(self, status=None, assignee=None):
        """获取任务列表"""
        headers = {
            "Authorization": f"Bearer {self.config['bitable_app_token']}",
            "Content-Type": "application/json"
        }
        
        params = {
            "app_id": self.config['app_id'],
            "app_secret": self.config['app_secret'],
            "table_id": self.config['bitable_table_id'],
            "page_size": 100
        }
        
        # 添加过滤条件
        if status:
            params["filter"] = {
                "conditions": [
                    {
                        "field_name": "状态",
                        "operator": "is",
                        "value": [status]
                    }
                ]
            }
        
        if assignee:
            params["filter"] = {
                "conditions": [
                    {
                        "field_name": "分配给",
                        "operator": "is",
                        "value": [assignee]
                    }
                ]
            }
        
        response = requests.post(
            "https://open.feishu.cn/open-apis/bitable/v1/apps/{}/tables/{}/records/search".format(
                self.config['app_id'], self.config['bitable_table_id']
            ),
            headers=headers,
            json=params
        )
        
        return response.json()
    
    def create_task(self, task_type, task_data, priority=3, creator="coordinator"):
        """创建新任务"""
        task = {
            "fields": {
                "任务 ID": f"task-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "任务类型": task_type,
                "任务描述": task_data.get("description", ""),
                "分配给": task_data.get("assignee", f"agent:{task_type}:main"),
                "状态": "待分配",
                "优先级": priority,
                "创建时间": datetime.now().isoformat(),
                "更新时间": datetime.now().isoformat(),
                "创建者": creator
            }
        }
        
        headers = {
            "Authorization": f"Bearer {self.config['bitable_app_token']}",
            "Content-Type": "application/json"
        }
        
        params = {
            "app_id": self.config['app_id'],
            "app_secret": self.config['app_secret'],
            "table_id": self.config['bitable_table_id'],
            "records": [task]
        }
        
        response = requests.post(
            "https://open.feishu.cn/open-apis/bitable/v1/apps/{}/tables/{}/records".format(
                self.config['app_id'], self.config['bitable_table_id']
            ),
            headers=headers,
            json=params
        )
        
        return response.json()
    
    def update_task_status(self, task_id, status, result=None, error=None):
        """更新任务状态"""
        # 先获取任务
        tasks = self.get_tasks()
        task_record = None
        
        for record in tasks.get('data', {}).get('items', []):
            if record['fields']['任务 ID'] == task_id:
                task_record = record
                break
        
        if not task_record:
            return {"error": "Task not found"}
        
        # 更新字段
        task_record['fields']['状态'] = status
        task_record['fields']['更新时间'] = datetime.now().isoformat()
        
        if status == "完成":
            task_record['fields']['完成时间'] = datetime.now().isoformat()
            if result:
                task_record['fields']['结果'] = result
        elif status == "失败":
            if error:
                task_record['fields']['错误信息'] = error
        elif status == "进行中":
            task_record['fields']['状态'] = "进行中"
        
        # 更新记录
        headers = {
            "Authorization": f"Bearer {self.config['bitable_app_token']}",
            "Content-Type": "application/json"
        }
        
        params = {
            "app_id": self.config['app_id'],
            "app_secret": self.config['app_secret'],
            "table_id": self.config['bitable_table_id'],
            "records": [task_record]
        }
        
        response = requests.put(
            "https://open.feishu.cn/open-apis/bitable/v1/apps/{}/tables/{}/records".format(
                self.config['app_id'], self.config['bitable_table_id']
            ),
            headers=headers,
            json=params
        )
        
        return response.json()

if __name__ == "__main__":
    client = FeishuClient()
    # 测试查询
    print(json.dumps(client.get_tasks(), indent=2))
```

---

## 🎯 总结

### 需要主人提供的

#### 阶段 1：飞书账号申请
- [ ] 申请飞书个人账号
- [ ] 申请飞书企业账号（推荐）

#### 阶段 2：飞书开放平台配置
- [ ] 登录飞书开放平台
- [ ] 创建飞书应用
- [ ] 启用 Bitable 权限
- [ ] 获取 App ID 和 App Secret

#### 阶段 3：飞书 Bitable 配置
- [ ] 创建 Bitable："OpenClaw 任务池"
- [ ] 创建 3 个数据表（任务主表、Agent 状态表、任务队列表）
- [ ] 获取 Bitable App Token 和 App Table ID
- [ ] 测试 Bitable API

#### 阶段 4：OpenClaw 集成
- [ ] 配置飞书 API 凭证
- [ ] 创建飞书 API 工具
- [ ] 测试集成

---

## 📋 关键信息收集清单

完成每个阶段后，请提供以下信息：

### 阶段 1 完成
```
飞书账号类型：[个人/企业]
飞书账号 ID：[如果企业账号]
```

### 阶段 2 完成
```
App ID：cli_xxxxxxxxxxxxxx
App Secret：xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 阶段 3 完成
```
Bitable App Token：bas_xxxxxxxxxxxxxxxxxxxxxxxxxx
Bitable App Table ID（任务主表）：tbl_xxxxxxxxxxxxxxxxxxxxxx
Bitable App Table ID（Agent 状态表）：tbl_xxxxxxxxxxxxxxxxxxxxxx
Bitable App Table ID（任务队列表）：tbl_xxxxxxxxxxxxxxxxxxxxxx
```

---

## 📊 预计时间

- 阶段 1：10-15 分钟
- 阶段 2：15-20 分钟
- 阶段 3：10-15 分钟
- 阶段 4：15-20 分钟

**总计**：50-70 分钟

---

**创建时间**: 2026-02-23 23:30
