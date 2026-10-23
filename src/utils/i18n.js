// Taal van HomeBase Back-up, zoals in HomeBaseOS: de Nederlandse tekst is de sleutel, {naam} wordt ingevuld.
// Standaard volgt de app de taal van het systeem (Nederlands, anders Engels); in Voorkeuren kan je ze kiezen.
import { en } from "../lang/en";

const DICTS = { en };

function detect() {
  try {
    const stored = localStorage.getItem("hb-lang");
    if (stored === "nl" || stored === "en") return stored;
  } catch {
    /* privévenster */
  }
  return (navigator.language || "nl").toLowerCase().startsWith("nl") ? "nl" : "en";
}

export const lang = detect();
export const locale = lang === "nl" ? "nl-BE" : "en-GB";
document.documentElement.lang = lang;

export function t(text, vars) {
  const d = DICTS[lang];
  const s = d && d[text] != null ? d[text] : text;
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)) : s;
}

export function setLang(l) {
  try {
    localStorage.setItem("hb-lang", l);
  } catch {
    /* privévenster */
  }
  window.location.reload();
}

// "3 uur geleden", "over 20 minuten"
export function ago(date) {
  const ms = new Date(date).getTime();
  if (!ms) return "";
  const s = Math.round((ms - Date.now()) / 1000);
  const a = Math.abs(s);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (a < 60) return rtf.format(0, "second");
  if (a < 3600) return rtf.format(Math.round(s / 60), "minute");
  if (a < 86400) return rtf.format(Math.round(s / 3600), "hour");
  return rtf.format(Math.round(s / 86400), "day");
}

export function bytes(n) {
  if (n == null || Number.isNaN(Number(n))) return "–";
  const u = ["B", "KB", "MB", "GB", "TB", "PB"];
  let i = 0;
  let v = Number(n);
  while (v >= 1000 && i < u.length - 1) {
    v /= 1024;
    i++;
  }
  return new Intl.NumberFormat(locale, { maximumFractionDigits: v >= 100 ? 0 : 1 }).format(v) + " " + u[i];
}
