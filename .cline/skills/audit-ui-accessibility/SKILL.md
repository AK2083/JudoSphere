---
name: audit-ui-accessibility
description: >-
  Audits Vue components for WCAG/a11y standards, ARIA attributes, keyboard
  navigation, and responsive Tailwind layouts.
modeSlugs:
  - code
  - ask
---

# Skill: UI Accessibility & Responsive Auditor

Use this skill when developing or reviewing Vue 3 components under `src/**/*.vue`.

## Inspection checklist

1. **Accessibility (a11y):**
   - Form inputs have `<label>`, `aria-label`, or `aria-labelledby`.
   - Decorative icons: `aria-hidden="true"`; icon-only buttons: translated `aria-label`.
   - Dynamic status/error messages: `role="alert"` or `aria-live="polite"`.
   - Keyboard focusable interactive elements with visible focus states.

2. **Template cleanliness:**
   - Zero business logic in templates; bind state/events from composables.

3. **Responsive Tailwind:**
   - Use responsive utilities (`sm:`, `md:`, `lg:`) and `@shared/ui` primitives.
   - No Vuetify grid/`useDisplay()` assumptions.
