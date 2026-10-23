import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Link, useNavigate } from "react-router";
import { sourceQueryStringParams } from "../utils/policyutil";
import { t, ago, bytes } from "../utils/i18n";
import { pickFolder, addFolder } from "../utils/homebase";

const ICON = {
  ok: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  warn: <path d="M12 8v5M12 16.5v.5M10.3 4.2 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z" />,
  busy: <path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5" />,
  folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
};
const Icon = ({ name }) => <svg viewBox="0 0 24 24" aria-hidden="true">{ICON[name]}</svg>;
Icon.propTypes = { name: PropTypes.string.isRequired };

const isBusy = (s) => s.status === "UPLOADING" || s.status === "PENDING";
const lastTime = (s) => (s.lastSnapshot ? new Date(s.lastSnapshot.endTime || s.lastSnapshot.startTime).getTime() : 0);
const errors = (s) => (s.lastSnapshot && s.lastSnapshot.rootEntry && s.lastSnapshot.rootEntry.summ && s.lastSnapshot.rootEntry.summ.numFailed) || 0;
const folderName = (p) => String(p).split(/[\\/]/).filter(Boolean).pop() || p;

function progress(u) {
  if (!u) return null;
  const done = (u.hashedBytes || 0) + (u.cachedBytes || 0);
  return { done, total: u.estimatedBytes || 0, pct: u.estimatedBytes ? Math.min(100, Math.round((done * 1000) / u.estimatedBytes) / 10) : null };
}

// Home screen: how this device's backups are doing, and a card per folder.
export function Overview() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState({});

  const load = useCallback(() => {
    axios
      .get("/api/v1/sources")
      .then((r) => {
        setData(r.data);
        setError("");
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    load();
    const id = window.setInterval(load, 3000);
    return () => window.clearInterval(id);
  }, [load]);

  const act = (s, what) => {
    setBusy((b) => ({ ...b, [s.source.path]: true }));
    axios
      .post(`/api/v1/sources/${what}?` + sourceQueryStringParams(s.source), {})
      .catch((e) => setError(e.response && e.response.data && e.response.data.error ? e.response.data.error : e.message))
      .finally(() => {
        setBusy((b) => ({ ...b, [s.source.path]: false }));
        load();
      });
  };
  const addOne = async () => {
    if (!window.kopiaUI) return navigate("/snapshots/new");
    const p = await pickFolder();
    if (!p) return;
    try {
      await addFolder(p);
    } catch (e) {
      setError(e.response && e.response.data && e.response.data.error ? e.response.data.error : e.message);
    }
    load();
  };

  if (!data) return <div className="hb-page hb-glass">{error ? <p className="hb-error">{error}</p> : <p className="hb-muted">{t("Loading…")}</p>}</div>;

  // On a NAS with several devices: only this device's (you can't see the others here anyway).
  const mine = data.localUsername ? data.sources.filter((s) => s.source.userName === data.localUsername && s.source.host === data.localHost) : data.sources;
  const running = mine.filter(isBusy);
  const last = Math.max(0, ...mine.map(lastTime));
  const stale = mine.filter((s) => !isBusy(s) && (!lastTime(s) || Date.now() - lastTime(s) > 3 * 86400000));
  const failed = mine.filter((s) => errors(s) > 0);
  const nexts = mine.map((s) => s.nextSnapshotTime && new Date(s.nextSnapshotTime).getTime()).filter(Boolean);
  const next = nexts.length ? Math.min(...nexts) : 0;

  let hero;
  if (!mine.length) hero = { cls: "warn", icon: "folder", title: t("Nothing to keep safe yet"), text: t("Choose the folders that should go to your NAS.") };
  else if (running.length) {
    const p = progress(running[0].upload);
    hero = { cls: "", icon: "busy", title: t("Backing up…"), text: running.length > 1 ? t("{n} folders are being backed up.", { n: running.length }) : t("{name}: {done}", { name: folderName(running[0].source.path), done: p && p.pct != null ? p.pct + "%" : bytes(p ? p.done : 0) }) };
  } else if (stale.length) hero = { cls: "warn", icon: "warn", title: t("A backup is too old"), text: t("{list} hasn't been backed up for more than 3 days. Is the NAS on, and is this device at home?", { list: stale.map((s) => folderName(s.source.path)).join(", ") }) };
  else if (failed.length) hero = { cls: "warn", icon: "warn", title: t("Backed up, with errors"), text: t("Some files could not be read. See the details for {list}.", { list: failed.map((s) => folderName(s.source.path)).join(", ") }) };
  else hero = { cls: "ok", icon: "ok", title: t("Everything is backed up"), text: t("Last backup {when}.", { when: ago(last) }) + (next ? " " + t("The next one {when}.", { when: ago(next) }) : "") };

  return (
    <>
      <div className={"hb-hero hb-glass " + hero.cls}>
        <span className="hb-dot"><Icon name={hero.icon} /></span>
        <div>
          <h2>{hero.title}</h2>
          <p>{hero.text}</p>
        </div>
        <div className="hb-actions hb-row">
          <button className="hb-btn primary" type="button" onClick={addOne}>+ {t("Add folder")}</button>
        </div>
      </div>
      {error && <p className="hb-error">{error}</p>}
      {mine.length ? (
        <div className="hb-cards">
          {mine.map((s) => {
            const p = isBusy(s) ? progress(s.upload) : null;
            const size = s.lastSnapshot && s.lastSnapshot.stats ? s.lastSnapshot.stats.totalSize : null;
            return (
              <div className="hb-card hb-glass" key={s.source.path}>
                <div className="hb-card-head">
                  <span className="hb-folder"><Icon name="folder" /></span>
                  <div style={{ minWidth: 0 }}>
                    <div className="hb-card-title">{folderName(s.source.path)}</div>
                    <div className="hb-card-path">{s.source.path}</div>
                  </div>
                </div>
                <dl className="hb-facts">
                  <dt>{t("Last backup")}</dt>
                  <dd>{lastTime(s) ? ago(lastTime(s)) : t("none yet")}{errors(s) > 0 && <> <span className="hb-pill warn">{t("{n} errors", { n: errors(s) })}</span></>}</dd>
                  <dt>{t("Size")}</dt>
                  <dd>{size != null ? bytes(size) : "–"}</dd>
                  <dt>{t("Next")}</dt>
                  <dd>{s.status === "PAUSED" ? t("paused") : isBusy(s) ? t("now") : s.nextSnapshotTime ? ago(s.nextSnapshotTime) : t("manual only")}</dd>
                </dl>
                {p && (
                  <div>
                    <div className={"hb-bar" + (p.pct == null ? " busy" : "")}><span style={p.pct != null ? { width: p.pct + "%" } : null} /></div>
                    <div className="hb-small hb-muted" style={{ marginTop: 4 }}>
                      {s.status === "PENDING" ? t("Waiting for the previous backup…") : p.total ? t("{done} of {total}", { done: bytes(p.done), total: bytes(p.total) }) : t("{done} read", { done: bytes(p.done) })}
                    </div>
                  </div>
                )}
                <div className="hb-row" style={{ marginTop: 4 }}>
                  {isBusy(s) ? (
                    <button className="hb-btn" type="button" disabled={busy[s.source.path]} onClick={() => act(s, "cancel")}>{t("Stop")}</button>
                  ) : (
                    <button className="hb-btn primary" type="button" disabled={busy[s.source.path]} onClick={() => act(s, "upload")}>{t("Back up now")}</button>
                  )}
                  <Link className="hb-btn" to={"/snapshots/single-source?" + sourceQueryStringParams(s.source)}>{t("View and restore")}</Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="hb-empty hb-glass">{t("Add a folder, e.g. your Documents. Kopia then backs it up to your NAS every hour.")}</div>
      )}
    </>
  );
}
