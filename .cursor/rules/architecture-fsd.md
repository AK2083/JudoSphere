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
- Vendor/infrastructure clients (Tauri bridge, storage, …) → `shared/` — wrap behind a public API (especially `@shared/api`). **Vue** and **vue-router** are imported directly (not via `@shared/api`).
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

**Reusable shell / composition UI** that is not a route page and not a single business use-case. Widgets assemble chrome that several pages (or the app shell) share.

### Prefer a widget when

| Signal                                                                           | Example                                             |
| -------------------------------------------------------------------------------- | --------------------------------------------------- |
| Same UI block appears across routes or in the app shell                          | Brand notch, primary navigation, status bar region  |
| Block has its own interaction + i18n but **no** domain use-case ownership        | Collapse/drag chrome, layout regions                |
| Putting it in `app/` would bloat the composition root                            | `AppShell` only composes; notch/nav live as widgets |
| Putting it in a **feature** would invent a fake use-case                         | Navigation is not “the navigate feature”            |
| Putting it in `shared/ui` would mix product chrome with design-system primitives | Buttons/inputs → `shared/ui`; shell nav → widget    |

### Prefer something else when

| Better home     | When                                                                      |
| --------------- | ------------------------------------------------------------------------- |
| `app/`          | One-off composition root wiring (providers, `AppShell` layout frame only) |
| `pages/`        | Route-level screens                                                       |
| `features/<…>/` | A named business use-case (forms, flows, domain actions)                  |
| `shared/ui/`    | Headless/visual primitives reused outside product chrome                  |

### Structure and rules

```
widgets/<widget-name>/
  ui/           # Vue + colocated <Name>.stories.ts
  model/        # composables (split by concern when a file grows)
  i18n/         # keys.ts, de.ts, en.ts, index.ts when the widget has copy
  index.ts      # public API — components + i18n exports only
```

- May use features, entities, and `shared`.
- Must **not** import `pages` or `app`.
- Register widget message bundles in `app/providers/i18n`.
- Keep `app` thin: shell composes widgets; widgets own their chrome behavior.

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

**API layering:** Generic host/client access lives in `shared/api/` (Tauri, Pinia, i18n, … — not Vue/vue-router). Each slice that needs such access gets its own `api/` folder with **use-case-specific** functions that call `@shared/api`.

- `model/` and `service/` import **only** from the slice `api/`, never directly from `@shared/api` (Vue/`vue-router` stay direct imports where needed).
- Slices import `entities` and `shared`; they may use other slices **of the same** feature, but **not** other features, pages, or widgets.

## entities

Domain entities (match, athlete, club, …) without use-case orchestration.

- May use `shared` only.
- Must not import features, widgets, pages, or `app`.

## shared

Abstraction of **swappable** host/runtime dependencies. No feature or page logic. Features/widgets use `@shared/api` for those facades; import `vue` / `vue-router` directly.

| Segment                       | Level     | Content                                           |
| ----------------------------- | --------- | ------------------------------------------------- |
| `api/`                        | Low-level | Dependency facades (Tauri invoke, Pinia, i18n, …) |
| `lib/`                        | Low-level | Technical helpers                                 |
| `ui/`                         | —         | Tailwind design-system primitives                 |
| `config/`                     | —         | Frontend configuration                            |
| `model/`, `types/`, `errors/` | —         | Shared types/errors when needed                   |

- Pinia/vue-i18n/Tauri/runtime SDKs are imported **only** inside `shared/api`. **Vue** and **vue-router** are imported directly.
- Pinia wiring lives in `app/providers/pinia/`; stores are defined in feature/entity `model/` via `defineStore` from `@shared/api`.
- i18n wiring lives in `app/providers/i18n/` (aggregates feature/page/shared message bundles + root `de.ts` / `en.ts`).
- Vue Router wiring lives in `app/providers/router/`; routes import `@pages/*` only; use `useRouter` / `useRoute` / `RouterLink` / `RouterView` from `vue-router`.
- Slice/page copy: `i18n/keys.ts` + `de.ts` / `en.ts`; UI calls `useTranslation()` from `@shared/api` with key objects (swappable library behind the facade).
- Nested features (e.g. `features/authentication/<slice>/`) keep per-slice `i18n/` and may roll up into a feature-level `i18n/` bundle for the provider.
- Design-system components without feature affiliation → `shared/ui/` (Tailwind).
- Each component in `shared/ui/` requires colocated `<Name>.stories.ts`.
- `shared` imports **no** features, entities, pages, widgets, or `app`.

## Import aliases

`@config`, `@app`, `@pages`, `@widgets`, `@features`, `@entities`, `@shared` — always import via aliases, never relative paths across layer boundaries. Do not use `@/`.

## Checklist for new files

1. Correct layer and slice chosen?
2. **Widget vs feature vs shared/ui vs app:** product chrome shared by shell/pages → widget; business use-case → feature; primitive → `shared/ui`; composition root only → `app`?
3. **app vs. shared:** wiring or swappable abstraction?
4. Import direction respected (downward only)?
5. Public API exported via `index.ts`?
6. Host/runtime deps go through `@shared/api` (and slice `api/` when in a feature); Vue/vue-router imported directly?
7. Reusable UI without feature affiliation → `shared/ui/` with Tailwind?
8. New or changed file in `ui/` → colocated `<Name>.stories.ts` added in the same change?
9. Public API comment policy respected ([project-overview.md](./project-overview.md))?
