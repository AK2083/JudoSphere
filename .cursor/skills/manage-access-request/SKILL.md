---
name: manage-access-request
description: >-
  Implements access request state transitions (pending, approved, rejected,
  expired) and binds approved requests to local users.
modeSlugs:
  - code
---

# Skill: Access Request Lifecycle Manager

Use this skill when handling access requests or user onboarding logic.

## State machine rules

Access requests must strictly transition through:

- `pending`
- `approved`
- `rejected`
- `expired`

## Workflow for approval

When set to `approved`:

1. Verify whether a matching local user already exists.
2. If exists: attach role/permissions.
3. If not: create a local user and assign the role.
4. Persist approval metadata in the host database.
5. Enforce transitions and permission checks in the Tauri host — not only in Vue.
