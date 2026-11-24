---
name: connect-tauri-command
description: >-
  End-to-end wiring of a new Tauri command across Rust slice commands, lib.rs
  registration, and @shared/api facade.
modeSlugs:
  - code
---

# Skill: Connect Tauri Command

Use this skill when adding a new host↔frontend capability (replaces Electron IPC channel wiring).

## Target execution pipeline

Update these locations in a single operation:

1. **Rust command** (`src-tauri/src/slices/<slice>/commands.rs`):
   - Add `#[tauri::command]` with validated inputs and host-side authorization when privileged.

2. **Host wiring** (`src-tauri/src/lib.rs`):
   - Register the command in `invoke_handler`.

3. **Frontend facade** (`src/shared/api/<module>.ts` + barrel):
   - Wrap `invoke` (or the existing Tauri facade helper) with JSDoc on the exported function.
   - Export via `src/shared/api/index.ts`.

4. **Feature usage** (optional, same change if UI needs it):
   - Call the facade only from a feature slice `api/` layer, then from `model/`.

## Guardrails

- Do not expose raw Tauri APIs to features/pages.
- Do not add preload/`window.api` Electron patterns.
