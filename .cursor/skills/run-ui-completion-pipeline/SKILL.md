---
name: run-ui-completion-pipeline
description: >-
  Executes ESLint, Prettier, typecheck, 100% coverage on touched modules, Tauri
  cargo tests when relevant, and Storybook/E2E checks before Task review.
modeSlugs:
  - tester
  - code
---

# Skill: UI / Task completion pipeline

Run this **after implementing a Feature Task** (and before asking for review). The Feature/Task workflow rule requires this quality gate.

## Mandatory (every Task)

1. `npm run lint` (`eslint .`) — always, not optional; may `--fix` touched files first, then re-run full lint
2. `npx prettier --write <touched files>` (or `npm run format` if the whole tree is appropriate)
3. `npm run typecheck` (`vue-tsc --build --noEmit`) — always, not optional
4. Unit coverage **100%** on every source file touched by the Task:

```bash
npx vitest run <test-paths> --coverage \
  --coverage.include='src/path/to/touched/**' \
  --coverage.exclude='' \
  --coverage.thresholds.statements=100 \
  --coverage.thresholds.branches=100 \
  --coverage.thresholds.functions=100 \
  --coverage.thresholds.lines=100
```

## Tauri / host

5. From `src-tauri/`: `cargo test --locked`  
   Required when Rust/host files changed, or when the Task wires into / depends on Tauri commands or host logging. For JudoSphere Feature Tasks, run this by default unless the change is clearly frontend-only with no host boundary.

## When applicable

6. Storybook for affected `.stories.ts` (`npm run storybook` / `build-storybook`)
7. Playwright for affected `.e2e.spec.ts` when E2E exists
8. Keep a11y / best-practices expectations in mind

## Done criteria

Report pass/fail for eslint, prettier, typecheck, coverage (with % on touched modules), and cargo tests before stopping for user review. Fix failures in the same turn when practical.
