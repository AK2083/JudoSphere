---
description: Vue frontend — components, composables, Tailwind design system, tests, accessibility, and i18n
globs: src/**/*.vue
alwaysApply: false
---

# Vue Frontend

## Components and logic

- New components exclusively with `<script setup lang="ts">`.
- **No business logic in templates** — no calculations, API calls, or complex conditions. Templates bind state and events from script/composable.
- Logic belongs in **composables** (`model/use-*.ts`) or `service/` — UI components in `ui/` stay presentation-focused.
- UI primitives come from the Tailwind-based design system in `@shared/ui` (no Vuetify).
- Import Vue/Tauri only via `@shared/api`.
- Layer assignment per [`architecture-fsd.md`](architecture-fsd.md).

```vue
<!-- ❌ Business logic in template -->
<button :disabled="email.length < 5 || !isOnline" @click="signUp(email, password)">

<!-- ✅ Composable provides ready state; shared UI primitive -->
<Button :disabled="!canSubmit" :loading="loading" @click="submit" />
```

## Design system (Tailwind)

- Build reusable primitives under `src/shared/ui` with Tailwind utility classes / design tokens.
- Features and pages compose `@shared/ui` components; they do not invent parallel button/input systems.
- Prefer extracting repeated visual patterns into `shared/ui` early to keep a separable design system.
- Colocate Storybook stories with each `shared/ui` component.

## Internationalization

- Supported languages (target): **German** and **English**.
- Prefer no hardcoded UI strings — text via i18n keys as i18n is introduced.
- ARIA labels and visible text also via i18n keys when available.

**Slice layout** (per use case under `features/<feature>/<slice>/i18n/`):

```
i18n/
  keys.ts
  de.ts
  en.ts
  index.ts
```

## Responsive design

- Layouts with Tailwind responsive utilities (`sm:`, `md:`, `lg:`, …).
- Test components on mobile, tablet, and desktop — no fixed pixel widths for core layouts.

## Accessibility (a11y)

- Aim for Lighthouse **Accessibility** score (no regressions).
- Set meaningful **ARIA attributes**: `aria-label`, `aria-labelledby`, `role`, `aria-live` for dynamic content.
- Interactive elements must be keyboard reachable; keep focus visible.
- Forms: `<label>` or `aria-label`/`aria-labelledby` for every input.
- Decorative icons: `aria-hidden="true"`; icon-only buttons: descriptive `aria-label`.
- Error/status messages: accessible to screen readers (`role="alert"` or `aria-live="polite"`).

## Tests per UI component (required on creation)

When adding a **new** `.vue` file under any `ui/` folder (`features/`, `pages/`, `widgets/`, `shared/ui/`, `entities/`), add Storybook in the **same change**:

| File                 | Purpose                                |
| -------------------- | -------------------------------------- |
| `<Name>.stories.ts`  | Storybook — isolated display, variants |
| `<Name>.e2e.spec.ts` | Playwright — when E2E is introduced    |

**Storybook convention:**

- `title` by layer: `Features/<Feature>/<Name>`, `Pages/<Page>/<Name>`, `Shared/UI/<Name>`, `Widgets/<Name>/<Name>`, `Entities/<Entity>/<Name>`
- `@storybook/vue3-vite`, `satisfies Meta<typeof Component>`

**Playwright convention (when introduced):**

- Prefer meaningful selectors: `getByRole`, `getByLabel`, `getByText`
- Tag tests with `@smoke`, `@critical`, and/or `@regression`

## Lighthouse

New and changed UI should meet Lighthouse requirements, especially Accessibility, Best Practices, and Performance.

## Completion checklist

After UI work, run and fix errors:

1. `npx eslint . --fix`
2. `npm run typecheck`
3. `npm run format`
4. `npm run test:coverage` (affected unit tests)
5. Storybook for new/changed `.stories.ts`
6. Playwright for new/changed `.e2e.spec.ts` when E2E exists
