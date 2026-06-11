"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  Heart,
  MessageCircleQuestion,
  ShoppingCart,
} from "lucide-react";

const tabs = [
  { href: "/", label: "本周", icon: CalendarDays },
  { href: "/list", label: "清单", icon: ShoppingCart },
  { href: "/recipes", label: "菜谱", icon: BookOpen },
  { href: "/chat", label: "问厨", icon: MessageCircleQuestion },
];

export default function TabBar() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-safe">
      <div className="pointer-events-auto mx-auto mb-2 grid max-w-lg grid-cols-4 rounded-3xl border border-white/75 bg-white/95 px-2 py-1.5 shadow-[0_12px_34px_rgba(251,191,36,0.16)] backdrop-blur-xl">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`group flex flex-col items-center gap-0.5 rounded-xl py-1 text-xs ${
                active ? "font-medium text-amber-700" : "text-stone-400"
              }`}
            >
              <span
                className={`relative flex size-8 items-center justify-center rounded-full transition-colors ${
                  active
                    ? "bg-amber-100 text-amber-700 ring-1 ring-amber-200"
                    : "group-active:bg-stone-100"
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.3 : 1.8} />
                {active && (
                  <Heart
                    size={9}
                    className="absolute -right-0.5 -top-0.5 fill-rose-400 text-rose-400"
                  />
                )}
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
