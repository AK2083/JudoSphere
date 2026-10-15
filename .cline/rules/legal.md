---
description: Legal and compliance framework for JudoSphere — GDPR, data retention, responsible disclosure, and licensing
globs: '**/*.{ts,vue,rs,md}'
alwaysApply: false
---

# Legal & Compliance

This file documents legal and compliance requirements for JudoSphere development. See [`SECURITY.md`](../../SECURITY.md) for responsible disclosure procedures.

---

## GDPR Compliance

JudoSphere processes personal data (athlete names, birthdates, contact information, competition results) for European users. Compliance is mandatory.

### Data Collection Principles

- **Lawful basis:** Consent (user registration) or legitimate interest (tournament administration).
- **Minimal data:** Collect only what is necessary for the feature (name, DOB, contact). No unnecessary fields.
- **Transparency:** Privacy policy must be clear and accessible at signup and in app settings.
- **User rights:** Provide mechanisms for users to:
  - **Access** their data (export as JSON/CSV)
  - **Correct** their data (edit profile)
  - **Delete** their data (account deletion + data purge from DB within 30 days)
  - **Withdraw consent** (opt-out of specific data uses, e.g. marketing emails)

### Implementation Checklist

- [ ] Privacy policy drafted and linked in `SECURITY.md`
- [ ] Consent banner on login/signup (i18n: de + en)
- [ ] Data export feature (`GET /api/user/export`, returns JSON/CSV)
- [ ] Data deletion feature (`DELETE /api/user`, cascading deletes athlete records, etc.)
- [ ] Data retention policy documented (e.g. "delete after 2 years of inactivity")
- [ ] Database audit log for sensitive operations (create/update/delete athlete, manage belt promotions)

### Cookie & LocalStorage Consent

- **App state only:** JudoSphere stores **UI state** in browser LocalStorage (language, theme, view preferences) — this is **not** personal data.
  - Exception: `judosphere_auth_token` stores an API token — requires consent if the app is deployed publicly (not needed for desktop Tauri).
- **No tracking cookies:** JudoSphere does not use Google Analytics or similar tracking.

---

## Data Retention

Define how long data is kept and when it is deleted.

### Retention Periods

| Data Type                                 | Retention Period       | Rationale                                            |
| ----------------------------------------- | ---------------------- | ---------------------------------------------------- |
| **Athlete profile** (name, DOB, contact)  | Until account deletion | Core to tournament admin                             |
| **Competition results** (matches, scores) | 3 years                | Legal/audit trail; allows tournament history queries |
| **Belt progression history**              | Until account deletion | Audit trail for grading records                      |
| **User login logs**                       | 90 days                | Security audit                                       |
| **API audit logs** (create/update/delete) | 1 year                 | Compliance and debugging                             |
| **Deleted account data**                  | 30 days (soft delete)  | Allow recovery window; then hard delete              |

### Automatic Deletion

- Implement a scheduled job (e.g. daily cron) to:
  1. Soft-delete old audit logs (move to archive table).
  2. Hard-delete data beyond retention periods.
  3. Log all deletions (for compliance audit).

---

## Responsible Disclosure

See [`SECURITY.md`](../../SECURITY.md) for the full responsible disclosure policy and contact procedures.

**Quick summary:**

- Security issues reported to `security@judosphere.dev` (or equivalent) **before public disclosure**.
- Response time: **48 hours** acknowledgment, **30 days** remediation target.
- CVE assignment for critical vulnerabilities.
- Public disclosure **only after patch is released**.

---

## Open Source Licensing

JudoSphere is licensed under **MIT** (see `LICENSE` file at repo root).

### Dependencies

- Review all dependencies on first use and during updates to ensure:
  - License is compatible with MIT (Apache 2.0, BSD, ISC, MPL-2.0, etc.).
  - No GPL/AGPL dependencies (viral licenses; incompatible with MIT).
  - Maintainers are active (not abandoned projects).
- Use `npm audit` to identify security vulnerabilities in dependencies.
- Pin major versions in `package.json`; use automated tools (Dependabot) for patch updates.

### Changelog & Version Bumping

- Use **Semantic Versioning** (SemVer): `MAJOR.MINOR.PATCH`.
  - **MAJOR:** Breaking changes (e.g. API signature change, new required field in database).
  - **MINOR:** New features, backward-compatible.
  - **PATCH:** Bug fixes.
- Maintain `CHANGELOG.md` with all releases (date, version, changes, contributors).
- Tag releases on GitHub: `v1.0.0`, `v1.1.0`, etc.

---

## Accessibility (Legal Requirement)

In many jurisdictions, public-facing software must comply with **WCAG 2.1 Level AA**. JudoSphere targets this standard.

### Requirements (per [`vue-frontend.md`](./vue-frontend.md))

- ARIA labels on all interactive elements.
- Keyboard navigation for all features (no mouse-only interactions).
- Color contrast ≥ 4.5:1 for normal text.
- Semantic HTML (`<button>`, `<label>`, `<section>`, not `<div>` pretending to be a button).
- Accessible forms with explicit labels or `aria-label`.

### Testing & Audit

- Run Lighthouse Accessibility audit on every page before release.
- Test with screen readers (NVDA, JAWS, VoiceOver) for critical flows (login, create athlete, manage belt).
- Document any known accessibility limitations and alternative workflows.

---

## Age-Appropriate Features

JudoSphere serves young athletes (under 18 in many cases). Comply with child protection requirements:

### COPPA (US) / GDPR (EU) — Children's Data

If users under 13 (COPPA) or 16 (GDPR) can sign up:

- Parental consent is **required** (not just from the child).
- Opt-out from marketing emails/push notifications by default.
- **Do not sell** or share child data with third parties.
- Implement data minimization (collect only essential data).

### Age-Gating

- If the app has age-restricted features (e.g. adult-only tournaments, age-based belt rankings), implement clear age checks in UI.
- Document which features are age-restricted.

---

## Audit & Compliance Checklist

Before each major release (v0.X, v1.X), verify:

- [ ] **GDPR:** Privacy policy updated; data export/delete features tested.
- [ ] **Data Retention:** Automated deletion jobs running; logs confirm deletions.
- [ ] **Responsible Disclosure:** `SECURITY.md` is current; contact email monitored.
- [ ] **Dependencies:** `npm audit` passes; no critical/high vulnerabilities.
- [ ] **Licensing:** License file present; all third-party licenses compatible with MIT.
- [ ] **Accessibility:** Lighthouse Accessibility ≥ 90; no automated ARIA violations.
- [ ] **Changelog:** `CHANGELOG.md` updated; version tag created on GitHub.
- [ ] **Age Protection:** (if applicable) Parental consent mechanism in place; age checks working.

---

## Links & References

- **GDPR Compliance:** https://gdpr-info.eu/
- **WCAG 2.1:** https://www.w3.org/WAI/WCAG21/quickref/
- **Responsible Disclosure:** https://cheatsheetseries.owasp.org/cheatsheets/Vulnerability_Disclosure_Cheat_Sheet.html
- **COPPA (US Children's Privacy):** https://www.ftc.gov/business-guidance/privacy-security/childrens-privacy
- **MIT License:** https://opensource.org/licenses/MIT
