"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { deleteAllRecipes, deleteRecipe } from "@/lib/actions";
import { RECIPE_CATEGORIES, type RecipeCategory } from "@/lib/types";
import type { Ingredient } from "@/lib/db/schema";
import Mascot from "@/components/Mascot";

type RecipeListItem = {
  id: string;
  name: string;
  category: RecipeCategory;
  ingredients: Ingredient[];
  tags: string[];
};

export default function RecipeList({ recipes }: { recipes: RecipeListItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [activeCategory, setActiveCategory] = useState<RecipeCategory | "全部">(
    "全部"
  );

  const visibleRecipes =
    activeCategory === "全部"
      ? recipes
      : recipes.filter((recipe) => recipe.category === activeCategory);

  function removeRecipe(recipe: RecipeListItem) {
    if (!confirm(`删除「${recipe.name}」？删了就没了。`)) return;
    startTransition(async () => {
      await deleteRecipe(recipe.id);
      router.refresh();
    });
  }

  function removeAll() {
    if (!confirm(`删除全部 ${recipes.length} 个菜谱？删了就没了。`)) return;
    startTransition(async () => {
      await deleteAllRecipes();
      router.refresh();
    });
  }

  return (
    <div>
      <header className="sticky top-0 z-30 bg-transparent px-4 pb-2 pt-3">
        <div className="rounded-2xl border border-amber-100/70 bg-white/95 px-4 py-3 shadow-[0_4px_14px_rgba(251,191,36,0.06)]">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-sky-600">
            <Mascot size="sm" mood="recipe" />
            <span>小厨 Kev 在收菜谱</span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-bold">菜谱库</h1>
              <p className="mt-0.5 text-xs text-stone-500">
                收藏你们想一起吃的菜
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link
                href="/recipes/new?ai=1"
                className="flex items-center gap-1 rounded-full border border-amber-300 bg-white/80 px-3 py-1.5 text-sm font-medium text-amber-700 active:bg-amber-50"
              >
                <Sparkles size={14} /> AI 导入
              </Link>
              <Link
                href="/recipes/new"
                className="flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm shadow-amber-200 active:bg-amber-600"
              >
                <Plus size={15} /> 新建
              </Link>
            </div>
          </div>
          {recipes.length > 0 && (
            <div className="mt-2 flex items-center justify-between gap-3 text-sm">
              <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-600">
                {activeCategory === "全部"
                  ? `共 ${recipes.length} 个菜谱`
                  : `${activeCategory} · ${visibleRecipes.length} 个`}
              </span>
              <button
                onClick={removeAll}
                disabled={pending}
                className="flex items-center gap-1 rounded-full border border-red-200 bg-white/80 px-3 py-1.5 font-medium text-red-600 active:bg-red-50 disabled:opacity-40"
              >
                <Trash2 size={14} /> 全部删除
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="space-y-2 px-4 py-4">
        {recipes.length > 0 && (
          <div className="-mx-4 overflow-x-auto px-4 pb-2">
            <div className="flex gap-2">
              {(["全部", ...RECIPE_CATEGORIES] as const).map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${
                    activeCategory === category
                      ? "border-amber-500 bg-amber-500 text-white"
                      : "border-amber-100 bg-white/95 text-stone-500"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}

        {visibleRecipes.map((recipe) => (
          <div
            key={recipe.id}
            className="flex items-center rounded-xl border border-amber-100 bg-white/95 shadow-sm shadow-amber-100/40 active:bg-rose-50/60"
          >
            <Link
              href={`/recipes/${recipe.id}`}
              className="min-w-0 flex-1 px-4 py-3"
            >
              <div className="truncate font-medium text-stone-800">
                {recipe.name}
              </div>
              <div className="mt-1 flex min-w-0 items-center gap-1.5 truncate text-xs text-stone-400">
                <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
                  {recipe.category}
                </span>
                <span className="truncate">
                  {recipe.ingredients.length} 种食材
                  {recipe.tags.length > 0 && ` · ${recipe.tags.join(" / ")}`}
                </span>
              </div>
            </Link>
            <button
              onClick={() => removeRecipe(recipe)}
              disabled={pending}
              className="mr-2 shrink-0 rounded-lg p-2 text-stone-300 active:bg-red-50 active:text-red-500 disabled:opacity-40"
              aria-label={`删除${recipe.name}`}
              title="删除"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {recipes.length === 0 && (
          <div className="mt-8 rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-5 text-center shadow-sm shadow-amber-100/40">
            <Mascot mood="recipe" size="lg" className="mx-auto" />
            <p className="mt-2 text-sm font-medium text-amber-900">
              小厨还没学会你们爱吃什么
            </p>
            <p className="mt-1 text-sm leading-relaxed text-amber-700">
              用「AI 导入」粘贴文字或小红书链接，先收几道菜。
            </p>
          </div>
        )}
        {recipes.length > 0 && visibleRecipes.length === 0 && (
          <p className="mt-8 text-center text-sm text-stone-400">
            这个分类下还没有菜谱。
          </p>
        )}
      </div>
    </div>
  );
}
