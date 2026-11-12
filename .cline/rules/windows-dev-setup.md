---
description: Windows developer setup — VC++ Redistributable and Tauri prerequisites
alwaysApply: true
---

# Windows — Developer Setup

On Windows, `npm install` can succeed while tooling still fails because native `.node` addons cannot load, or Tauri prerequisites are missing.

## Native Node addons (VC++ Redistributable)

Suspect a missing VC++ runtime when you see:

- `Cannot find native binding` / `ERR_DLOPEN_FAILED` (`oxc-resolver`, …)
- `Das angegebene Modul wurde nicht gefunden` for a `.node` file that exists under `node_modules`

**Fix:** Install [VC_redist.x64.exe](https://aka.ms/vs/17/release/vc_redist.x64.exe), reopen the terminal, then retry `npm install` / `npm test`.

Do **not** default to deleting `package-lock.json` / all of `node_modules` first.

## Tauri on Windows

For `npm run tauri dev` / builds, follow the official [Tauri Windows prerequisites](https://tauri.app/start/prerequisites/#windows) (MSVC Build Tools, WebView2, Rust).

This project uses **Tauri**, not Electron — do not suggest Electron binary reinstall steps.
