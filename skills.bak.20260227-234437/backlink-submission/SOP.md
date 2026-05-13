# 外链提交 SOP

完整的外链提交操作流程文档。

## 一、环境准备

### 工具
- OpenClaw 内置浏览器（profile="openclaw"），已登录 Google
- Playwright 批量自动化（npm install playwright）
- 飞书 Bitable API 读写数据
- HTTP 代理 127.0.0.1:7897

### 飞书表格
- 日常统计 `tblaMsBwA96hAgfR` → 待提交来源
- 外链—驿使BOT `tbli5iiDrCmcqLlM` → 结果记录
- 收录统计 `tblNJSvkynCSZjtG` → 收录跟踪

## 二、三种提交类型

### 1️⃣ 博客评论区外链
- 纯文本URL形式，6-8个评论模板轮换
- 多组作者名+邮箱轮换
- WordPress/Blogger/通用表单自动识别

### 2️⃣ AI工具目录站
- 填写产品信息表单（名称/URL/描述/关键词/分类）
- 需准备 Logo + 产品截图

### 3️⃣ 社交平台发帖
- 需登录（Google OAuth）
- 部分需身份验证
- 内容要有价值，不能纯广告

## 三、操作流程

### 3.1 从飞书拉取列表
```bash
curl 获取 tenant_access_token
→ 调用 records/search 接口
```

### 3.2 博客评论批量提交（Playwright）

**核心逻辑**：
打开页面 → 检测表单类型 → 填写 → 提交 → 记录JSONL日志

**表单识别**：
- WordPress: `#comment` / `#author` / `#email` / `#url` / `#submit`
- Blogger: `#commentBodyField` / `button` Publish
- 通用: `textarea` + `form` + `submit`

**关键配置**：
- headless + proxy + 屏蔽图片加速

### 3.3 失败重试策略（三轮）

1. Playwright headless 批量，超时15-20s
2. Playwright 重试失败的，超时25s
3. 内置浏览器逐个手动处理（有登录态，能处理隐藏按钮）

### 3.4 目录站提交

先分析表单 → 检测交换外链/登录/CAPTCHA/付费 → 填写 → 提交

### 3.5 结果写入飞书

按状态分列：
- ✅ 成功
- ⏳ 审核中
- ❌ 失败
- ⏭️ 无表单

每列配备注栏

## 四、注意事项

### 安全
- 严禁修改其他数据表
- 不外泄API密钥

### 质量
- 评论自然
- 模板轮换
- 免费优先
- 交换外链单独记录

## 五、常见问题速查

| 问题 | 解决方案 |
|------|---------|
| Playwright超时 | 增加timeout或换内置浏览器 |
| 按钮display:none | 强制`el.style.display='inline-block'` |
| React站click无效 | connectOverCDP + `page.mouse.click(x,y)` |
| TipTap编辑器 | `document.execCommand('insertText')` |
| 飞书字段类型错 | 文本传字符串，URL传`{link,text}` |
| Token过期 | 重新获取tenant_access_token |

## 六、文件结构

```
workspace-courier/
├── AGENTS.md / SOUL.md / TOOLS.md / USER.md
├── SOP.md（本文档）
├── assets/（产品素材）
├── memory/（提交记录）
├── submit_comments.js（批量脚本模板）
├── submit_log.jsonl（结果日志）
└── comment_templates.json（评论模板）
```

## 七、新任务 Checklist

1. ✅ 确认产品信息（URL/名称/描述/关键词）
2. ✅ 访问产品网站理解内容
3. ✅ 准备评论模板 + 作者信息
4. ✅ 飞书拉取待提交列表
5. ✅ 区分类型（评论/目录站/社交平台）
6. ✅ 评论 → Playwright批量
7. ✅ 目录站 → 逐个分析提交
8. ✅ 失败 → 内置浏览器重试
9. ✅ 结果写入飞书
10. ✅ 汇总发送

---

完整 SOP 文件在 `workspace-courier/SOP.md`
