# Interface van HomeBase Back-up

Deze fork van [kopia/htmlui](https://github.com/kopia/htmlui) is de interface van **HomeBase Back-up**, de app voor pc's en Macs die een back-up maakt naar [HomeBaseOS](https://github.com/lennertvh1/homebaseos). De app zelf staat in de fork [lennertvh1/kopia](https://github.com/lennertvh1/kopia) (branch `homebase`, zie `HOMEBASE.md` daar). Apache License 2.0, zoals het origineel.

## Wat is er anders dan htmlui

| Waar | Wijziging |
|---|---|
| `src/css/HomeBase.css` | De stijl van het dashboard van HomeBaseOS: dezelfde tokens (licht = ochtendnevel, donker = avond), glas, lettertype Onest, knoppen en velden. Ook de schermen van Kopia (tabellen, kaarten, tabbladen, Bootstrap) volgen die tokens. Hou de tokens gelijk met `homebaseos/public/style.css`. |
| `index.html` | Titel, pictogram en hetzelfde landschap als achtergrond. |
| `src/App.jsx` | Bovenbalk zoals in HomeBaseOS (Back-ups, Alle back-ups, Taken, Regels, Verbinding, Voorkeuren); schermen van Kopia op een glazen paneel; `/` → `/overview`. |
| `src/pages/Overview.jsx` | Nieuw startscherm: status ("Alles is bewaard", te oud, met fouten, bezig) en een kaart per map met *Nu bewaren* en *Bekijken en terugzetten*. |
| `src/components/HomeBasePair.jsx` | Nieuw: koppelen met HomeBaseOS (adres + koppelcode) en *Wat wil je bewaren?*. De oorspronkelijke opties staan achter *Andere opslag (geavanceerd)*. |
| `src/utils/homebase.js` | Koppelen (via `window.kopiaUI.homebasePair` in de app; in een browser rechtstreeks), mappen toevoegen. |
| `src/utils/i18n.js`, `src/lang/en.js` | Nederlands en Engels: de Nederlandse tekst is de sleutel, zoals in HomeBaseOS. Taal volgt het systeem of Voorkeuren. |
| `src/pages/Preferences.jsx`, `src/pages/Repository.jsx` | Vertaald; taalkeuze; alleen de thema's licht en donker. |
| `public/fonts` | Onest (variabel lettertype, SIL Open Font License, zie `OFL.txt`), zodat de app zonder internet werkt. |
| `public/*.png`, `favicon.ico`, `homebase.svg`, `manifest.json` | Pictogrammen en naam. |
| `tests/` | Aangepast aan de nieuwe teksten en het startscherm. |

De schermen van Kopia zelf (geschiedenis, terugzetten, beleid, taken) zijn herstijld maar nog Engels.

## Ontwikkelen

```bash
npm ci
npm run build        # → build/, gebruikt door kopia/homebase/build-htmlui.sh
npx vitest run       # tests
```
