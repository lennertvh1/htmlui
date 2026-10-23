import { use } from "react";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import { NotificationEditor } from "../components/notifications/NotificationEditor";
import { UIPreferencesContext } from "../contexts/UIPreferencesContext";
import { t, lang, setLang, LANGS } from "../utils/i18n";

/**
 * Class that exports preferences
 */
export function Preferences() {
  const { theme, bytesStringBase2, fontSize, setByteStringBase, setTheme, setFontSize } = use(UIPreferencesContext);

  return (
    <Tabs defaultActiveKey="appearance" id="preferences" className="mb-3">
      <Tab eventKey="appearance" title={t("Appearance")} id="tab-appearance">
        <Container fluid>
          <Row>
            <Form.Group as={Col} controlId="language">
              <Form.Label className="required">{t("Language")}</Form.Label>
              <select className="form-select form-select-sm" id="languageSelector" value={lang} onChange={(e) => setLang(e.target.value)}>
                {Object.entries(LANGS).map(([code, l]) => (
                  <option key={code} value={code}>
                    {l.name}
                  </option>
                ))}
              </select>
            </Form.Group>
            <Form.Group as={Col} controlId="theme">
              <Form.Label className="required">{t("Theme")}</Form.Label>
              <select
                className="form-select form-select-sm"
                title={t("Choose a theme")}
                id="themeSelector"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
              >
                <option value="light">{t("Light (morning mist)")}</option>
                <option value="dark">{t("Dark (evening)")}</option>
              </select>
            </Form.Group>
            <Form.Group as={Col} controlId="appearance">
              <Form.Label className="required">{t("Text size")}</Form.Label>
              <select
                className="form-select form-select-sm"
                title={t("Choose the text size")}
                id="fontSizeInput"
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
              >
                <option value="fs-6">{t("small")}</option>
                <option value="fs-5">{t("normal")}</option>
                <option value="fs-4">{t("large")}</option>
              </select>
            </Form.Group>
            <Form.Group as={Col} controlId="byteRepresentation">
              <Form.Label className="required">{t("Sizes")}</Form.Label>
              <select
                className="form-select form-select-sm"
                title={t("Choose how sizes are shown")}
                id="bytesBaseInput"
                value={bytesStringBase2}
                onChange={(e) => setByteStringBase(e.target.value)}
              >
                <option value="true">Base-2 (KiB, MiB, GiB, TiB)</option>
                <option value="false">Base-10 (KB, MB, GB, TB)</option>
              </select>
            </Form.Group>
          </Row>
        </Container>
      </Tab>
      <Tab eventKey="notifications" title={t("Notifications")} id="tab-notifications">
        <div className="tab-content-fix">
          <Container fluid>
            <NotificationEditor />
          </Container>
        </div>
      </Tab>
    </Tabs>
  );
}
