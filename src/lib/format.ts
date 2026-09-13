import type { Lang } from "./i18n";

const LOCALES: Record<Lang, string> = { hy: "hy-AM", ru: "ru-RU", en: "en-US" };

// Deterministic across server and client (Intl currency formatting differs
// between Node and browsers → React hydration mismatch).
function groupThousands(n: number) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function formatPrice(amount: number, currency = "AMD", lang: Lang = "hy") {
  const num = groupThousands(amount);
  if (currency === "AMD") {
    return lang === "en" ? `AMD ${num}` : `${num} ֏`;
  }
  return `${num} ${currency}`;
}

export function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISODate(s: string | null | undefined): Date | undefined {
  if (!s) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

const HY_MONTHS_SHORT = ["Հնվ", "Փտվ", "Մրտ", "Ապր", "Մյս", "Հնս", "Հլս", "Օգս", "Սեպ", "Հոկ", "Նոյ", "Դեկ"];

export function formatDate(s: string | null | undefined, lang: Lang = "hy") {
  const d = parseISODate(s);
  if (!d) return "";
  if (lang === "hy") return `${d.getDate()} ${HY_MONTHS_SHORT[d.getMonth()]}`;
  return new Intl.DateTimeFormat(LOCALES[lang], { day: "numeric", month: "short" }).format(d);
}

export function nightsBetween(checkIn?: string | null, checkOut?: string | null) {
  const a = parseISODate(checkIn);
  const b = parseISODate(checkOut);
  if (!a || !b) return 0;
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000));
}

export function todayISO() {
  return toISODate(new Date());
}

export function addDaysISO(iso: string, days: number) {
  const d = parseISODate(iso) ?? new Date();
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** Every night in [checkIn, checkOut) — the nights that must be free. */
export function nightsInRange(checkIn: string, checkOut: string): string[] {
  const out: string[] = [];
  const start = parseISODate(checkIn);
  const end = parseISODate(checkOut);
  if (!start || !end) return out;
  const cur = new Date(start);
  while (cur < end) {
    out.push(toISODate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

export function slugify(input: string) {
  const map: Record<string, string> = {
    ա: "a", բ: "b", գ: "g", դ: "d", ե: "e", զ: "z", է: "e", ը: "y", թ: "t", ժ: "zh",
    ի: "i", լ: "l", խ: "kh", ծ: "ts", կ: "k", հ: "h", ձ: "dz", ղ: "gh", ճ: "ch", մ: "m",
    յ: "y", ն: "n", շ: "sh", ո: "o", չ: "ch", պ: "p", ջ: "j", ռ: "r", ս: "s", վ: "v",
    տ: "t", ր: "r", ց: "ts", ու: "u", փ: "p", ք: "q", և: "ev", օ: "o", ֆ: "f",
  };
  return input
    .toLowerCase()
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}