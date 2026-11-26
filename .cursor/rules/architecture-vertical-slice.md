---
description: Vertical Slice Architecture — layers and slice structure for src-tauri (Tauri/Rust host)
globs: src-tauri/**/*
alwaysApply: false
---

# Vertical Slice Architecture (Tauri Host)

The Tauri **host** (Rust) uses vertical slices — not FSD. The Vue frontend follows [architecture-fsd.md](./architecture-fsd.md). There is no Electron main/preload bridge.

```
src/                 → FSD (Vue UI, features, pages)
src-tauri/src/
  lib.rs             → wiring only
  main.rs            → entry
  slices/<slice>/    → vertical slices (commands, domain, persistence)
```

## Layers

```
lib.rs → slices
slices → other slices only via clear public APIs
```

| Layer      | Path                            | Responsibility                           |
| ---------- | ------------------------------- | ---------------------------------------- |
| **Wiring** | `src-tauri/src/lib.rs`          | Plugins, state, command registration     |
| **Slices** | `src-tauri/src/slices/<slice>/` | One use case / bounded context per slice |
| **Entry**  | `src-tauri/src/main.rs`         | Thin binary entry calling `lib::run()`   |

## Slice layout

Ideal structure:

```
src-tauri/src/slices/<slice>/
  mod.rs          # public slice API
  commands.rs     # #[tauri::command] adapters — thin
  # optional: domain/, repository/, service/ as the slice grows
```

**Layering within a slice:**

| File / folder  | Role                                                                |
| -------------- | ------------------------------------------------------------------- |
| `commands.rs`  | Input validation, delegation — no heavy domain orchestration inline |
| domain/service | Use-case orchestration (optional)                                   |
| repository     | Persistence access (optional; keep DB details out of commands)      |

- Add new functionality as a new slice; do not mix into existing slices.
- Register the module in `slices/mod.rs` and wire commands in `lib.rs` only.

## Frontend bridge

- Frontend never imports Rust internals.
- Frontend calls host capabilities only through `@shared/api` facades (wrapping `@tauri-apps/*`).
- New host capability = Tauri command(s) + matching `@shared/api` facade in the same change when the UI needs it.

## Local SQLite (host-owned)

Use **`rusqlite`** (bundled) in the Tauri host — **not** `tauri-plugin-sql` and not SQL from Vue.

- DB file: App Data (`judosphere.db`); connection and migrations live under `slices/database/`
- Schema changes: versioned SQL under `slices/database/migrations/`, applied on host startup
- Frontend: only Tauri commands via `@shared/api` (e.g. `getAppValue` / `setAppValue`) — **no** raw SQL, **no** DB SDK in features/pages
- Why: persistence, auth, and later LAN HTTP APIs stay on the host; the webview must not own the schema or execute arbitrary SQL

## Security

- Authorization and privileged decisions belong in the Tauri host, not in Vue alone ([auth-security.md](./auth-security.md), [security-privacy.md](./security-privacy.md))
- Do not expose secrets to the frontend or browser clients on the LAN
- Persist sensitive tokens as hashes only — never plaintext
- Local DB access stays in Rust slices (`rusqlite`), not in Vue

## Documentation

- Exported TypeScript facades under `src/shared/api` require English public API doc comments.
- Keep Rust public APIs documented where non-obvious.

## Frontend (FSD) vs. host (VSA)

| Aspect         | Frontend (`src/`)              | Host (`src-tauri/`)             |
| -------------- | ------------------------------ | ------------------------------- |
| Architecture   | Feature-Sliced Design          | Vertical Slices                 |
| UI             | Vue + Tailwind design system   | No UI                           |
| Host access    | `@shared/api` → Tauri commands | Rust commands/domain            |
| Auth decisions | Never alone in Vue             | In Tauri host                   |
| Public API     | `index.ts` per slice           | `mod.rs` / commands + TS facade |

## Checklist for new host slices

1. Correct slice chosen — one use case, not a catch-all folder?
2. `mod.rs` as clear public surface?
3. Commands registered in `lib.rs`?
4. Matching `@shared/api` facade added/updated when frontend needs it?
5. Privileged operations secured in the host?
6. Persistence/schema via host `rusqlite` + migrations — no SQL plugin / no SQL from Vue?
