import { use, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { AppContext } from "../contexts/AppContext";
import { t } from "../utils/i18n";
import { pairWithHomeBase, knownFolders, pickFolder, addFolder } from "../utils/homebase";

// First time: pair with HomeBaseOS (address + pairing code from the dashboard), then choose what to keep safe.
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
        /* private window */
      }
      setNas(p.nas || address);
      setStep("folders");
    } catch (ex) {
      const d = ex.response && ex.response.data;
      setError(d && d.error ? t("Connecting to the backup server failed: {error}", { error: d.error }) : ex.message);
    } finally {
      setBusy(false);
    }
  }

  if (step === "folders") return <HomeBaseFolders nas={nas} onDone={() => context.repositoryUpdated(true)} />;

  return (
    <div>
      <h1 className="hb-title">{t("Connect to your HomeBaseOS")}</h1>
      <p className="hb-lead">{t("In HomeBaseOS, open Backups → Devices, add this device and click Pairing code. Type the address of your HomeBaseOS and that code here.")}</p>
      <form className="hb-form" onSubmit={submit} noValidate>
        <label className="hb-fld">
          <span className="hb-label">{t("Address of your HomeBaseOS")}</span>
          <input className="hb-field" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t("e.g. freddy.local or 192.168.1.10")} autoFocus={!address} spellCheck="false" autoComplete="off" />
          <small>{t("The same address as in your browser; http:// may be left out.")}</small>
        </label>
        <label className="hb-fld">
          <span className="hb-label">{t("Pairing code")}</span>
          <input className="hb-field hb-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="XXXX-XXXX" maxLength={12} autoFocus={!!address} spellCheck="false" autoComplete="off" />
          <small>{t("The code works once, for 15 minutes.")}</small>
        </label>
        <p className="hb-error" role="alert">{error}</p>
        <div className="hb-row">
          <button className="hb-btn primary" type="submit" disabled={busy}>{busy ? t("Connecting…") : t("Connect")}</button>
          <button className="hb-btn" type="button" onClick={onAdvanced}>{t("Other storage (advanced)")}</button>
        </div>
      </form>
    </div>
  );
}

HomeBasePair.propTypes = { onAdvanced: PropTypes.func.isRequired };

// What do you want to keep safe? Documents, Desktop and Pictures by default; your own folders can be added.
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
    // The entire user folder already contains the others: then only that one.
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
      <h1 className="hb-title">{t("What do you want to keep safe?")}</h1>
      <p className="hb-lead">{t("Connected to {nas}. Choose the folders that go to your NAS every hour. You can add or remove folders later.", { nas })}</p>
      {folders.length ? (
        <div className="hb-checks">
          {folders.map((f) => (
            <label className="hb-check" key={f.path} style={all && f.key !== "home" ? { opacity: 0.5 } : null}>
              <input type="checkbox" checked={!!checked[f.path]} disabled={all && f.key !== "home"} onChange={(e) => setChecked((c) => ({ ...c, [f.path]: e.target.checked }))} />
              <span>
                <b>{f.key === "home" ? t("Entire user folder") : t(f.label)}</b>
                <small>{f.path}</small>
              </span>
            </label>
          ))}
        </div>
      ) : (
        <p className="hb-muted">{t("Choose a folder below.")}</p>
      )}
      <p className="hb-error" role="alert" style={{ marginTop: 12 }}>{error}</p>
      <div className="hb-row">
        <button className="hb-btn primary" type="button" disabled={busy} onClick={submit}>{busy ? t("Working…") : t("Keep safe")}</button>
        {window.kopiaUI && <button className="hb-btn" type="button" onClick={addOwn}>{t("Other folder…")}</button>}
        <button className="hb-btn" type="button" onClick={onDone}>{t("Choose later")}</button>
      </div>
    </div>
  );
}

HomeBaseFolders.propTypes = { nas: PropTypes.string, onDone: PropTypes.func.isRequired };
