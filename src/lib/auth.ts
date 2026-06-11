// 单用户口令保护：cookie 里存口令的 SHA-256，proxy 比对。
// 个人应用走 HTTPS，这个强度够用；不设 APP_PASSWORD 时整体跳过。
const SALT = "chief-kev-v1";

export const AUTH_COOKIE = "ck_auth";

export async function passwordToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`${SALT}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
