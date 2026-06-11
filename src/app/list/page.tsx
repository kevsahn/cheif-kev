import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { shoppingItems } from "@/lib/db/schema";
import { todayStr, weekStartOf } from "@/lib/dates";
import ShoppingList from "@/components/list/ShoppingList";

export const dynamic = "force-dynamic";

export default async function ListPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const today = todayStr();
  const weekStart = /^\d{4}-\d{2}-\d{2}$/.test(week ?? "")
    ? weekStartOf(week!)
    : weekStartOf(today);

  const db = await getDb();
  const items = await db
    .select()
    .from(shoppingItems)
    .where(eq(shoppingItems.weekStart, weekStart))
    .orderBy(asc(shoppingItems.sortOrder), asc(shoppingItems.name));

  return (
    <ShoppingList
      weekStart={weekStart}
      items={items}
      isCurrentWeek={weekStart === weekStartOf(today)}
    />
  );
}
