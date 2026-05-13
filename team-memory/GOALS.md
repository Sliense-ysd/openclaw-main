# GOALS.md - 团队周计划

更新时间：2026-05-11 09:05 Asia/Shanghai  
周期：2026-05-11 ～ 2026-05-17

## 本周总目标

本周重点从“找到增长机会和修补单点问题”推进到“收入链路稳定、可售产品上线、已有需求转化”。新增研究和机会监控继续做，但不能替代 P0 收口：支付、广告归因、API 中转站可售化、客户回复闭环、SEO 高曝光页面发布。

核心衡量标准：

1. SongUnique 的付费搜索、试听、checkout、PayPal optional、节日邮件和 reviews/trust 页面形成可追踪收入闭环；不在 `unique song` 连续 0 转化时盲目加预算。
2. MusicMake 完成 Stripe 升级补差价上线验证，并至少发布一轮 Suno / AI music policy / ringtone 高确定性 SEO 修复。
3. API 中转站从临时 sslip.io / rebranded scaffold 进入可售状态：正式域名、provider keys、生产 env、billing/webhook、docs 和线上 smoke test 全部打通。
4. Stripe webhook / billing 相关告警按项目逐项清掉，img2video 旧账户和新账户 webhook 错位不再继续制造失败事件。
5. 邮件、KOL、客户反馈和团队记录形成每日事实源；Spam / Trash / 已读线程不再漏扫，WIP Board 和 PROJECT_STATUS 不再依赖事后猜测。

## 上周进展摘要

- growth：GSC / Umami / DataForSEO / Google Ads 监控恢复到可用状态，确认 MusicMake 最大短期 SEO 漏斗仍是 Suno pricing/free/YouTube policy 低 CTR；`/ai-ringtone-generator` 出现高质量点击，可升级为工具 hub。
- growth / ads：SongUnique `unique song` 证明有商业需求，但 2026-05-09 和 2026-05-10 连续花费无转化；自然搜索 `unique song` CTR 约 0.5%，`/reviews` 有排名无点击，站内 `demo_audio_error` 仍是高优先级转化风险。
- SongUnique：完成 PayPal 默认隐藏、企业 PayPal 链路验证、展开空白块修复和慢加载根因定位；完成节日营销邮件模板、Resend audience 同步和 broadcast 草稿验证；完成 2 笔真实未交付订单交付和 4 封竞对误购客诉回复。
- MusicMake：完成升级 checkout 报错排查，确认生产支付方式选择和 provider checkout 创建可用；完成 Stripe canonical product/price、专用 Billing Portal configuration、订阅 provider 语义和 Stripe 已订阅用户升级入口收口。
- KOL / 邮件：MusicMake KOL “零回复”复盘完成，真实问题是 Ankit Sharma 付费合作意向进入 Gmail Spam，未进入本地回复映射 / SQLite / Feishu；Gmail Daily Brief 已补 risk folders read+unread 扫描和回归测试。
- API 中转站：完成市场/CPC/竞品/终局判断、新 VPS MVP、Umami / Feishu 接入、Stripe test 店铺和 sexygf 底座复查；完成首页品牌重做、旧弹窗和 SexyGF 残留清理并部署验证。正式域名、provider keys 和生产 provider smoke 仍未收口。
- img2video / billing：Stripe webhook 告警已定位为旧 Stripe 账户未退役 + 新 Stripe 账户 webhook URL 指向不存在路由的双重错位，后续需要按修复方案执行。
- OpenClaw / 运维：修复 OpenClaw / KOL agent 代理漂移、Telegram 长消息与 probe 问题；完成 Gmail + Zoho 巡检、Umami 管理员凭据轮换、闪电说共享词典接入。
- 记录治理：daily log 覆盖仍不足，memory 根层文件数仍超标；多项成果依赖 WIP Board 和 outbox 补证，需本周恢复稳定记录纪律。

## 本周优先级

### P0 - 必须推进

1. SongUnique 收入链路收口
   - 产出：`demo_audio_error` 根因修复、checkout / PayPal 事件链路复核、`/reviews` trust 页面和首页 SERP snippet 修订、Ads 5/6 有单 vs 5/9-5/10 无单复盘。
   - 完成标准：试听错误明显下降或有明确降级路径；`unique song` 不加预算前完成设备/国家/小时/事件链路对比；reviews/legit/price/保障信息可被用户和搜索结果承接。
   - Owner：growth + coding + users。

2. MusicMake 支付升级和 SEO 发布
   - 产出：Stripe 升级补差价变更部署与线上验证；Suno pricing/free/free-tier、YouTube AI music policy、Udio commercial-use、AI music monetization 页面修复；`/ai-ringtone-generator` hub 升级方案或 PR。
   - 完成标准：Stripe Customer Portal 走 canonical price 白名单并能完成 live smoke；至少 4 个高曝光 SEO 页面进入可发布状态；ringtone 页面补 demo / FAQ / 手机设置教程内链。
   - Owner：coding + growth + kol。

3. API 中转站正式域名与 provider 配通
   - 产出：正式域名确认和 Cloudflare zone 接入、生产 env provider keys、Dokploy/GitHub Actions 部署、线上 relay/provider smoke test、billing/webhook 环境核对。
   - 完成标准：不再只依赖 `sslip.io` 临时域名；KIE / APIMart / SAN02 / BytePlus 等至少一个真实 provider 线上可用；首页、docs、pricing、checkout、Feishu/Umami 事件可验证。
   - Owner：coding + operations + growth。

4. Stripe webhook / billing 告警清零
   - 产出：img2video 旧 Stripe endpoint 退役或修正、新账户 webhook 路由修复、存量 `past_due` 订阅处理建议；同时复查 MusicMake / SongUnique / API 中转站 webhook URL 与 env。
   - 完成标准：旧账户不再持续向错误 endpoint 投递；新账户 webhook 返回 2xx；关键项目 webhook secret 和 route 对齐，不能从旧目录或非 Git 目录发布。
   - Owner：coding + operations。

5. 邮件 / 客服 / KOL 事实源闭环
   - 产出：Gmail Inbox / Spam / Trash / 已读线程、Zoho、Resend、Feishu、SQLite 的每日汇总口径；客户邮件回复建议执行追踪；KOL follow-up 降噪模板。
   - 完成标准：Ankit Sharma 这类 Spam 业务回复不会再被日报漏掉；缺 refresh token 的账号明确列为配置缺口；所有外联链接带 UTM，CTA 不再混杂 free trial / paid sponsorship / media kit / WhatsApp。
   - Owner：kol + users + operations。

6. 团队记录与 memory 治理
   - 产出：active workspace daily log、WIP Board 实时状态、`team-memory/PROJECT_STATUS.md` 日终更新、memory 根层归档清单。
   - 完成标准：growth/product/research/task/users/kol/backlink/coding/operations/seo/main 至少记录完成、阻塞、下一步；research、kol、growth、product、main、operations memory 根层开始降到规范内；敏感信息只进入 secrets。
   - Owner：main 协调，各 workspace 自负责。

### P1 - 应该完成

1. Seedance20 / Seedance30 API 与新词 hub
   - 产出：Seedance20 `/seedance2api` provider comparison + API pricing hub；Seedance30 `seedance 3.0` release / official / API / price / free / alternatives hub。
   - 完成标准：FAQ/Breadcrumb/SoftwareApplication 或 Article JSON-LD 完成；provider comparison 覆盖 ByteDance official、fal.ai、OpenRouter、PiAPI、Kie、AtlasCloud、Replicate；Seedance30 避免 app/tool 页面分散同一 query 权重。
   - Owner：growth + product + coding。

2. SongUnique 节日营销可发件化
   - 产出：`songunique.com` Resend 发件域验证、节日 campaign 操作 SOP、母亲节之后的父亲节 / anniversary / memorial 复用版本。
   - 完成标准：不再用 `musicmake.ai` 发件域承载 SongUnique 品牌邮件；注册用户进入可营销名单链路可复验；broadcast 草稿可安全转正式发送。
   - Owner：growth + users + operations。

3. MusicMake KOL follow-up 和 creator demo
   - 产出：AI music disclosure / copyright / distribution safety follow-up 模板，ringtone demo 3 条脚本，KOL 回复监控日报。
   - 完成标准：follow-up 不重复上一批重 CTA 错误；围绕 YouTube disclosure、commercial-use、distribution safety 和 ringtone demo 给创作者明确内容钩子。
   - Owner：kol + growth。

4. Google Ads AI Max 隔离实验准备
   - 产出：SongUnique AI Max 小额实验设计，包含 URL inclusion/exclusion、品牌排除、否词、conversion lag 和 search terms 审计节奏。
   - 完成标准：主 campaign 不被自动大改；只在转化追踪与落地页修复后启动，预算从小额实验开始。
   - Owner：growth。

5. Veryfb / OpenCLI Bridge 可行路径决策
   - 产出：Chrome extension 接入、Playwright persistent、CDP、已登录 profile 的对比结论。
   - 完成标准：Chrome 147 对 `--load-extension` 的限制不再反复消耗；选一条可验证浏览路径，或明确本周暂停。
   - Owner：operations + coding。

### P2 - 有余力再做

1. Toolify 模型 SEO brief 重排
   - 优先从 `sentence-transformers/all-MiniLM-L6-v2`、`BAAI/bge-small-en-v1.5`、`BAAI/bge-large-en-v1.5`、`BAAI/bge-m3` 中产出 3 份 brief；必须区分 exact model keyword 和 broad family keyword。

2. i2v / Veo40 / SexySeduce 基础监控补齐
   - i2v 补 GSC 验证；Veo40 修 Umami API 500；SexySeduce 接 GSC、提交 sitemap，再判断是否建 `free ai girlfriend` 等页面。

3. Product Hunt / Reddit / 社区复用
   - 把 MusicMake 合规 hub、Seedance API hub、SongUnique trust page 改造成社区帖、FAQ 帖或复盘帖；不抢 P0 发布资源。

4. BPS / Cron Hub / Codex 同步后续
   - 继续维护 BPS Dashboard、域名拍卖数据源替换、Codex/Claude 跨设备同步，但排在收入链路和 API 中转站之后。

## 本周关键任务清单

| 编号 | 优先级 | 任务 | 交付物 | 完成标准 |
| --- | --- | --- | --- | --- |
| W19-01 | P0 | SongUnique `demo_audio_error` 与 checkout 事件排查 | 修复 PR 或根因报告 | 试听错误有修复或降级路径，checkout 事件链路可复核 |
| W19-02 | P0 | SongUnique Ads 5/6 vs 5/9-5/10 复盘 | 观察报告 | 设备/国家/小时/search term/事件差异清晰，不盲目加预算 |
| W19-03 | P0 | SongUnique reviews / trust 页面 | 页面 brief 或 PR | 承接 reviews/legit/price/退款/交付时效意图 |
| W19-04 | P0 | MusicMake Stripe 升级补差价上线 | 部署记录 + live smoke | Portal / checkout / subscription provider 语义验证通过 |
| W19-05 | P0 | MusicMake Suno 与 AI music SEO 发布 | 页面修订清单或 PR | 至少 4 个高曝光页面可发布 |
| W19-06 | P0 | API 中转站正式域名接入 | DNS / env / deploy 记录 | 正式域名可访问，Umami/Feishu/Stripe 基础配置正确 |
| W19-07 | P0 | API 中转站 provider 配通 | provider smoke 报告 | 至少一个真实上游线上可用，错误有可见降级 |
| W19-08 | P0 | img2video Stripe webhook 修复 | webhook 修复记录 | 旧 endpoint 停止失败，新 endpoint 返回 2xx |
| W19-09 | P0 | 邮件 / KOL 回复事实源 | 日报口径 + skill/script 记录 | Inbox/Spam/Trash/已读线程不漏扫 |
| W19-10 | P0 | 团队记录与 memory 归档 | PROJECT_STATUS + 归档清单 | 活跃 workspace 每天有完成/阻塞/下一步 |
| W19-11 | P1 | Seedance API / Seedance 3.0 hub | 页面 brief 或 PR | provider comparison、FAQ、JSON-LD、canonical/内链完成 |
| W19-12 | P1 | SongUnique 节日邮件发件域 | Resend 域名验证 + SOP | SongUnique 品牌域可安全发 campaign |
| W19-13 | P1 | MusicMake creator follow-up | 模板 + demo 脚本 | CTA 降噪，链接带 UTM |
| W19-14 | P1 | AI Max 隔离实验准备 | 实验方案 | 只在 tracking/landing 修好后小预算启动 |
| W19-15 | P1 | Veryfb / OpenCLI Bridge 决策 | 可行路径报告 | 不再重复同一失败路径 |

## 风险与约束

- SongUnique paid search 已经有真实花费，连续 0 转化时继续加预算会放大落地页、试听或追踪问题。
- PayPal 慢加载根因部分在 PayPal 前端按钮链路和地区网络，不应把所有问题误归为本站 API；但本站必须给用户清晰 loading / retry / fallback。
- API 中转站如果继续停在 rebrand 和临时域名阶段，就无法验证真实 provider 成本、计费、退款和客服压力。
- Stripe webhook 修复要严格核对 repo、branch、worktree、remote 和 diff，不允许从旧目录或构建产物覆盖生产。
- MusicMake SEO 最大曝光页面仍未发布，继续新增调研会稀释本周可见收益。
- 邮件日报如果只看 unread 或只看 Inbox，会继续漏掉 Spam 里的真实商业回复。
- memory 根层超标会增加恢复成本，但归档不能误删近期标准 daily log 和正式交付索引。

## 每日检查节奏

- 09:00：检查 WIP Board active items、前一日 PROJECT_STATUS、SongUnique Ads 回填、邮件/KOL risk folders。
- 12:00：只追 P0 阻塞：SongUnique 收入链路、MusicMake 支付/SEO、API 中转站域名/provider、Stripe webhook。
- 18:00：更新 `team-memory/PROJECT_STATUS.md`，同步完成、阻塞、下一步和需要用户决策的事项。
- 周末复盘：按 W19 任务表检查 P0/P1 完成率，决定下周是否进入 SongUnique 扩量、API 中转站投放、MusicMake creator 扩展。
