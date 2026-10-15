# JudoSphere Coding Rules & Guidelines

This directory contains comprehensive coding guidelines, architectural patterns, and best practices for JudoSphere development. All files apply to the codebase via Cline's `.cline/rules/` system.

---

## Quick Navigation

### 📐 Architecture

| File                                                         | Purpose                             | Applies To                    |
| ------------------------------------------------------------ | ----------------------------------- | ----------------------------- |
| **[`architecture.md`](./architecture.md)**                   | High-level system overview          | All files                     |
| **[`architecture-frontend.md`](./architecture-frontend.md)** | Vue 3 + Feature-Sliced Design (FSD) | `src/**/*.ts`, `src/**/*.vue` |
| **[`architecture-backend.md`](./architecture-backend.md)**   | Tauri + Vertical Slices             | `src-tauri/src/**/*.rs`       |

### 🎨 Frontend Development

| File                                       | Purpose                                                                    | Applies To                    |
| ------------------------------------------ | -------------------------------------------------------------------------- | ----------------------------- |
| **[`vue-frontend.md`](./vue-frontend.md)** | Vue 3 components, Tailwind CSS, Storybook, Playwright, i18n, accessibility | `src/**/*.vue`, `src/**/*.ts` |

### 🛡️ Security & Compliance

| File                                               | Purpose                                                                         | Applies To                             |
| -------------------------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------- |
| **[`security-privacy.md`](./security-privacy.md)** | Tauri IPC boundary, secrets management, SQLite, Supabase, LocalStorage security | `src/**/*.ts`, `src-tauri/src/**/*.rs` |
| **[`legal.md`](./legal.md)**                       | GDPR, data retention, responsible disclosure, licensing, accessibility (WCAG)   | All files                              |

### 📋 Project & Process

| File                                               | Purpose                                                        | Applies To |
| -------------------------------------------------- | -------------------------------------------------------------- | ---------- |
| **[`project-overview.md`](./project-overview.md)** | Tech stack, development workflow, deployment strategy, roadmap | All files  |

### 🔗 External References

| File                                                 | Purpose                                            |
| ---------------------------------------------------- | -------------------------------------------------- |
| **[`SECURITY.md`](../../SECURITY.md)** (repo root)   | Responsible disclosure policy, security advisories |
| **[`LICENSE`](../../LICENSE)** (repo root)           | MIT license                                        |
| **[`CHANGELOG.md`](../../CHANGELOG.md)** (repo root) | Release notes, version history                     |

---

## Rules at a Glance

### Frontend (Vue 3)

✅ **DO:**

- Use `<script setup lang="ts">` (Composition API)
- Write UI logic in **composables** (`use-*.ts`) — not in templates
- Style with **Tailwind CSS utilities** exclusively
- Use **i18n** for all text (German + English)
- Create **Storybook stories** (`.stories.ts`) for every UI component
- Create **Playwright E2E tests** (`.e2e.spec.ts`) for every UI component
- Test on **mobile (375px), tablet (768px), desktop (1280px+)** viewports
- Implement **WCAG 2.1 AA** accessibility standards (ARIA, keyboard nav, color contrast)

❌ **DON'T:**

- Use Options API or class components
- Put business logic in templates
- Write custom CSS (use Tailwind utilities)
- Hardcode UI text (use i18n keys)
- Forget Storybook stories or Playwright tests
- Disable `:focus` styles (keep them visible)
- Use color alone to convey meaning

### Backend (Rust + Tauri)

✅ **DO:**

- Organize code as **Vertical Slices** (one slice per domain: `athlete`, `competition`, `belt`, …)
- Keep **commands thin** (deserialize → delegate to service)
- Put **business logic in `service.rs`** (validation, orchestration)
- Put **DB queries in `repository.rs`** (no business logic here)
- Use **`Result<T, AppError>`** for error handling (unified error type)
- Parameterize **SQL queries** (never string interpolation)
- Use **SQLite WAL mode** for concurrent access
- Enable **foreign key constraints** in SQLite

❌ **DON'T:**

- Import across slices (no `crate::athlete::` from `crate::competition::`)
- Put business logic in `commands.rs`
- Put DB branching logic in `repository.rs`
- Use custom ad-hoc error types (use `AppError`)
- Concatenate SQL strings (parameterize queries)
- Disable SQLite foreign keys

### IPC Bridge (Tauri ↔ Vue)

✅ **DO:**

- Call `invoke()` **only from `src/shared/api/`** (never directly in features)
- Use **wrapper functions** in `src/shared/api/` to handle error mapping
- Return **`Result<T, String>`** from Rust commands (Tauri-compatible)
- Map errors to typed **`AppError`** in Vue (via `shared/api/`)
- Keep **shared DTOs in sync** (`src/shared/types/` ↔ `src-tauri/src/shared/types.rs`)

❌ **DON'T:**

- Call `window.__TAURI__` directly in features (violates architecture)
- Return custom Rust error types from commands (must be `String`)
- Forget to add matching TypeScript DTO when adding Rust DTO

### Security

✅ **DO:**

- Store **sensitive secrets in OS keychain** or environment variables (never in SQLite)
- Validate **all user inputs** (forms, IPC payloads, file uploads)
- Use **parameterized SQL queries** (no string interpolation)
- Store **UI state in LocalStorage only** (e.g. `judosphere.<feature>.<key>`)
- Let **Supabase SDK manage auth tokens** automatically (do not override)
- Implement **RLS (Row-Level Security)** on every Supabase table
- Use **window-label-based access control** in Tauri commands (least privilege)

❌ **DON'T:**

- Commit passwords, API keys, or credentials to git
- Concatenate user input into SQL queries
- Store sensitive data in LocalStorage (use OS keychain)
- Use wildcard grant permissions in Tauri production
- Forget RLS on Supabase tables

### Accessibility (WCAG 2.1 AA)

✅ **DO:**

- Use **semantic HTML** (`<button>`, `<label>`, `<form>`, `<section>`, `<nav>`)
- Add **`aria-label` or `aria-labelledby`** to interactive elements
- Make all interactive elements **keyboard-reachable** (Tab, Enter, Space, Arrow keys)
- Ensure **color contrast ≥ 4.5:1** for normal text, **≥ 3:1** for large text
- Use **`role="alert"` or `aria-live="polite"`** for dynamic messages
- Keep **`:focus` styles visible** (distinct styling required)
- Add **`aria-hidden="true"` to decorative icons**

❌ **DON'T:**

- Use `<div>` styled as a `<button>` (use semantic `<button>`)
- Rely on color alone to convey meaning (pair with text or icons)
- Remove `:focus` styles (CSS reset antipattern)
- Create icon-only buttons without `aria-label`
- Use interactive elements that cannot be keyboard-reached

### i18n (Internationalization)

✅ **DO:**

- Support **German (de) and English (en)**
- Define **`keys.ts`** with type-safe translation key paths
- Create **one `de.ts` and one `en.ts`** per slice (not language subfolders)
- Use **`useTranslation()`** composable in components
- Translate **ARIA labels, buttons, form fields, error messages** — everything visible to users
- Nest objects in i18n files for logical grouping (flat structure preferred)

❌ **DON'T:**

- Hardcode UI text (all text must be translated)
- Create language-specific folders (`de/`, `en/`) — use flat `de.ts`, `en.ts` structure
- Forget ARIA labels in translations
- Mix languages in a single component

---

## Development Checklist

### Before Committing

- [ ] Run linters: `npm run lint:fix`
- [ ] Type check: `npm run type:check`
- [ ] Format: `npm run format:fix`
- [ ] Tests pass: `npm run test:e2e:regression`, `npm run test:coverage`
- [ ] Storybook stories work: `npm run storybook`
- [ ] Lighthouse Accessibility ≥ 90 (for UI changes)
- [ ] Follow Conventional Commits: `feat`, `fix`, `chore`, `docs`, `refactor`, etc.
- [ ] CHANGELOG.md updated (for user-facing changes)

### Before Opening PR

- [ ] Branch naming follows convention: `feature/`, `fix/`, `docs/`, etc.
- [ ] No merge conflicts
- [ ] Code review checklist: architecture rules followed, no security issues, tests added
- [ ] Commit message describes the change clearly

---

## How Cline Uses These Rules

These rules are applied automatically by Cline when you ask for coding assistance. Cline will:

1. **Reference architectural patterns** when designing new components or slices.
2. **Enforce naming conventions** (PascalCase for components, `use-*` for composables, etc.).
3. **Check IPC boundaries** and ensure you're not calling Tauri directly from features.
4. **Validate security patterns** (no hardcoded secrets, parameterized SQL, etc.).
5. **Remind about testing** (Storybook stories + Playwright E2E tests for every UI component).
6. **Suggest i18n patterns** when you introduce new UI text.
7. **Enforce accessibility standards** (ARIA, semantic HTML, keyboard navigation, color contrast).

---

## Updating These Rules

If you discover an architectural pattern that should be documented or a rule that is outdated:

1. **Create an issue** or open a discussion in GitHub.
2. **Propose changes** to the relevant `.md` file.
3. **Ensure backward compatibility** — rules should not break existing code; they should clarify and guide future development.
4. **Notify all contributors** of significant rule changes.

---

## Additional Resources

- **[Vue 3 Documentation](https://vuejs.org/)**
- **[Tauri Documentation](https://tauri.app/)**
- **[Tailwind CSS](https://tailwindcss.com/)**
- **[Playwright](https://playwright.dev/)**
- **[Storybook Vue 3](https://storybook.js.org/docs/vue/get-started/install)**
- **[WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)**
- **[GDPR Compliance](https://gdpr-info.eu/)**
- **[Responsible Disclosure](https://cheatsheetseries.owasp.org/cheatsheets/Vulnerability_Disclosure_Cheat_Sheet.html)**

---

## Quick Links

- 📊 **[System Architecture](./architecture.md)** — Overview of frontend + backend
- 🏗️ **[Backend Architecture](./architecture-backend.md)** — Rust, Tauri, vertical slices
- 📱 **[Frontend Architecture](./architecture-frontend.md)** — Vue, FSD, feature slices
- 🎨 **[Vue & Tailwind Guide](./vue-frontend.md)** — Components, styling, testing, a11y
- 🔒 **[Security & Privacy](./security-privacy.md)** — Secrets, IPC boundary, database security
- ⚖️ **[Legal & Compliance](./legal.md)** — GDPR, data retention, licensing, accessibility
- 🎯 **[Project Overview](./project-overview.md)** — Tech stack, development workflow, roadmap
- 🛡️ **[Security Policy](../../SECURITY.md)** — Responsible disclosure, vulnerability reporting

---

**Last Updated:** 2026-10-14
