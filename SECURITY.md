# Security Policy

This document describes the security practices and responsible disclosure process for JudoSphere.

---

## Supported Versions

| Version | Supported          | End of Life |
| ------- | ------------------ | ----------- |
| 0.x     | ✅ Yes (current)   | TBD         |
| < 0.1   | ❌ No              | 2026-10-14  |

---

## Reporting a Security Vulnerability

**Do not** open a public GitHub issue for security vulnerabilities. Instead:

### Contact Information

- **Email:** `security@judosphere.dev` (or use GitHub's private security advisory feature)
- **Response Time:** We will acknowledge your report within **48 hours**.
- **Resolution Target:** Critical issues will be patched within **30 days** of confirmation.

### Process

1. **Report:** Send a detailed description of the vulnerability, including:
   - Type of vulnerability (e.g. XSS, SQL injection, privilege escalation)
   - Location in the code (if known)
   - Steps to reproduce
   - Potential impact
   - Your recommended fix (if available)

2. **Acknowledgment:** We will confirm receipt and assign a security advisor.

3. **Investigation:** Our team will verify and assess the vulnerability.

4. **Patch Development:** We will create a fix and test it thoroughly.

5. **Release:** A patched version will be released and publicly disclosed.

6. **Credit:** (Optional) We will acknowledge you in the security advisory and `CHANGELOG.md` unless you prefer to remain anonymous.

---

## Security Best Practices

### For Developers

- **Dependencies:** Keep `package.json` and `Cargo.toml` up to date. Run `npm audit` and `cargo audit` regularly.
- **Secrets:** Never commit passwords, API keys, or credentials. Use environment variables (via `.env` files, not in git).
- **Input Validation:** Validate and sanitize all user inputs (forms, file uploads, IPC payloads).
- **Authentication:** (Future) Implement HTTPS and token-based auth for multi-client features.
- **Encryption:** Sensitive data (e.g. API tokens) stored locally should be encrypted using OS keychains.
- **Logging:** Do not log sensitive data (passwords, PII); use structured logging with `tracing` crate.

See [`.cline/rules/security-privacy.md`](.cline/rules/security-privacy.md) for detailed security guidelines.

### For Users

- **Updates:** Keep JudoSphere updated. Security patches are released as soon as available.
- **Backups:** Regularly backup your tournament data (SQLite database export).
- **Access Control:** Do not share admin credentials; use strong, unique passwords if auth is enabled.
- **Local Network:** If using LAN sync, only connect to trusted devices on your network.

---

## Privacy Policy

JudoSphere collects and stores personal data (athlete names, birthdates, contact information, competition results) on your local machine. This data is:

- **Never** sent to external servers without your explicit consent.
- **Encrypted** at rest (OS keychain for sensitive tokens).
- **Deletable** on demand via the app's data management features.

For GDPR compliance requirements, see [`.cline/rules/legal.md`](.cline/rules/legal.md).

---

## Compliance

JudoSphere adheres to:

- **WCAG 2.1 Level AA** for accessibility.
- **GDPR** (EU) for data protection.
- **COPPA** (US) for child protection (if applicable).
- **MIT License** for open-source software.

---

## Security Advisories

All security advisories are published on [GitHub Security Advisories](https://github.com/AK2083/JudoSphere/security/advisories) and included in the `CHANGELOG.md`.

### Recent Advisories

- None yet (project is in early development).

---

## Questions?

If you have security-related questions that are not a vulnerability report, please open a **Discussion** in the GitHub repository or email `info@judosphere.dev`.
