---
name: enforce-tauri-command-security
description: >-
  Ensures privileged Tauri commands verify session/permission in the host and
  that Vue never makes final auth decisions alone.
modeSlugs:
  - security
  - code
---

# Skill: Enforce Tauri Command Security

Use this skill when reviewing or implementing privileged host operations.

## Checklist

1. Privileged `#[tauri::command]` handlers verify active session and required permission in Rust.
2. Vue/components only display state; they do not decide authorization alone.
3. Tokens are stored hashed — never plaintext in DB, logs, or frontend storage.
4. Browser clients on the LAN cannot invoke elevated host operations without host checks.
5. Secrets/service-role keys never appear in `@shared/api` browser-facing code.
