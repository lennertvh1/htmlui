// Pairing with HomeBaseOS. In the app (Electron) the main process makes the request to the NAS: this page runs on
// https://127.0.0.1 and may not call an http address on your network. In a normal browser (development) it goes directly.
import axios from "axios";
import { t } from "./i18n";

// "freddy.local", "192.168.1.10:8080" or "http://freddy:8080" → http://freddy.local:8080
export function nasBaseUrl(address) {
  let a = String(address || "").trim().replace(/\/+$/, "");
  if (!a) return null;
  if (!/^https?:\/\//i.test(a)) a = "http://" + a;
  let u;
  try {
    u = new URL(a);
  } catch {
    return null;
  }
  if (!u.port && u.protocol === "http:") u.port = "8080";
  return u.origin;
}

// The pairing code as HomeBaseOS shows it (XXXX-XXXX): capitals and a dash don't matter.
export const cleanCode = (code) => String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

async function fetchPairing(base, code) {
  const url = base + "/api/backup/pair/" + encodeURIComponent(code);
  if (window.kopiaUI && window.kopiaUI.homebasePair) return window.kopiaUI.homebasePair(url);
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

// Fetch the details from HomeBaseOS and connect to the Kopia server on the NAS.
export async function pairWithHomeBase(address, code) {
  const base = nasBaseUrl(address);
  if (!base) throw new Error(t("Fill in the address of your HomeBaseOS, e.g. freddy.local or 192.168.1.10."));
  const c = cleanCode(code);
  if (c.length !== 8) throw new Error(t("A pairing code has 8 characters, e.g. K7MQ-2XPF."));
  let r;
  try {
    r = await fetchPairing(base, c);
  } catch (e) {
    throw new Error(t("HomeBaseOS can't be reached at {address}. Check the address and whether you are on the same network.", { address: base }), { cause: e });
  }
  if (!r || r.status !== 200 || !r.data) {
    if (r && r.status === 404) throw new Error(t("That pairing code is wrong or has expired. Create a new one in HomeBaseOS."));
    if (r && r.status === 429) throw new Error(t("Too many wrong codes. Wait 5 minutes and try again."));
    throw new Error(t("HomeBaseOS returned an error: {error}", { error: (r && r.data && r.data.error) || (r && r.status) || "?" }));
  }
  const p = r.data;
  // The same address you reached HomeBaseOS with: that works from this device in any case.
  const host = new URL(base).hostname;
  await axios.post("/api/v1/repo/connect", {
    apiServer: { url: `https://${host.includes(":") ? "[" + host + "]" : host}:${p.port}`, serverCertFingerprint: p.fingerprint },
    password: p.password,
    clientOptions: { username: p.username, hostname: p.hostname, description: t("HomeBaseOS on {nas}", { nas: p.nas || host }) },
  });
  return p;
}

// Standard folders on this device (Documents, Pictures …), only in the app.
export async function knownFolders() {
  if (window.kopiaUI && window.kopiaUI.knownFolders) return window.kopiaUI.knownFolders();
  return [];
}

// Choose a folder with the system's dialog (only in the app), otherwise null.
export function pickFolder() {
  return new Promise((resolve) => {
    if (window.kopiaUI && window.kopiaUI.selectDirectory) window.kopiaUI.selectDirectory((p) => resolve(p || null));
    else resolve(null);
  });
}

// Add a folder: from now on Kopia backs it up according to the NAS's global policy (every hour) and starts right away.
export function addFolder(path) {
  return axios.post("/api/v1/sources", { path, createSnapshot: true, policy: {} });
}
