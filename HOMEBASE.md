# HomeBase Backup interface

This fork of [kopia/htmlui](https://github.com/kopia/htmlui) is the interface of **HomeBase Backup**, the app for PCs and Macs that backs up to [HomeBaseOS](https://github.com/lennertvh1/homebaseos). The app itself is in the fork [lennertvh1/kopia](https://github.com/lennertvh1/kopia) (branch `homebase`, see `HOMEBASE.md` there). Apache License 2.0, like the original.

## What is different from htmlui

| Where | Change |
|---|---|
| `src/css/HomeBase.css` | The style of the HomeBaseOS dashboard: the same tokens (light = morning mist, dark = evening), glass, the Onest typeface, buttons and fields. Kopia's screens (tables, cards, tabs, Bootstrap) follow those tokens too. Keep the tokens in sync with `homebaseos/public/style.css`. |
| `index.html` | Title, icon and the same landscape as the background. |
| `src/App.jsx` | Top bar like in HomeBaseOS (Backups, All backups, Tasks, Rules, Connection, Preferences); Kopia's screens on a glass panel; `/` → `/overview`. |
| `src/pages/Overview.jsx` | New home screen: status ("Everything is backed up", too old, with errors, running) and a card per folder with *Back up now* and *View and restore*. |
| `src/components/HomeBasePair.jsx` | New: pairing with HomeBaseOS (address + pairing code) and *What do you want to keep safe?*. The original options are behind *Other storage (advanced)*. |
| `src/utils/homebase.js` | Pairing (via `window.kopiaUI.homebasePair` in the app; directly in a browser), adding folders. |
| `src/utils/i18n.js`, `src/lang/nl.js` | English and Dutch: the English text is the key, like in HomeBaseOS. The language follows the system or Preferences. To add a language: a file in `src/lang/` and a line in `LANGS`. |
| `src/pages/Preferences.jsx`, `src/pages/Repository.jsx` | Translated; language choice; only the light and dark themes. |
| `public/fonts` | Onest (variable typeface, SIL Open Font License, see `OFL.txt`), so the app works without internet. |
| `public/*.png`, `favicon.ico`, `homebase.svg`, `manifest.json` | Icons and name. |
| `tests/` | Adapted to the new texts and the home screen. |

Kopia's own screens (history, restore, policies, tasks) are restyled but only in English.

## Development

```bash
npm ci
npm run build        # → build/, used by kopia/homebase/build-htmlui.sh
npx vitest run       # tests
```
