import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, passwordToken } from "@/lib/auth";

export async function proxy(req: NextRequest) {
  const password = process.env.APP_PASSWORD;
  if (!password) return NextResponse.next(); // 没设密码 = 本地开发，不拦

  const { pathname } = req.nextUrl;
  if (pathname === "/login" || pathname === "/api/auth") {
    return NextResponse.next();
  }

  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (token && token === (await passwordToken(password))) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  // 放过静态资源、manifest 和图标——iOS 添加到主屏幕时会匿名抓取它们
  matcher: [
    "/((?!_next|favicon.ico|manifest.webmanifest|icon|apple-icon|.*\\.(?:svg|png|ico|webp)$).*)",
  ],
};
