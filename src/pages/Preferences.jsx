import { use } from "react";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import { NotificationEditor } from "../components/notifications/NotificationEditor";
import { UIPreferencesContext } from "../contexts/UIPreferencesContext";
import { t, lang, setLang } from "../utils/i18n";

/**
 * Class that exports preferences
 */
export function Preferences() {
  const { theme, bytesStringBase2, fontSize, setByteStringBase, setTheme, setFontSize } = use(UIPreferencesContext);

  return (
    <Tabs defaultActiveKey="appearance" id="preferences" className="mb-3">
      <Tab eventKey="appearance" title={t("Weergave")} id="tab-appearance">
        <Container fluid>
          <Row>
            <Form.Group as={Col} controlId="language">
              <Form.Label className="required">{t("Taal")}</Form.Label>
              <select className="form-select form-select-sm" id="languageSelector" value={lang} onChange={(e) => setLang(e.target.value)}>
                <option value="nl">Nederlands</option>
                <option value="en">English</option>
              </select>
            </Form.Group>
            <Form.Group as={Col} controlId="theme">
              <Form.Label className="required">{t("Thema")}</Form.Label>
              <select
                className="form-select form-select-sm"
                title={t("Kies een thema")}
                id="themeSelector"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
              >
                <option value="light">{t("Licht (ochtendnevel)")}</option>
                <option value="dark">{t("Donker (avond)")}</option>
              </select>
            </Form.Group>
            <Form.Group as={Col} controlId="appearance">
              <Form.Label className="required">{t("Tekstgrootte")}</Form.Label>
              <select
                className="form-select form-select-sm"
                title={t("Kies de tekstgrootte")}
                id="fontSizeInput"
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
              >
                <option value="fs-6">{t("klein")}</option>
                <option value="fs-5">{t("normaal")}</option>
                <option value="fs-4">{t("groot")}</option>
              </select>
            </Form.Group>
            <Form.Group as={Col} controlId="byteRepresentation">
              <Form.Label className="required">{t("Groottes")}</Form.Label>
              <select
                className="form-select form-select-sm"
                title={t("Kies hoe groottes getoond worden")}
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
      <Tab eventKey="notifications" title={t("Meldingen")} id="tab-notifications">
        <div className="tab-content-fix">
          <Container fluid>
            <NotificationEditor />
          </Container>
        </div>
      </Tab>
    </Tabs>
  );
}
