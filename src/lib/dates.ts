// 日期统一用 YYYY-MM-DD 字符串传递，避免时区歧义。
// "今天"按 APP_TZ（默认悉尼）计算——服务器跑在 UTC 上时不会差一天。
const TZ = process.env.APP_TZ || "Australia/Sydney";

export function todayStr(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// 所在周的周一
export function weekStartOf(dateStr: string): string {
  const dow = new Date(dateStr + "T00:00:00Z").getUTCDay(); // 0=周日
  return addDays(dateStr, dow === 0 ? -6 : 1 - dow);
}

export function weekDays(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

const WEEKDAY_NAMES = ["日", "一", "二", "三", "四", "五", "六"];

export function weekdayName(dateStr: string): string {
  return WEEKDAY_NAMES[new Date(dateStr + "T00:00:00Z").getUTCDay()];
}

export function formatShort(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${Number(m)}/${Number(d)}`;
}
