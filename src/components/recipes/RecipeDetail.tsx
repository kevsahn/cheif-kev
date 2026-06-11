"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Pencil, Trash2 } from "lucide-react";
import type { Recipe } from "@/lib/db/schema";
import { deleteRecipe } from "@/lib/actions";
import RecipeEditor from "./RecipeEditor";
import Mascot from "@/components/Mascot";

export default function RecipeDetail({ recipe }: { recipe: Recipe }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [, startTransition] = useTransition();

  if (editing) {
    return (
      <div className="px-4 py-4">
        <div className="mb-3 rounded-xl border border-amber-100 bg-white/80 px-3 py-2 shadow-sm shadow-amber-100/40">
          <h1 className="text-xl font-bold">编辑菜谱</h1>
          <p className="text-xs text-stone-500">把这道菜调成你们喜欢的版本</p>
        </div>
        <RecipeEditor
          initial={recipe}
          onDone={() => {
            setEditing(false);
            router.refresh();
          }}
        />
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <div className="mb-3 flex items-center justify-between rounded-xl border border-amber-100 bg-white/80 px-2 py-2 shadow-sm shadow-amber-100/40">
        <Link
          href="/recipes"
          className="flex items-center text-stone-400 active:text-stone-600"
        >
          <ChevronLeft size={22} />
          <span className="text-sm">菜谱</span>
        </Link>
        <div className="flex gap-3">
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-sm font-medium text-amber-600"
          >
            <Pencil size={14} /> 编辑
          </button>
          <button
            onClick={() => {
              if (!confirm(`删除「${recipe.name}」？删了就没了。`)) return;
              startTransition(async () => {
                await deleteRecipe(recipe.id);
                router.push("/recipes");
              });
            }}
            className="flex items-center gap-1 text-sm text-stone-400"
          >
            <Trash2 size={14} /> 删除
          </button>
        </div>
      </div>

      <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-sky-600">
        <Mascot size="sm" mood="recipe" />
        <span>小厨 Kev 的菜谱卡</span>
      </div>
      <h1 className="text-2xl font-bold">{recipe.name}</h1>
      <div className="mt-2">
        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
          {recipe.category}
        </span>
      </div>
      {recipe.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {recipe.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      <section className="mt-5">
        <h2 className="mb-2 text-sm font-semibold text-stone-500">食材</h2>
        <div className="divide-y divide-stone-100 rounded-xl border border-amber-100 bg-white/95 shadow-sm shadow-amber-100/40">
          {recipe.ingredients.map((ing, i) => (
            <div key={i} className="flex items-center px-3 py-2.5">
              <span className="flex-1 text-[15px]">{ing.name}</span>
              <span className="text-sm text-stone-400">{ing.amount}</span>
            </div>
          ))}
          {recipe.ingredients.length === 0 && (
            <p className="px-3 py-3 text-sm text-stone-400">没填食材</p>
          )}
        </div>
      </section>

      <section className="mt-5">
        <h2 className="mb-2 text-sm font-semibold text-stone-500">步骤</h2>
        <ol className="space-y-3">
          {recipe.steps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-rose-50 text-xs font-semibold text-rose-500 ring-1 ring-rose-100">
                {i + 1}
              </span>
              <p className="pt-0.5 text-[15px] leading-relaxed">{s}</p>
            </li>
          ))}
          {recipe.steps.length === 0 && (
            <p className="text-sm text-stone-400">没填步骤</p>
          )}
        </ol>
      </section>

      {recipe.notes && (
        <section className="mt-5">
          <h2 className="mb-2 text-sm font-semibold text-stone-500">备注</h2>
          <p className="rounded-xl border border-amber-100 bg-white/95 px-3 py-2.5 text-sm leading-relaxed text-stone-600 shadow-sm shadow-amber-100/40">
            {recipe.notes}
          </p>
        </section>
      )}
    </div>
  );
}
