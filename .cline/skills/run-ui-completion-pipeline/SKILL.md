---
name: run-ui-completion-pipeline
description: >-
  Executes linting, type-checking, formatting, coverage, and Storybook checks
  prior to completing UI tasks.
modeSlugs:
  - tester
---

# Skill: UI Completion Pipeline

Use this skill after UI features or component modifications.

## Execution steps

1. `npx eslint . --fix`
2. `npm run format`
3. `npm run typecheck`
4. `npm run test:coverage` (affected unit tests)
5. Verify Storybook for affected `.stories.ts` (`npm run storybook` / `build-storybook`)
6. Run Playwright for affected `.e2e.spec.ts` when E2E exists
7. Keep Accessibility/Best Practices/Performance expectations in mind (no Vuetify-specific checks)
