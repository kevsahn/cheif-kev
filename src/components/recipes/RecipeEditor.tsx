"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Sparkles, X } from "lucide-react";
import {
  CATEGORIES,
  RECIPE_CATEGORIES,
  type RecipeCategory,
} from "@/lib/types";
import type { Ingredient } from "@/lib/db/schema";
import { saveRecipe } from "@/lib/actions";
import Mascot from "@/components/Mascot";

type Initial = {
  id?: string;
  name: string;
  category: RecipeCategory;
  ingredients: Ingredient[];
  steps: string[];
  tags: string[];
  notes: string | null;
};

const emptyIng = (): Ingredient => ({
  name: "",
  amount: "",
  category: "蔬菜水果",
});

export default function RecipeEditor({
  initial,
  showAi = false,
  onDone,
}: {
  initial?: Initial;
  showAi?: boolean;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState<RecipeCategory>(
    initial?.category ?? "中餐"
  );
  const [ings, setIngs] = useState<Ingredient[]>(
    initial?.ingredients.length ? initial.ingredients : [emptyIng()]
  );
  const [stepsText, setStepsText] = useState(initial?.steps.join("\n") ?? "");
  const [tagsText, setTagsText] = useState(initial?.tags.join(", ") ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const [aiOpen, setAiOpen] = useState(showAi);
  const [aiText, setAiText] = useState("");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function setIng(i: number, patch: Partial<Ingredient>) {
    setIngs((prev) => prev.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  }

  async function parseWithAi() {
    if (!aiText.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/ai/recipe-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "解析失败");
      const r = data.recipe;
      setName(r.name);
      setCategory(r.category);
      setIngs(r.ingredients.length ? r.ingredients : [emptyIng()]);
      setStepsText(r.steps.join("\n"));
      setTagsText(r.tags.join(", "));
      setAiOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "解析失败，再试一次");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!name.trim()) {
      setError("先给菜起个名字");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const id = await saveRecipe({
        id: initial?.id,
        name,
        category,
        ingredients: ings,
        steps: stepsText.split("\n"),
        tags: tagsText.split(/[,，]/),
        notes,
      });
      if (onDone) {
        onDone();
        router.refresh();
      } else {
        router.push(`/recipes/${id}`);
      }
    } catch {
      setError("保存失败，再试一次");
      setSaving(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-base outline-none focus:border-amber-500";

  return (
    <div className="space-y-4">
      {aiOpen ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 shadow-sm shadow-amber-100/60">
          <div className="mb-2 flex items-start gap-2">
            <Mascot size="md" mood="recipe" />
            <div>
              <p className="text-sm font-medium text-amber-900">
                小厨 Kev 帮你把菜谱收好
              </p>
              <p className="mt-0.5 text-xs text-stone-500">
                粘贴菜谱文字、小红书分享文本或链接，表单会自动填好
              </p>
            </div>
          </div>
          <textarea
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            rows={6}
            placeholder="把菜谱文字或小红书分享内容粘到这里…"
            className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm leading-relaxed outline-none focus:border-amber-500"
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={parseWithAi}
              disabled={busy || !aiText.trim()}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-amber-500 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              <Sparkles size={14} />
              {busy ? "解析中…" : "解析并填入"}
            </button>
            <button
              onClick={() => setAiOpen(false)}
              className="rounded-lg border border-amber-200 bg-white/80 px-3 text-sm text-stone-500"
            >
              收起
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAiOpen(true)}
          className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-white/80 px-3 py-1.5 text-sm font-medium text-amber-700 shadow-sm shadow-amber-100/50"
        >
          <Sparkles size={14} /> 粘贴文字/小红书链接，AI 自动填表
        </button>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-600">
          菜名
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="比如：番茄炒蛋"
          className={inputCls}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-600">
          分类
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as RecipeCategory)}
          className={inputCls}
        >
          {RECIPE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-600">
          食材
        </label>
        <div className="space-y-2">
          {ings.map((ing, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={ing.name}
                onChange={(e) => setIng(i, { name: e.target.value })}
                placeholder="食材"
                className="min-w-0 flex-1 rounded-lg border border-stone-200 bg-white px-3 py-2 text-base outline-none focus:border-amber-500"
              />
              <input
                value={ing.amount}
                onChange={(e) => setIng(i, { amount: e.target.value })}
                placeholder="用量"
                className="w-20 rounded-lg border border-stone-200 bg-white px-2 py-2 text-base outline-none focus:border-amber-500"
              />
              <select
                value={ing.category}
                onChange={(e) => setIng(i, { category: e.target.value })}
                className="w-24 rounded-lg border border-stone-200 bg-white px-1.5 py-2 text-sm outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <button
                onClick={() =>
                  setIngs((prev) =>
                    prev.length > 1 ? prev.filter((_, j) => j !== i) : prev
                  )
                }
                className="p-1 text-stone-300 active:text-red-500"
                aria-label="删除这行"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => setIngs((prev) => [...prev, emptyIng()])}
          className="mt-2 flex items-center gap-1 text-sm text-amber-600"
        >
          <Plus size={14} /> 加一种食材
        </button>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-600">
          步骤（一行一步）
        </label>
        <textarea
          value={stepsText}
          onChange={(e) => setStepsText(e.target.value)}
          rows={6}
          placeholder={"番茄切块，鸡蛋打散\n热油先炒蛋，盛出\n…"}
          className={`${inputCls} leading-relaxed`}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-600">
          标签（逗号分隔，可不填）
        </label>
        <input
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
          placeholder="快手, 下饭, 鸡肉"
          className={inputCls}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-600">
          备注（可不填）
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="比如：Coles 的鸡腿肉比鸡胸好用"
          className={`${inputCls} leading-relaxed`}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2 pb-4">
        <button
          onClick={save}
          disabled={saving}
          className="flex-1 rounded-xl bg-amber-500 py-3 font-medium text-white shadow-sm shadow-amber-200 disabled:opacity-60"
        >
          {saving ? "保存中…" : "保存进菜谱库"}
        </button>
        {onDone && (
          <button
            onClick={onDone}
            className="rounded-xl border border-stone-300 px-5 text-stone-500"
          >
            取消
          </button>
        )}
      </div>
    </div>
  );
}
