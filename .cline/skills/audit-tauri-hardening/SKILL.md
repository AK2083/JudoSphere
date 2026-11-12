---
name: audit-tauri-hardening
description: >-
  Audits Tauri host configuration, CSP/capabilities, and frontend bridge
  boundaries against desktop security best practices.
modeSlugs:
  - security
---

# Skill: Tauri Hardening Auditor

Use this skill in Security Mode to audit Tauri configuration and host/frontend boundaries (replaces Electron hardening).

## Inspection checklist

1. **Capabilities:** Review `src-tauri/capabilities/` — grant only required permissions.
2. **CSP / dangerous remote content:** Ensure the webview does not load untrusted remote scripts by default.
3. **Bridge leakage:** Frontend must talk to the host only through `@shared/api` facades; no raw privileged Node/Electron APIs.
4. **Command surface:** Tauri commands are explicit, validated, and least-privilege.
5. **No Electron assumptions:** Ignore `contextIsolation` / `nodeIntegration` / preload checks — they do not apply.
