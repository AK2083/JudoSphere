---
description: Feature branch naming, Task order, create Tasks first, review-before-commit, mark Done after commit
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

## Steps

When the user asks to implement a **Feature** that should have **Task** sub-issues (GitHub issue types):

1. Ensure you are on (or create) the correct `feature/<n>-…` branch.
2. **Ensure Tasks exist** for that Feature id. If there are none, create them first with skill **`create-feature-tasks`** — do not start product code yet. Each Task must be a **sub-issue of the Feature**, type **Task**, assignee from config (`defaultAssignee`), and added to config `projectTitle` when set.
3. **Inspect Tasks** (sub-issues). Build order = ascending issue number.
4. **Do one Task only** — the first open / not-done Task. Do not start later Tasks in the same turn.
5. Implement that Task’s acceptance criteria; keep the change focused.
6. **Stop for review** — do **not** create a git commit on your own. Summarize the diff and ask the user to review.
7. Commit **only** after the user explicitly asks. Include `Refs #<taskNumber>` in the commit message.
8. After a successful commit, hooks / Husky `post-commit` mark that Task **Done**.
9. Start the **next** open Task only when the user asks.

**Hook vs skill:** hooks enforce _when_ (branch/Feature id, Tasks first, one-at-a-time, no solo commit, Done after commit). Skill `create-feature-tasks` teaches _how_ to draft/create Task issues.

Shared engine: `.workflow/feature-task/`  
Runtime state (gitignored): `.workflow/feature-task/state.json`

```bash
python3 .workflow/feature-task/engine.py from-branch
python3 .workflow/feature-task/engine.py next-context
```
