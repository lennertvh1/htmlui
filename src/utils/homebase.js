// Koppelen met HomeBaseOS. In de app (Electron) doet het hoofdproces de aanvraag naar de NAS: deze pagina draait op
// https://127.0.0.1 en mag geen http-adres op je netwerk aanspreken. In een gewone browser (ontwikkelen) gaat het rechtstreeks.
import axios from "axios";
import { t } from "./i18n";

// "freddy.local", "192.168.1.10:8080" of "http://freddy:8080" → http://freddy.local:8080
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

// De koppelcode zoals HomeBaseOS ze toont (XXXX-XXXX): hoofdletters en een streepje maken niet uit.
export const cleanCode = (code) => String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

async function fetchPairing(base, code) {
  const url = base + "/api/backup/pair/" + encodeURIComponent(code);
  if (window.kopiaUI && window.kopiaUI.homebasePair) return window.kopiaUI.homebasePair(url);
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

// Haal de gegevens op bij HomeBaseOS en verbind met de Kopia-server op de NAS.
export async function pairWithHomeBase(address, code) {
  const base = nasBaseUrl(address);
  if (!base) throw new Error(t("Vul het adres van je HomeBaseOS in, bv. freddy.local of 192.168.1.10."));
  const c = cleanCode(code);
  if (c.length !== 8) throw new Error(t("Een koppelcode heeft 8 tekens, bv. K7MQ-2XPF."));
  let r;
  try {
    r = await fetchPairing(base, c);
  } catch (e) {
    throw new Error(t("HomeBaseOS is niet bereikbaar op {address}. Controleer het adres en of je op hetzelfde netwerk zit.", { address: base }), { cause: e });
  }
  if (!r || r.status !== 200 || !r.data) {
    if (r && r.status === 404) throw new Error(t("Die koppelcode klopt niet of is verlopen. Maak een nieuwe in HomeBaseOS."));
    if (r && r.status === 429) throw new Error(t("Te veel foute codes. Wacht 5 minuten en probeer opnieuw."));
    throw new Error(t("HomeBaseOS gaf een fout: {error}", { error: (r && r.data && r.data.error) || (r && r.status) || "?" }));
  }
  const p = r.data;
  // Hetzelfde adres als waarmee je HomeBaseOS bereikte: dat werkt in elk geval vanaf dit toestel.
  const host = new URL(base).hostname;
  await axios.post("/api/v1/repo/connect", {
    apiServer: { url: `https://${host.includes(":") ? "[" + host + "]" : host}:${p.port}`, serverCertFingerprint: p.fingerprint },
    password: p.password,
    clientOptions: { username: p.username, hostname: p.hostname, description: t("HomeBaseOS op {nas}", { nas: p.nas || host }) },
  });
  return p;
}

// Gewone mappen op dit toestel (Documenten, Afbeeldingen …), alleen in de app.
export async function knownFolders() {
  if (window.kopiaUI && window.kopiaUI.knownFolders) return window.kopiaUI.knownFolders();
  return [];
}

// Map kiezen met het venster van het systeem (alleen in de app), anders null.
export function pickFolder() {
  return new Promise((resolve) => {
    if (window.kopiaUI && window.kopiaUI.selectDirectory) window.kopiaUI.selectDirectory((p) => resolve(p || null));
    else resolve(null);
  });
}

// Een map toevoegen: Kopia bewaart ze vanaf nu volgens het algemene beleid van de NAS (elk uur) en start meteen.
export function addFolder(path) {
  return axios.post("/api/v1/sources", { path, createSnapshot: true, policy: {} });
}
