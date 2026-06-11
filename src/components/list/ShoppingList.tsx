"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { CATEGORIES } from "@/lib/types";
import { addDays, formatShort } from "@/lib/dates";
import {
  addShoppingItem,
  clearCheckedItems,
  clearShoppingItems,
  deleteShoppingItem,
  toggleShoppingItem,
} from "@/lib/actions";
import Mascot from "@/components/Mascot";

type Item = {
  id: string;
  name: string;
  amount: string | null;
  category: string;
  checked: boolean;
  manual: boolean;
};

export default function ShoppingList({
  weekStart,
  items,
  isCurrentWeek,
}: {
  weekStart: string;
  items: Item[];
  isCurrentWeek: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimisticItems, applyOptimistic] = useOptimistic(
    items,
    (state, action: { id: string; checked: boolean }) =>
      state.map((it) =>
        it.id === action.id ? { ...it, checked: action.checked } : it
      )
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>("其他");

  const done = optimisticItems.filter((i) => i.checked).length;
  const donePercent = optimisticItems.length
    ? Math.round((done / optimisticItems.length) * 100)
    : 0;
  const known = (c: string) =>
    (CATEGORIES as readonly string[]).includes(c) ? c : "其他";
  const groups = CATEGORIES.map((c) => ({
    category: c,
    list: optimisticItems.filter((i) => known(i.category) === c),
  })).filter((g) => g.list.length > 0);

  function toggle(it: Item) {
    startTransition(async () => {
      applyOptimistic({ id: it.id, checked: !it.checked });
      await toggleShoppingItem(it.id, !it.checked);
    });
  }

  async function generate() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/ai/shopping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "生成失败");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成失败，再试一次");
    } finally {
      setBusy(false);
    }
  }

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const n = name;
    const a = amount;
    const c = category;
    setName("");
    setAmount("");
    startTransition(async () => {
      await addShoppingItem(weekStart, n, a, c);
      router.refresh();
    });
  }

  function clearAll() {
    if (!confirm("清空这一周的购物清单？")) return;
    startTransition(async () => {
      await clearShoppingItems(weekStart);
      router.refresh();
    });
  }

  return (
    <div>
      <header className="sticky top-0 z-30 bg-transparent px-4 pb-2 pt-3">
        <div className="rounded-2xl border border-amber-100/70 bg-white/95 px-4 py-3 shadow-[0_4px_14px_rgba(251,191,36,0.06)]">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-sky-600">
            <Mascot size="sm" mood="shopping" />
            <span>小厨 Kev 在整理采购车</span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold">购物清单</h1>
              <p className="mt-0.5 text-xs text-stone-500">
                {optimisticItems.length > 0
                  ? `已买 ${done}/${optimisticItems.length} 项`
                  : "等菜单排好后一起生成"}
              </p>
            </div>
            {optimisticItems.length > 0 && (
              <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-600">
                {donePercent}%
              </span>
            )}
          </div>
          {optimisticItems.length > 0 && (
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-amber-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-sky-400 transition-[width]"
                style={{ width: `${donePercent}%` }}
              />
            </div>
          )}
          <div className="mt-2 flex items-center justify-between text-sm">
            <Link
              href={`/list?week=${addDays(weekStart, -7)}`}
              className="rounded-lg p-1.5 text-stone-400 active:bg-stone-200"
              aria-label="上一周"
            >
              <ChevronLeft size={18} />
            </Link>
            {isCurrentWeek ? (
              <span className="text-stone-600">
                {formatShort(weekStart)} – {formatShort(addDays(weekStart, 6))} ·
                本周
              </span>
            ) : (
              <Link href="/list" className="font-medium text-amber-600">
                {formatShort(weekStart)} – {formatShort(addDays(weekStart, 6))} ·
                回到本周
              </Link>
            )}
            <Link
              href={`/list?week=${addDays(weekStart, 7)}`}
              className="rounded-lg p-1.5 text-stone-400 active:bg-stone-200"
              aria-label="下一周"
            >
              <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </header>

      <div className="px-4 py-4">
        <button
          onClick={generate}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 font-medium text-white shadow-sm shadow-amber-200 disabled:opacity-60"
        >
          <Sparkles size={16} />
          {busy
            ? "正在汇总本周食材…"
            : optimisticItems.some((i) => !i.manual)
              ? "按最新菜单重新生成"
              : "生成两人购物清单"}
        </button>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {optimisticItems.some((i) => !i.manual) && (
          <p className="mt-1.5 text-center text-xs text-stone-400">
            重新生成会保留手动添加的条目和已勾选状态
          </p>
        )}

        <div className="mt-4 space-y-4">
          {groups.map((g) => (
            <div key={g.category}>
              <h2 className="mb-1 px-1 text-xs font-medium text-stone-400">
                {g.category}
              </h2>
              <div className="divide-y divide-stone-100 rounded-xl border border-amber-100 bg-white/95 shadow-sm shadow-amber-100/40">
                {g.list.map((it) => (
                  <div
                    key={it.id}
                    onClick={() => toggle(it)}
                    className="flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 active:bg-rose-50/60"
                  >
                    <span
                      className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                        it.checked
                          ? "border-amber-500 bg-amber-500 text-white"
                          : "border-stone-300"
                      }`}
                    >
                      {it.checked && <Check size={13} strokeWidth={3} />}
                    </span>
                    <span
                      className={`flex-1 text-[15px] ${
                        it.checked ? "text-stone-300 line-through" : ""
                      }`}
                    >
                      {it.name}
                    </span>
                    {it.amount && (
                      <span className="text-sm text-stone-400">{it.amount}</span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startTransition(async () => {
                          await deleteShoppingItem(it.id);
                          router.refresh();
                        });
                      }}
                      disabled={pending}
                      className="rounded-lg p-2 text-stone-300 active:bg-red-50 active:text-red-500 disabled:opacity-40"
                      aria-label={`删除${it.name}`}
                      title="删除"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {optimisticItems.length === 0 && (
          <div className="mt-8 rounded-xl border border-sky-100 bg-sky-50/70 px-4 py-5 text-center shadow-sm shadow-sky-100/40">
            <Mascot mood="shopping" size="lg" className="mx-auto" />
            <p className="mt-2 text-sm font-medium text-sky-900">
              采购车还空着
            </p>
            <p className="mt-1 text-sm leading-relaxed text-sky-700">
              先去「本周」排菜单，再让小厨帮你们汇总食材。
            </p>
          </div>
        )}

        <form
          onSubmit={add}
          className="mt-6 flex gap-2 rounded-xl border border-amber-100 bg-white/90 p-2 shadow-sm shadow-amber-100/40"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="加点别的…"
            className="min-w-0 flex-1 rounded-lg border border-stone-300 px-3 py-2 text-base outline-none focus:border-amber-500"
          />
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="数量"
            className="w-16 rounded-lg border border-stone-300 px-2 py-2 text-base outline-none focus:border-amber-500"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-stone-300 bg-white px-1.5 py-2 text-sm outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!name.trim()}
            className="rounded-lg bg-stone-800 px-3 text-white disabled:opacity-40"
            aria-label="添加"
          >
            <Plus size={18} />
          </button>
        </form>

        {optimisticItems.length > 0 && (
          <div className="mt-4 grid gap-2">
            {done > 0 && (
              <button
                onClick={() =>
                  startTransition(async () => {
                    await clearCheckedItems(weekStart);
                    router.refresh();
                  })
                }
                disabled={pending}
                className="w-full py-2 text-center text-sm text-stone-400 underline disabled:opacity-40"
              >
                清除已勾选的 {done} 项
              </button>
            )}
            <button
              onClick={clearAll}
              disabled={pending}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 py-2.5 text-sm font-medium text-red-600 active:bg-red-50 disabled:opacity-40"
            >
              <Trash2 size={15} /> 清空本周清单
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
