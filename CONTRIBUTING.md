# Contributing to JudoSphere

Welcome! This guide explains how to contribute code to JudoSphere using **GitHub Flow**.

---

## Quick Start

1. Fork the repository (optional, if external contributor)
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make changes, commit, and push
4. Open a Pull Request
5. Code review & merge

---

## GitHub Flow

JudoSphere uses **GitHub Flow** — a simple, scalable branching model.

```
main (always deployable)
  ↓
  ├─→ feature/athlete-management (new feature)
  │     ↓ commit, push
  │     ↓ pull request
  │     ↓ code review
  │     ↓ merge back to main
  │
  ├─→ bugfix/cors-issue (bug fix)
  │     ↓ commit, push
  │     ↓ pull request
  │     ↓ merge
  │
  └─→ docs/setup-guide (documentation)
        ↓ commit, push
        ↓ pull request
        ↓ merge
```

**Key Principles:**

- `main` is always stable and deployable
- All work happens in feature branches
- No `develop` branch (unlike Git Flow)
- Short-lived branches (1–3 days typically)
- Regular code reviews before merge

---

## Branch Naming Conventions

### Format

```
<type>/<issue-number>-<short-description>
```

**Examples:**

- `feature/123-athlete-registration` — New feature for issue #123
- `bugfix/456-cors-headers` — Bug fix for issue #456
- `docs/789-setup-guide` — Documentation update
- `refactor/890-api-client` — Code refactoring
- `chore/901-dependencies` — Maintenance/dependencies

### Types

| Type        | Purpose                               | Example                            |
| ----------- | ------------------------------------- | ---------------------------------- |
| `feature/`  | New feature or functionality          | `feature/123-athlete-crud`         |
| `bugfix/`   | Bug fix                               | `bugfix/456-null-pointer`          |
| `docs/`     | Documentation updates                 | `docs/789-contributing-guide`      |
| `refactor/` | Code refactoring (no behavior change) | `refactor/890-extract-composables` |
| `chore/`    | Maintenance, dependencies, config     | `chore/901-update-deps`            |

### Rules

- **Lowercase only** — No uppercase letters
- **Use hyphens** — Not underscores or camelCase
- **Include issue number** (if applicable) — `feature/123-description`
- **Keep short** — Max 50 characters (excluding type)
- **Be descriptive** — What is being done?

**✅ Good:**

- `feature/123-athlete-belt-promotion`
- `bugfix/456-vite-hmr-cors`
- `docs/setup-unraid`

**❌ Bad:**

- `feature/MyAthleteFeature` (uppercase)
- `feature_athlete` (underscore)
- `Feature/Athlete/Management` (too nested)
- `f/athlete` (not descriptive)

---

## Commit Conventions

JudoSphere uses **Conventional Commits** format for clear, semantic commit messages.

### Format

```
<type>(<scope>): <subject>

<body (optional)>

<footer (optional)>
```

### Type

| Type        | Meaning                               |
| ----------- | ------------------------------------- |
| `feat:`     | New feature (frontend or backend)     |
| `fix:`      | Bug fix                               |
| `docs:`     | Documentation changes                 |
| `style:`    | Code style (formatting, linting)      |
| `refactor:` | Code refactoring (no behavior change) |
| `perf:`     | Performance improvements              |
| `test:`     | Adding or updating tests              |
| `chore:`    | Maintenance, dependencies, config     |
| `ci:`       | CI/CD configuration                   |

### Scope (Optional)

Indicate what part changed:

- `athlete` — Athlete feature
- `competition` — Competition feature
- `ui` — UI components
- `api` — API/backend
- `db` — Database/migrations
- `docs` — Documentation
- `ci` — CI/CD

### Subject Line

- **Imperative mood:** "add" not "added" or "adds"
- **Lowercase first letter**
- **No period at end**
- **Max 50 characters**

### Examples

**Good:**

```
feat(athlete): add belt promotion workflow
fix(api): resolve CORS headers for localhost:5173
docs(setup): update Code-Server installation steps
refactor(ui): extract athlete card to component
test(e2e): add Playwright tests for athlete form
chore(deps): update Vue to 3.4.0
```

**Bad:**

```
Fixed CORS bug  (no type/scope, vague)
feat: added athlete belt promotion feature  (not imperative, too long)
docs: UPDATING DOCS  (uppercase)
refactor(athlete): fix bug  (refactor shouldn't fix bugs, use fix:)
```

### Body (Optional)

For complex commits, add body after blank line:

```
feat(athlete): add belt promotion workflow

Adds ability for instructors to promote athletes to next belt rank.
Includes validation, history tracking, and audit logging.

Related to issue #123
```

### Footer (Optional)

Reference issues:

```
Fixes #123
Closes #456
Related to #789
```

---

## Pull Request Process

### 1. Before Creating PR

Ensure:

- ✅ Branch name follows conventions
- ✅ Commits follow Conventional Commits
- ✅ Code follows `.cline/rules/` guidelines
- ✅ Tests written and passing
- ✅ Linting & type checking pass
- ✅ Self-review done (check your own code first)

### 2. Create Pull Request

**Title Format:**

```
<type>(<scope>): <description>

Example:
feat(athlete): add belt promotion workflow
```

**Description Template:**

```markdown
## Description

Brief explanation of what changed and why.

## Related Issue

Fixes #123

## Type of Change

- [ ] New feature
- [ ] Bug fix
- [ ] Documentation update
- [ ] Refactoring
- [ ] Dependency update

## Testing

- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing done

## Checklist

- [ ] Follows `.cline/rules/` guidelines
- [ ] Code reviewed by self
- [ ] No console errors/warnings
- [ ] Database migrations included (if applicable)
- [ ] Documentation updated (if applicable)
- [ ] i18n keys added (if UI text added)
```

### 3. Code Review

**Reviewers will check:**

#### Frontend (Vue)

- ✅ Follows [`vue-frontend.md`](.cline/rules/vue-frontend.md)
- ✅ `<script setup lang="ts">` (no Options API)
- ✅ No business logic in templates
- ✅ Tailwind utilities only (no custom CSS)
- ✅ All text via i18n (`t(keys.translationKey)`)
- ✅ Responsive design tested (mobile, tablet, desktop)
- ✅ Accessibility (semantic HTML, ARIA, keyboard nav, contrast)
- ✅ Storybook story included (`.stories.ts`)
- ✅ Playwright E2E test included (`.e2e.spec.ts`)
- ✅ Linting passes: `npm run lint:fix`
- ✅ Type checking passes: `npm run type:check`

#### Backend (Rust)

- ✅ Follows [`architecture-backend.md`](.cline/rules/architecture-backend.md)
- ✅ Vertical slices architecture (no cross-slice imports)
- ✅ `commands.rs` — thin layer, immediate delegation
- ✅ `service.rs` — business logic & validation
- ✅ `repository.rs` — SQL only, no domain logic
- ✅ Error handling: `Result<T, AppError>` or `Result<T, String>` (for IPC)
- ✅ Parameterized SQL queries (no string interpolation)
- ✅ No personal data in logs
- ✅ Tests added (if applicable)
- ✅ Cargo check passes: `cargo check --manifest-path src-tauri/Cargo.toml`

#### Database/Migrations

- ✅ Migrations in `src-tauri/migrations/NNN-description.sql`
- ✅ Numbered sequentially
- ✅ Idempotent (safe to run multiple times)
- ✅ Foreign keys included
- ✅ Migration tracked in `_migrations` table

#### Documentation

- ✅ README/setup guides updated (if needed)
- ✅ Code comments for complex logic
- ✅ No personal data in examples/screenshots
- ✅ Complies with [`legal.md`](.cline/rules/legal.md) (GDPR, licensing)
- ✅ Complies with [`security-privacy.md`](.cline/rules/security-privacy.md)

### 4. Merge

Once approved:

- ✅ All CI checks pass (linting, type checking, tests)
- ✅ At least 1 approval (or maintainer squash-merge)
- ✅ No merge conflicts
- ✅ Branch deleted after merge

---

## Testing Requirements

All code changes require tests before PR.

### Frontend: Storybook

Every Vue component needs `.stories.ts`:

```bash
src/features/athlete/register-athlete/ui/
  ├── RegisterAthleteForm.vue
  ├── RegisterAthleteForm.stories.ts       ← Required
  └── RegisterAthleteForm.e2e.spec.ts      ← Required
```

### Frontend: Playwright E2E

Every component needs `.e2e.spec.ts`:

```typescript
test.describe('AthleteForm', () => {
  test('submits form successfully', async ({ page }) => {
    // Test implementation
  })
})
```

Tag tests appropriately:

- `@smoke` — Fast sanity checks (30 seconds total)
- `@critical` — Must-not-break flows
- `@regression` — Full coverage (mandatory)

**Run tests:**

```bash
npm run test:e2e:smoke      # Fast (~30s)
npm run test:e2e:critical   # Critical flows
npm run test:e2e:regression # Full suite (~5 min)
```

### Backend: Unit Tests (if applicable)

```bash
cargo test --manifest-path src-tauri/Cargo.toml
```

### Type Checking & Linting

**Before pushing:**

```bash
npm run lint:fix       # Auto-fix linting issues
npm run type:check     # TypeScript type checking
npm run format:fix     # Prettier formatting
```

All must pass before PR.

---

## Commit Workflow Example

```bash
# 1. Create feature branch
git checkout -b feature/123-athlete-promotion

# 2. Make changes
# Edit src/features/athlete/promote/ui/PromoteForm.vue
# Add src/features/athlete/promote/ui/PromoteForm.stories.ts
# Add src/features/athlete/promote/ui/PromoteForm.e2e.spec.ts
# Add src-tauri/src/athlete/commands.rs (new command)
# Add src-tauri/migrations/002-add-promotion-history.sql

# 3. Run linting & tests
npm run lint:fix
npm run type:check
npm run test:e2e:smoke

# 4. Commit with conventional format
git add .
git commit -m "feat(athlete): add belt promotion workflow

- Add PromoteForm component with validation
- Add promotion history table in database
- Add API endpoint for belt promotion
- Include i18n translations (de, en)
- Include Storybook stories and Playwright tests

Fixes #123"

# 5. Push and create PR
git push origin feature/123-athlete-promotion
# → GitHub: Create Pull Request
```

---

## Development Checklist (Before PR)

- [ ] Branch name follows `<type>/<issue>-<description>` format
- [ ] All commits follow Conventional Commits format
- [ ] **Tests written and passing:**
  - [ ] Storybook story (`.stories.ts`) for Vue components
  - [ ] Playwright E2E test (`.e2e.spec.ts`) for Vue components
  - [ ] Unit tests for backend (if applicable)
- [ ] **Code quality:**
  - [ ] `npm run lint:fix` passes
  - [ ] `npm run type:check` passes
  - [ ] `npm run format:fix` passes
  - [ ] `cargo check` passes (if Rust changes)
- [ ] **Code follows guidelines:**
  - [ ] Frontend: `.cline/rules/vue-frontend.md`
  - [ ] Backend: `.cline/rules/architecture-backend.md`
  - [ ] Database: Migrations in `src-tauri/migrations/`
  - [ ] i18n: Translations in slice `i18n/` folder
- [ ] **Documentation:**
  - [ ] No personal data in examples/logs
  - [ ] Complies with `SECURITY.md` (secrets, logging)
  - [ ] Complies with `.cline/rules/legal.md` (GDPR, licensing)
- [ ] **Self-review:**
  - [ ] Code is clear and maintainable
  - [ ] No console errors/warnings
  - [ ] No `console.log()` statements left
  - [ ] No commented-out code
  - [ ] No debugging code
- [ ] **PR description:**
  - [ ] Title follows `<type>(<scope>): <description>`
  - [ ] Description explains "what" and "why"
  - [ ] Related issue linked (`Fixes #123`)
  - [ ] Type of change checked

---

## Code Review Checklist (For Reviewers)

### Must-Haves

- [ ] Changes align with issue/PR description
- [ ] No breaking changes without discussion
- [ ] All tests passing (GitHub Actions)
- [ ] No personal data in code/logs/comments
- [ ] Commit history clean (squashed or rebased)
- [ ] Branch name & commit messages follow conventions

### Frontend Reviews

- [ ] Follows FSD architecture (no cross-feature imports)
- [ ] Uses `<script setup lang="ts">` (no Options API)
- [ ] Tailwind utilities used (no custom CSS)
- [ ] i18n keys used (no hardcoded text)
- [ ] ARIA labels present (semantic HTML)
- [ ] Responsive design working (3 viewports tested)
- [ ] Storybook story complete
- [ ] Playwright E2E test included
- [ ] No console errors/warnings

### Backend Reviews

- [ ] Follows vertical slices (no cross-slice imports)
- [ ] `commands.rs` is thin (delegates to service)
- [ ] `service.rs` has business logic & validation
- [ ] `repository.rs` has SQL only (no domain logic)
- [ ] Parameterized SQL (no string interpolation)
- [ ] Error handling: `AppError` or `String` (for IPC)
- [ ] No personal data in logs
- [ ] Database migrations included & documented

### Database Reviews

- [ ] Migrations numbered sequentially
- [ ] Migration file is idempotent
- [ ] Foreign keys/constraints present
- [ ] No hardcoded data in migrations

### Documentation/Compliance Reviews

- [ ] README/setup updated (if applicable)
- [ ] No real personal data in examples
- [ ] Security checklist passed (see `SECURITY.md`)
- [ ] GDPR checklist passed (see `.cline/rules/legal.md`)
- [ ] Dependencies checked for license compatibility

### Approve?

- [ ] All checks passed
- [ ] Code quality satisfactory
- [ ] No security/privacy concerns
- [ ] Complies with architecture
- ✅ **APPROVE** or request changes

---

## CI/CD Pipeline

GitHub Actions automatically checks:

- ✅ **Linting:** ESLint
- ✅ **Type Checking:** TypeScript (`tsc`)
- ✅ **Formatting:** Prettier
- ✅ **Tests:** Playwright E2E (smoke suite)
- ✅ **Build:** `npm run build` + `cargo build`

PR merges only if all checks pass + approved.

---

## Questions?

- **Architecture:** See `.cline/rules/architecture.md`
- **Frontend Dev:** See `.cline/rules/vue-frontend.md`
- **Backend Dev:** See `.cline/rules/architecture-backend.md`
- **Setup:** See `INSTALL.md`
- **Security:** See `SECURITY.md`
- **Legal:** See `.cline/rules/legal.md`

---

## Summary

| Aspect         | Format                           | Example                                 |
| -------------- | -------------------------------- | --------------------------------------- |
| **Branch**     | `<type>/<issue>-<description>`   | `feature/123-athlete-promotion`         |
| **Commit**     | `<type>(<scope>): <subject>`     | `feat(athlete): add promotion workflow` |
| **PR Title**   | `<type>(<scope>): <description>` | `feat(athlete): add promotion workflow` |
| **Tests**      | `.stories.ts` + `.e2e.spec.ts`   | ✅ Both required                        |
| **Linting**    | `npm run lint:fix`               | Must pass                               |
| **Type Check** | `npm run type:check`             | Must pass                               |
| **Approvals**  | ≥1 reviewer                      | Before merge                            |

---

**Last Updated:** 2026-10-14  
**Branching Model:** GitHub Flow  
**Commit Convention:** Conventional Commits  
**Language:** English  
**License:** MIT
