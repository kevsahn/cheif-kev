export const CATEGORIES = [
  "蔬菜水果",
  "肉类海鲜",
  "蛋奶豆制品",
  "主食粮油",
  "调料干货",
  "其他",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const RECIPE_CATEGORIES = [
  "中餐",
  "西餐",
  "甜点",
  "烘焙",
  "饮品",
  "其他",
] as const;

export type RecipeCategory = (typeof RECIPE_CATEGORIES)[number];

export const MEALS = [
  { key: "lunch", label: "午" },
  { key: "dinner", label: "晚" },
] as const;

export type MealKey = (typeof MEALS)[number]["key"];
