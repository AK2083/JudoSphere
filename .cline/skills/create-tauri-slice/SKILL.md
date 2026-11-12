---
name: create-tauri-slice
description: >-
  Scaffolds a Tauri/Rust vertical slice under src-tauri/src/slices with mod.rs,
  commands.rs, lib.rs wiring, and optional @shared/api facade.
modeSlugs:
  - architect
  - code
---

# Skill: Create Tauri Vertical Slice

Use this skill to add a new host capability in Rust (replaces Electron main slices).

## Target structure

```
src-tauri/src/slices/<slice>/
  mod.rs
  commands.rs
```

## Execution steps

1. Create `src-tauri/src/slices/<slice>/mod.rs` and `commands.rs`.
2. Declare `pub mod <slice>;` in `src-tauri/src/slices/mod.rs`.
3. Implement thin `#[tauri::command]` functions in `commands.rs`.
4. Register commands in `src-tauri/src/lib.rs` via `invoke_handler` — wiring only.
5. If the Vue frontend needs the capability, add/update a facade in `src/shared/api` and export it from the barrel.
6. Keep domain/persistence details inside the slice as it grows; do not put them in Vue.

## Guardrails

- No Electron/preload/IPC patterns.
- Vue must not call `@tauri-apps/*` directly — only `@shared/api`.
- Privileged checks belong in the Rust host commands/services.
