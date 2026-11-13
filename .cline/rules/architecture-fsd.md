---
description: Feature-Sliced Design — layers, import rules, and slice structure for src/
globs: src/**/*
alwaysApply: false
---

# Feature-Sliced Design (FSD)

Frontend code lives under `src/` in six layers. Imports may only point **downward** — never from `shared` toward `entities`, `features`, `pages`, `widgets`, or `app`.

```
app → pages, widgets, features, entities, shared
pages → widgets, features, entities, shared
widgets → features, entities, shared
features → entities, shared (+ slices of the same feature among themselves)
entities → shared
shared → internal only
```

## app vs. shared — decision guide

Classify new dependencies by **role**, not technology:

| Question                                                                | → `app` | → `shared` |
| ----------------------------------------------------------------------- | ------- | ---------- |
| Part of the **composition root** (start app, register plugins)?         | Yes     | No         |
| **Swappable/mockable** without rewriting features?                      | No      | Yes        |
| Features should **not import SDKs directly**?                           | —       | Yes        |
| Switching mainly requires **wiring changes** in `main.ts`/`providers/`? | Yes     | No         |

**Rules of thumb:**

- Render framework and global providers (app shell) → `app/` / `app/providers/` — configure directly, do not abstract.
- Vendor/infrastructure clients (Tauri bridge, storage, …) → `shared/` — wrap behind a public API (especially `@shared/api`).
- Thin helpers **built on** the framework that features use everywhere → `shared/lib/` (setup stays in `app`).
- Design-system primitives (Tailwind-based) → `shared/ui/`.

**Split pattern:** A dependency can be both — instance/wiring in `app/providers/`, usage API in `shared/api` or `shared/lib/`.

## app

Composition root — app initialization, global providers, and framework wiring.

- Contains everything that **composes** the Vue application; not further abstracted.
- Examples: Vue Router, Pinia, i18n plugin, Tailwind entry styles.
- Router imports **only** page components from `@pages/*`.
- Router guards may use features/`shared` for app-wide orchestration.
- Do not register feature or widget UI directly in the router.

## pages

Route components — one page per route. The router knows only `@pages/*`.

- Pages compose features and optionally widgets; they contain no business logic.
- Structure per page: `ui/`, `index.ts` (public API).
- Each file in `ui/` is a page component: ship `<Name>.vue` and `<Name>.stories.ts` together (see [`vue-frontend.md`](vue-frontend.md)). Add E2E specs when Playwright is introduced.

## widgets

Standalone UI building blocks without feature affiliation (e.g. `Navigation`).

- May use features, entities, and `shared`.
- Structure: `ui/`, optional `i18n/`, `index.ts`.
- Each component in `ui/` requires a colocated `<Name>.stories.ts`.

## features

Business functionality divided into **slices** (use cases). One slice = one cohesive use case.

Ideal slice structure per use case:

```
features/<feature>/<slice>/
  ui/          # Vue components for the use case
               # Per component: <Name>.vue + <Name>.stories.ts
  model/       # composables, state, form logic
  i18n/        # keys.ts, de.ts, en.ts, index.ts
  api/         # use-case API: wraps @shared/api for this slice
  service/     # (optional) orchestration within the slice
  index.ts     # public API — export only here
```

**API layering:** Generic host/client access lives in `shared/api/` (Vue, Tauri, …). Each slice that needs such access gets its own `api/` folder with **use-case-specific** functions that call `@shared/api`.

- `model/` and `service/` import **only** from the slice `api/`, never directly from `@shared/api`.
- Slices import `entities` and `shared`; they may use other slices **of the same** feature, but **not** other features, pages, or widgets.

## entities

Domain entities (match, athlete, club, …) without use-case orchestration.

- May use `shared` only.
- Must not import features, widgets, pages, or `app`.

## shared

Abstraction of **swappable** dependencies. No feature or page logic. Features/widgets import only the public API — never the SDK directly.

| Segment                       | Level     | Content                                   |
| ----------------------------- | --------- | ----------------------------------------- |
| `api/`                        | Low-level | Dependency facades (Vue, Tauri invoke, …) |
| `lib/`                        | Low-level | Technical helpers                         |
| `ui/`                         | —         | Tailwind design-system primitives         |
| `config/`                     | —         | Frontend configuration                    |
| `model/`, `types/`, `errors/` | —         | Shared types/errors when needed           |

- Vue/Tauri/runtime SDKs are imported **only** inside `shared/api`.
- Design-system components without feature affiliation → `shared/ui/` (Tailwind).
- Each component in `shared/ui/` requires colocated `<Name>.stories.ts`.
- `shared` imports **no** features, entities, pages, widgets, or `app`.

## Import aliases

`@app`, `@pages`, `@widgets`, `@features`, `@entities`, `@shared` — always import via aliases, never relative paths across layer boundaries. Do not use `@/`.

## Checklist for new files

1. Correct layer and slice chosen?
2. **app vs. shared:** wiring or swappable abstraction?
3. Import direction respected (downward only)?
4. Public API exported via `index.ts`?
5. Runtime deps go through `@shared/api` (and slice `api/` when in a feature)?
6. Reusable UI without feature affiliation → `shared/ui/` with Tailwind?
7. New or changed file in `ui/` → colocated `<Name>.stories.ts` added in the same change?
