---
name: troubleshoot-windows-native-addons
description: >-
  Diagnoses Windows ERR_DLOPEN_FAILED / missing VCRUNTIME140.dll issues and
  Tauri prerequisite gaps (not Electron).
modeSlugs:
  - debug
  - ask
---

# Skill: Windows Native Addon & Tauri Troubleshooter

Use this skill for native binding failures or Tauri setup problems on Windows.

## Native Node addons

Suspect missing VC++ runtime when:

- `ERR_DLOPEN_FAILED` / `Cannot find native binding`
- German Windows: `Das angegebene Modul wurde nicht gefunden` for an existing `.node` file

**Fix:** Install [VC_redist.x64.exe](https://aka.ms/vs/17/release/vc_redist.x64.exe), reopen terminal, retry. Do not wipe lockfile/`node_modules` first.

## Tauri

- Follow [Tauri Windows prerequisites](https://tauri.app/start/prerequisites/#windows).
- Do **not** suggest Electron binary reinstall (`node_modules/electron`) — this project uses Tauri.
