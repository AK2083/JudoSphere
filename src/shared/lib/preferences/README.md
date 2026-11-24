# App preferences bag

Day-of preferences live in **one** browser `localStorage` JSON bag under
`APP_PREFERENCES_STORAGE_KEY` (`judosphere.app.preferences`). Do not add
one-off storage keys or a second storage design for general UI options.

## How to add a future preference key

1. **Type** — Add the value (and optional const object) on `AppPreferences` in
   `types.ts`. Prefer a small closed union (see `theme`, `uiDensity`).
2. **Default** — Set a sensible first-start value in `DEFAULT_APP_PREFERENCES`
   and clone it in `createDefaultAppPreferences()` in `defaults.ts`.
3. **Seed / merge** — Teach `mergeAppPreferences` in `storage.ts` to keep a
   valid stored value and fall back to the default when the key is missing or
   invalid. Existing keys (e.g. theme/language) must not be wiped on upgrade.
4. **Shared settings API** — Expose read/write through
   `useSettingsPreferences` in `src/pages/settings/model/` the same way as
   theme/language/`uiDensity` (`loadAppPreferences` / `saveAppPreferences`).
   Settings UI controls are optional; the API path is required.
5. **Exports** — Re-export types/helpers from `preferences/index.ts` and
   `src/shared/lib/index.ts` when callers need them.
6. **Tests** — Cover default seed, merge-on-upgrade (preserve prior values),
   and read/write via the shared settings API.

`loadAppPreferences` already seeds on first open and rewrites a merged bag when
new keys appear. Keep confirmations as nested slots under `confirmations` only
when the value is a versioned acceptance, not a general UI default.
