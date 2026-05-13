# PROJECT_STATUS

更新时间：2026-05-12 18:00 Asia/Shanghai
更新人：main

## 执行摘要

- 今日标准 daily log 覆盖仍偏薄：仅 `workspace/memory/2026-05-12.md` 与 `workspace-growth/memory/2026-05-12.md` 存在。
- 结合 WIP Board 与 for-human 交付记录，今日实际完成量集中在支付/积分故障修复、Omni 四站部署与索引、SongUnique 订单交付、KOL/CRM 推进、输出规范升级和小三炮插件修复。
- 明日主线应从“救火与部署”切回“增长代码发布 + 支付回归监控 + SongUnique 转化修复”，同时处理日志覆盖和 memory 根层膨胀。

## 数据覆盖

- 标准今日日志：
  - `/Users/openclaw/.openclaw/workspace/memory/2026-05-12.md`
  - `/Users/openclaw/.openclaw/workspace-growth/memory/2026-05-12.md`
- 项目状态源：
  - `/Users/openclaw/.openclaw/workspace/team-memory/PROJECT_STATUS.md`
  - `/Users/openclaw/.openclaw/team-memory/PROJECT_STATUS.md`
- 辅助证据：
  - `~/ai-shared/AI-Task/WIP-BOARD.md` 中 2026-05-12 WIP 条目
  - `for-human/2026-05/` 下 2026-05-12 的 47 份交付文档

## 今日完成

### 1. 支付、积分与 Stripe 多站点修复

- 查明 Nadou / 共享 Stripe 订阅积分未到账根因：新版 Stripe invoice 的订阅字段未被旧 parser 识别，导致订阅续费未进入积分派发路径。
- 完成 Nadou 单客户补偿与订阅权益补发，并进一步做全量对账：Nadou 与 MusicMake 已确认缺口完成补发，复核后关键 paid credit-bearing events 均有积分流水。
- 修复跨站订阅误拦截：checkout、current plan、cancel flow 改为按当前站点查询；Checkout 本地 preflight block / exception 补飞书告警。
- 允许同站点重复订阅，并提供 `ALLOW_DUPLICATE_SITE_SUBSCRIPTIONS` 开关；相关补丁已同步并部署到 13 个支付站点分支。
- 修复共享 webhook 场景下“错站失败通知”风险：失败类事件按站点过滤，成功/订阅事件保留共享 endpoint 处理能力。

### 2. Omni 四站部署、认证、索引和外链

- `aiomnivideo.com`、`omnivideopro.com`、`omnivideo2.com`、`geminomni.com` 按 Downloads SOP 完成品牌化重写、Logo/OG/Favicon 独立化、多语言关键文案修复、构建与公网验收。
- 四站 Google / GitHub 登录环境变量完成 drift check、Dokploy + GitHub ENV_PRODUCTION 同步、部署与最终复核。
- 四站 robots、普通 sitemap、video sitemap、llms.txt 均线上可访问；GSC 所有权已验证，普通 sitemap 与 video sitemap 提交成功；Bing Webmaster 与 IndexNow 主动索引提交成功。
- 小三炮 / 白名单外链两条链路均推进：四个 Omni 域名完成插件侧发送与 API 侧低风险外链发布，并保存公开链接证据。
- `site-branch-clone` 与 `branch-sync` skill 已补品牌差异化硬规则，避免以后只做关键词替换而漏换 logo、title、metadata、footer、多语言残留。

### 3. SongUnique、Adsy 与广告监控

- SongUnique paid-undelivered 审计完成；真实客户订单已完成候选生成、QA 预览、封面/PDF 修复、正式交付与 DB/邮件后置验证。
- SongUnique Google Ads 完成两轮日报；2026-05-10 花费高但 0 conversions，`unique song` 仍是主要 spend 来源，明日不应加预算，先查 conversion tracking、trust/reviews、demo/checkout。
- Adsy 后台完成待同意任务检查，随后批准 3 条验链通过任务，状态从 `Your Approval` 变为 `Completed`。
- Nadou support 发信身份已配置并用于客户回复；后续同类客户邮件必须继续走品牌域名 sender gate。

### 4. Growth / SEO 监控

- 两轮增长监控完成 GSC、Umami、DataForSEO、Google Ads 快照。
- Seedance30 是今日最明确新 SEO 机会：`seedance 3.0` 已有点击与较高 CTR，但 app 子页分散，需要收敛 canonical/title/internal linking 并补 release/API/free/price FAQ。
- Seedance20 `/seedance2api` 仍缺 JSON-LD，应升级为 API/provider comparison hub。
- MusicMake `/ai-ringtone-generator` 继续有效，Suno / YouTube policy 类高曝光低 CTR 页面仍应优先修 snippet、首屏答案和强内链。
- i2v.ai 仍是 GSC `siteUnverifiedUser`，若继续增长推进，先修 Search Console 权限。

### 5. KOL / BPS / 输出规范 / 本机基础设施

- MusicMake KOL CRM 已从本地 SQLite 依赖推进到旧 VPS Postgres 后端；线上 BPS snapshot 返回 `storage=postgres`，并发出 3 封 warm follow-up。
- 新一轮 MusicMake 网红邮箱采集 WIP 已启动，YouTube Data API 与 Apify 账号可用，但采集、评分、去重、回写仍未完成。
- Obsidian Briefing Memo 风格与日报类 Skill 输出标准完成升级；广告、邮件、数据分析日报维度已补齐到关键词/时间/国家/设备/人群、网站/事件/留存/转化等层面。
- 小三炮批量导入 URL-only 解析修复已提交推送；多 Chrome Profile 同步核查已形成交付。
- IBKR Client Portal Gateway 已安装并配置到 `https://localhost:5050`，当前等待人工登录/2FA 后才能验证 API。
- GitHub backup cron 暴露问题：当前 `.openclaw/workspace` 没有 remote，cron 显示 ok 不等于实际已推送。

## 需要关注

- **日志覆盖不足**：12 个 `workspace*` 中只有 `workspace` 和 `workspace-growth` 有标准 `memory/2026-05-12.md`；大量完成项依赖 WIP Board 和 outbox 补证。
- **支付修复需要回归监控**：Stripe invoice parser、共享 webhook、站点维度订阅查询已修，但明日必须用真实 production 查询确认无新增 missing credits / 错站通知。
- **增长修复仍未全部进入代码发布**：MusicMake SEO、Seedance30/20 SEO hub、SongUnique trust/reviews/demo/checkout 仍是明日关键执行项。
- **WIP Board 状态有少量漂移**：部分条目 checklist 已完成但 status 仍显示 `executing`；日终后应单独做 WIP hygiene，避免明日误判。
- **备份 cron 有假成功风险**：没有 Git remote 前不能把 cron 结果当成远端备份完成。
- **memory 根层超量**：research、kol、growth、product、operations、coding 需要归档清理。

## 明日优先级

1. **P0：支付/积分回归监控**  
   跑 Nadou / MusicMake / 共享 Stripe cluster 的新增 paid events 与积分流水核对，确认失败通知不再错站。

2. **P0：MusicMake 与视频站 SEO 发布**  
   先发布 MusicMake Suno/snippet、`/ai-ringtone-generator` hub；再推进 Seedance30 `seedance 3.0` 聚合和 Seedance20 `/seedance2api` API hub。

3. **P0：SongUnique 转化修复**  
   查 Ads conversion tracking / lag、`demo_audio_error`、trust/reviews schema、checkout friction；保持 Mother's Day 泛词止损。

4. **P1：KOL 回复与新线索闭环**  
   关闭 MusicMake 新一轮网红邮箱采集 WIP，继续补 Gmail / Resend / Feishu / CRM 合并事实源，优先处理 4 条 overdue warm follow-up。

5. **P1：Omni 四站上线后复查**  
   做登录 smoke、GSC sitemap first processing 观察、外链 URL 索引/可访问复查，避免部署完成后无人看首日异常。

6. **P1：本机与任务系统维护**  
   给 `.openclaw/workspace` backup cron 配 remote 或显式标记不可备份；IBKR Gateway 等待登录后验证；执行 memory 归档清理。

## 归档清理建议

- **必须优先清理**：
  - `/Users/openclaw/.openclaw/workspace-research/memory`：140 个根层文件
  - `/Users/openclaw/.openclaw/workspace-kol/memory`：71 个根层文件
  - `/Users/openclaw/.openclaw/workspace-growth/memory`：62 个根层文件
  - `/Users/openclaw/.openclaw/workspace-product/memory`：34 个根层文件
  - `/Users/openclaw/.openclaw/workspace-operations/memory`：25 个根层文件
  - `/Users/openclaw/.openclaw/workspace-coding/memory`：21 个根层文件
- **暂时观察**：
  - `workspace-backlink/memory`：19
  - `workspace-seo/memory`：19
  - `workspace-task/memory`：17
  - `workspace/memory`：11
  - `workspace-users/memory`：11
  - `.openclaw/memory`：8
- **建议动作**：保留最近 14 天 daily log 在 `memory/` 根层；旧 daily log 移到 `memory/archive/`；专题报告、CSV、JSON、一次性分析移到 `memory/reports/` 或专题目录。

## 长期记忆更新

- 已仅以索引形式补充：
  - `workspace/MEMORY.md`：GitHub backup cron 无 remote 时存在假成功风险。
  - `workspace-kol/MEMORY.md`：MusicMake KOL CRM 已推进到旧 VPS Postgres 后端，后续不应把本地 SQLite 当唯一事实源。
- 未把支付修复、Omni 部署、增长快照等长内容写入各 `MEMORY.md`；这些仍保留在 WIP Board、PROJECT_STATUS 与 for-human 交付文档中。

