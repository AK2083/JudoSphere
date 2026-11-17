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

When the user names a **Feature** issue to implement:

0. **Ensure Tasks exist** for that Feature (GitHub Task sub-issues in build order). If none exist yet, **create them first** before writing product code — follow the project skill `create-feature-tasks` (hook = when/why; skill = how).
1. Load the Feature and its Task sub-issues (order = ascending issue number).
2. Work on **exactly one** Task at a time: the first open / not-done Task.
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
    task = next_open_task(feature_number)
    state: dict[str, Any] = {
        "featureIssue": feature_number,
        "allowCommit": bool(existing.get("allowCommit")),
    }
    if task:
        state["activeTaskIssue"] = int(task["number"])
        state["activeTaskTitle"] = task.get("title")
        state["activeTaskUrl"] = task.get("url")
    else:
        state["activeTaskIssue"] = None
        state["activeTaskTitle"] = None
        state["activeTaskUrl"] = None
    save_state(state)
    return state


def build_next_task_context(feature_number: int | None = None) -> str:
    state = load_state()
    feature = feature_number or state.get("featureIssue")
    lines = [WORKFLOW_CONTEXT.strip(), ""]
    if not feature:
        lines.append(
            "No active Feature in runtime state. Bind one with "
            "`python3 .workflow/feature-task/engine.py set-feature <number>` "
            "or include a Feature issue reference in the user prompt "
            "(feature-specific tooling may set state later)."
        )
        return "\n".join(lines)

    feature = int(feature)
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
    if open_tasks:
        nxt = open_tasks[0]
        lines.append("")
        lines.append(
            f"**Implement next: #{nxt.get('number')} — {nxt.get('title')}** "
            f"({nxt.get('url')}). Stop after this Task for user review; do not commit alone."
        )
        save_state(
            {
                "featureIssue": feature,
                "activeTaskIssue": int(nxt["number"]),
                "activeTaskTitle": nxt.get("title"),
                "activeTaskUrl": nxt.get("url"),
                "allowCommit": bool(existing.get("allowCommit")),
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


def detect_feature_from_text(text: str) -> int | None:
    patterns = [
        r"Feature:\s*.*?#(\d+)",
        r"\bfeature\s+#(\d+)\b",
        r"github\.com/[^/\s]+/[^/\s]+/issues/(\d+)",
    ]
    for pat in patterns:
        match = re.search(pat, text, flags=re.I)
        if match:
            return int(match.group(1))
    return None


def mark_task_done(task_number: int, commit_sha: str | None = None) -> dict[str, Any]:
    cfg = load_config()
    done_status_id = cfg.get("doneStatusId") or os.environ.get("FEATURE_TASK_DONE_STATUS_ID")
    result: dict[str, Any] = {"task": task_number, "status": "unknown"}

    try:
        repo = owner_repo(cfg)
    except RuntimeError as exc:
        result["error"] = str(exc)
        log(str(exc))
        return result

    if done_status_id:
        owner, name = repo.split("/", 1)
        lookup = subprocess.run(
            [
                "gh",
                "api",
                "graphql",
                "-f",
                f'query=query{{repository(owner:"{owner}",name:"{name}"){{issue(number:{task_number}){{id}}}}}}',
            ],
            cwd=str(REPO_ROOT),
            text=True,
            capture_output=True,
            timeout=30,
            check=False,
        )
        issue_id = None
        try:
            issue_id = json.loads(lookup.stdout)["data"]["repository"]["issue"]["id"]
        except (json.JSONDecodeError, KeyError, TypeError):
            issue_id = None
        if issue_id:
            mutation = {
                "query": """
                mutation($issueId:ID!, $statusId:ID!) {
                  setIssueStatus(input:{issueId:$issueId, statusId:$statusId}) {
                    issue { number state status { name } }
                  }
                }
                """,
                "variables": {"issueId": issue_id, "statusId": done_status_id},
            }
            status_proc = subprocess.run(
                ["gh", "api", "graphql", "--input", "-"],
                cwd=str(REPO_ROOT),
                input=json.dumps(mutation),
                text=True,
                capture_output=True,
                timeout=30,
                check=False,
            )
            if status_proc.returncode == 0 and "errors" not in (status_proc.stdout or ""):
                result["status"] = "planning-status-done"
                log(f"setIssueStatus Done for #{task_number}: {status_proc.stdout.strip()}")
            else:
                log(f"setIssueStatus failed for #{task_number}: {status_proc.stderr or status_proc.stdout}")

    if not cfg.get("closeTaskOnDone", True) and result["status"] == "planning-status-done":
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
    if not is_git_commit_command(command):
        return {"permission": "allow"}
    cfg = load_config()
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
    """Bind Feature from the prompt when present.

    Cursor `beforeSubmitPrompt` cannot inject `additional_context` (only continue/deny).
    We set `injectWorkflowContext` so the next `postToolUse` hook injects the same
    Feature/Task guidance Cline gets on TaskStart / UserPromptSubmit (including
    “create Tasks first” via skill `create-feature-tasks`).
    """
    prompt = str(payload.get("prompt") or "")
    feature = detect_feature_from_text(prompt)
    workflowish = bool(
        re.search(
            r"\b(implement|umsetzen|feature|task|tasks?\s+anlegen|create\s+tasks?)\b",
            prompt,
            flags=re.I,
        )
    )
    if feature and workflowish:
        set_feature_context(feature)
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
    feature = detect_feature_from_text(prompt)
    if feature and re.search(r"\b(implement|umsetzen|feature|task)\b", prompt, flags=re.I):
        set_feature_context(feature)
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
        "usage: engine.py [mark-done|set-feature <n>|next-context [n]|cursor <mode>|cline <mode>]",
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
