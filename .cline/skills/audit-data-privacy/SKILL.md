---
name: audit-data-privacy
description: >-
  Audits code for data minimization, PII logging leaks, real personal data in
  tests/mocks, and minor protection.
modeSlugs:
  - compliance
---

# Skill: Data Privacy & GDPR Auditor

Use this skill in Compliance Mode to inspect features processing user or tournament data.

## Inspection checklist

1. **Data minimization:** Collect/store/export only required personal fields.
2. **PII in logs:** Strip names, emails, birthdates, phones from logs/debug output.
3. **No real personal data:** Tests, Storybook, seeds, screenshots use fictional mocks only.
4. **Minor/children protection:** Extra isolation and strict permission checks at the trusted Tauri host / database layer.
