"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import Mascot from "@/components/Mascot";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "帮我们想想这周吃什么",
  "约会晚餐想清淡一点，做什么？",
  "鸡胸肉怎么做才不柴？",
  "冰箱里有西兰花和虾，能做个两人份吗？",
];

export default function Chat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  async function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    setInput("");
    setBusy(true);
    const history: Msg[] = [...messages, { role: "user", content: t }];
    setMessages([...history, { role: "assistant", content: "" }]);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(-12) }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `请求失败（${res.status}）`);
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMessages([...history, { role: "assistant", content: acc }]);
      }
      if (!acc.trim()) {
        setMessages([
          ...history,
          { role: "assistant", content: "（没有返回内容，再问一次试试）" },
        ]);
      }
    } catch (e) {
      setMessages([
        ...history,
        {
          role: "assistant",
          content: `出错了：${e instanceof Error ? e.message : "未知错误"}`,
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <header className="sticky top-0 z-30 bg-transparent px-4 pb-2 pt-3">
        <div className="rounded-2xl border border-amber-100/70 bg-white/95 px-4 py-3 shadow-[0_4px_14px_rgba(251,191,36,0.06)]">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-sky-600">
            <Mascot size="sm" mood="happy" />
            <span>小厨 Kev 在线</span>
          </div>
          <h1 className="text-xl font-bold">问厨</h1>
          <p className="mt-0.5 text-xs text-stone-400">
            知道你们的本周菜单和菜谱库，随便问
          </p>
        </div>
      </header>

      <div className="space-y-3 px-4 py-4 pb-24">
        {messages.length === 0 && (
          <div className="mt-6 space-y-2">
            <div className="mb-4 rounded-xl border border-sky-100 bg-sky-50/70 px-4 py-5 text-center shadow-sm shadow-sky-100/40">
              <Mascot mood="thinking" size="lg" className="mx-auto" />
              <p className="mt-2 text-sm font-medium text-sky-900">
                小厨在，直接问
              </p>
              <p className="mt-1 text-sm leading-relaxed text-sky-700">
                想做两人份、换食材、安排晚餐，都可以丢给它。
              </p>
            </div>
            <p className="mb-3 text-center text-sm text-stone-400">
              想吃什么，直接问就好
            </p>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="flex w-full items-center gap-2 rounded-xl border border-amber-100 bg-white/95 px-4 py-3 text-left text-sm shadow-sm shadow-amber-100/40 active:bg-sky-50/70"
              >
                <Sparkles size={14} className="shrink-0 text-amber-500" />
                <span>{s}</span>
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === "user" ? "flex justify-end" : "flex"}
          >
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[15px] leading-relaxed ${
                m.role === "user"
                  ? "rounded-br-md bg-amber-500 text-white shadow-sm shadow-amber-200"
                  : "rounded-bl-md border border-sky-100 bg-sky-50/80 shadow-sm shadow-sky-100/40"
              }`}
            >
              {m.content ||
                (busy && i === messages.length - 1 ? "思考中…" : "")}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div
        className="fixed inset-x-0 z-30 px-4"
        style={{ bottom: "calc(5.35rem + env(safe-area-inset-bottom))" }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="mx-auto flex max-w-lg gap-2 rounded-full border border-white/75 bg-white/90 p-2 shadow-[0_12px_34px_rgba(251,191,36,0.16)] backdrop-blur-xl"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="问点做菜的事…"
            className="min-w-0 flex-1 rounded-full border border-amber-100/70 bg-white/90 px-4 py-2 text-base outline-none placeholder:text-stone-400 focus:border-amber-400 focus:bg-white/90"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-300 text-white shadow-sm shadow-amber-200 active:bg-amber-400 disabled:opacity-40"
            aria-label="发送"
          >
            <Send size={17} />
          </button>
        </form>
      </div>
    </div>
  );
}
