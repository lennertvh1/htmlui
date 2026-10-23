import { use, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { AppContext } from "../contexts/AppContext";
import { t } from "../utils/i18n";
import { pairWithHomeBase, knownFolders, pickFolder, addFolder } from "../utils/homebase";

// Eerste keer: koppelen met HomeBaseOS (adres + koppelcode uit het dashboard), daarna kiezen wat je wil bewaren.
export function HomeBasePair({ onAdvanced }) {
  const context = use(AppContext);
  const [step, setStep] = useState("pair");
  const [address, setAddress] = useState(() => localStorage.getItem("hb-nas") || "");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [nas, setNas] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const p = await pairWithHomeBase(address, code);
      try {
        localStorage.setItem("hb-nas", address.trim());
      } catch {
        /* privévenster */
      }
      setNas(p.nas || address);
      setStep("folders");
    } catch (ex) {
      const d = ex.response && ex.response.data;
      setError(d && d.error ? t("Verbinden met de back-upserver lukte niet: {error}", { error: d.error }) : ex.message);
    } finally {
      setBusy(false);
    }
  }

  if (step === "folders") return <HomeBaseFolders nas={nas} onDone={() => context.repositoryUpdated(true)} />;

  return (
    <div>
      <h1 className="hb-title">{t("Verbinden met je HomeBaseOS")}</h1>
      <p className="hb-lead">{t("Open in HomeBaseOS Back-ups → Toestellen, voeg dit toestel toe en klik op Koppelcode. Typ hier het adres van je HomeBaseOS en die code.")}</p>
      <form className="hb-form" onSubmit={submit} noValidate>
        <label className="hb-fld">
          <span className="hb-label">{t("Adres van je HomeBaseOS")}</span>
          <input className="hb-field" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t("bv. freddy.local of 192.168.1.10")} autoFocus={!address} spellCheck="false" autoComplete="off" />
          <small>{t("Hetzelfde adres als in je browser, zonder http:// mag ook.")}</small>
        </label>
        <label className="hb-fld">
          <span className="hb-label">{t("Koppelcode")}</span>
          <input className="hb-field hb-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="XXXX-XXXX" maxLength={12} autoFocus={!!address} spellCheck="false" autoComplete="off" />
          <small>{t("De code werkt één keer en 15 minuten lang.")}</small>
        </label>
        <p className="hb-error" role="alert">{error}</p>
        <div className="hb-row">
          <button className="hb-btn primary" type="submit" disabled={busy}>{busy ? t("Verbinden…") : t("Verbinden")}</button>
          <button className="hb-btn" type="button" onClick={onAdvanced}>{t("Andere opslag (geavanceerd)")}</button>
        </div>
      </form>
    </div>
  );
}

HomeBasePair.propTypes = { onAdvanced: PropTypes.func.isRequired };

// Wat wil je bewaren? Standaard Documenten, Bureaublad en Afbeeldingen; eigen mappen kunnen erbij.
export function HomeBaseFolders({ nas, onDone }) {
  const [folders, setFolders] = useState([]);
  const [checked, setChecked] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    knownFolders().then((list) => {
      setFolders(list);
      setChecked(Object.fromEntries(list.map((f) => [f.path, ["documents", "desktop", "pictures"].includes(f.key)])));
    });
  }, []);

  const home = folders.find((f) => f.key === "home");
  const all = home && checked[home.path];

  async function addOwn() {
    const p = await pickFolder();
    if (!p || folders.some((f) => f.path === p)) return;
    setFolders((list) => [...list, { key: "own", label: p.split(/[\\/]/).filter(Boolean).pop() || p, path: p }]);
    setChecked((c) => ({ ...c, [p]: true }));
  }

  async function submit() {
    setError("");
    setBusy(true);
    // De hele gebruikersmap bevat de andere al: dan alleen die.
    const paths = all ? [home.path] : folders.filter((f) => checked[f.path] && f.key !== "home").map((f) => f.path);
    try {
      for (const p of paths) await addFolder(p);
      onDone();
    } catch (ex) {
      const d = ex.response && ex.response.data;
      setError(d && d.error ? d.error : ex.message);
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="hb-title">{t("Wat wil je bewaren?")}</h1>
      <p className="hb-lead">{t("Verbonden met {nas}. Kies de mappen die elk uur naar je NAS gaan. Je kan later nog mappen toevoegen of weghalen.", { nas })}</p>
      {folders.length ? (
        <div className="hb-checks">
          {folders.map((f) => (
            <label className="hb-check" key={f.path} style={all && f.key !== "home" ? { opacity: 0.5 } : null}>
              <input type="checkbox" checked={!!checked[f.path]} disabled={all && f.key !== "home"} onChange={(e) => setChecked((c) => ({ ...c, [f.path]: e.target.checked }))} />
              <span>
                <b>{f.key === "home" ? t("Hele gebruikersmap") : t(f.label)}</b>
                <small>{f.path}</small>
              </span>
            </label>
          ))}
        </div>
      ) : (
        <p className="hb-muted">{t("Kies hieronder een map.")}</p>
      )}
      <p className="hb-error" role="alert" style={{ marginTop: 12 }}>{error}</p>
      <div className="hb-row">
        <button className="hb-btn primary" type="button" disabled={busy} onClick={submit}>{busy ? t("Bezig…") : t("Bewaren")}</button>
        {window.kopiaUI && <button className="hb-btn" type="button" onClick={addOwn}>{t("Andere map…")}</button>}
        <button className="hb-btn" type="button" onClick={onDone}>{t("Later kiezen")}</button>
      </div>
    </div>
  );
}

HomeBaseFolders.propTypes = { nas: PropTypes.string, onDone: PropTypes.func.isRequired };
