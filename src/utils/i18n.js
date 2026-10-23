// Language of HomeBase Backup, like in HomeBaseOS: the English text is the key, {name} is filled in.
// By default the app follows the system language (if there is a translation, otherwise English); you can choose it in Preferences.
import { nl } from "../lang/nl";

// Translations; English is built in. To add a language: a file in src/lang/ and a line here.
export const LANGS = {
  en: { name: "English", locale: "en-GB", dict: null },
  nl: { name: "Nederlands", locale: "nl-BE", dict: nl },
};

function detect() {
  try {
    const stored = localStorage.getItem("hb-lang");
    if (stored && LANGS[stored]) return stored;
  } catch {
    /* private window */
  }
  const sys = (navigator.language || "en").toLowerCase().split("-")[0];
  return LANGS[sys] ? sys : "en";
}

export const lang = detect();
export const locale = LANGS[lang].locale;
document.documentElement.lang = lang;

export function t(text, vars) {
  const d = LANGS[lang].dict;
  const s = d && d[text] != null ? d[text] : text;
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)) : s;
}

export function setLang(l) {
  try {
    localStorage.setItem("hb-lang", l);
  } catch {
    /* private window */
  }
  window.location.reload();
}

// "3 hours ago", "in 20 minutes"
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
