---
name: create-fsd-slice
description: >-
  Scaffolds a Feature-Sliced Design use-case slice under src/features with ui,
  model, api, i18n, barrel export, and Storybook stubs using Tailwind shared UI.
modeSlugs:
  - architect
  - code
---

# Skill: Create FSD Feature Slice

Use this skill to add a new frontend use-case slice under Feature-Sliced Design.

## Target structure

```
src/features/<feature>/<slice>/
  ui/
  model/
  api/
  i18n/
  index.ts
```

## Execution steps

1. Create the folders above for the new slice.
2. Add `index.ts` as the **only** public export surface.
3. Put presentation in `ui/` with `<script setup lang="ts">`.
4. Put composables in `model/use-*.ts` — no business logic in templates.
5. Put host/client calls in slice `api/` that wrap `@shared/api` (never import `vue` / `@tauri-apps/*` directly in features).
6. Use Tailwind design-system components from `@shared/ui` instead of inventing one-off controls.
7. Add colocated `<Name>.stories.ts` for each new `ui/` component in the same change.
8. Import the slice elsewhere only via `@features/<feature>/<slice>` (or the feature barrel).

## Guardrails

- Do not import other features, pages, or widgets from this slice.
- Do not deep-import another slice’s internals.
- Entities belong in `@entities/*`, not inside the feature slice unless tightly coupled UI for that entity is required.
