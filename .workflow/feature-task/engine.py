#!/usr/bin/env python3
"""Generic Feature → Task workflow engine for agent hooks and git hooks.

Product-/feature-specific “where am I?” state lives in a gitignored state file
(see config.stateFile). Hooks stay policy-only and reusable across repos.
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

WORKFLOW_ROOT = Path(__file__).resolve().parent
REPO_ROOT = WORKFLOW_ROOT.parents[1]
CONFIG_PATH = WORKFLOW_ROOT / "config.json"

WORKFLOW_CONTEXT = """## Feature / Task workflow (mandatory)

Work Features on a git branch named **`feature/<issueNumber>-<short-description>`**
(example: `feature/7-app-shell-navigation`). The Feature issue id for Task creation and
implementation comes **from that branch** (hooks/skills parse it). Do not invent a different
branch shape for Feature work.

When implementing that Feature:

0. **Ensure Tasks exist** for the Feature id from the branch (GitHub Task sub-issues in build order). If none exist yet, **create them first** before writing product code — follow the project skill `create-feature-tasks` (hook = when/why; skill = how).
1. Load the Feature and its Task sub-issues (order = ascending issue number).
2. Work on **exactly one** Task at a time: the first open / not-done Task. Starting it sets project status to **In progress**.
3. Implement only that Task’s acceptance criteria. Do not start the next Task in the same turn.
4. **Do not create a git commit on your own.** Stop and ask the user to review the diff.
5. Only after the user has reviewed and explicitly asks to commit, create the commit (include `Refs #<task>` in the message).
6. After that commit succeeds, the Task is marked **Done** automatically (hooks / post-commit). Then continue with the next open Task only when the user asks.

Runtime state (active Feature/Task) is local and feature-specific — not part of the shared hook policy.
"""


def read_json(path: Path) -> dict[str, Any]:
    if not path.is_file():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}


def write_json(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def load_config() -> dict[str, Any]:
    cfg = {
        "ownerRepo": None,
        "issueTypeFeature": "Feature",
        "issueTypeTask": "Task",
        "taskTitlePrefix": "Task:",
        "defaultAssignee": None,
        "projectTitle": None,
        "projectStatusFieldName": "Status",
        "inProgressStatusName": "In progress",
        "doneStatusName": "Done",
        "branchPattern": r"^feature/(?P<number>\d+)-(?P<slug>[a-z0-9]+(?:-[a-z0-9]+)*)$",
        "inProgressStatusId": None,
        "doneStatusId": None,
        "closeTaskOnDone": True,
        "requireCommitApproval": True,
        "stateFile": ".workflow/feature-task/state.json",
        "logFile": ".workflow/feature-task/workflow.log",
    }
    raw = read_json(CONFIG_PATH)
    # Ignore documentation-only keys from config.example.json (e.g. "_comments").
    cleaned = {
        key: value
        for key, value in raw.items()
        if not str(key).startswith("_") and not str(key).startswith("//")
    }
    cfg.update(cleaned)
    return cfg


def state_path(cfg: dict[str, Any] | None = None) -> Path:
    cfg = cfg or load_config()
    raw = str(cfg.get("stateFile") or ".workflow/feature-task/state.json")
    path = Path(raw)
    return path if path.is_absolute() else REPO_ROOT / path


def log_path(cfg: dict[str, Any] | None = None) -> Path:
    cfg = cfg or load_config()
    raw = str(cfg.get("logFile") or ".workflow/feature-task/workflow.log")
    path = Path(raw)
    return path if path.is_absolute() else REPO_ROOT / path


def log(message: str) -> None:
    try:
        path = log_path()
        path.parent.mkdir(parents=True, exist_ok=True)
        stamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        with path.open("a", encoding="utf-8") as handle:
            handle.write(f"{stamp} {message}\n")
    except OSError:
        pass


def load_state() -> dict[str, Any]:
    return read_json(state_path())


def _coerce_issue_number(value: Any) -> int | None:
    if isinstance(value, int):
        return value
    if isinstance(value, str) and value.isdigit():
        return int(value)
    return None


def save_state(data: dict[str, Any]) -> None:
    payload = dict(data)
    payload["updatedAt"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    write_json(state_path(), payload)


def emit(obj: dict[str, Any]) -> None:
    sys.stdout.write(json.dumps(obj))
    sys.stdout.flush()


def read_stdin_json() -> dict[str, Any]:
    raw = sys.stdin.read()
    if not raw.strip():
        return {}
    try:
        data = json.loads(raw)
        return data if isinstance(data, dict) else {}
    except json.JSONDecodeError:
        return {}


def run_git(args: list[str], timeout: int = 30) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", *args],
        cwd=str(REPO_ROOT),
        text=True,
        capture_output=True,
        timeout=timeout,
        check=False,
    )


def run_gh(args: list[str], timeout: int = 30) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["gh", *args],
        cwd=str(REPO_ROOT),
        text=True,
        capture_output=True,
        timeout=timeout,
        check=False,
    )


def parse_owner_repo_from_remote(url: str) -> str | None:
    url = url.strip()
    if not url:
        return None
    if url.startswith("git@"):
        # git@host:owner/repo.git
        match = re.match(r"git@[^:]+:([^/]+)/([^/]+?)(?:\.git)?$", url)
        if match:
            return f"{match.group(1)}/{match.group(2)}"
    parsed = urlparse(url)
    if parsed.netloc and parsed.path:
        parts = [p for p in parsed.path.split("/") if p]
        if len(parts) >= 2:
            owner, name = parts[0], parts[1]
            if name.endswith(".git"):
                name = name[:-4]
            return f"{owner}/{name}"
    return None


def owner_repo(cfg: dict[str, Any] | None = None) -> str:
    cfg = cfg or load_config()
    env = os.environ.get("FEATURE_TASK_OWNER_REPO") or os.environ.get("JUDOSPHERE_OWNER_REPO")
    if env:
        return env
    configured = cfg.get("ownerRepo")
    if configured:
        return str(configured)
    remote = run_git(["remote", "get-url", "origin"]).stdout.strip()
    detected = parse_owner_repo_from_remote(remote)
    if detected:
        return detected
    raise RuntimeError(
        "Cannot resolve owner/repo. Set config.ownerRepo, FEATURE_TASK_OWNER_REPO, "
        "or configure git remote origin."
    )


def is_git_commit_command(command: str) -> bool:
    if not command:
        return False
    patterns = (
        r"(^|[;&|]\s*|\n\s*)git\s+commit\b",
        r"(^|[;&|]\s*|\n\s*)git\s+-C\s+\S+\s+commit\b",
    )
    return any(re.search(p, command) for p in patterns)


def extract_issue_numbers(text: str) -> list[int]:
    found = re.findall(r"(?:#|Refs\s+#|closes\s+#|fixes\s+#)(\d+)\b", text, flags=re.I)
    nums: list[int] = []
    for item in found:
        try:
            nums.append(int(item))
        except ValueError:
            continue
    return nums


def is_task_issue(node: dict[str, Any], cfg: dict[str, Any]) -> bool:
    type_name = str((node.get("issueType") or {}).get("name") or "")
    title = str(node.get("title") or "")
    wanted = str(cfg.get("issueTypeTask") or "Task")
    prefix = str(cfg.get("taskTitlePrefix") or "Task:")
    return type_name == wanted or title.startswith(prefix)


def task_is_open(task: dict[str, Any]) -> bool:
    state = str(task.get("state") or "").upper()
    status_name = str(((task.get("status") or {}) or {}).get("name") or "").lower()
    if status_name in {"done", "completed", "closed"}:
        return False
    return state == "OPEN"


def fetch_feature_tasks(feature_number: int) -> list[dict[str, Any]]:
    cfg = load_config()
    query = """
    query($owner:String!, $name:String!, $number:Int!) {
      repository(owner:$owner, name:$name) {
        issue(number:$number) {
          number
          title
          issueType { name }
          subIssues(first:50) {
            nodes {
              number
              title
              state
              issueType { name }
              status { name }
              url
            }
          }
        }
      }
    }
    """
    owner, name = owner_repo(cfg).split("/", 1)
    payload = {
        "query": query,
        "variables": {"owner": owner, "name": name, "number": feature_number},
    }
    proc = subprocess.run(
        ["gh", "api", "graphql", "--input", "-"],
        cwd=str(REPO_ROOT),
        input=json.dumps(payload),
        text=True,
        capture_output=True,
        timeout=45,
        check=False,
    )
    if proc.returncode != 0:
        log(f"fetch_feature_tasks failed: {proc.stderr.strip()}")
        return []
    try:
        data = json.loads(proc.stdout)
    except json.JSONDecodeError:
        return []
    issue = (((data or {}).get("data") or {}).get("repository") or {}).get("issue") or {}
    nodes = ((issue.get("subIssues") or {}).get("nodes")) or []
    tasks = [n for n in nodes if is_task_issue(n, cfg)]
    tasks.sort(key=lambda n: int(n.get("number") or 0))
    return tasks


def next_open_task(feature_number: int) -> dict[str, Any] | None:
    for task in fetch_feature_tasks(feature_number):
        if task_is_open(task):
            return task
    return None


def resolve_active_task_number(commit_message: str | None = None) -> int | None:
    state = load_state()
    active = state.get("activeTaskIssue")
    if isinstance(active, int):
        return active
    if isinstance(active, str) and active.isdigit():
        return int(active)

    if commit_message:
        refs = extract_issue_numbers(commit_message)
        if refs:
            return refs[0]

    feature = state.get("featureIssue")
    if isinstance(feature, int) or (isinstance(feature, str) and str(feature).isdigit()):
        task = next_open_task(int(feature))
        if task:
            return int(task["number"])
    return None


def set_feature_context(feature_number: int) -> dict[str, Any]:
    """Bind runtime state to a Feature. Feature-specific; not required for hook install."""
    existing = load_state()
    previous_active = _coerce_issue_number(existing.get("activeTaskIssue"))

    task = next_open_task(feature_number)
    state: dict[str, Any] = {
        "featureIssue": feature_number,
        "allowCommit": bool(existing.get("allowCommit")),
    }
    if task:
        state.update(activate_task(task, previous_active=previous_active))
    else:
        state["activeTaskIssue"] = None
        state["activeTaskTitle"] = None
        state["activeTaskUrl"] = None
    save_state(state)
    return state


def build_next_task_context(feature_number: int | None = None) -> str:
    branch = current_branch()
    # Do not bind via set_feature_context here — activation (incl. In progress) happens below once.
    feature = resolve_feature_number(feature_number, bind=False)
    lines = [WORKFLOW_CONTEXT.strip(), ""]
    lines.append(f"Current branch: `{branch or '(unknown)'}`")
    if branch and parse_feature_from_branch(branch) is None and not branch.startswith(
        ("main", "master", "develop", "release/")
    ):
        lines.append(
            "Branch does **not** match `feature/<issueNumber>-<short-description>`. "
            "For Feature work, create/switch to e.g. `feature/7-app-shell-navigation` "
            "so hooks/skills can read the Feature id."
        )
    if not feature:
        lines.append(
            "No Feature id resolved. Use branch `feature/<issueNumber>-<slug>`, or "
            "`python3 .workflow/feature-task/engine.py set-feature <number>`, or mention "
            "`Feature #<n>` / `feature/<n>-…` in the prompt."
        )
        return "\n".join(lines)

    feature = int(feature)
    lines.append(f"Feature id source: branch/state → **#{feature}**")
    tasks = fetch_feature_tasks(feature)
    open_tasks = [t for t in tasks if task_is_open(t)]
    lines.append(f"Active Feature: #{feature}")
    if not tasks:
        lines.append(
            "No Task sub-issues found for this Feature (or `gh` unavailable). "
            "**Do not start product implementation yet.** "
            "Create ordered Task sub-issues first using skill `create-feature-tasks`, "
            "then re-run / continue with the first open Task."
        )
        return "\n".join(lines)

    lines.append("Task roadmap (ascending number = build order):")
    for task in tasks:
        marker = "OPEN" if task_is_open(task) else "DONE"
        lines.append(f"- #{task.get('number')} [{marker}] {task.get('title')}")

    existing = load_state()
    previous_active = _coerce_issue_number(existing.get("activeTaskIssue"))

    if open_tasks:
        nxt = open_tasks[0]
        nxt_number = int(nxt["number"])
        activated = activate_task(nxt, previous_active=previous_active)
        lines.append("")
        lines.append(
            f"**Implement next: #{nxt_number} — {nxt.get('title')}** "
            f"({nxt.get('url')}). Stop after this Task for user review; do not commit alone."
        )
        if previous_active != nxt_number:
            lines.append(
                f"Project status for #{nxt_number} set to **{cfg_status_label('inProgress')}**."
            )
        save_state(
            {
                "featureIssue": feature,
                "allowCommit": bool(existing.get("allowCommit")),
                **activated,
            }
        )
    else:
        lines.append("")
        lines.append("All Tasks for this Feature are done.")
        save_state(
            {
                "featureIssue": feature,
                "activeTaskIssue": None,
                "activeTaskTitle": None,
                "activeTaskUrl": None,
                "allowCommit": False,
            }
        )
    return "\n".join(lines)


def current_branch() -> str:
    proc = run_git(["rev-parse", "--abbrev-ref", "HEAD"])
    if proc.returncode != 0:
        return ""
    return proc.stdout.strip()


def branch_pattern(cfg: dict[str, Any] | None = None) -> str:
    cfg = cfg or load_config()
    return str(
        cfg.get("branchPattern")
        or r"^feature/(?P<number>\d+)-(?P<slug>[a-z0-9]+(?:-[a-z0-9]+)*)$"
    )


def parse_feature_from_branch(branch: str | None = None, cfg: dict[str, Any] | None = None) -> int | None:
    """Extract Feature issue number from `feature/<number>-<slug>` branches."""
    name = (branch if branch is not None else current_branch()).strip()
    if not name or name == "HEAD":
        return None
    # Drop remote prefix if present (e.g. origin/feature/7-foo)
    if name.count("/") >= 2 and not name.startswith("feature/"):
        parts = name.split("/", 1)
        name = parts[1]
    match = re.match(branch_pattern(cfg), name)
    if not match:
        return None
    try:
        return int(match.group("number"))
    except (IndexError, ValueError):
        return None


def detect_feature_from_text(text: str) -> int | None:
    patterns = [
        r"Feature:\s*.*?#(\d+)",
        r"\bfeature\s+#(\d+)\b",
        r"github\.com/[^/\s]+/[^/\s]+/issues/(\d+)",
        r"\bfeature/(\d+)-[a-z0-9-]+\b",
    ]
    for pat in patterns:
        match = re.search(pat, text, flags=re.I)
        if match:
            return int(match.group(1))
    return None


def resolve_feature_number(
    explicit: int | None = None,
    text: str | None = None,
    *,
    bind: bool = False,
) -> int | None:
    """Resolve Feature id: explicit → branch → prompt/text → runtime state."""
    if explicit is not None:
        feature = int(explicit)
    else:
        feature = parse_feature_from_branch()
        if feature is None and text:
            feature = detect_feature_from_text(text)
        if feature is None:
            state = load_state()
            raw = state.get("featureIssue")
            if isinstance(raw, int):
                feature = raw
            elif isinstance(raw, str) and raw.isdigit():
                feature = int(raw)
    if feature is not None and bind:
        set_feature_context(feature)
    return feature


def extract_new_branch_name(command: str) -> str | None:
    """Return branch name from `git checkout -b` / `git switch -c` commands."""
    patterns = [
        r"\bgit\s+checkout\s+(?:-[^\s]*b[^\s]*\s+|-[^\s]*\s+)*-b\s+(\S+)",
        r"\bgit\s+switch\s+(?:-[^\s]*c[^\s]*\s+|-[^\s]*\s+)*-c\s+(\S+)",
        r"\bgit\s+branch\s+(\S+)",
    ]
    for pat in patterns:
        match = re.search(pat, command)
        if match:
            name = match.group(1).strip().strip("'\"")
            # Ignore flags mistaken as names
            if name.startswith("-"):
                continue
            return name
    return None


def is_valid_feature_branch(name: str, cfg: dict[str, Any] | None = None) -> bool:
    return parse_feature_from_branch(name, cfg) is not None


def gh_graphql(query: str, variables: dict[str, Any] | None = None, timeout: int = 45) -> dict[str, Any]:
    payload = {"query": query, "variables": variables or {}}
    proc = subprocess.run(
        ["gh", "api", "graphql", "--input", "-"],
        cwd=str(REPO_ROOT),
        input=json.dumps(payload),
        text=True,
        capture_output=True,
        timeout=timeout,
        check=False,
    )
    if proc.returncode != 0:
        log(f"gh graphql failed: {proc.stderr.strip() or proc.stdout.strip()}")
        return {"errors": [{"message": proc.stderr.strip() or proc.stdout.strip() or "graphql failed"}]}
    try:
        return json.loads(proc.stdout)
    except json.JSONDecodeError:
        return {"errors": [{"message": "invalid graphql json"}]}


def fetch_issue_node_id(task_number: int, cfg: dict[str, Any] | None = None) -> str | None:
    cfg = cfg or load_config()
    try:
        owner, name = owner_repo(cfg).split("/", 1)
    except RuntimeError:
        return None
    data = gh_graphql(
        """
        query($owner:String!, $name:String!, $number:Int!) {
          repository(owner:$owner, name:$name) {
            issue(number:$number) { id }
          }
        }
        """,
        {"owner": owner, "name": name, "number": int(task_number)},
    )
    try:
        return data["data"]["repository"]["issue"]["id"]
    except (KeyError, TypeError):
        return None


def resolve_project_v2(cfg: dict[str, Any] | None = None) -> dict[str, Any] | None:
    """Resolve configured Projects V2 board by title (user + repository scopes)."""
    cfg = cfg or load_config()
    title = str(cfg.get("projectTitle") or "").strip()
    if not title:
        return None
    try:
        owner, name = owner_repo(cfg).split("/", 1)
    except RuntimeError as exc:
        log(str(exc))
        return None

    data = gh_graphql(
        """
        query($owner:String!, $name:String!, $login:String!) {
          repository(owner:$owner, name:$name) {
            projectsV2(first:20) { nodes { id title number } }
          }
          user(login:$login) {
            projectsV2(first:20) { nodes { id title number } }
          }
        }
        """,
        {"owner": owner, "name": name, "login": owner},
    )
    nodes: list[dict[str, Any]] = []
    try:
        nodes.extend((((data.get("data") or {}).get("repository") or {}).get("projectsV2") or {}).get("nodes") or [])
    except AttributeError:
        pass
    try:
        nodes.extend((((data.get("data") or {}).get("user") or {}).get("projectsV2") or {}).get("nodes") or [])
    except AttributeError:
        pass

    wanted = title.casefold()
    for node in nodes:
        if str(node.get("title") or "").casefold() == wanted:
            return node
    log(f"project not found for title={title!r}")
    return None


def resolve_project_status_field(
    project_id: str, cfg: dict[str, Any] | None = None
) -> dict[str, Any] | None:
    cfg = cfg or load_config()
    field_name = str(cfg.get("projectStatusFieldName") or "Status").strip()
    data = gh_graphql(
        """
        query($id:ID!) {
          node(id:$id) {
            ... on ProjectV2 {
              fields(first:40) {
                nodes {
                  ... on ProjectV2SingleSelectField {
                    id
                    name
                    options { id name }
                  }
                }
              }
            }
          }
        }
        """,
        {"id": project_id},
    )
    try:
        fields = data["data"]["node"]["fields"]["nodes"]
    except (KeyError, TypeError):
        return None
    wanted = field_name.casefold()
    for field in fields:
        if not field or "options" not in field:
            continue
        if str(field.get("name") or "").casefold() == wanted:
            return field
    log(f"project status field not found: {field_name!r}")
    return None


def project_status_option_id(field: dict[str, Any], option_name: str) -> str | None:
    wanted = option_name.casefold()
    for option in field.get("options") or []:
        if str(option.get("name") or "").casefold() == wanted:
            return str(option.get("id"))
    return None


def ensure_project_item(issue_id: str, project_id: str) -> str | None:
    data = gh_graphql(
        """
        query($id:ID!) {
          node(id:$id) {
            ... on Issue {
              projectItems(first:20) {
                nodes { id project { id } }
              }
            }
          }
        }
        """,
        {"id": issue_id},
    )
    try:
        items = data["data"]["node"]["projectItems"]["nodes"]
    except (KeyError, TypeError):
        items = []
    for item in items or []:
        if ((item.get("project") or {}).get("id")) == project_id:
            return str(item.get("id"))

    added = gh_graphql(
        """
        mutation($project:ID!, $content:ID!) {
          addProjectV2ItemById(input:{projectId:$project, contentId:$content}) {
            item { id }
          }
        }
        """,
        {"project": project_id, "content": issue_id},
    )
    try:
        return added["data"]["addProjectV2ItemById"]["item"]["id"]
    except (KeyError, TypeError):
        log(f"failed to add issue to project: {added}")
        return None


def set_project_item_status(issue_number: int, status_name: str, cfg: dict[str, Any] | None = None) -> dict[str, Any]:
    """Set Projects V2 Status option for an issue (e.g. In progress / Done)."""
    cfg = cfg or load_config()
    result: dict[str, Any] = {"task": issue_number, "projectStatus": status_name, "ok": False}
    if not cfg.get("projectTitle") or not status_name:
        result["skipped"] = "project-status-unconfigured"
        return result

    project = resolve_project_v2(cfg)
    if not project:
        result["error"] = "project-not-found"
        return result
    field = resolve_project_status_field(str(project["id"]), cfg)
    if not field:
        result["error"] = "status-field-not-found"
        return result
    option_id = project_status_option_id(field, status_name)
    if not option_id:
        result["error"] = f"status-option-not-found:{status_name}"
        return result
    issue_id = fetch_issue_node_id(issue_number, cfg)
    if not issue_id:
        result["error"] = "issue-not-found"
        return result
    item_id = ensure_project_item(issue_id, str(project["id"]))
    if not item_id:
        result["error"] = "project-item-missing"
        return result

    updated = gh_graphql(
        """
        mutation($project:ID!, $item:ID!, $field:ID!, $option:String!) {
          updateProjectV2ItemFieldValue(
            input:{
              projectId:$project
              itemId:$item
              fieldId:$field
              value:{ singleSelectOptionId:$option }
            }
          ) {
            projectV2Item { id }
          }
        }
        """,
        {
            "project": str(project["id"]),
            "item": item_id,
            "field": str(field["id"]),
            "option": option_id,
        },
    )
    if updated.get("errors"):
        result["error"] = updated["errors"]
        log(f"set project status failed for #{issue_number}: {updated['errors']}")
        return result
    result["ok"] = True
    log(f"Set project status for #{issue_number} → {status_name}")
    return result


def set_issue_planning_status(issue_number: int, status_id: str) -> bool:
    issue_id = fetch_issue_node_id(issue_number)
    if not issue_id or not status_id:
        return False
    data = gh_graphql(
        """
        mutation($issueId:ID!, $statusId:ID!) {
          setIssueStatus(input:{issueId:$issueId, statusId:$statusId}) {
            issue { number state status { name } }
          }
        }
        """,
        {"issueId": issue_id, "statusId": status_id},
    )
    if data.get("errors"):
        log(f"setIssueStatus failed for #{issue_number}: {data['errors']}")
        return False
    log(f"setIssueStatus for #{issue_number}: {json.dumps(data.get('data'))}")
    return True


def mark_task_in_progress(task_number: int) -> dict[str, Any]:
    """Mark the active Task as In progress (project Status + optional planning status)."""
    cfg = load_config()
    result: dict[str, Any] = {"task": task_number, "status": "unknown"}
    planning_id = cfg.get("inProgressStatusId") or os.environ.get("FEATURE_TASK_IN_PROGRESS_STATUS_ID")
    if planning_id and set_issue_planning_status(int(task_number), str(planning_id)):
        result["status"] = "planning-status-in-progress"

    project_name = str(cfg.get("inProgressStatusName") or "In progress")
    project_result = set_project_item_status(int(task_number), project_name, cfg)
    result["project"] = project_result
    if project_result.get("ok"):
        result["status"] = (
            "project-status-in-progress"
            if result["status"] == "unknown"
            else f"{result['status']}+project"
        )
    elif project_result.get("error") and result["status"] == "unknown":
        result["error"] = project_result.get("error")
    return result


def cfg_status_label(kind: str) -> str:
    cfg = load_config()
    if kind == "inProgress":
        return str(cfg.get("inProgressStatusName") or "In progress")
    if kind == "done":
        return str(cfg.get("doneStatusName") or "Done")
    return kind


def activate_task(task: dict[str, Any], *, previous_active: int | None = None) -> dict[str, Any]:
    """Persist active Task in local state and flip GitHub/project status to In progress when it changes."""
    number = int(task["number"])
    state_update = {
        "activeTaskIssue": number,
        "activeTaskTitle": task.get("title"),
        "activeTaskUrl": task.get("url"),
    }
    if previous_active != number:
        status_result = mark_task_in_progress(number)
        state_update["activeTaskStatus"] = status_result.get("status")
    return state_update


def mark_task_done(task_number: int, commit_sha: str | None = None) -> dict[str, Any]:
    cfg = load_config()
    done_status_id = cfg.get("doneStatusId") or os.environ.get("FEATURE_TASK_DONE_STATUS_ID")
    result: dict[str, Any] = {"task": task_number, "status": "unknown"}

    try:
        owner_repo(cfg)
    except RuntimeError as exc:
        result["error"] = str(exc)
        log(str(exc))
        return result

    if done_status_id and set_issue_planning_status(int(task_number), str(done_status_id)):
        result["status"] = "planning-status-done"

    done_name = str(cfg.get("doneStatusName") or "Done")
    project_result = set_project_item_status(int(task_number), done_name, cfg)
    result["project"] = project_result
    if project_result.get("ok") and result["status"] == "unknown":
        result["status"] = "project-status-done"

    if not cfg.get("closeTaskOnDone", True) and result["status"] in {
        "planning-status-done",
        "project-status-done",
    }:
        return result

    sha = commit_sha or run_git(["rev-parse", "--short", "HEAD"]).stdout.strip()
    comment = f"Marked done after commit `{sha}` (generic Feature/Task workflow)."
    close_proc = run_gh(
        [
            "issue",
            "close",
            str(task_number),
            "--repo",
            repo,
            "--reason",
            "completed",
            "--comment",
            comment,
        ]
    )
    if close_proc.returncode == 0:
        result["status"] = "closed-completed" if result["status"] == "unknown" else result["status"]
        log(f"Closed task #{task_number} as completed ({sha})")
    else:
        if "already closed" in (close_proc.stderr or "").lower():
            result["status"] = "already-closed"
        else:
            result["error"] = close_proc.stderr.strip()
            log(f"Failed to close #{task_number}: {close_proc.stderr.strip()}")

    state = load_state()
    if state.get("activeTaskIssue") in {task_number, str(task_number)}:
        feature = state.get("featureIssue")
        if feature:
            set_feature_context(int(feature))
        else:
            state["activeTaskIssue"] = None
            save_state(state)
    return result


def latest_commit_message() -> str:
    return run_git(["log", "-1", "--pretty=%B"]).stdout


def handle_mark_done_from_commit() -> int:
    message = latest_commit_message()
    task_number = resolve_active_task_number(message)
    if not task_number:
        log("mark-done: no active task or Refs # in commit message")
        print("feature-task-workflow: no task to mark done", file=sys.stderr)
        return 0
    result = mark_task_done(int(task_number))
    print(json.dumps(result))
    return 0 if "error" not in result else 1


def cursor_session_start(_payload: dict[str, Any]) -> dict[str, Any]:
    return {"additional_context": build_next_task_context()}


def cursor_before_shell(payload: dict[str, Any]) -> dict[str, Any]:
    command = str(payload.get("command") or "")
    cfg = load_config()
    new_branch = extract_new_branch_name(command)
    if new_branch and not is_valid_feature_branch(new_branch, cfg):
        return {
            "permission": "ask",
            "user_message": (
                f"Branch `{new_branch}` is not `feature/<issueNumber>-<short-description>`. "
                "Approve only if this is intentional (non-Feature work)."
            ),
            "agent_message": (
                "Feature work must use branches like `feature/7-app-shell-navigation`. "
                "Rename/recreate the branch so hooks/skills can parse the Feature issue id."
            ),
        }
    if new_branch and is_valid_feature_branch(new_branch, cfg):
        feature = parse_feature_from_branch(new_branch, cfg)
        if feature is not None:
            set_feature_context(feature)
    if not is_git_commit_command(command):
        return {"permission": "allow"}
    if not cfg.get("requireCommitApproval", True):
        return {"permission": "allow"}
    return {
        "permission": "ask",
        "user_message": (
            "Feature/Task workflow: review the diff before allowing this git commit. "
            "Approve only after you reviewed the Task changes."
        ),
        "agent_message": (
            "A git commit was gated by the Feature/Task workflow hook. "
            "Do not retry committing until the user has reviewed and approved. "
            "Include `Refs #<taskNumber>` in the commit message."
        ),
    }


def cursor_after_shell(payload: dict[str, Any]) -> dict[str, Any]:
    command = str(payload.get("command") or "")
    output = str(payload.get("output") or "")
    if not is_git_commit_command(command):
        return {}
    failed = bool(
        re.search(r"(^|\n)error:|(^|\n)fatal:|hook declined|commit.*failed", output, flags=re.I)
    )
    if failed:
        return {
            "additional_context": "git commit appears to have failed; Task was not marked Done."
        }
    message = latest_commit_message()
    task_number = resolve_active_task_number(message)
    if not task_number:
        return {
            "additional_context": (
                "Commit finished, but no active Task / Refs # found to mark Done. "
                "Bind a Feature (`engine.py set-feature <n>`) or reference the Task in the commit message."
            )
        }
    result = mark_task_done(int(task_number))
    return {
        "additional_context": (
            f"Feature/Task workflow: marked Task #{task_number} as Done ({result.get('status')}). "
            "Only start the next Task when the user asks."
        )
    }


def cursor_before_prompt(payload: dict[str, Any]) -> dict[str, Any]:
    """Bind Feature from branch (preferred) or prompt.

    Cursor `beforeSubmitPrompt` cannot inject `additional_context` (only continue/deny).
    We set `injectWorkflowContext` so the next `postToolUse` hook injects the same
    Feature/Task guidance Cline gets on TaskStart / UserPromptSubmit (including
    “create Tasks first” via skill `create-feature-tasks`).
    """
    prompt = str(payload.get("prompt") or "")
    workflowish = bool(
        re.search(
            r"\b(implement|umsetzen|feature|task|tasks?\s+anlegen|create\s+tasks?|branch)\b",
            prompt,
            flags=re.I,
        )
    )
    feature = resolve_feature_number(text=prompt, bind=bool(workflowish or parse_feature_from_branch()))
    if feature is not None:
        build_next_task_context(feature)
    if feature or workflowish or load_state().get("featureIssue"):
        state = load_state()
        state["injectWorkflowContext"] = True
        save_state(state)
    return {"continue": True}


def cursor_post_tool(_payload: dict[str, Any]) -> dict[str, Any]:
    """Inject Feature/Task workflow context once after the user prompt (Cursor bridge)."""
    state = load_state()
    if not state.get("injectWorkflowContext"):
        return {}
    state["injectWorkflowContext"] = False
    save_state(state)
    return {"additional_context": build_next_task_context()}


def prompt_requests_commit(prompt: str) -> bool:
    return bool(
        re.search(
            r"\b(commit|commiten|committen|committe|jetzt\s+committen|create\s+a\s+commit|git\s+commit)\b",
            prompt,
            flags=re.I,
        )
    )


def cline_context_payload(payload: dict[str, Any] | None = None) -> dict[str, Any]:
    payload = payload or {}
    prompt = str(((payload.get("userPromptSubmit") or {}).get("prompt")) or "")
    allow_commit = prompt_requests_commit(prompt)
    resolve_feature_number(text=prompt, bind=True)
    context = build_next_task_context()
    if allow_commit:
        state = load_state()
        state["allowCommit"] = True
        save_state(state)
    return {"cancel": False, "contextModification": context}


def cline_pre_tool(payload: dict[str, Any]) -> dict[str, Any]:
    cfg = load_config()
    pre = payload.get("preToolUse") or {}
    tool_name = str(pre.get("toolName") or payload.get("toolName") or "")
    params = pre.get("parameters") or payload.get("parameters") or payload.get("toolParams") or {}
    command = ""
    if isinstance(params, dict):
        command = str(params.get("command") or params.get("cmd") or "")
    if "command" in tool_name.lower() or tool_name in {"execute_command", "Bash", "Shell"}:
        new_branch = extract_new_branch_name(command)
        if new_branch and not is_valid_feature_branch(new_branch, cfg):
            return {
                "cancel": True,
                "errorMessage": (
                    f"Branch `{new_branch}` must be `feature/<issueNumber>-<short-description>` "
                    "(e.g. `feature/7-app-shell-navigation`) so the Feature id is available for Task creation."
                ),
                "contextModification": build_next_task_context(),
            }
        if new_branch and is_valid_feature_branch(new_branch, cfg):
            feature = parse_feature_from_branch(new_branch, cfg)
            if feature is not None:
                set_feature_context(feature)
        if is_git_commit_command(command):
            if not cfg.get("requireCommitApproval", True):
                return {"cancel": False}
            state = load_state()
            allowed = bool(state.get("allowCommit")) or os.environ.get("FEATURE_TASK_ALLOW_GIT_COMMIT") == "1"
            if allowed:
                state["allowCommit"] = False
                save_state(state)
                return {
                    "cancel": False,
                    "contextModification": (
                        "Commit approved by user for this Feature/Task. "
                        "Include `Refs #<taskNumber>` in the message."
                    ),
                }
            return {
                "cancel": True,
                "errorMessage": (
                    "Feature/Task workflow: do not create the git commit yet. "
                    "Stop for user review. After review, ask the user to confirm the commit "
                    "(or commit in the IDE); Done is applied post-commit."
                ),
                "contextModification": build_next_task_context(),
            }
    return {"cancel": False}


def cline_post_tool(payload: dict[str, Any]) -> dict[str, Any]:
    post = payload.get("postToolUse") or {}
    tool_name = str(post.get("toolName") or payload.get("toolName") or "")
    params = post.get("parameters") or {}
    command = ""
    if isinstance(params, dict):
        command = str(params.get("command") or "")
    if post.get("success") is False:
        return {"cancel": False}
    if ("command" in tool_name.lower() or tool_name in {"execute_command", "Bash", "Shell"}) and is_git_commit_command(
        command
    ):
        message = latest_commit_message()
        task_number = resolve_active_task_number(message)
        if task_number:
            result = mark_task_done(int(task_number))
            return {
                "cancel": False,
                "contextModification": (
                    f"Marked Task #{task_number} Done ({result.get('status')}). "
                    "Wait for the user before starting the next Task."
                ),
            }
    return {"cancel": False}


def main(argv: list[str]) -> int:
    if len(argv) >= 2 and argv[1] == "mark-done":
        return handle_mark_done_from_commit()

    if len(argv) >= 3 and argv[1] == "set-feature":
        feature = int(argv[2])
        state = set_feature_context(feature)
        print(json.dumps(state, indent=2))
        return 0

    if len(argv) >= 2 and argv[1] == "from-branch":
        branch = current_branch()
        feature = parse_feature_from_branch(branch)
        result = {"branch": branch, "featureIssue": feature}
        if feature is not None:
            result.update(set_feature_context(feature))
        print(json.dumps(result, indent=2))
        return 0 if feature is not None else 1

    if len(argv) >= 2 and argv[1] == "next-context":
        feature = int(argv[2]) if len(argv) >= 3 else None
        print(build_next_task_context(feature))
        return 0

    if len(argv) >= 2 and argv[1] == "cursor":
        mode = argv[2] if len(argv) >= 3 else ""
        payload = read_stdin_json()
        if mode == "sessionStart":
            emit(cursor_session_start(payload))
        elif mode == "beforeShell":
            emit(cursor_before_shell(payload))
        elif mode == "afterShell":
            emit(cursor_after_shell(payload))
        elif mode == "beforePrompt":
            emit(cursor_before_prompt(payload))
        elif mode == "postTool":
            emit(cursor_post_tool(payload))
        else:
            emit({})
        return 0

    if len(argv) >= 2 and argv[1] == "cline":
        mode = argv[2] if len(argv) >= 3 else ""
        payload = read_stdin_json()
        hook_name = str(payload.get("hookName") or mode)
        if hook_name in {"UserPromptSubmit", "TaskStart", "TaskResume"} or mode in {
            "UserPromptSubmit",
            "TaskStart",
            "TaskResume",
        }:
            emit(cline_context_payload(payload))
        elif hook_name == "PreToolUse" or mode == "PreToolUse":
            emit(cline_pre_tool(payload))
        elif hook_name == "PostToolUse" or mode == "PostToolUse":
            emit(cline_post_tool(payload))
        else:
            emit({"cancel": False})
        return 0

    print(
        "usage: engine.py [mark-done|set-feature <n>|from-branch|next-context [n]|cursor <mode>|cline <mode>]",
        file=sys.stderr,
    )
    return 2


if __name__ == "__main__":
    try:
        raise SystemExit(main(sys.argv))
    except Exception as exc:  # noqa: BLE001
        log(f"unhandled error: {exc}")
        if len(sys.argv) >= 2 and sys.argv[1] in {"cursor", "cline"}:
            if sys.argv[1] == "cline":
                emit({"cancel": False})
            elif len(sys.argv) >= 3 and sys.argv[2] == "beforeShell":
                emit({"permission": "allow"})
            elif len(sys.argv) >= 3 and sys.argv[2] == "beforePrompt":
                emit({"continue": True})
            else:
                emit({})
            raise SystemExit(0)
        raise SystemExit(1)
