# Contributing to JudoSphere

Thank you for your interest in contributing. This guide covers the development workflow, quality checks, and how to extend the codebase.

## Requirements

- **Node.js** and **npm**
- **Rust** toolchain for Tauri
- Platform prerequisites from the [Tauri guide](https://tauri.app/start/prerequisites/)

## Getting started

```bash
npm install
npm start
```

`npm start` starts the Vite frontend and the Tauri host application. In Cursor/VS Code use task **tauri:dev** (default build task; runs `npm start`).

For isolated UI work, run `npm run storybook`. For frontend-only Vite, run `npm run dev`.

See the [README](README.md) for the product overview and [docs/architecture.md](docs/architecture.md) for folder layout.

## App version & version name

Shell chrome (brand notch) reads a single identity from `@shared/config`:

- **SemVer** — `package.json` `version` (via `appVersion.version`)
- **Version name** — from `VITE_APP_VERSION_NAME` when set; otherwise empty (`appVersion.versionName`)

Do not hard-code a second version string in Vue UI. Day-to-day local builds leave the designation empty unless you set `VITE_APP_VERSION_NAME`.

### Sync script

Release workflows call `scripts/sync-release-identity.mjs` to write the same SemVer **without** `+metadata` into:

- `package.json`
- `src-tauri/tauri.conf.json`
- `src-tauri/Cargo.toml`

Cargo rejects `+build` metadata in `version`, so the per-release designation lives only in the Git tag and `VITE_APP_VERSION_NAME`.

```bash
RELEASE_VERSION=1.0.0-alpha.1 RELEASE_VERSION_NAME=Example \
  node scripts/sync-release-identity.mjs
```

Channel promotion (alpha → beta → rc) keeps core, counter, and designation:

```bash
SOURCE_TAG=v1.0.0-alpha.1+Example TARGET_CHANNEL=beta \
  node scripts/map-release-channel.mjs
```

Tests: `npm run test:release-identity`.

### Tag & Release naming

| Field                   | Rule                                   | Example                  |
| ----------------------- | -------------------------------------- | ------------------------ |
| Git tag                 | `v{version}+{versionName}`             | `v1.0.0-alpha.1+Example` |
| GitHub Release **name** | the manual designation (`versionName`) | `Example`                |
| Manifest SemVer         | version **without** `+versionName`     | `1.0.0-alpha.1`          |

`versionName` is chosen **manually per release** (any SemVer build-metadata-safe name). It is not a fixed project constant.

### Packager strategy (SemVer prereleases)

We **keep** channel SemVer (`alpha` / `beta` / `rc`) in manifests and tags. We do **not** rewrite versions just for packagers.

RPM and MSI reject those prereleases (RPM: `-` in the version; MSI: non-numeric prerelease). Release builds therefore use **per-OS bundle targets** instead of `targets: "all"`:

| OS      | Ship              | Skip (for now) |
| ------- | ----------------- | -------------- |
| macOS   | `app`, `dmg`      | —              |
| Linux   | `deb`, `appimage` | `rpm`          |
| Windows | `nsis`            | `msi`          |

Encoded in `src-tauri/tauri.conf.json` and in the release matrix (`--bundles …` in `.github/workflows/release-tauri-build.yml`). A later change could add packager-specific version mapping if we need RPM/MSI again.

## Release stages (Test → Staging → Production)

GitHub Environments `test`, `staging`, and `production` gate the three SemVer channels. Shared matrix build: [`.github/workflows/release-tauri-build.yml`](.github/workflows/release-tauri-build.yml).

| Stage          | Workflow                                                             | Environment                       | Channel                           | Publish            |
| -------------- | -------------------------------------------------------------------- | --------------------------------- | --------------------------------- | ------------------ |
| **Test**       | [`release-test.yml`](.github/workflows/release-test.yml)             | `test`                            | **alpha** (e.g. `1.0.0-alpha.1`)  | Prerelease         |
| **Staging**    | [`release-staging.yml`](.github/workflows/release-staging.yml)       | `staging`                         | **beta** (from a green Test tag)  | Prerelease         |
| **Production** | [`release-production.yml`](.github/workflows/release-production.yml) | `production` (required reviewers) | **rc** (from a green Staging tag) | **Non**-prerelease |

Typical operator flow:

1. **Release Test** — `workflow_dispatch` with `version` (`*-alpha.*`) + `version_name` (+ optional `ref`). Smoke the installers (local app / local Supabase).
2. **Release Staging** — `from_tag` = green Test tag (e.g. `v1.0.0-alpha.1+Example`). Rebuilds as beta; validate against cloud Supabase.
3. **Release Production** — `from_tag` = green Staging tag (e.g. `v1.0.0-beta.1+Example`). Rebuilds as rc; cannot skip Staging.

Staging and Production refuse invalid source tags (missing release, draft, wrong channel, or no assets).

### Signing secrets

Configure on the GitHub Environments (especially `production`) before relying on signed updates:

| Secret                               | Required                       | Purpose                                                 |
| ------------------------------------ | ------------------------------ | ------------------------------------------------------- |
| `TAURI_SIGNING_PRIVATE_KEY`          | For trusted Production updates | Private key that signs Tauri update/installer artifacts |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Only if the key is encrypted   | Passphrase for that private key                         |

Builds succeed without these secrets; auto-update trust needs them once the updater is enabled.

### Tauri Updater (later Feature)

Production already publishes consumable non-prerelease artifacts. Wiring `@tauri-apps/plugin-updater` and a `latest.json` endpoint is a **separate later Feature** — not part of these release workflows.

## Icons (Heroicons)

Use [`@heroicons/vue`](https://github.com/tailwindlabs/heroicons) for UI icons in Vue components:

```ts
import { HomeIcon, Cog6ToothIcon } from '@heroicons/vue/24/outline'
```

Prefer the **24/outline** set for shell chrome. Mark decorative icons with `aria-hidden="true"`; icon-only controls need a translated `aria-label` / `title` (see app shell nav when collapsed).

## Available scripts

- `npm run dev` — Vite frontend only
- `npm start` — full Tauri host + Vite (`beforeDevCommand`)
- `npm run tauri:build` — Tauri production bundle
- `npm run build` — typecheck + frontend production build
- `npm run preview` — preview the frontend production build
- `npm run lint` — ESLint
- `npm run format` — Prettier write
- `npm run typecheck` — TypeScript project references check
- `npm run test` — Vitest unit suite (once)
- `npm run test:coverage` — unit tests + coverage (80% thresholds)
- `npm run test:release-identity` — Node test runner for `scripts/release-identity*.mjs` (sync + channel mapping)
- `npm run test:e2e` — Playwright e2e (expects a production build in `dist/`, or builds via CI first)
- `npm run storybook` / `npm run build-storybook` — Storybook UI / static build
- `npm run test:storybook` — Storybook Vitest (`VITEST_STORYBOOK=true`)
- `npm run docs` — generate API docs from JSDoc comments (`docs/api/`, see `jsdoc.json`)

## Git hooks

`npm install` runs `prepare` → `husky` so Git uses `.husky/`. Hook commands live in the hook files — not as npm scripts.

- **pre-commit** (`.husky/pre-commit`) — `lint-staged`:
  - ESLint paths (`src/**/*.{js,mjs,cjs,ts,vue}`, `*.config.{js,mjs,cjs,ts}`, `config/**/*.ts`): ESLint `--fix`, then Prettier
  - Markdown / JSON (`*.{md,json,jsonc}`): Prettier only
- **post-commit** (`.husky/post-commit`) — marks the active Feature **Task** as Done after a successful commit (see agent workflow below)
- **pre-push** (`.husky/pre-push`) — currently commented out; when enabled: `npm run typecheck` then `npm run test:coverage`. Storybook stays opt-in.

To bypass in an emergency only: `git commit --no-verify` / `git push --no-verify` (avoid for normal work).

## Agent Feature / Task workflow (Cursor & Cline)

Generic reusable workflow for GitHub **Feature** issues with ordered **Task** sub-issues:

1. Work on branch `feature/<issueNumber>-<short-description>` (Feature id comes from the branch)
2. If the Feature has no Tasks yet, create them first (skill `create-feature-tasks`)
3. Tasks in ascending issue-number order (one Task at a time); starting a Task sets project Status to **In progress**
4. Agents stop for review and must not commit alone
5. After you approve/create the commit (include `Refs #<task>`), the Task is marked Done (project Status **Done**)

Shared engine: [`.workflow/feature-task/`](.workflow/feature-task/) (`engine.py`, `config.json`; field notes in `config.example.json`).  
Runtime active Feature/Task state is **local/feature-specific** (gitignored): `.workflow/feature-task/state.json`.

**Hooks** = when (policy). **Skill** `create-feature-tasks` = how to create Task issues.

Wiring:

- Cursor: `.cline/hooks.json` (`.cursor` → `.cline`) → `.workflow/feature-task/integrations/cursor/`
- Cline: `.clinerules/hooks/*` → `.workflow/feature-task/integrations/cline/` (enable Hooks in Cline settings)
- Git: `.husky/post-commit` → `engine.py mark-done`
- Rule: `.cline/rules/feature-task-workflow.md`
- Skill: `.cline/skills/create-feature-tasks/SKILL.md`

```bash
git switch -c feature/7-app-shell-navigation
python3 .workflow/feature-task/engine.py from-branch
python3 .workflow/feature-task/engine.py next-context
```

## Continuous integration

GitHub Actions workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every push and pull request:

1. ESLint, Prettier check, typecheck, Vitest unit coverage (80%), release-identity script tests
2. Frontend build + Playwright e2e (Chromium); HTML report uploaded as the `playwright-report` artifact

No repository secrets are required for this workflow. Manual release workflows (Test / Staging / Production) are separate; see **Release stages** above.

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
3. Use `@shared/api` for Tauri/Pinia/i18n and other host runtime dependencies; import `vue` and `vue-router` directly.
4. Import via aliases (`@features/...`, `@shared/...`), not deep relative paths across layers.

### Adding a Tauri slice

1. Create `src-tauri/src/slices/<slice>/` with `mod.rs` and `commands.rs`.
2. Register the module in `slices/mod.rs`.
3. Wire commands in `lib.rs` only.
4. Expose a matching facade in `src/shared/api` for frontend use.

### Local SQLite

- Host DB: `rusqlite` (bundled) file `judosphere.db` in the app data directory; migrations under `src-tauri/src/slices/database/migrations/`.
- Frontend: only `@shared/api` helpers (`getAppValue` / `setAppValue` / `deleteAppValue`) which call Tauri commands — no SQL and no DB SDK in Vue.

## IDE

- VS Code / Cursor + Vue - Official + Tauri + rust-analyzer + **CodeLLDB** + ESLint + Prettier + Storybook
- Project rules live under `.cursor/rules/`

### Debugging (Cursor / VS Code)

Configs live in `.vscode/launch.json` and `.vscode/tasks.json`. Install recommended extensions when prompted (especially **CodeLLDB**).

| Configuration                                  | What it debugs                                        |
| ---------------------------------------------- | ----------------------------------------------------- |
| **Tauri: Debug Rust (dev)**                    | Rust host + Vite; window is WebKit                    |
| **Vue/TS: Cursor breakpoints (Chrome + Vite)** | Vue/TS breakpoints **inside Cursor** (needs Chromium) |
| **Vue/TS: Open in Safari only**                | Opens Safari — **no** Cursor breakpoints              |
| **Vitest: Debug current file**                 | Unit test of the open file                            |

**Why Safari ≠ Cursor breakpoints:** Cursor’s JS debugger speaks Chrome DevTools Protocol. Safari/WebKit does not. `Open in Safari only` just runs `open -a Safari …`.

**Vue breakpoints with Safari (recommended on your Mac):**

1. Start **Tauri: Debug Rust (dev)**, task **tauri:dev**, or `npm start` / `npm run dev`.
2. Safari → Settings → Advanced → enable **Show features for web developers**.
3. **Develop → [your Mac] →** the Vite page or **judosphere** WebView.
4. In Web Inspector → **Sources**: open your `.vue` / `.ts` and set breakpoints there.

**Vue breakpoints inside Cursor:** use **Vue/TS: Cursor breakpoints (Chrome + Vite)** (Chrome/Chromium must be installed). That session has no Tauri `invoke` unless you debug the Tauri WebView via Safari Inspector instead.
