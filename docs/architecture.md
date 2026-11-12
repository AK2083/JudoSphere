# Architecture

JudoSphere uses two complementary architectures: **Feature-Sliced Design (FSD)** in the Vue frontend and **vertical slices** in the Tauri/Rust host.

## Overview

| Area | Architecture | Location |
| --- | --- | --- |
| **Frontend** | [Feature-Sliced Design](https://feature-sliced.design/) | `src/app/`, `pages/`, `widgets/`, `features/`, `entities/`, `shared/` |
| **Host / backend** | Vertical slices | `src-tauri/src/slices/<slice>/` |

There is no Electron main/preload bridge. Privileged host logic lives in Rust and is exposed to the frontend through Tauri commands, always wrapped by facades in `@shared/api`.

## Frontend (FSD)

```
app → pages → widgets → features → entities → shared
```

- `src/app/` — composition root (shell, providers, global styles)
- `src/pages/` — route-level composition
- `src/widgets/` — reusable composed UI blocks
- `src/features/` — user-facing use cases
- `src/entities/` — domain entities (match, athlete, club, …)
- `src/shared/` — swappable infrastructure and UI primitives

### Import aliases

| Alias | Path |
| --- | --- |
| `@app` / `@app/*` | `src/app` |
| `@pages` / `@pages/*` | `src/pages` |
| `@widgets` / `@widgets/*` | `src/widgets` |
| `@features` / `@features/*` | `src/features` |
| `@entities` / `@entities/*` | `src/entities` |
| `@shared` / `@shared/*` | `src/shared` |

Rules:

- Imports may only point **downward**
- Public APIs are exported via barrel `index.ts` files
- Runtime dependencies are accessed only through `@shared/api` facades
- Never import `@tauri-apps/*` or `vue` directly outside `src/shared/api`

Details: `.cursor/rules/vue-fsd.mdc`, `.cursor/rules/shared-api.mdc`

## Tauri host (vertical slices)

```
src-tauri/src/
  lib.rs          # wiring only
  main.rs         # entry
  slices/
    <slice>/
      mod.rs
      commands.rs
```

- `lib.rs` registers plugins, state, and commands only
- Each product capability is a slice (`greet` today; later `competition`, `scoring`, `network`, …)
- Host/LAN serving belongs in a dedicated slice (e.g. `network`), not in Vue
- Frontend calls host capabilities only via `@shared/api`

Details: `.cursor/rules/tauri-slices.mdc`

## Security boundaries

- Domain and persistence logic belong in Tauri slices, not in Vue components
- The browser clients of organizers/judges consume the host-served UI; they must not hold privileged host secrets
- Keep personal competition data local-first and minimize exposure on the LAN

## Design system

Reusable UI primitives live in `src/shared/ui` so a design system (Tailwind-based) can be extracted later without FSD restructuring.
