"use server";

import { revalidatePath } from "next/cache";
import { and, eq, gte, lte } from "drizzle-orm";
import { getDb } from "./db";
import {
  planEntries,
  recipes,
  shoppingItems,
  type Ingredient,
} from "./db/schema";
import { addDays } from "./dates";
import type { MealKey, RecipeCategory } from "./types";

export async function setPlanEntry(input: {
  date: string;
  meal: MealKey;
  recipeId?: string | null;
  freeText?: string | null;
}) {
  const db = await getDb();
  await db
    .delete(planEntries)
    .where(
      and(eq(planEntries.date, input.date), eq(planEntries.meal, input.meal))
    );
  if (input.recipeId || input.freeText?.trim()) {
    await db.insert(planEntries).values({
      date: input.date,
      meal: input.meal,
      recipeId: input.recipeId ?? null,
      freeText: input.freeText?.trim() || null,
    });
  }
  revalidatePath("/");
}

export async function clearPlanEntries(weekStart: string) {
  const db = await getDb();
  await db
    .delete(planEntries)
    .where(
      and(gte(planEntries.date, weekStart), lte(planEntries.date, addDays(weekStart, 6)))
    );
  revalidatePath("/");
}

export async function saveRecipe(input: {
  id?: string;
  name: string;
  category: RecipeCategory;
  ingredients: Ingredient[];
  steps: string[];
  tags: string[];
  notes?: string;
}): Promise<string> {
  const db = await getDb();
  const values = {
    name: input.name.trim(),
    category: input.category,
    ingredients: input.ingredients.filter((i) => i.name.trim()),
    steps: input.steps.map((s) => s.trim()).filter(Boolean),
    tags: input.tags.map((t) => t.trim()).filter(Boolean),
    notes: input.notes?.trim() || null,
  };
  if (input.id) {
    await db
      .update(recipes)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(recipes.id, input.id));
    revalidatePath("/recipes");
    revalidatePath(`/recipes/${input.id}`);
    return input.id;
  }
  const [row] = await db
    .insert(recipes)
    .values(values)
    .returning({ id: recipes.id });
  revalidatePath("/recipes");
  return row.id;
}

export async function deleteRecipe(id: string) {
  const db = await getDb();
  await db.delete(recipes).where(eq(recipes.id, id));
  revalidatePath("/recipes");
  revalidatePath("/");
}

export async function deleteAllRecipes() {
  const db = await getDb();
  await db.delete(recipes);
  revalidatePath("/recipes");
  revalidatePath("/");
}

export async function toggleShoppingItem(id: string, checked: boolean) {
  const db = await getDb();
  await db
    .update(shoppingItems)
    .set({ checked })
    .where(eq(shoppingItems.id, id));
  revalidatePath("/list");
}

export async function addShoppingItem(
  weekStart: string,
  name: string,
  amount: string,
  category: string
) {
  if (!name.trim()) return;
  const db = await getDb();
  await db.insert(shoppingItems).values({
    weekStart,
    name: name.trim(),
    amount: amount.trim() || null,
    category,
    manual: true,
    sortOrder: 999,
  });
  revalidatePath("/list");
}

export async function deleteShoppingItem(id: string) {
  const db = await getDb();
  await db.delete(shoppingItems).where(eq(shoppingItems.id, id));
  revalidatePath("/list");
}

export async function clearShoppingItems(weekStart: string) {
  const db = await getDb();
  await db.delete(shoppingItems).where(eq(shoppingItems.weekStart, weekStart));
  revalidatePath("/list");
}

export async function clearCheckedItems(weekStart: string) {
  const db = await getDb();
  await db
    .delete(shoppingItems)
    .where(
      and(
        eq(shoppingItems.weekStart, weekStart),
        eq(shoppingItems.checked, true)
      )
    );
  revalidatePath("/list");
}
