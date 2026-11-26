---
description: Feature branch naming, Task order, quality gate before review (eslint/prettier/typecheck/coverage/cargo), review-before-commit
alwaysApply: true
---

# Feature / Task implementation workflow

## Branch (required for Feature work)

Use git branches named:

`feature/<issueNumber>-<short-description>`

Example: `feature/7-app-shell-navigation`

Hooks and skill `create-feature-tasks` read the **Feature issue id from the branch**. Do not use other branch shapes for Feature implementation.

```bash
git switch -c feature/7-app-shell-navigation
python3 .workflow/feature-task/engine.py from-branch
```

## Project Status timing (mandatory)

| When                                  | What gets **In progress**                                     |
| ------------------------------------- | ------------------------------------------------------------- |
| Tasks are **created** for the Feature | The **Feature** only (`engine.py mark-feature-in-progress`)   |
| User asks to **implement** a Task     | That **Task** only (`engine.py start-task [n]`)               |
| Task commit succeeds                  | That Task → **Done** (hooks); do not auto-start the next Task |

- Creating Tasks must **not** set any Task to In progress.
- Loading context / `next-context` / `from-branch` must **not** set a Task to In progress.
- Wrong: first Task In progress while Feature stays Todo. Right: Feature In progress first; Task In progress only when coding that Task starts.

## Steps

When the user asks to implement a **Feature** that should have **Task** sub-issues (GitHub issue types):

1. Ensure you are on (or create) the correct `feature/<n>-…` branch.
2. **Ensure Tasks exist** for that Feature id. If there are none, create them first with skill **`create-feature-tasks`** — do not start product code yet. Each Task must be a **sub-issue of the Feature**, type **Task**, assignee from config (`defaultAssignee`), and added to config `projectTitle` when set (**JudoSphere Planning** only). **Never** add Tasks to **JudoSphere Roadmap 2027** or any other Roadmap project — Roadmap is Features-only; if a Task lands there, remove it. After creation, set the **Feature** to **In progress**; leave Tasks as Todo.
3. **Inspect Tasks** (sub-issues). Build order = ascending issue number.
4. **Do one Task only** — the first open / not-done Task. When the user asks to implement it, run `start-task` so that Task’s project Status becomes **In progress**. Do not start later Tasks in the same turn.
5. Implement that Task’s acceptance criteria; keep the change focused.
6. **Quality gate (mandatory before review):** run the checks below on the change; fix failures before stopping. Do not stop for review until this gate is green (or the user explicitly waives it). Prefer skill **`run-ui-completion-pipeline`** for the frontend steps.
   - **ESLint:** `npm run lint` (`eslint .`) — always; use `--fix` on touched files only when safe, then re-run full lint
   - **Prettier:** `npx prettier --write` on touched files (or `npm run format` when appropriate)
   - **Typecheck:** `npm run typecheck` (`vue-tsc --build --noEmit`)
   - **Coverage 100%** statements/branches/functions/lines on every source file touched by the Task (Vitest `--coverage` scoped to those modules; example below)
   - **Tauri / Rust:** `cargo test --locked` in `src-tauri/` whenever host code was touched **or** the Task depends on / forwards into the host (default for this repo’s Feature work — run it unless the Task is clearly frontend-only with no host boundary)
7. **Stop for review** — do **not** create a git commit on your own. Summarize the diff and quality-gate results; ask the user to review.
8. Commit **only** after the user explicitly asks. Use **Conventional Commits** with a **short summary only** (no bullet lists) — see rule `commit-messages`. Include `Refs #<taskNumber>` in the commit message.
9. After a successful commit, hooks / Husky `post-commit` mark that Task **Done** (project Status **Done**, then close).
10. Start the **next** open Task only when the user asks (then `start-task` for that next Task).

**Hook vs skill:** hooks enforce _when_ (branch/Feature id, Tasks first, one-at-a-time, no solo commit, Done after commit). Skill `create-feature-tasks` teaches _how_ to draft/create Task issues and to mark the Feature In progress on creation.

Shared engine: `.workflow/feature-task/`  
Runtime state (gitignored): `.workflow/feature-task/state.json`

```bash
python3 .workflow/feature-task/engine.py from-branch
python3 .workflow/feature-task/engine.py mark-feature-in-progress   # after Task creation
python3 .workflow/feature-task/engine.py next-context               # lists next Task; does not start it
python3 .workflow/feature-task/engine.py start-task                 # when implementation begins

npm run lint
npx prettier --write <touched-files>
npm run typecheck

# Coverage gate for touched module(s) — adjust the path to the changed code:
npx vitest run src/path/to/module --coverage \
  --coverage.include='src/path/to/module/**' \
  --coverage.exclude='' \
  --coverage.thresholds.statements=100 \
  --coverage.thresholds.branches=100 \
  --coverage.thresholds.functions=100 \
  --coverage.thresholds.lines=100

# Tauri host unit tests (default for Feature Tasks with host boundary):
(cd src-tauri && cargo test --locked)
```
