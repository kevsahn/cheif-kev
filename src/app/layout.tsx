import type { Metadata, Viewport } from "next";
import "./globals.css";
import TabBar from "@/components/TabBar";

export const metadata: Metadata = {
  title: "Chief Kev",
  description: "每周备菜小助手：菜单、购物清单、菜谱与 AI 问厨",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Chief Kev",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#fafaf9",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className="bg-stone-50 text-stone-900 antialiased">
        <main className="mx-auto min-h-dvh max-w-lg pb-28">{children}</main>
        <TabBar />
      </body>
    </html>
  );
}
