import { revalidatePath } from "next/cache";
import { zodTextFormat } from "openai/helpers/zod";
import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { ShoppingSchema } from "@/lib/ai-schemas";
import { getOpenAI, MODEL } from "@/lib/openai";
import { getDb } from "@/lib/db";
import { planEntries, recipes, shoppingItems } from "@/lib/db/schema";
import { weekDays } from "@/lib/dates";

export const maxDuration = 300;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { weekStart?: string };
  const { weekStart } = body;
  if (!weekStart || !/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    return Response.json({ error: "weekStart 格式不对" }, { status: 400 });
  }

  try {
    const db = await getDb();
    const days = weekDays(weekStart);
    const entries = await db
      .select()
      .from(planEntries)
      .where(
        and(gte(planEntries.date, days[0]), lte(planEntries.date, days[6]))
      );

    // 同一道菜这周做几次，食材就按几份算
    const countByRecipe = new Map<string, number>();
    for (const e of entries) {
      if (e.recipeId) {
        countByRecipe.set(e.recipeId, (countByRecipe.get(e.recipeId) ?? 0) + 1);
      }
    }
    if (countByRecipe.size === 0) {
      return Response.json(
        { error: "本周菜单里还没有关联菜谱的菜，先去「本周」排菜单" },
        { status: 400 }
      );
    }

    const used = await db
      .select()
      .from(recipes)
      .where(inArray(recipes.id, [...countByRecipe.keys()]));

    const lines: string[] = [];
    for (const r of used) {
      const times = countByRecipe.get(r.id) ?? 1;
      for (const ing of r.ingredients) {
        lines.push(
          `${ing.name}｜${ing.amount || "适量"}${times > 1 ? `｜这道菜做 ${times} 次` : ""}｜来自「${r.name}」｜分区:${ing.category}`
        );
      }
    }
    if (lines.length === 0) {
      return Response.json(
        { error: "这些菜谱都没填食材，先去补一下" },
        { status: 400 }
      );
    }

    const client = getOpenAI();
    const resp = await client.responses.parse({
      model: MODEL,
      instructions: `把一周菜谱的食材原料合并成一份超市购物清单（用户在澳洲 Coles/Woolworths 购物）：
- 同一种食材合并成一条（小葱/香葱算一种），数量能加就加并给大概值（如"约600g"），加不了就写"适量"；某道菜做 N 次的食材按 N 份算
- 盐、油、生抽这类家里必有的基础调味不列；不常见的调料（如豆豉、花椒）要列
- category 按给定枚举选；items 按逛超市的顺序排：蔬菜水果→肉类海鲜→蛋奶豆制品→主食粮油→调料干货→其他`,
      input: `本周食材原料如下，请合并成购物清单：\n${lines.join("\n")}`,
      text: { format: zodTextFormat(ShoppingSchema, "shopping_list") },
    });
    const parsed = resp.output_parsed;
    if (!parsed) {
      return Response.json(
        { error: "AI 没给出有效结果，再试一次" },
        { status: 502 }
      );
    }

    // 重新生成：保留手动添加的条目；同名条目保留勾选状态
    const old = await db
      .select()
      .from(shoppingItems)
      .where(eq(shoppingItems.weekStart, weekStart));
    const checkedNames = new Set(
      old.filter((o) => o.checked).map((o) => o.name)
    );
    const manualNames = new Set(
      old.filter((o) => o.manual).map((o) => o.name)
    );

    await db
      .delete(shoppingItems)
      .where(
        and(
          eq(shoppingItems.weekStart, weekStart),
          eq(shoppingItems.manual, false)
        )
      );
    const rows = parsed.items
      .filter((it) => it.name.trim() && !manualNames.has(it.name.trim()))
      .map((it, i) => ({
        weekStart,
        name: it.name.trim(),
        amount: it.amount.trim() || null,
        category: it.category,
        checked: checkedNames.has(it.name.trim()),
        manual: false,
        sortOrder: i,
      }));
    if (rows.length > 0) {
      await db.insert(shoppingItems).values(rows);
    }

    revalidatePath("/list");
    return Response.json({ count: rows.length });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "生成失败" },
      { status: 500 }
    );
  }
}
