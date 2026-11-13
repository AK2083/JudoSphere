---
description: Project goals, roles, architecture guidelines, and privacy for JudoSphere
alwaysApply: true
---

# JudoSphere — Project Overview

Offline-first Tauri application for organizing **smaller judo competitions** and **small clubs**. Target audience: volunteer organizers without commercial tournament software.

## Vision and user roles

| Role                                | Device                    | Responsibility                                            |
| ----------------------------------- | ------------------------- | --------------------------------------------------------- |
| **Organizer / tournament director** | Host computer (Tauri)     | Starts the app, manages the tournament, serves the LAN UI |
| **Scoring judge**                   | Separate computer/browser | Opens the host-provided website on the intranet           |
| **Audience / participants**         | —                         | Out of scope for this software                            |

### Planned flow (prospective)

1. Organizer starts the Tauri application on the host computer.
2. The host serves the application UI on the local network.
3. Scoring judges open the host-provided website in a browser.
4. Competition data stays local-first on the host.

When building new features, consider these roles: organizer = host app; scoring judge = browser client on the LAN.

## Milestones and issues

Milestones are the **product roadmap** for judo competition day roles above (organizer / tournament director, scoring judge / list keeper, weigh-in staff as needed). Audience and participants stay out of scope.

- Structure: Goal, Audience, Roadmap, Out of scope, Deferred — no architecture essays or rule restatements.
- Roadmap: numbered items in build order; **one item ≈ one GitHub issue**.
- **Formulate meaningfully:** each milestone roadmap item and each issue must spell out _who_ benefits, _what_ happens on competition day, and _why_ it matters — full sentences, not keyword dumps. Issues then add concrete acceptance criteria and implementation notes on top of that.
- Do not teach FSD, host slices, facades, lint, or other rules already covered here inside milestones or issue fluff.

## Technical guidelines

- **Frontend:** Vue 3 + TypeScript, Feature-Sliced Design under `src/`
- **UI:** Tailwind CSS; design system built under `src/shared/ui` (no Vuetify)
- **Desktop / host:** Tauri 2 + Rust vertical slices under `src-tauri/src/slices/`
- **Offline-first:** local use must work without cloud or internet
- **Dependency access:** runtime deps only via `@shared/api` facades
- **Docs/comments:** English; JSDoc only on exported functions/variables; barrel `index.ts` public APIs

## Data storage and sync

- **Primary:** local data on the host (Tauri app data / future local DB in Rust slices)
- Offline/local-first behavior takes precedence: the app must work without cloud
- Optional cloud sync (if introduced later) belongs in dedicated feature/host slices — not scattered in UI components

## Security and GDPR

Tournament competitors are natural persons — protect personal data:

- **No sensitive data in plaintext** when storing or transmitting (hashed passwords, secure tokens, no PII in logs/monitoring)
- Minimal data collection: only what is needed for tournament operations
- Cloud sync only with authentication and trusted-layer authorization
- Intranet access (scoring judges) on the LAN — still avoid unnecessary exposure of personal data in URLs or client storage
- For new fields/endpoints, check: storage location (local vs. cloud), consent, deletability, encryption where appropriate

## Scope notes for implementation

- Small competitions: simple operation for volunteers matters more than enterprise features
- Organizer workflow (Tauri host) and browser clients (scoring judges) are separate access paths — shared domain logic, different UI/permissions
- Prefer i18n for UI text; avoid hardcoded strings as the product grows
- Open Source: consider association compatibility for code and dependencies
