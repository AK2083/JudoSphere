---
description: JudoSphere project overview — tech stack, architecture, development workflow, and deployment strategy
globs: "**/*.{ts,vue,rs,md}"
alwaysApply: false
---

# Project Overview

JudoSphere is a **desktop application** for managing judo tournaments, athletes, and belt progressions. Built with **Tauri 2** (Rust backend) + **Vue 3** (frontend), it runs on Windows, macOS, and Linux.

---

## Tech Stack

### Frontend
- **Framework:** Vue 3 (`@vitejs/plugin-vue`)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS (utility-first)
- **State:** Pinia (store) + Composables
- **i18n:** vue-i18n (German + English)
- **Testing:** Playwright (E2E) + Vitest (unit, if added later)
- **Component Showcase:** Storybook (Vue 3)
- **Routing:** Vue Router
- **IPC Bridge:** Tauri `@tauri-apps/api` (via `src/shared/api/`)

### Backend
- **Runtime:** Tauri 2 (v2.0+)
- **Language:** Rust (2021 edition)
- **Database:** SQLite (with WAL mode for sync-friendly operations)
- **Architecture:** Vertical Slices (no cross-slice imports)
- **Error Handling:** Unified `AppError` type (extractable as `judosphere-core` crate)
- **Logging:** `tracing` crate (structured logging)

### DevOps & Infrastructure
- **VCS:** Git (GitHub)
- **Package Manager:** npm (frontend) + Cargo (backend)
- **CI/CD:** GitHub Actions (planned: linting, testing, artifact builds)
- **Local Development:** `npm run dev` (Vite dev server + Tauri dev mode)
- **Desktop Deployment:** Tauri bundler (generates `.msi`, `.dmg`, `.AppImage`, `.deb`)
- **Networking:** mDNS (for LAN discovery between clients and sync server, if multi-client is implemented)

---

## Architecture Layers

### Frontend (FSD — Feature-Sliced Design)

```
src/
├── app/              # Composition root (providers, router, main.ts)
├── pages/            # Route components (one per route)
├── widgets/          # Standalone UI blocks (navigation, sidebar)
├── features/         # Business slices (athlete, competition, belt, …)
└── shared/           # Swappable abstractions (api, lib, ui, types, errors)
```

**Import rule:** Only downward. `app` → `pages` → `features` → `shared`. Never upward.

### Backend (Vertical Slices)

```
src-tauri/src/
├── lib.rs            # Composition root (registers all slices)
├── main.rs           # Tauri entry point
├── shared/           # Extractable → judosphere-core
│   ├── errors.rs     # AppError, Result<T, AppError>
│   └── types.rs      # Value objects (e.g. BeltRank)
├── infrastructure/   # Extractable → judosphere-sqlite
│   ├── db.rs         # Connection pool, migrations
│   └── logging.rs    # Tracing setup
├── athlete/          # Slice: athlete management
├── competition/      # Slice: tournament management
├── belt/             # Slice: belt & grading
└── …
```

**Import rule:** No cross-slice imports. Slices depend on `shared/` and `infrastructure/` only.

---

## Key Features & Workflows

### 1. Athlete Management
- **Create:** Register new athlete (name, DOB, belt rank, contact).
- **Edit:** Update athlete profile.
- **Delete:** Remove athlete and cascade-delete associated records (matches, grading history).
- **List:** View all athletes with filtering/sorting (by name, belt, DOB).

### 2. Tournament Management
- **Create:** Set up tournament (name, date, location, rules).
- **Schedule:** Define rounds, bracket pairings.
- **Record Results:** Log match outcomes (winner, score, time).
- **Publish:** Generate reports (results, standings, belt promotions).

### 3. Belt Progression
- **Track:** Record belt grading events (test date, result, feedback).
- **Validate:** Prevent retroactive promotions (e.g. can't promote to black-belt after already being black-belt).
- **History:** View grading timeline per athlete.

### 4. Data Persistence
- **SQLite Database:** Stored in app data directory (`~/.judosphere/` or equivalent).
- **WAL Mode:** Enables faster writes and concurrent reads (useful for multi-client sync).
- **Migrations:** Version-controlled schema changes (see `src-tauri/migrations/`).

### 5. Desktop Sync (Future)
- **Local Network:** Use mDNS to discover other JudoSphere instances on the same network.
- **Sync Protocol:** (TBD) Supabase Realtime or custom WebSocket protocol.
- **Conflict Resolution:** Last-write-wins or per-record versioning.

---

## Development Workflow

### Local Setup

1. **Clone repo:**
   ```bash
   git clone https://github.com/AK2083/JudoSphere.git
   cd JudoSphere
   ```

2. **Install dependencies:**
   ```bash
   npm install
   cargo build  # (Rust backend)
   ```

3. **Start dev environment:**
   ```bash
   npm run dev
   # or separate terminals:
   npm run dev:frontend  # Vite on http://localhost:5173
   npm run dev:backend   # Tauri in debug mode
   ```

4. **Run tests:**
   ```bash
   npm run test:storybook    # Storybook UI components
   npm run test:e2e          # Playwright end-to-end
   npm run test:coverage     # (if unit tests added)
   ```

5. **Build for release:**
   ```bash
   npm run build
   npm run tauri build       # Generates installers
   ```

### Commit Workflow

1. **Branch naming:** `feature/athlete-list`, `fix/login-bug`, `docs/architecture`.
2. **Commit message:** Follow Conventional Commits (feat, fix, chore, docs, etc.).
3. **Pre-commit checks:**
   - Linting: `npm run lint:fix`
   - Type checking: `npm run type:check`
   - Formatting: `npm run format:fix`
4. **Pull Request:** Merge to `main` only after:
   - CI passes (linting, tests).
   - Code review approved.
   - No merge conflicts.

### Testing Requirements

- **Every UI component** (`src/features/*/ui/*.vue`, `src/widgets/*/ui/*.vue`, `src/pages/*/ui/*.vue`) must have:
  - `.stories.ts` (Storybook)
  - `.e2e.spec.ts` (Playwright)
- **Backend commands** must be tested via E2E (Playwright communicates with Tauri).
- **Test tags:** `@smoke` (fast), `@critical` (blocking flows), `@regression` (full coverage).

---

## Network & Deployment

### Desktop (Single Client)

- **No external network required** — all data stored locally in SQLite.
- **Tauri app** bundles Rust backend + Vue frontend; runs standalone on user's machine.
- **Updates:** Via GitHub Releases or auto-updater (Tauri built-in).

### LAN Sync (Multi-Client, Future)

If tournament organizers need to sync data across multiple devices on the same network:

- **Service Discovery:** mDNS (`judosphere._http._tcp.local`) broadcasts each client's IP.
- **Sync Server:** One client designated as "sync host" (or separate lightweight server).
- **Client Connection:** Other clients connect via `http://<sync-host-ip>:8080/api/...` (IP + port).
- **Fallback:** If IP connection fails, try mDNS name (`judosphere-host.local:8080`).
- **Authentication:** (TBD) API keys or token-based (no passwords over unencrypted LAN).

**Note:** Currently not implemented. Planned for v2.0+.

---

## File Structure Quick Reference

```
JudoSphere/
├── .cline/rules/              # AI coding guidelines
│   ├── architecture.md         # High-level overview
│   ├── architecture-frontend.md # Vue + FSD rules
│   ├── architecture-backend.md  # Rust + vertical slices
│   ├── vue-frontend.md          # Vue 3, Tailwind, Storybook, Playwright
│   ├── security-privacy.md      # Security best practices
│   ├── legal.md                 # GDPR, compliance
│   └── project-overview.md      # This file
│
├── src/                        # Frontend (Vue 3)
│   ├── app/                    # Composition root
│   ├── pages/                  # Route components
│   ├── widgets/                # Shared UI blocks
│   ├── features/               # Business slices
│   └── shared/                 # Abstractions
│
├── src-tauri/                  # Tauri app (Rust backend)
│   ├── src/                    # Rust source
│   │   ├── lib.rs              # Composition root
│   │   ├── main.rs             # Entry point
│   │   ├── shared/             # Extractable crate
│   │   ├── infrastructure/     # DB, logging
│   │   ├── athlete/            # Slice
│   │   ├── competition/        # Slice
│   │   ├── belt/               # Slice
│   │   └── …
│   ├── migrations/             # SQLite schema (SQL files)
│   └── Cargo.toml              # Rust dependencies
│
├── package.json                # npm deps (Vue, Tailwind, etc.)
├── vite.config.ts              # Vite configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
├── .github/workflows/          # CI/CD (GitHub Actions)
├── CHANGELOG.md                # Release notes
├── LICENSE                     # MIT license
├── README.md                   # Quick start guide
└── SECURITY.md                 # Responsible disclosure policy
```

---

## Roadmap (Planned Phases)

### Phase 1: MVP (v0.1–v0.5)
- ✅ Athlete CRUD
- ✅ Belt progression tracking
- ✅ Basic competition management
- ✅ UI with Tailwind + Storybook
- ✅ Comprehensive E2E tests (Playwright)
- ✅ Security & legal compliance

### Phase 2: Multi-User (v1.0)
- Supabase integration (multi-client, auth)
- LAN sync protocol
- Real-time updates (Supabase Realtime or WebSocket)
- User roles (admin, coach, referee)

### Phase 3: Advanced (v1.5+)
- Tournament bracket generation (Swiss, round-robin)
- PDF export (results, certificates)
- Video match replay integration
- Mobile companion app (React Native)

---

## Contributing

1. Follow guidelines in `.cline/rules/*.md`.
2. Use Conventional Commits.
3. Add tests for every new feature.
4. Run linters and type checks before committing.
5. Update `CHANGELOG.md` with user-facing changes.

---

## Support & Troubleshooting

### Common Issues

**"Cannot connect to backend"**
- Ensure `npm run dev` is running (launches Tauri backend in debug mode).
- Check Tauri dev window for error messages.

**"Database locked"**
- Ensure only one Tauri instance is running per computer.
- SQLite WAL mode should allow concurrent reads; if issue persists, check for stuck transactions.

**"Tests fail locally but pass in CI"**
- Timezone differences: ensure tests mock dates/times consistently.
- File permissions: run `npm run test:e2e` with elevated permissions if needed.

---

## Links & Resources

- **Vue 3 Guide:** https://vuejs.org/
- **Tailwind CSS:** https://tailwindcss.com/
- **Tauri Docs:** https://tauri.app/
- **SQLite:** https://www.sqlite.org/
- **Playwright:** https://playwright.dev/
- **Storybook Vue3:** https://storybook.js.org/docs/vue/get-started/install
