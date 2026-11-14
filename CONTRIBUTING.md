# Contributing to JudoSphere

Thank you for your interest in contributing. This guide covers the development workflow, quality checks, and how to extend the codebase.

## Requirements

- **Node.js** and **npm**
- **Rust** toolchain for Tauri
- Platform prerequisites from the [Tauri guide](https://tauri.app/start/prerequisites/)

## Getting started

```bash
npm install
npm run tauri dev
```

`npm run tauri dev` starts the Vite frontend and the Tauri host application.

For isolated UI work, run `npm run storybook`. For frontend-only Vite, run `npm run dev`.

See the [README](README.md) for the product overview and [docs/architecture.md](docs/architecture.md) for folder layout.

## Available scripts

- `npm run dev` — Vite frontend only
- `npm run tauri` / `npm run tauri dev` — Tauri CLI / full host app
- `npm run build` — typecheck + frontend production build
- `npm run preview` — preview the frontend production build
- `npm run lint` — ESLint
- `npm run format` — Prettier write
- `npm run typecheck` — TypeScript project references check
- `npm run test` — Vitest unit suite (once)
- `npm run test:coverage` — unit tests + coverage (80% thresholds)
- `npm run test:e2e` — Playwright e2e (expects a production build in `dist/`, or builds via CI first)
- `npm run storybook` / `npm run build-storybook` — Storybook UI / static build
- `npm run test:storybook` — Storybook Vitest (`VITEST_STORYBOOK=true`)

## Git hooks

After `npm install`, run **`npx husky`** once per clone so Git uses `.husky/`. Hook commands live in the hook files — not as npm scripts.

- **pre-commit** (`.husky/pre-commit`) — `lint-staged` on ESLint paths (`src/**/*.{js,mjs,cjs,ts,vue}`, `*.config.{js,mjs,cjs,ts}`, `config/**/*.ts`): ESLint `--fix`, then Prettier
- **pre-push** (`.husky/pre-push`) — currently commented out; when enabled: `npm run typecheck` then `npm run test:coverage`. Storybook stays opt-in.

To bypass in an emergency only: `git commit --no-verify` / `git push --no-verify` (avoid for normal work).

## Continuous integration

GitHub Actions workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every push and pull request:

1. ESLint, Prettier check, typecheck, Vitest unit coverage (80%)
2. Frontend build + Playwright e2e (Chromium); HTML report uploaded as the `playwright-report` artifact

No repository secrets are required for this workflow.

## Best practices

- Keep changes small and focused by feature or fix
- Let pre-commit fix format/lint on staged files; re-enable pre-push before feature work so types + coverage gate pushes
- Cover new business logic with unit tests so coverage thresholds stay green
- Add Storybook stories for new UI under `ui/` folders
- README / docs / JSDoc are written in English; JSDoc only on exported APIs
- Public module APIs use barrel files (`index.ts`)
- Do not store secrets in the repository, frontend, or logs
- Host/domain logic belongs in Tauri slices; Vue talks to the host only via `@shared/api`

## Architecture

The Vue frontend follows [Feature-Sliced Design](https://feature-sliced.design/); the Tauri host uses vertical slices. See [docs/architecture.md](docs/architecture.md).

### Adding a frontend feature

1. Create a slice under `src/features/<feature>/` (or a use-case folder inside it).
2. Export only through `index.ts`.
3. Use `@shared/api` for Vue/Tauri and other runtime dependencies.
4. Import via aliases (`@features/...`, `@shared/...`), not deep relative paths across layers.

### Adding a Tauri slice

1. Create `src-tauri/src/slices/<slice>/` with `mod.rs` and `commands.rs`.
2. Register the module in `slices/mod.rs`.
3. Wire commands in `lib.rs` only.
4. Expose a matching facade in `src/shared/api` for frontend use.

## IDE

- VS Code / Cursor + Vue - Official + Tauri + rust-analyzer + ESLint + Prettier + Storybook
- Project rules live under `.cursor/rules/`
