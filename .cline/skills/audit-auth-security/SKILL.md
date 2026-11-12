---
name: audit-auth-security
description: >-
  Audits auth, session, and migration files for plain-text token leaks, missing
  Tauri host session guards, and role mutation vulnerabilities.
modeSlugs:
  - debug
  - ask
  - security
---

# Skill: Auth & Security Auditor

Use this skill to audit authorization, authentication, and database code under `**/auth/**`, `**/sessions/**`, `**/migrations/**`, and `src-tauri/**`.

## Inspection checklist

1. **Plain-text token check:** Tokens must be stored as hashes; never log plaintext tokens.
2. **Host authorization check:** Every privileged Tauri command verifies active session and required permission before executing logic.
3. **Role protection:** Endpoints/SQL modifying system roles/permissions are protected.
4. **Access request states:** Enforce `pending | approved | rejected | expired`.
5. **No Vue-only auth:** Frontend must not be the sole authorization boundary.

## Output format

List flaws with file paths, lines, severity, and recommended fixes.
