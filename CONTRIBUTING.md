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
- `npm run lint:check` — ESLint checks
- `npm run lint:fix` — auto-fix supported ESLint issues
- `npm run type:check` — TypeScript project references check (`tsconfig.app` + `tsconfig.node`)
- `npm run format:check` — Prettier formatting check
- `npm run format:fix` — format files with Prettier
- `npm run test` — Vitest (unit project by default; Storybook gated)
- `npm run test:unit` — unit tests only
- `npm run test:coverage` — unit coverage report
- `npm run test:storybook` — Storybook browser tests (`VITEST_STORYBOOK=true`)
- `npm run storybook` — Storybook UI catalog
- `npm run build-storybook` — static Storybook build

## Best practices

- Keep changes small and focused by feature or fix
- Run `lint:check`, `type:check`, and relevant tests before every commit
- Cover new business logic with unit tests
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
