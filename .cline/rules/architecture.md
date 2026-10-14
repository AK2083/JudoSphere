---
description: JudoSphere — Architecture overview (Vue FSD + Tauri Vertical Slices + Extractable Crates)
globs: src/**/*,src-tauri/**/*
alwaysApply: true
---

# JudoSphere — Architecture Overview

JudoSphere is a desktop application built on **Tauri 2** (Rust backend) and **Vue 3** (frontend renderer). Both sides follow distinct, clearly separated architectural principles.

> **Detailed rule sets:**
>
> - Frontend (Vue / FSD): [`architecture-frontend.md`](architecture-frontend.md)
> - Backend (Tauri / Vertical Slices): [`architecture-backend.md`](architecture-backend.md)

---

## System Overview

```mermaid
graph LR
    subgraph FE ["Frontend — src/"]
        direction TB
        APP["app\nComposition root"]
        PAGES["pages\nRoute components"]
        WIDGETS["widgets\nUI building blocks"]
        FEATURES["features\nBusiness slices"]
        SHARED_FE["shared\nIPC bridge · lib · ui · types"]
    end

    subgraph BE ["Backend — src-tauri/src/"]
        direction TB
        LIB["lib.rs\nComposition root"]
        SLICES["domain slices\nathlete · competition · belt · …"]
        INFRA["infrastructure\ndb · logging"]
        SHARED_BE["shared\nerrors · types"]
    end

    SHARED_FE -- "invoke(command)" --> LIB
    LIB -- "emit(event)" --> SHARED_FE

    style FE fill:#e8f4fd,stroke:#3b82f6
    style BE fill:#fef3e8,stroke:#f97316
```

---

## IPC Boundary (Vue ↔ Tauri)

```mermaid
sequenceDiagram
    participant F as feature/api/
    participant S as shared/api/
    participant T as commands.rs
    participant SV as service.rs
    participant R as repository.rs

    F->>S: call wrapper function
    S->>T: invoke("command_name", payload)
    T->>SV: delegate(args)
    SV->>R: query()
    R-->>SV: Result<T, AppError>
    SV-->>T: Result<T, AppError>
    T-->>S: Result<T, String>
    S-->>F: typed result / AppError
```

**Rules:**

- All `invoke` / `listen` calls live exclusively in `src/shared/api/`. Features never call `window.__TAURI__` directly.
- Command names are `snake_case` and defined in the slice's `commands.rs`.
- Shared DTOs are maintained in parallel: `src/shared/types/` (TypeScript) and `src-tauri/src/shared/types.rs` (Rust). A change on one side always requires a matching change on the other.
- Commands return `Result<T, String>` (Tauri-compatible); Vue maps the error string to a typed `AppError` inside `shared/api/`.

---

## Extractable Crates — at a Glance

Selected infrastructure modules are implemented as **in-monolith modules today** but are designed from day one to be extracted as standalone Rust crates and published to the GitHub Package Feed.

| Module (now)                      | Future crate name     | Responsibility                                        |
| --------------------------------- | --------------------- | ----------------------------------------------------- |
| `src-tauri/src/infrastructure/db` | `judosphere-sqlite`   | SQLite abstraction, connection pool, migration helper |
| `src-tauri/src/shared/`           | `judosphere-core`     | Shared error types, Result alias, value objects       |
| _(future)_                        | `judosphere-supabase` | Supabase client wrapper, auth, realtime               |

See [`architecture-backend.md`](architecture-backend.md#extractable-crates) for the full extraction rules and migration plan.

---

## Quick Reference — Which Rule Applies Where?

| Area                            | Architectural principle  | Key constraint                           |
| ------------------------------- | ------------------------ | ---------------------------------------- |
| `src/app/`                      | FSD — Composition root   | No feature imports, wiring only          |
| `src/pages/`                    | FSD — Route components   | No business logic                        |
| `src/widgets/`                  | FSD — UI building blocks | No direct export to pages when global    |
| `src/features/`                 | FSD — Use cases          | Slices only; no cross-feature imports    |
| `src/shared/`                   | FSD — Abstractions       | No imports from higher layers            |
| `src-tauri/src/<slice>/`        | Vertical slices          | No cross-slice imports                   |
| `src-tauri/src/infrastructure/` | Extractable crate        | No Tauri types, no slice dependencies    |
| `src-tauri/src/shared/`         | Extractable crate        | Pure domain types and error classes only |
