# Backlink Submission Skill

自动化外链提交系统，支持博客评论、AI 工具目录站、社交平台发帖。

## 功能

### 三种提交类型

#### 1️⃣ 博客评论区外链
- 纯文本 URL 形式
- 6-8 个评论模板轮换
- 多组作者名 + 邮箱轮换
- WordPress/Blogger/通用表单自动识别

#### 2️⃣ AI 工具目录站
- 填写产品信息表单（名称/URL/描述/关键词/分类）
- 需准备 Logo + 产品截图
- 自动检测交换外链/登录/CAPTCHA/付费

#### 3️⃣ 社交平台发帖
- 需登录（Google OAuth）
- 部分需身份验证
- 内容要有价值，不能纯广告

## 操作流程

### 1. 从飞书拉取列表
```bash
# 获取待提交外链列表
curl -X POST "https://open.feishu.cn/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records/search"
```

### 2. 博客评论批量提交

**表单识别**：
- WordPress: `#comment` / `#author` / `#email` / `#url` / `#submit`
- Blogger: `#commentBodyField` / `button` Publish
- 通用: `textarea` + `form` + `submit`

**三轮重试策略**：
1. Playwright headless 批量（超时 15-20s）
2. Playwright 重试失败的（超时 25s）
3. OpenClaw 内置浏览器逐个手动处理

### 3. 目录站提交
1. 分析表单结构
2. 检测交换外链/登录/CAPTCHA/付费
3. 填写产品信息
4. 提交并记录结果

### 4. 结果写入飞书

按状态分列：
- ✅ 成功
- ⏳ 审核中
- ❌ 失败
- ⏭️ 无表单

每列配备注栏

## 评论模板示例

```json
{
  "templates": [
    "Great tool! Check out {product_url} for similar features.",
    "Thanks for sharing! {product_url} might be helpful too.",
    "Interesting post. You might also like {product_url}",
    "Nice article! {product_url} offers similar solutions.",
    "Good read! {product_url} has some related features.",
    "Helpful content! {product_url} is worth checking out."
  ],
  "authors": [
    {"name": "Alex Chen", "email": "alex.chen@example.com"},
    {"name": "Sarah Kim", "email": "sarah.kim@example.com"},
    {"name": "Mike Johnson", "email": "mike.j@example.com"}
  ]
}
```

## 飞书表结构

**日常统计表** (tblaMsBwA96hAgfR)
- 外链（纯文本）
- 发布日期（Unix 时间戳）

**外链—驿使BOT** (tbli5iiDrCmcqLlM)
- 外链
- 状态（成功/审核中/失败/无表单）
- 备注

## 使用方法

### 手动执行

```bash
cd /Users/rain/.openclaw/workspace
node scripts/submit_comments.js
```

### 通过 OpenClaw

```
执行外链提交：
1. 从飞书拉取待提交列表
2. 博客评论批量提交
3. 目录站逐个分析提交
4. 结果写入飞书
5. 汇报结果
```

## 常见问题

| 问题 | 原因 | 解决 |
|------|------|------|
| Playwright 超时 | 页面加载慢 | 增加 timeout 或换内置浏览器 |
| 按钮 display:none | 隐藏按钮 | 强制 `el.style.display='inline-block'` |
| React 站 click 无效 | 事件未触发 | 使用 `page.mouse.click(x,y)` |
| TipTap 编辑器 | 特殊编辑器 | `document.execCommand('insertText')` |
| 飞书字段类型错 | 类型不匹配 | 文本传字符串，URL 传 `{link,text}` |

## 环境要求

- Node.js: /opt/homebrew/bin/node
- Playwright: 已安装在 workspace
- 代理: 127.0.0.1:7897
- OpenClaw 内置浏览器（profile="openclaw"）
