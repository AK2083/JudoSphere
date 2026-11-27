---
name: create-feature-tasks
description: >-
  Creates ordered GitHub Task sub-issues for a Feature issue (user stories +
  acceptance criteria) before implementation, then writes the top-down Feature
  briefing in the same turn. Use when a Feature has no Tasks yet, when the
  Feature/Task workflow hook says to create tasks first, or when the user asks
  to break a Feature into Tasks.
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

- **Preferred:** current git branch `feature/<issueNumber>-<short-description>` (Feature id parsed from the branch)
- Feature issue number or URL (fallback if not on a Feature branch yet)
- Feature body (user story, acceptance criteria, roadmap / dependencies)
- Repo workflow config: `.workflow/feature-task/config.json`

### Branch (required for Feature work)

Before creating Tasks / implementing, ensure the branch matches config `branchPattern` (default):

`feature/<issueNumber>-<short-description>`

Example: `feature/7-app-shell-navigation`

```bash
git switch -c feature/7-app-shell-navigation
python3 .workflow/feature-task/engine.py from-branch
```

Hooks and this skill use that number as the Feature parent id.

## Required GitHub fields (every Task)

Read defaults from `.workflow/feature-task/config.json` (see `config.example.json` for field comments):

| Field        | Requirement                                                                                         |
| ------------ | --------------------------------------------------------------------------------------------------- |
| **Parent**   | Must be the Feature issue (`parentIssueId` / sub-issue of the Feature)                              |
| **Type**     | `issueTypeTask` from config (default **Task**)                                                      |
| **Assignee** | `defaultAssignee` from config, or authenticated `gh api user` login if null                         |
| **Project**  | If `projectTitle` is set (this repo: **JudoSphere Planning**), add the issue to **that board only** |
| **Title**    | `Task: …`                                                                                           |
| **Body**     | Short **User Story** + **Acceptance Criteria** checklist                                            |

Also copy milestone/labels from the Feature when present.

### Project scope note

**Never** add Tasks to **JudoSphere Roadmap 2027** (or any other Roadmap project). Roadmap boards are for Features / planning items only. Tasks belong only on `projectTitle` (**JudoSphere Planning**).

If a Task appears on a Roadmap project (GitHub often auto-adds sub-issues when the parent Feature is on Roadmap), remove that project item immediately after creation:

```bash
# deleteProjectV2Item requires both projectId and itemId
gh api graphql -f query='mutation($projectId:ID!,$itemId:ID!){deleteProjectV2Item(input:{projectId:$projectId,itemId:$itemId}){deletedItemId}}' \
  -F projectId='PVT_…' -F itemId='PVTI_…'
```

Adding to Projects V2 needs `gh` scopes `read:project` and `project`. If `gh project …` fails with insufficient scopes, tell the user to run:

```bash
gh auth refresh -s read:project,project
```

Then retry adding the created Tasks to **JudoSphere Planning** only. Do not skip parent/type/assignee while waiting on project scopes.

## Status timing (mandatory)

| Moment                       | Project Status                                                            |
| ---------------------------- | ------------------------------------------------------------------------- |
| **After Tasks are created**  | Set the **Feature** to **In progress**. Leave every new **Task** as Todo. |
| **When implementing a Task** | Only then set that **Task** to **In progress** (`engine.py start-task`).  |
| **This skill**               | Must **not** call `start-task` / must **not** mark any Task In progress.  |

Wrong: first Task → In progress while Feature stays Todo.  
Right: Feature → In progress on Task creation; Task → In progress only when coding that Task starts.

## Procedure

1. Read config: `.workflow/feature-task/config.json`.
2. Resolve Feature id from the current branch (`engine.py from-branch`). If missing, create/switch to `feature/<n>-…` first, then continue.
3. Read the Feature issue (`gh issue view <n> --json title,body,issueType,url,milestone,labels,assignees`).
4. Confirm type is Feature (or treat as Feature if the user said so).
5. List existing sub-issues. If Task children already cover the work, **stop** and report them — do not duplicate. Still fix missing assignee/project/parent if the user asked to repair metadata.
6. Derive an ordered Task list from the Feature:
   - Prefer an explicit numbered roadmap in the Feature body
   - Else split acceptance criteria into small, implementable Tasks
7. Create each Task via GraphQL `createIssue` (or equivalent) with **all** required fields above:
   - `issueTypeId` for Task
   - `parentIssueId` = Feature node id (from the branch)
   - `assigneeIds` = configured default assignee
   - Then `gh project item-add` (or GraphQL `addProjectV2ItemById`) using `projectTitle` only — never Roadmap
   - If the Task was auto-added to a Roadmap project, delete that project item (`projectId` + `itemId`)
8. Order = ascending issue number = build order (create in intended sequence).
9. Verify each created issue: parent = Feature, type = Task, assignee set, on `projectTitle` only (not on any Roadmap board). New Tasks must remain **Todo** (not In progress).
10. Set the **Feature** to In progress and bind workflow state **without** starting a Task:

```bash
python3 .workflow/feature-task/engine.py mark-feature-in-progress
python3 .workflow/feature-task/engine.py from-branch
```

Do **not** run `start-task` or mark any Task In progress here. Prefer not to rely on `next-context` for Status flips — context listing must not start a Task.

11. **Same turn, mandatory:** follow skill `brief-active-task`. Write the top-down Feature briefing in the user-visible reply (program → Feature → ordered Tasks → repo starting point). Use facts from `mark-feature-in-progress` / `orient-task` plus a quick repo look. Do **not** defer this briefing until implementation starts.
12. Tell the user which Tasks were created, that the **Feature** is In progress, that the briefing above is the orientation for this Feature, and that implementation of the **first open** Task (via `start-task`) starts only after they ask.

## Guardrails

- Feature work runs on `feature/<issueNumber>-<slug>` so the Feature id is unambiguous
- Tasks **belong to the Feature** (parent/sub-issue) — never create orphan Tasks for this workflow
- Generic drafting only — no product-domain hardcoding in titles beyond the Feature text and config defaults
- One Feature at a time
- Do not start coding the Feature until Tasks exist (unless the user explicitly waives that)
- The knowledge briefing is part of Task **creation**, not of `start-task`
- Do not mark Tasks In progress or Done here — In progress happens on `start-task` when implementation begins; Done happens after commit via the workflow hooks
