---
description: Security rules for local users, roles, sessions and access requests
globs: **/auth/**/*.ts, **/authorization/**/*.ts, **/sessions/**/*.ts, **/db/**/*.sql, **/migrations/**/*.sql, src-tauri/**/*.rs
alwaysApply: false
---

Authorization must be enforced in the Tauri host (Rust), not only in Vue.
Every privileged Tauri command must verify the current session and required permission.
Do not store session tokens in plain text. Store token hashes only.
System roles and permissions must be protected from normal user edits.
Access requests must have clear states: pending, approved, rejected, expired.
Approved access requests must create a real local user or attach to an existing one.
Frontend/browser clients must not make final authorization decisions alone.
