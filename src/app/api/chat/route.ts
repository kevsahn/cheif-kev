import { and, asc, gte, lte } from "drizzle-orm";
import { getOpenAI, MODEL } from "@/lib/openai";
import { getDb } from "@/lib/db";
import { planEntries, recipes } from "@/lib/db/schema";
import { todayStr, weekDays, weekStartOf, weekdayName } from "@/lib/dates";

export const maxDuration = 60;

type InMsg = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  let messages: InMsg[];
  try {
    const body = await req.json();
    messages = (body.messages as InMsg[]).filter(
      (m) =>
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim() !== ""
    );
    if (messages.length === 0) throw new Error();
  } catch {
    return Response.json({ error: "消息格式不对" }, { status: 400 });
  }

  try {
    const db = await getDb();
    const today = todayStr();
    const days = weekDays(weekStartOf(today));
    const [entries, allRecipes] = await Promise.all([
      db
        .select()
        .from(planEntries)
        .where(
          and(gte(planEntries.date, days[0]), lte(planEntries.date, days[6]))
        )
        .orderBy(asc(planEntries.date)),
      db.select({ id: recipes.id, name: recipes.name }).from(recipes),
    ]);
    const nameOf = new Map(allRecipes.map((r) => [r.id, r.name]));
    const planText = entries
      .map(
        (e) =>
          `周${weekdayName(e.date)}${e.meal === "lunch" ? "午" : "晚"}：${
            e.recipeId ? nameOf.get(e.recipeId) ?? "?" : e.freeText
          }`
      )
      .join("\n");

    const system = `你是 Chief Kev 备菜 app 里的厨房助手。用户是 Kevin，住在澳洲，平时在 Coles / Woolworths 买菜。
用中文回答，口语化、简短、直接给可操作的建议；讲做法只给关键步骤。不要用 markdown 标题或列表符号，用普通短段落。
今天是 ${today}。
本周菜单：
${planText || "（还没排）"}
菜谱库里有：${allRecipes.map((r) => r.name).join("、") || "（空）"}`;

    const client = getOpenAI();
    const stream = client.responses.stream({
      model: MODEL,
      instructions: system,
      input: messages,
    });

    const encoder = new TextEncoder();
    const respBody = new ReadableStream<Uint8Array>({
      start(controller) {
        stream.on("response.output_text.delta", (e) =>
          controller.enqueue(encoder.encode(e.delta))
        );
        stream
          .finalResponse()
          .then(() => {
            try {
              controller.close();
            } catch {}
          })
          .catch((e) => {
            try {
              controller.enqueue(
                encoder.encode(
                  `\n出错了：${e instanceof Error ? e.message : "未知错误"}`
                )
              );
              controller.close();
            } catch {}
          });
      },
      cancel() {
        stream.abort();
      },
    });

    return new Response(respBody, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "服务出错" },
      { status: 500 }
    );
  }
}
