# Feature → Task workflow (generic)

Reusable agent/git workflow for GitHub **Feature** issues with ordered **Task** sub-issues.

## Policy (generic)

0. Feature work uses branch **`feature/<issueNumber>-<short-description>`**; Feature id for Task creation comes from the branch.
1. If the Feature has no Task sub-issues yet, **create them first** (skill `create-feature-tasks`).
2. Work Tasks in ascending issue-number order (one at a time).
3. Do not commit alone — stop for human review.
4. After an approved/successful commit, mark that Task done.
5. Start the next Task only when asked.

### Hook vs skill

| Layer                                            | Role                                                                              |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| **Hooks** (`integrations/`, `engine.py` context) | Short, generic _when_: remind to create Tasks if missing; gate commits; mark Done |
| **Skill** `.cline/skills/create-feature-tasks`   | _How_: read Feature, draft User Stories, create Task sub-issues                   |

Cursor `beforeSubmitPrompt` can only continue/deny (no context injection) — it binds the Feature and flags a one-shot inject. The same Task-creation guidance is then injected on Cursor **sessionStart** / **postToolUse**, and on Cline **TaskStart** & **UserPromptSubmit**, plus the always-on rule.

## Layout

| Path                  | Role                                                             |
| --------------------- | ---------------------------------------------------------------- |
| `engine.py`           | Shared logic (Cursor, Cline, Husky)                              |
| `config.json`         | Repo policy (assignee/project defaults; no Feature/Task numbers) |
| `config.example.json` | Template + English `_comments` per field                         |
| `state.json`          | **Runtime** active Feature/Task (gitignored; feature-specific)   |
| `extensions/`         | Future feature-specific adapters                                 |
| `integrations/`       | Thin Cursor / Cline / Husky entrypoints                          |

## Setup

```bash
git switch -c feature/7-app-shell-navigation
python3 .workflow/feature-task/engine.py from-branch
python3 .workflow/feature-task/engine.py next-context
# fallback if needed:
# python3 .workflow/feature-task/engine.py set-feature <feature-issue-number>
```

`ownerRepo` in `config.json` may stay `null` — the engine resolves `owner/name` from `git remote get-url origin`.

Task creation defaults (skill `create-feature-tasks`):

- Parent = Feature (required)
- Type = `issueTypeTask` (Task)
- Assignee = `defaultAssignee` (this repo: `AK2083`)
- Project = `projectTitle` (this repo: `Judosphere Planning`) — needs `gh auth` scopes `read:project` + `project`

Optional: set `doneStatusId` when GitHub planning statuses are available; otherwise Tasks are closed with reason `completed`.

## Agent wiring

- Cursor: `.cline/hooks.json` (`.cursor` → `.cline`) → `integrations/cursor/*`
- Cline: `.clinerules/hooks/*` → `engine.py cline …`
- Git: `.husky/post-commit` → `engine.py mark-done`
