---
name: validate-vsa-imports
description: >-
  Audits Tauri host code for vertical-slice boundary rules and frontend bridge
  isolation.
modeSlugs:
  - debug
---

# Skill: VSA Import & Security Validator (Tauri)

Use this skill to audit the Tauri host architecture (replaces Electron main/preload checks).

## Validation rules

1. **Wiring isolation:** `lib.rs` only registers plugins/state/commands — no domain logic.
2. **Slice boundaries:** Cross-slice usage goes through clear public APIs (`mod.rs`), not internals.
3. **Command cleanliness:** `commands.rs` stays thin; persistence/domain live deeper in the slice.
4. **Frontend isolation:** Vue never imports Rust paths; host access only via `@shared/api`.
5. **No Electron leftovers:** Reject preload/`window.api`/`ipcMain` patterns.
6. **Facade JSDoc:** Exported `@shared/api` functions have English JSDoc.
