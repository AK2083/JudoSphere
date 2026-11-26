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
- **Design:** follow **SOLID** for all feature and host work ([solid-principles.md](./solid-principles.md))
- **Offline-first:** local use must work without cloud or internet
- **Dependency access:** host/runtime deps (Tauri, Pinia, i18n, …) via `@shared/api` facades; **Vue** and **vue-router** import directly
- **Docs/comments:** English only. See public-API comment policy below; barrel `index.ts` exposes public APIs

## Public API comments

- **Language:** English.
- **Document only the public API:** exclusively **exported** members — functions, classes, methods, types/interfaces, and exported constants/variables. Require `@param` / `@returns` where applicable. Enforced today by ESLint `eslint-plugin-jsdoc` (`jsdoc/require-jsdoc` with `publicOnly`).
- **Do not document:** non-exported / module-private functions, private helpers, non-exported constants, local variables/`let`/`ref` state, or inline narration of obvious code.
- **Do not leave:** `//` or block comments that only restate the next line, TODOs-as-noise, or “ignore error” catch notes. Prefer empty `catch` blocks when ignoring is intentional.
- **Vue SFCs:** same rules in `<script setup>` — no doc comments on local helpers; no comments in `<template>`.
- **CSS / `<style>`:** no comments at all (`/* … */` or `//`) in `.css` files or SFC `<style>` blocks — neither narration nor “contract” notes.

## Data storage and sync

- **Primary:** local SQLite on the Tauri host via **`rusqlite`** (bundled), not cloud and not `tauri-plugin-sql`
- Vue never runs SQL; it calls host commands through `@shared/api` only (see [architecture-vertical-slice.md](./architecture-vertical-slice.md))
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
