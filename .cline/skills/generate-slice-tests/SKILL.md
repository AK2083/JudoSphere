---
name: generate-slice-tests
description: >-
  Generates colocated unit tests and Storybook coverage for FSD/Tauri slices
  using Vitest and existing project conventions.
modeSlugs:
  - tester
  - code
---

# Skill: Generate Slice Tests

Use this skill after creating or changing a feature/host slice.

## Frontend (FSD)

1. Add Vitest unit tests as `*.test.ts` next to logic under `model/`, `api/`, or `shared/`.
2. Add `<Name>.stories.ts` for each new/changed `ui/` Vue component.
3. Prefer testing through public APIs (`index.ts`) and `@shared/api` mocks — do not import `@tauri-apps/*` in tests of features directly if a facade exists.
4. Run `npm run test` / `npm run test:coverage`.

## Host (Tauri)

1. Prefer Rust unit tests colocated with the slice when logic is non-trivial.
2. Keep command adapters thin so domain logic is testable without UI.
3. If a TS facade was added, cover it with Vitest and mocked `invoke`.
