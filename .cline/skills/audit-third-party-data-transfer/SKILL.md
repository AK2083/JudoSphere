---
name: audit-third-party-data-transfer
description: >-
  Audits external data transfers (Supabase, external APIs, export files) for
  role authorization and privacy compliance.
modeSlugs:
  - compliance
---

# Skill: Third-Party Data Transfer Auditor

Use this skill when implementing endpoints that send data externally or generate exports (PDF/Excel/CSV).

## Inspection checklist

1. Identify payloads sent to Supabase/APIs/third parties.
2. Confirm authorization at a trusted layer (Tauri host and/or Supabase RLS) before dispatch.
3. Export minimization: exclude non-public fields unless permitted.
4. Ensure private member data is not rendered publicly without authorization.
