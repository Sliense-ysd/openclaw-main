# X 监控规则配置

## 大厂优先级列表

当检测到以下公司的正式发布时，标记为最高优先级（🚨🚨🚨）并连发三遍。

| 公司 | 常见 X 账号 | 备注 |
|------|------------|------|
| Google / DeepMind | @GoogleDeepMind, @GeminiApp, @OfficialLoganK | Gemini 系列 |
| OpenAI | @OpenAI, @sama | GPT 系列 |
| NVIDIA | @NVIDIA | GPU、AI 芯片 |
| Anthropic | @AnthropicAI | Claude 系列 |
| Meta | @AIatMeta | Llama 系列 |
| Microsoft | @Microsoft | Azure AI |
| xAI | @xaborai, @elonmusk | Grok 系列 |
| 阿里 Qwen | @Alibaba_Qwen | 通义千问 |
| 字节 / ByteDance | — | 豆包、Doubao |
| Mistral | @MistralAI | Mistral 系列 |
| Apple | — | Apple Intelligence |

## 判断标准

### 正式发布（连发三遍）
- 官方账号宣布
- 包含版本号或产品名
- 提供访问链接或 API
- 有性能数据或 benchmark

### 传闻/泄露（正常报告）
- 非官方来源
- 标注为"传闻"或"泄露"
- 不连发

### 不报告
- 社区量化版本
- 纯回顾性 newsletter
- 重复内容
- 低质量讨论

## 监控关键词

### 英文关键词
- model, release, launch, announce, unveil
- GPT, Claude, Gemini, Llama, Mistral, Grok
- open source, benchmark, SOTA, AGI
- agent, framework, tool, API
- breakthrough, state-of-the-art

### 中文关键词
- 模型, 发布, 开源, 上线
- 突破, 最新, 重磅
- 工具, 框架, 平台

## 内容类型

### 优先报告
1. **新模型发布**
   - 大语言模型
   - 多模态模型
   - 专业领域模型

2. **新产品上线**
   - AI 应用
   - 开发工具
   - API 服务

3. **新框架/工具**
   - 开源框架
   - 开发工具
   - 部署方案

4. **重大突破**
   - Benchmark 新纪录
   - 技术突破
   - 架构创新

### 次要报告
- 产品更新
- 功能改进
- 社区讨论

### 不报告
- 个人观点
- 营销软文
- 重复内容
- 低质量讨论

## 输出格式规范

### 标准格式
```
🌬️ 新词监控更新 N 条：

1. [产品名] — [发布者]
   [一句话摘要]
   🔗 [链接]

2. ...
```

### 大厂发布格式
```
🚨🚨🚨 重大发布！

[产品名] 正式发布 — [公司]
- [关键特性 1]
- [关键特性 2]
- [关键特性 3]

🔗 [链接]

[URGENT_REPEAT_3X]
```

## 去重策略

1. **基于帖子 ID**
   - 记录在 `x-monitor-last-seen.md`
   - 每次扫描更新

2. **基于内容相似度**
   - 主 agent 判断
   - 避免重复推送

3. **时间窗口**
   - 24 小时内的重复内容
   - 仅推送一次

## 维护规则

### 每日检查
- Cron 任务状态
- 去重文件完整性
- 浏览器登录状态

### 每周更新
- 大厂账号列表
- 关键词列表
- 监控规则

### 异常处理
- 连续错误 > 3 次 → 检查网络
- 无新内容 > 24 小时 → 检查列表
- 重复推送 → 检查去重逻辑

---

**最后更新**: 2026-02-22
**维护者**: 研究助手
