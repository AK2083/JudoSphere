---
name: implement-judo-tournament-flow
description: >-
  Guides feature work for organizer host flows and scoring-judge LAN clients in
  JudoSphere's offline-first Tauri model.
modeSlugs:
  - architect
  - code
---

# Skill: Implement Judo Tournament Flow

Use this skill when building competition-day workflows.

## Role boundaries

1. **Organizer (Tauri host):**
   - Starts the host app, manages the competition, serves the LAN UI.
   - Privileged operations run in Rust slices / host commands.

2. **Scoring judge (intranet / browser):**
   - Opens the host-provided website.
   - Limited to scoring/match actions allowed by the host.
   - Must not receive host secrets or elevate privileges in the browser alone.

3. **Audience / participants:**
   - Out of scope for this software — do not build spectator/participant portals unless product scope changes.

## Execution rules

- Keep domain logic in Tauri slices and shared domain types; keep Vue presentation thin.
- Offline-first: core flows must work without cloud.
- Use Tailwind `@shared/ui` for UI consistency.
- Segment routes/permissions by role; do not leak organizer-only controls to judge clients.
