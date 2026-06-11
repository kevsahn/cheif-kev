import { z } from "zod";
import { CATEGORIES, RECIPE_CATEGORIES } from "./types";

// 结构化输出的 schema：所有字段必填、不能有 min/max 之类的约束
// （OpenAI structured outputs 的 JSON Schema 子集限制）
export const IngredientSchema = z.object({
  name: z.string(),
  amount: z.string(),
  category: z.enum(CATEGORIES),
});

export const RecipeSchema = z.object({
  name: z.string(),
  category: z.enum(RECIPE_CATEGORIES),
  ingredients: z.array(IngredientSchema),
  steps: z.array(z.string()),
  tags: z.array(z.string()),
});

export const PlanSchema = z.object({
  entries: z.array(
    z.object({
      date: z.string(),
      meal: z.enum(["lunch", "dinner"]),
      // 三选一：引用现有菜谱 id / 新建菜谱 / 自由文本（剩菜、外卖等）
      existingRecipeId: z.string().nullable(),
      newRecipe: RecipeSchema.nullable(),
      freeText: z.string().nullable(),
    })
  ),
  summary: z.string(),
});

export const ShoppingSchema = z.object({
  items: z.array(
    z.object({
      name: z.string(),
      amount: z.string(),
      category: z.enum(CATEGORIES),
    })
  ),
});
