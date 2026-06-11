import {
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { RECIPE_CATEGORIES } from "../types";

export type Ingredient = {
  name: string;
  amount: string; // 如 "500g"、"2根"，可为空字符串
  category: string; // 超市分区，见 lib/types.ts CATEGORIES
};

export const recipes = pgTable("recipes", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  category: text("category", { enum: RECIPE_CATEGORIES })
    .notNull()
    .default("中餐"),
  ingredients: jsonb("ingredients").$type<Ingredient[]>().notNull().default([]),
  steps: jsonb("steps").$type<string[]>().notNull().default([]),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const planEntries = pgTable(
  "plan_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    date: date("date").notNull(), // YYYY-MM-DD
    meal: text("meal", { enum: ["lunch", "dinner"] }).notNull(),
    recipeId: uuid("recipe_id").references(() => recipes.id, {
      onDelete: "set null",
    }),
    freeText: text("free_text"), // 不关联菜谱时的自由文本，如"外卖"、"剩菜"
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("plan_date_meal_idx").on(t.date, t.meal)]
);

export const shoppingItems = pgTable("shopping_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  weekStart: date("week_start").notNull(), // 所属周的周一 YYYY-MM-DD
  name: text("name").notNull(),
  amount: text("amount"),
  category: text("category").notNull().default("其他"),
  checked: boolean("checked").notNull().default(false),
  manual: boolean("manual").notNull().default(false), // 手动添加的条目不会被重新生成覆盖
  sortOrder: integer("sort_order").notNull().default(0),
});

export type Recipe = typeof recipes.$inferSelect;
export type PlanEntry = typeof planEntries.$inferSelect;
export type ShoppingItem = typeof shoppingItems.$inferSelect;
