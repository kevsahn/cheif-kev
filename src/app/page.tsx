import { and, asc, gte, lte } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { planEntries, recipes } from "@/lib/db/schema";
import { todayStr, weekDays, weekStartOf } from "@/lib/dates";
import WeekView from "@/components/week/WeekView";

export const dynamic = "force-dynamic";

export default async function WeekPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const today = todayStr();
  const weekStart = /^\d{4}-\d{2}-\d{2}$/.test(week ?? "")
    ? weekStartOf(week!)
    : weekStartOf(today);
  const days = weekDays(weekStart);

  const db = await getDb();
  const [entries, allRecipes] = await Promise.all([
    db
      .select()
      .from(planEntries)
      .where(and(gte(planEntries.date, days[0]), lte(planEntries.date, days[6]))),
    db
      .select({ id: recipes.id, name: recipes.name })
      .from(recipes)
      .orderBy(asc(recipes.name)),
  ]);

  return (
    <WeekView
      weekStart={weekStart}
      today={today}
      entries={entries}
      recipes={allRecipes}
    />
  );
}
