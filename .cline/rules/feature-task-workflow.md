---
description: Generic Feature → Task order, create Tasks first, review-before-commit, mark Done after commit
alwaysApply: true
---

# Feature / Task implementation workflow

When the user asks to implement a **Feature** that should have **Task** sub-issues (GitHub issue types):

1. **Ensure Tasks exist** for that Feature. If there are none, create them first with skill **`create-feature-tasks`** — do not start product code yet. Each Task must be a **sub-issue of the Feature**, type **Task**, assignee from config (`defaultAssignee`), and added to config `projectTitle` when set.
2. **Inspect Tasks** (sub-issues). Build order = ascending issue number.
3. **Do one Task only** — the first open / not-done Task. Do not start later Tasks in the same turn.
4. Implement that Task’s acceptance criteria; keep the change focused.
5. **Stop for review** — do **not** create a git commit on your own. Summarize the diff and ask the user to review.
6. Commit **only** after the user explicitly asks. Include `Refs #<taskNumber>` in the commit message.
7. After a successful commit, hooks / Husky `post-commit` mark that Task **Done**.
8. Start the **next** open Task only when the user asks.

**Hook vs skill:** hooks enforce _when_ (Tasks first, one-at-a-time, no solo commit, Done after commit). Skill `create-feature-tasks` teaches _how_ to draft/create Task issues.

Shared engine: `.workflow/feature-task/`  
Runtime state (gitignored): `.workflow/feature-task/state.json`

```bash
python3 .workflow/feature-task/engine.py set-feature <feature-issue-number>
python3 .workflow/feature-task/engine.py next-context
```
