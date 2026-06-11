<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Chief Kev — 项目说明

个人用每周备菜 PWA（单用户）。中文 UI，移动端优先（手机加到主屏幕使用）。

## 技术栈与约定

- Next.js 16 App Router + TypeScript + Tailwind v4，部署 Vercel
- **Next 16 注意**：用 `src/proxy.ts`（不是 middleware.ts）；`params`/`searchParams` 是 Promise 要 await
- 数据库：Drizzle ORM，schema 在 `src/lib/db/schema.ts`。本地无 `DATABASE_URL` 时自动用 PGlite（`./.pglite`），生产用 Neon（neon-http driver）。改 schema 后 `pnpm db:push`
- LLM：官方 `openai` SDK（不要换成第三方封装），用 Responses API。模型用 `src/lib/openai.ts` 的 `MODEL`（env `OPENAI_MODEL` 可覆盖，默认 gpt-5.1）。结构化输出用 `client.responses.parse()` + `zodTextFormat`（取 `output_parsed`），流式聊天用 `client.responses.stream()` 监听 `response.output_text.delta`。schema 在 `src/lib/ai-schemas.ts`（字段全必填、enum 限定，遵守 structured outputs 的 JSON Schema 子集）
- 鉴权：单密码（`APP_PASSWORD`）+ SHA-256 cookie，`src/proxy.ts` 拦截；不设密码 = 不启用（本地开发）
- 日期一律 `YYYY-MM-DD` 字符串传递，"今天/本周"按 `APP_TZ`（默认悉尼）算，工具在 `src/lib/dates.ts`；周从周一开始
- 数据变更走 server actions（`src/lib/actions.ts`）+ `revalidatePath`；AI 调用走 route handlers（`src/app/api/`）
- UI：手写组件 + lucide-react 图标，琥珀色主题（amber-500），底部 TabBar 导航

## 命令

```bash
pnpm dev        # 开发
pnpm build      # 构建
pnpm db:push    # 同步 schema 到数据库（本地 PGlite / 有 DATABASE_URL 时为 Neon）
```
