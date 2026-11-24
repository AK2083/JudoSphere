# Feature → Task workflow (generic)

Reusable agent/git workflow for GitHub **Feature** issues with ordered **Task** sub-issues.

## Policy (generic)

0. Feature work uses branch **`feature/<issueNumber>-<short-description>`**; Feature id for Task creation comes from the branch.
1. If the Feature has no Task sub-issues yet, **create them first** (skill `create-feature-tasks`). Creating Tasks sets the **Feature** project **Status → In progress**; new Tasks stay Todo.
2. Work Tasks in ascending issue-number order (one at a time). **Only when implementation of a Task begins**, set that Task **Status → In progress** (`engine.py start-task`). Context / `from-branch` must not flip Task status.
3. Before review, touched modules must have **100%** unit coverage (statements/branches/functions/lines).
4. Do not commit alone — stop for human review.
5. After an approved/successful commit, mark that Task done (project **Status → Done**, then close).
6. Start the next Task only when asked (then `start-task` again).

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
# after creating Tasks:
# python3 .workflow/feature-task/engine.py mark-feature-in-progress
# when starting implementation of the next Task:
# python3 .workflow/feature-task/engine.py start-task
# fallback if needed:
# python3 .workflow/feature-task/engine.py set-feature <feature-issue-number>
```

`ownerRepo` in `config.json` may stay `null` — the engine resolves `owner/name` from `git remote get-url origin`.

Task creation defaults (skill `create-feature-tasks`):

- Parent = Feature (required)
- Type = `issueTypeTask` (Task)
- Assignee = `defaultAssignee` (this repo: `AK2083`)
- Project = `projectTitle` (this repo: `JudoSphere Planning`) — needs `gh auth` scopes `read:project` + `project`. Do **not** add Tasks to `JudoSphere Roadmap 2027` (Roadmap = Features only).
- On Task **creation**: Feature project Status → `inProgressStatusName` (`In progress`); Tasks stay Todo
- On Task **start** (`start-task`): that Task project Status → `inProgressStatusName` (`In progress`)
- On Task done: project Status → `doneStatusName` (`Done`), then close unless configured otherwise

Optional: set `inProgressStatusId` / `doneStatusId` when GitHub issue planning statuses are available.

## Agent wiring

- Cursor: `.cline/hooks.json` (`.cursor` → `.cline`) → `integrations/cursor/*`
- Cline: `.clinerules/hooks/*` → `engine.py cline …`
- Git: `.husky/post-commit` → `engine.py mark-done`
