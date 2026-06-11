"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { addDays, formatShort, weekDays, weekdayName } from "@/lib/dates";
import { MEALS, type MealKey } from "@/lib/types";
import { clearPlanEntries, setPlanEntry } from "@/lib/actions";
import Mascot from "@/components/Mascot";

type RecipeLite = { id: string; name: string };
type Entry = {
  id: string;
  date: string;
  meal: string;
  recipeId: string | null;
  freeText: string | null;
};
type Slot = { date: string; meal: MealKey };

export default function WeekView({
  weekStart,
  today,
  entries,
  recipes,
}: {
  weekStart: string;
  today: string;
  entries: Entry[];
  recipes: RecipeLite[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Slot | null>(null);
  const [aiOpen, setAiOpen] = useState(false);

  const recipeName = useMemo(
    () => new Map(recipes.map((r) => [r.id, r.name])),
    [recipes]
  );
  const entryMap = useMemo(() => {
    const m = new Map<string, Entry>();
    for (const e of entries) m.set(`${e.date}|${e.meal}`, e);
    return m;
  }, [entries]);

  const days = weekDays(weekStart);
  const isCurrentWeek = days.includes(today);
  const hasEntries = entries.length > 0;
  const filledSlots = entries.length;

  function clearSlot(slot: Slot) {
    startTransition(async () => {
      await setPlanEntry({ date: slot.date, meal: slot.meal });
      router.refresh();
    });
  }

  function clearWeek() {
    if (!confirm("清空这一周所有已安排的午餐和晚餐？")) return;
    startTransition(async () => {
      await clearPlanEntries(weekStart);
      router.refresh();
    });
  }

  return (
    <div>
      <header className="sticky top-0 z-30 bg-transparent px-4 pb-2 pt-3">
        <div className="rounded-2xl border border-amber-100/70 bg-white/95 px-4 py-3 shadow-[0_4px_14px_rgba(251,191,36,0.06)]">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-sky-600">
            <Mascot size="sm" mood="thinking" />
            <span>小厨 Kev 正在看菜单</span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-bold">本周菜单</h1>
              <p className="mt-0.5 text-xs text-stone-500">
                已安排 {filledSlots}/14 格 · 这周一起好好吃饭
              </p>
            </div>
            <div className="flex items-center gap-2">
              {hasEntries && (
                <button
                  onClick={clearWeek}
                  disabled={pending}
                  className="flex items-center gap-1 whitespace-nowrap rounded-full border border-red-200 bg-white/80 px-3 py-1.5 text-sm font-medium text-red-600 active:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 size={14} /> 清空
                </button>
              )}
              <button
                onClick={() => setAiOpen(true)}
                className="flex items-center gap-1 whitespace-nowrap rounded-full bg-amber-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm shadow-amber-200 active:bg-amber-600"
              >
                <Sparkles size={15} /> AI 排菜单
              </button>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <Link
              href={`/?week=${addDays(weekStart, -7)}`}
              className="rounded-lg p-1.5 text-stone-400 active:bg-stone-200"
              aria-label="上一周"
            >
              <ChevronLeft size={18} />
            </Link>
            {isCurrentWeek ? (
              <span className="text-stone-600">
                {formatShort(days[0])} – {formatShort(days[6])} · 本周
              </span>
            ) : (
              <Link href="/" className="font-medium text-amber-600">
                {formatShort(days[0])} – {formatShort(days[6])} · 回到本周
              </Link>
            )}
            <Link
              href={`/?week=${addDays(weekStart, 7)}`}
              className="rounded-lg p-1.5 text-stone-400 active:bg-stone-200"
              aria-label="下一周"
            >
              <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </header>

      <div className="space-y-3 px-4 py-4">
        {days.map((d) => (
          <div
            key={d}
            className={`rounded-xl border bg-white/95 shadow-sm shadow-amber-100/40 ${
              d === today
                ? "border-rose-300 ring-2 ring-rose-100"
                : "border-amber-100"
            }`}
          >
            <div className="flex items-center justify-between gap-2 px-3 pt-2.5">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold">周{weekdayName(d)}</span>
                <span className="text-xs text-stone-400">{formatShort(d)}</span>
              </div>
              {d === today && (
                <span className="flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-600">
                  <Heart size={10} className="fill-rose-400" />
                  今天约饭
                </span>
              )}
            </div>
            <div className="divide-y divide-stone-100 px-1 py-1">
              {MEALS.map(({ key, label }) => {
                const e = entryMap.get(`${d}|${key}`);
                const text = e
                  ? e.recipeId
                    ? recipeName.get(e.recipeId) ?? "（菜谱已删除）"
                    : e.freeText
                  : null;
                return (
                  <div key={key} className="flex items-center">
                    <button
                      onClick={() => setEditing({ date: d, meal: key })}
                      className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2.5 text-left active:bg-rose-50/60"
                    >
                      <span
                        className={`flex h-6 w-10 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                          text
                            ? "bg-amber-50 text-amber-700"
                            : "bg-stone-100 text-stone-400"
                        }`}
                      >
                        {label === "午" ? "午餐" : "晚餐"}
                      </span>
                      {text ? (
                        <span className="flex-1 truncate text-[15px] font-medium text-stone-800">
                          {text}
                        </span>
                      ) : (
                        <span className="flex-1 text-[15px] text-stone-300">
                          一起安排点什么…
                        </span>
                      )}
                    </button>
                    {e && (
                      <button
                        onClick={() => clearSlot({ date: d, meal: key })}
                        disabled={pending}
                        className="mr-1 shrink-0 rounded-lg p-2 text-stone-300 active:bg-red-50 active:text-red-500 disabled:opacity-40"
                        aria-label={`删除${formatShort(d)}${label}`}
                        title="删除"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <SlotEditor
          slot={editing}
          entry={entryMap.get(`${editing.date}|${editing.meal}`)}
          recipes={recipes}
          onClose={() => setEditing(null)}
        />
      )}
      {aiOpen && (
        <PlanAIDialog weekStart={weekStart} onClose={() => setAiOpen(false)} />
      )}
    </div>
  );
}

function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative mx-auto w-full max-w-lg">
        <div className="max-h-[80dvh] overflow-y-auto rounded-t-2xl bg-white p-4 pb-safe">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-stone-400 active:bg-stone-100"
              aria-label="关闭"
            >
              <X size={20} />
            </button>
          </div>
          <div className="pb-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

function SlotEditor({
  slot,
  entry,
  recipes,
  onClose,
}: {
  slot: Slot;
  entry?: Entry;
  recipes: RecipeLite[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState("");
  const [free, setFree] = useState(entry?.freeText ?? "");

  const filtered = recipes.filter((r) =>
    r.name.toLowerCase().includes(q.trim().toLowerCase())
  );
  const mealLabel = slot.meal === "lunch" ? "午餐" : "晚餐";

  function apply(recipeId: string | null, freeText: string | null) {
    startTransition(async () => {
      await setPlanEntry({ date: slot.date, meal: slot.meal, recipeId, freeText });
      router.refresh();
      onClose();
    });
  }

  return (
    <Sheet
      title={`周${weekdayName(slot.date)} ${formatShort(slot.date)} · ${mealLabel}`}
      onClose={onClose}
    >
      <div className={pending ? "pointer-events-none opacity-50" : ""}>
        {entry && (
          <div className="mb-3 flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm">
            <span className="truncate">
              当前：
              {entry.recipeId ? (
                <Link
                  href={`/recipes/${entry.recipeId}`}
                  className="font-medium text-amber-700 underline"
                >
                  {recipes.find((r) => r.id === entry.recipeId)?.name ?? "菜谱"}
                </Link>
              ) : (
                entry.freeText
              )}
            </span>
            <button
              onClick={() => apply(null, null)}
              className="ml-2 shrink-0 text-stone-500 underline"
            >
              清除
            </button>
          </div>
        )}

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索菜谱…"
          className="mb-2 w-full rounded-lg border border-stone-300 px-3 py-2 text-base outline-none focus:border-amber-500"
        />
        <div className="max-h-56 divide-y divide-stone-100 overflow-y-auto rounded-lg border border-stone-200">
          {filtered.map((r) => (
            <button
              key={r.id}
              onClick={() => apply(r.id, null)}
              className="block w-full px-3 py-2.5 text-left text-[15px] active:bg-amber-50"
            >
              {r.name}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-3 py-4 text-sm text-stone-400">
              {recipes.length === 0 ? (
                <>
                  还没有菜谱，去
                  <Link href="/recipes" className="text-amber-600 underline">
                    菜谱页
                  </Link>
                  加一个，或直接在下面写
                </>
              ) : (
                "没搜到"
              )}
            </p>
          )}
        </div>

        <p className="mb-1.5 mt-4 text-xs text-stone-400">
          或者随便写点什么（外卖 / 约会 / 出去吃 / 剩菜）
        </p>
        <div className="flex gap-2">
          <input
            value={free}
            onChange={(e) => setFree(e.target.value)}
            placeholder="比如：出去吃火锅"
            className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-base outline-none focus:border-amber-500"
          />
          <button
            onClick={() => apply(null, free)}
            disabled={!free.trim()}
            className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            确定
          </button>
        </div>
      </div>
    </Sheet>
  );
}

function PlanAIDialog({
  weekStart,
  onClose,
}: {
  weekStart: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [prefs, setPrefs] = useState("");
  const [overwrite, setOverwrite] = useState(false);
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");

  async function generate() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/ai/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart, preferences: prefs, overwrite }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "生成失败");
      setSummary(data.summary || "已生成本周菜单");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成失败，再试一次");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet title="AI 排菜单" onClose={onClose}>
      {summary ? (
        <div>
          <div className="mb-3 flex items-center gap-3 rounded-xl border border-sky-100 bg-sky-50 px-3 py-2.5">
            <Mascot mood="happy" />
            <div>
              <p className="text-sm font-semibold text-sky-900">小厨排好了</p>
              <p className="text-xs text-sky-700">看看这周有没有想微调的地方</p>
            </div>
          </div>
          <p className="whitespace-pre-wrap rounded-lg border border-amber-100 bg-amber-50 px-3 py-3 text-sm leading-relaxed">
            {summary}
          </p>
          <button
            onClick={onClose}
            className="mt-3 w-full rounded-xl bg-amber-500 py-3 font-medium text-white"
          >
            好，去看看
          </button>
        </div>
      ) : (
        <div>
          <div className="mb-3 flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5">
            <Mascot mood="thinking" />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                让小厨 Kev 先想一版
              </p>
              <p className="text-xs text-amber-700">
                会结合菜谱库、两人份和你们这周的偏好
              </p>
            </div>
          </div>
          <textarea
            value={prefs}
            onChange={(e) => setPrefs(e.target.value)}
            rows={4}
            placeholder="说说你们这周想怎么吃：比如「清淡一点，两顿鸡肉一顿鱼，午餐尽量简单，周五晚上出去吃」"
            className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-base leading-relaxed outline-none focus:border-amber-500"
          />
          <label className="mt-2 flex items-center gap-2 text-sm text-stone-600">
            <input
              type="checkbox"
              checked={overwrite}
              onChange={(e) => setOverwrite(e.target.checked)}
              className="size-4 accent-amber-500"
            />
            覆盖已经排好的格子
          </label>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <button
            onClick={generate}
            disabled={busy}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 font-medium text-white disabled:opacity-60"
          >
            <Sparkles size={16} />
            {busy ? "AI 正在排菜单，约需一分钟…" : "生成两人菜单"}
          </button>
          <p className="mt-2 text-center text-xs text-stone-400">
            会优先用你的菜谱库，缺的菜会自动创建新菜谱
          </p>
        </div>
      )}
    </Sheet>
  );
}
