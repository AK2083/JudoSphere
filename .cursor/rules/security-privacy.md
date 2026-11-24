---
description: Security and privacy rules for implementations
alwaysApply: true
---

Technical security rules:

- Do not store secrets, API keys, service role keys, tokens, or passwords in the Vue frontend, repository, local DB, or logs.
- Supabase service role keys (if used) must never appear in Vue/`@shared/api` client code exposed to the browser.
- Local DB / privileged persistence happens only in the Tauri host (Rust slices) or trusted local services.
- Vue code must not make security-critical decisions on its own.
- Every privileged Tauri command must verify session, user, and permission in the host.
- Never store session tokens in plaintext; store secure hashes only.
- Logs must not contain full personal records, session IDs, tokens, or sensitive content.
- Migrations must not delete user data without an explicit, documented decision.
- Sync must not overwrite local data without conflict detection.
