---
name: validate-fsd-imports
description: >-
  Audits code for Feature-Sliced Design import boundary violations and layer
  integrity in src/.
modeSlugs:
  - debug
  - ask
---

# Skill: FSD Import Validator

Use this skill before commits/PRs to enforce FSD layering.

## Validation checklist

1. **Downward imports only** among `app → pages → widgets → features → entities → shared`.
2. `shared` imports nothing from higher layers.
3. Features do not import other features/pages/widgets.
4. Runtime deps (`vue`, `@tauri-apps/*`) only inside `src/shared/api`.
5. Feature `model/`/`ui/` should call slice `api/`, not `@shared/api` directly when a slice api exists.
6. Cross-slice imports go through barrels (`index.ts`).
7. Aliases are `@app`/`@pages`/`@widgets`/`@features`/`@entities`/`@shared` — not `@/`.

## Output format

List violations with file/line and suggested refactor.
