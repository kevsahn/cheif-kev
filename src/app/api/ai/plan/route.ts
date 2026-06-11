import { revalidatePath } from "next/cache";
import { zodTextFormat } from "openai/helpers/zod";
import { and, eq, gte, lte } from "drizzle-orm";
import { PlanSchema } from "@/lib/ai-schemas";
import { getOpenAI, MODEL } from "@/lib/openai";
import { getDb } from "@/lib/db";
import { planEntries, recipes } from "@/lib/db/schema";
import { weekDays, weekdayName } from "@/lib/dates";
import { MEALS, type MealKey } from "@/lib/types";

export const maxDuration = 300;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    weekStart?: string;
    preferences?: string;
    overwrite?: boolean;
  };
  const { weekStart, preferences, overwrite } = body;
  if (!weekStart || !/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    return Response.json({ error: "weekStart 格式不对" }, { status: 400 });
  }

  try {
    const db = await getDb();
    const days = weekDays(weekStart);
    const [existing, library] = await Promise.all([
      db
        .select()
        .from(planEntries)
        .where(
          and(gte(planEntries.date, days[0]), lte(planEntries.date, days[6]))
        ),
      db
        .select({
          id: recipes.id,
          name: recipes.name,
          category: recipes.category,
          tags: recipes.tags,
        })
        .from(recipes),
    ]);

    const taken = new Set(existing.map((e) => `${e.date}|${e.meal}`));
    const nameOf = new Map(library.map((r) => [r.id, r.name]));
    const slots: { date: string; meal: MealKey }[] = [];
    for (const d of days) {
      for (const { key } of MEALS) {
        if (overwrite || !taken.has(`${d}|${key}`)) {
          slots.push({ date: d, meal: key });
        }
      }
    }
    if (slots.length === 0) {
      return Response.json(
        { error: "这周已经排满了。想重排的话勾选「覆盖已经排好的格子」" },
        { status: 400 }
      );
    }

    const slotText = slots
      .map(
        (s) =>
          `${s.date}（周${weekdayName(s.date)}）${s.meal === "lunch" ? "午餐" : "晚餐"}`
      )
      .join("\n");
    const libraryText = library
      .map(
        (r) =>
          `${r.id} | ${r.name}（${r.category}${
            r.tags.length ? `、${r.tags.join("、")}` : ""
          }）`
      )
      .join("\n");
    const keptText = overwrite
      ? ""
      : existing
          .map(
            (e) =>
              `周${weekdayName(e.date)}${e.meal === "lunch" ? "午" : "晚"}：${
                e.recipeId ? nameOf.get(e.recipeId) ?? "?" : e.freeText
              }`
          )
          .join("\n");

    const system = `你帮 Kevin（住澳洲，在 Coles/Woolworths 买菜）排每周的备菜菜单。
原则：
- 家常中餐为主，做法省事；午餐倾向简单，优先快手菜、便当菜、面/饭类
- Kevin 一般不吃剩菜，不要默认安排剩菜；剩菜只是偶尔可用的选项，只有在用户要求、省事明显合理或能减少浪费时才用 freeText 写明，比如"周二晚红烧鸡的剩菜"
- 一周内食材尽量复用，减少要买的种类
- 优先复用菜谱库里合适的菜（existingRecipeId 必须用列表里的精确 id）；没有合适的就编一道新菜（newRecipe）
- 每个 entry 三选一：existingRecipeId / newRecipe / freeText，另外两个填 null
- newRecipe：category 从 中餐 / 西餐 / 甜点 / 烘焙 / 饮品 / 其他 里选；步骤 3-6 步短句；ingredients 的 amount 写大概用量；tags 给 2-3 个
- 只为指定的空档生成 entry，不要多也不要少排
- summary 用 2-3 句中文总结这周怎么吃、是否照顾到了要求`;

    const userMsg = `需要安排的空档：
${slotText}

Kevin 的要求：${preferences?.trim() || "（没特别说，按家常、省事、营养均衡来）"}

菜谱库：
${libraryText || "（空的，全部新建）"}
${keptText ? `\n已排好的（保持不动，注意别重复）：\n${keptText}` : ""}`;

    const client = getOpenAI();
    const resp = await client.responses.parse({
      model: MODEL,
      instructions: system,
      input: [{ role: "user", content: userMsg }],
      text: { format: zodTextFormat(PlanSchema, "plan") },
    });
    const plan = resp.output_parsed;
    if (!plan) {
      return Response.json({ error: "AI 没给出有效结果，再试一次" }, { status: 502 });
    }

    const wanted = new Set(slots.map((s) => `${s.date}|${s.meal}`));
    const validIds = new Set(library.map((r) => r.id));
    let filled = 0;
    for (const e of plan.entries) {
      if (!wanted.has(`${e.date}|${e.meal}`)) continue;

      let recipeId: string | null = null;
      let freeText: string | null = e.freeText?.trim() || null;
      if (e.existingRecipeId && validIds.has(e.existingRecipeId)) {
        recipeId = e.existingRecipeId;
        freeText = null;
      } else if (e.newRecipe?.name.trim()) {
        const [row] = await db
          .insert(recipes)
          .values({
            name: e.newRecipe.name.trim(),
            category: e.newRecipe.category,
            ingredients: e.newRecipe.ingredients,
            steps: e.newRecipe.steps,
            tags: e.newRecipe.tags,
          })
          .returning({ id: recipes.id });
        recipeId = row.id;
        freeText = null;
      } else if (!freeText) {
        continue;
      }

      await db
        .delete(planEntries)
        .where(and(eq(planEntries.date, e.date), eq(planEntries.meal, e.meal)));
      await db.insert(planEntries).values({
        date: e.date,
        meal: e.meal,
        recipeId,
        freeText,
      });
      filled++;
    }

    revalidatePath("/");
    revalidatePath("/recipes");
    return Response.json({ summary: plan.summary, filled });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "生成失败" },
      { status: 500 }
    );
  }
}
