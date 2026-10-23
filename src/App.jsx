import "bootstrap/dist/css/bootstrap.min.css";
import "./css/Theme.css";
import "./css/App.css";
import "./css/HomeBase.css";
import axios from "axios";
import PropTypes from "prop-types";
import { React, Component } from "react";
import { BrowserRouter as Router, NavLink, Navigate, Route, Routes } from "react-router";
import { Policy } from "./pages/Policy";
import { Preferences } from "./pages/Preferences";
import { Policies } from "./pages/Policies";
import { Repository } from "./pages/Repository";
import { Task } from "./pages/Task";
import { Tasks } from "./pages/Tasks";
import { Snapshots } from "./pages/Snapshots";
import { SnapshotCreate } from "./pages/SnapshotCreate";
import { SnapshotDirectory } from "./pages/SnapshotDirectory";
import { SnapshotHistory } from "./pages/SnapshotHistory";
import { SnapshotRestore } from "./pages/SnapshotRestore";
import { Overview } from "./pages/Overview";
import { t } from "./utils/i18n";
import { AppContext } from "./contexts/AppContext";
import { UIPreferenceProvider } from "./contexts/UIPreferencesContext";

// Menu: pad, naam, pictogram, alleen met een verbonden NAS.
const NAV = [
  ["/overview", "Back-ups", <path key="i" d="M7 18.5a4.5 4.5 0 0 1-.7-8.9A6 6 0 0 1 17.8 8a4.3 4.3 0 0 1-.3 8.5M9 14l2.2 2.2L15.5 12" />, true],
  ["/snapshots", "Alle back-ups", <path key="i" d="M4 6h16M4 12h16M4 18h10" />, true],
  ["/tasks", "Taken", <path key="i" d="M9 6h11M9 12h11M9 18h11M4.5 6l.8.8L6.8 5M4.5 12l.8.8 1.5-1.8M4.5 18l.8.8 1.5-1.8" />, true],
  ["/policies", "Regels", <path key="i" d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6z" />, true],
  ["/repo", "Verbinding", <path key="i" d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />, false],
  ["/preferences", "Voorkeuren", <path key="i" d="M4 7h10M18 7h2M4 17h4M12 17h8M14 4v6M8 14v6" />, false],
];

// Schermen van Kopia staan op een glazen paneel, zoals de vensters in HomeBaseOS.
const Page = ({ children }) => <div className="hb-page hb-glass">{children}</div>;
Page.propTypes = { children: PropTypes.node };

export default class App extends Component {
  constructor() {
    super();

    this.state = {
      runningTaskCount: 0,
      isFetching: false,
      repoDescription: "",
      isRepositoryConnected: false,
    };

    this.fetchTaskSummary = this.fetchTaskSummary.bind(this);
    this.repositoryUpdated = this.repositoryUpdated.bind(this);
    this.repositoryDescriptionUpdated = this.repositoryDescriptionUpdated.bind(this);
    this.fetchInitialRepositoryDescription = this.fetchInitialRepositoryDescription.bind(this);

    const tok = document.head.querySelector('meta[name="kopia-csrf-token"]');
    if (tok && tok.content) {
      axios.defaults.headers.common["X-Kopia-Csrf-Token"] = tok.content;
    } else {
      axios.defaults.headers.common["X-Kopia-Csrf-Token"] = "-";
    }
  }

  componentDidMount() {
    const av = document.getElementById("appVersion");
    if (av) {
      // show app version after mounting the component to avoid flashing of unstyled content.
      av.style.display = "block";
    }

    this.fetchInitialRepositoryDescription();
    this.taskSummaryInterval = window.setInterval(this.fetchTaskSummary, 5000);
  }

  fetchInitialRepositoryDescription() {
    axios
      .get("/api/v1/repo/status")
      .then((result) => {
        if (result.data.description) {
          this.setState({
            repoDescription: result.data.description,
            isRepositoryConnected: result.data.connected,
          });
        }
      })
      .catch((_) => {
        /* ignore */
      });
  }

  fetchTaskSummary() {
    if (!this.state.isFetching) {
      this.setState({ isFetching: true });
      axios
        .get("/api/v1/tasks-summary")
        .then((result) => {
          this.setState({
            isFetching: false,
            runningTaskCount: result.data["RUNNING"] || 0,
          });
        })
        .catch((_) => {
          this.setState({ isFetching: false, runningTaskCount: -1 });
        });
    }
  }

  componentWillUnmount() {
    window.clearInterval(this.taskSummaryInterval);
  }

  // this is invoked via AppContext whenever repository is connected, disconnected, etc.
  repositoryUpdated(isConnected) {
    this.setState({ isRepositoryConnected: isConnected });
    if (isConnected) {
      window.location.replace("/overview");
    } else {
      window.location.replace("/repo");
    }
  }

  repositoryDescriptionUpdated(desc) {
    this.setState({
      repoDescription: desc,
    });
  }

  render() {
    const { uiPrefs, runningTaskCount, isRepositoryConnected } = this.state;

    return (
      <Router>
        <AppContext value={this}>
          <UIPreferenceProvider initalValue={uiPrefs}>
            <header className="hb-topbar">
              <NavLink className="hb-brand" to="/overview">
                <svg viewBox="0 0 32 32" aria-hidden="true">
                  <path d="M5 15.5 16 6l11 9.5V27H19.5v-7.5h-7V27H5z" />
                </svg>
                <b>HomeBase Back-up</b>
                <span className="hb-host">{this.state.repoDescription}</span>
              </NavLink>
              <nav className="hb-nav" aria-label={t("Menu")}>
                {NAV.map(([to, label, icon, needsRepo]) => (
                  <NavLink
                    key={to}
                    data-testid={"tab-" + to.slice(1)}
                    className={needsRepo && !isRepositoryConnected ? "disabled" : ""}
                    to={to}
                    title={t(label)}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">{icon}</svg>
                    <span>{t(label)}</span>
                    {to === "/tasks" && runningTaskCount > 0 && <b className="hb-count">{runningTaskCount}</b>}
                  </NavLink>
                ))}
              </nav>
            </header>

            <main className="hb-main">
              <Routes>
                <Route path="overview" element={<Overview />} />
                <Route path="snapshots" element={<Page><Snapshots /></Page>} />
                <Route path="snapshots/new" element={<Page><SnapshotCreate /></Page>} />
                <Route path="snapshots/single-source/" element={<Page><SnapshotHistory /></Page>} />
                <Route path="snapshots/dir/:oid/restore" element={<Page><SnapshotRestore /></Page>} />
                <Route path="snapshots/dir/:oid" element={<Page><SnapshotDirectory /></Page>} />
                <Route path="policies/edit/" element={<Page><Policy /></Page>} />
                <Route path="policies" element={<Page><Policies /></Page>} />
                <Route path="tasks/:tid" element={<Page><Task /></Page>} />
                <Route path="tasks" element={<Page><Tasks /></Page>} />
                <Route path="repo" element={<Page><Repository /></Page>} />
                <Route path="preferences" element={<Page><Preferences /></Page>} />
                <Route path="/" element={<Navigate to={isRepositoryConnected ? "/overview" : "/repo"} />} />
              </Routes>
            </main>
          </UIPreferenceProvider>
        </AppContext>
      </Router>
    );
  }
}
