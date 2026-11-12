---
name: add-db-migration
description: >-
  Creates a versioned SQL migration for the Tauri host local database and
  registers it in host-side migration infrastructure.
modeSlugs:
  - architect
---

# Skill: Database Migration Generator

Use this skill to modify the local SQLite schema owned by the Tauri host.

## Rules & safeguards

- Migrations must **never** drop tables/columns or delete user data without an explicit, documented decision.
- Prefer additive, reversible-friendly steps with safe defaults.

## Execution steps

1. Determine the next version prefix from existing host migrations (e.g. under a future `src-tauri/.../migrations/` location owned by a database/shared host slice).
2. Create `V<XXX>__<slice_or_context>_<short_description>.sql`.
3. Register the migration in the host migration runner/registry.
4. Keep SQL ownership in the Tauri host — Vue must not execute schema DDL.

## Note

If migration infrastructure does not exist yet, create it as part of a dedicated Tauri database slice rather than in the frontend.
