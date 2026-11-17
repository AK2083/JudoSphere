---
name: create-feature-tasks
description: >-
  Creates ordered GitHub Task sub-issues for a Feature issue (user stories +
  acceptance criteria) before implementation. Use when a Feature has no Tasks
  yet, when the Feature/Task workflow hook says to create tasks first, or when
  the user asks to break a Feature into Tasks.
modeSlugs:
  - architect
  - code
---

# Skill: Create Feature Tasks

Use this skill to turn a GitHub **Feature** into ordered **Task** sub-issues.

## Hook vs skill

| Layer                                | Responsibility                                                                                                                  |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| **Hooks** (`.workflow/feature-task`) | Remind/enforce _when_: Tasks must exist before implementation; one Task at a time; review before commit; mark Done after commit |
| **This skill**                       | Teach _how_: draft and create good Task issues from the Feature                                                                 |

Do not put long drafting instructions into hooks. Hooks stay short and generic; this skill owns the creation procedure.

## When to run

- User asks to implement a Feature that has **no** Task sub-issues
- Workflow context says: create Tasks first (`create-feature-tasks`)
- User explicitly asks to create / break down Tasks for a Feature

## Inputs

- Feature issue number or URL
- Feature body (user story, acceptance criteria, roadmap / dependencies)
- Repo workflow config: `.workflow/feature-task/config.json`

## Required GitHub fields (every Task)

Read defaults from `.workflow/feature-task/config.json` (see `config.example.json` for field comments):

| Field        | Requirement                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------------ |
| **Parent**   | Must be the Feature issue (`parentIssueId` / sub-issue of the Feature)                                 |
| **Type**     | `issueTypeTask` from config (default **Task**)                                                         |
| **Assignee** | `defaultAssignee` from config, or authenticated `gh api user` login if null                            |
| **Project**  | If `projectTitle` is set (this repo: **Judosphere Planning**), add the issue to that Projects V2 board |
| **Title**    | `Task: …`                                                                                              |
| **Body**     | Short **User Story** + **Acceptance Criteria** checklist                                               |

Also copy milestone/labels from the Feature when present.

### Project scope note

Adding to Projects V2 needs `gh` scopes `read:project` and `project`. If `gh project …` fails with insufficient scopes, tell the user to run:

```bash
gh auth refresh -s read:project,project
```

Then retry adding the created Tasks to the project. Do not skip parent/type/assignee while waiting on project scopes.

## Procedure

1. Read config: `.workflow/feature-task/config.json`.
2. Read the Feature issue (`gh issue view <n> --json title,body,issueType,url,milestone,labels,assignees`).
3. Confirm type is Feature (or treat as Feature if the user said so).
4. List existing sub-issues. If Task children already cover the work, **stop** and report them — do not duplicate. Still fix missing assignee/project/parent if the user asked to repair metadata.
5. Derive an ordered Task list from the Feature:
   - Prefer an explicit numbered roadmap in the Feature body
   - Else split acceptance criteria into small, implementable Tasks
6. Create each Task via GraphQL `createIssue` (or equivalent) with **all** required fields above:
   - `issueTypeId` for Task
   - `parentIssueId` = Feature node id
   - `assigneeIds` = configured default assignee
   - Then `gh project item-add` (or GraphQL `addProjectV2ItemById`) using `projectTitle`
7. Order = ascending issue number = build order (create in intended sequence).
8. Verify each created issue: parent = Feature, type = Task, assignee set, project membership when configured.
9. Bind workflow state:

```bash
python3 .workflow/feature-task/engine.py set-feature <feature-number>
python3 .workflow/feature-task/engine.py next-context
```

10. Tell the user which Tasks were created and that implementation starts with the **first open** Task only after they ask.

## Guardrails

- Tasks **belong to the Feature** (parent/sub-issue) — never create orphan Tasks for this workflow
- Generic drafting only — no product-domain hardcoding in titles beyond the Feature text and config defaults
- One Feature at a time
- Do not start coding the Feature until Tasks exist (unless the user explicitly waives that)
- Do not mark Tasks Done here — that happens after commit via the workflow hooks
