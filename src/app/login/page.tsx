"use client";

import { useState } from "react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      location.href = "/";
    } else {
      setError("密码不对，再试试");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-8">
      <div className="mb-8 text-center">
        <div className="mb-2 text-5xl">🍳</div>
        <h1 className="text-2xl font-bold">Chief Kev</h1>
        <p className="mt-1 text-sm text-stone-500">每周备菜小助手</p>
      </div>
      <form onSubmit={submit} className="w-full max-w-xs space-y-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="访问密码"
          autoFocus
          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base outline-none focus:border-amber-500"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy || !password}
          className="w-full rounded-xl bg-amber-500 py-3 font-medium text-white disabled:opacity-50"
        >
          {busy ? "进入中…" : "进入"}
        </button>
      </form>
    </div>
  );
}
