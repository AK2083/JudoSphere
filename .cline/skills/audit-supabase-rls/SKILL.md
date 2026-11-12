---
name: audit-supabase-rls
description: >-
  Audits Supabase database migrations for proper Row Level Security (RLS)
  policies and direct API access vectors.
modeSlugs:
  - security
---

# Skill: Supabase RLS & API Security Auditor

Use this skill when Supabase is introduced or changed.

## Inspection checklist

1. **RLS enabled** on every non-public table.
2. **Policy coverage** for SELECT/INSERT/UPDATE/DELETE as required.
3. **Anon key** limited to intended public/read paths.
4. **Service role key** only in trusted host/server environment — never in Vue/`@shared/api` browser-facing code.
