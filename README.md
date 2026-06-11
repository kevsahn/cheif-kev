# Chief Kev 🍳

给自己用的每周备菜 PWA：排本周午/晚餐菜单 → 一键汇总超市购物清单 → 菜谱库 → AI 问厨。

## 功能

- **本周**：7 天 × 午/晚菜单格，点格子选菜谱或随手写（外卖/剩菜）；「AI 排菜单」按你的要求一键生成整周
- **清单**：按本周菜单自动合并去重食材，按超市分区（蔬果→肉→蛋奶→主食→调料）排序；可勾选、手动加项，重新生成会保留手动项和勾选状态
- **菜谱**：增删改查；「AI 导入」粘贴任意菜谱文字自动解析成结构化菜谱
- **问厨**：聊天助手，知道你的本周菜单和菜谱库

## 本地跑起来

```bash
pnpm install
cp .env.example .env   # 填 OPENAI_API_KEY（不填则 AI 功能报错，其他功能正常）
pnpm db:push           # 建表（本地默认用 ./.pglite 文件数据库，零配置）
pnpm dev
```

> OPENAI_API_KEY 在 https://platform.openai.com/ 创建。注意 API 与 ChatGPT 订阅是两套独立计费，需单独充值（最低 $5，本 app 用量每月约 $1–3）。

打开 http://localhost:3000。本地不设 `APP_PASSWORD` 就不启用登录。

## 部署到 Vercel（手机上用）

1. 推到 GitHub，Vercel 导入该仓库（框架自动识别 Next.js）
2. Vercel 项目 → **Storage → Create Database → Neon**（免费层），`DATABASE_URL` 会自动注入
3. 项目 → Settings → Environment Variables 添加：
   - `OPENAI_API_KEY`
   - `APP_PASSWORD`（公网必设）
4. 部署完成后，本地跑一次建表：`DATABASE_URL="<Neon 连接串>" pnpm db:push`
5. **iPhone 上**：Safari 打开站点 → 登录 → 分享 → **添加到主屏幕**，之后就是全屏独立 app

改了 `src/lib/db/schema.ts` 后重新 `pnpm db:push`（本地和 Neon 各跑一次）。

## 环境变量

见 [.env.example](.env.example)。模型默认 `gpt-5.1`，想省钱设 `OPENAI_MODEL=gpt-5-mini`。

## 还没做（按需再加）

- Service worker 离线缓存（现在断网打不开；超市信号差时清单可能加载不出）
- 聊天记录持久化（现在刷新即清空）
- 推送提醒（iOS 16.4+ 的 Web Push 可做"周日提醒排菜单"）
