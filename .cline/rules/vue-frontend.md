---
description: Vue 3 frontend — components, composables, Tailwind CSS, testing (Playwright + Storybook), accessibility, and i18n
globs: src/**/*.vue
alwaysApply: false
---

# Vue 3 Frontend

This rule applies to all Vue components in `src/` (frontend). It covers structure, styling with Tailwind CSS, testing patterns (Playwright E2E + Storybook), internationalization (i18n), and accessibility (a11y).

---

## Components & Script Setup

**Rules:**

- All components must use `<script setup lang="ts">` — no Options API or class-based components.
- No business logic in templates — use the component for UI binding only. Logic belongs in **composables** (`model/use-*.ts`), **services** (`service/`), or **API wrappers** (`api/`).
- Keep components focused and small. Complex UIs should be split into smaller presentational components.
- Import types and composables at the top. Group imports by source: `vue` → `@shared` → relative imports.

```vue
<script setup lang="ts">
import { computed } from 'vue'
import type { Athlete } from '@shared/types'
import { useAthlete } from '@features/athlete/model/use-athlete'

const props = withDefaults(
  defineProps<{
    athleteId: string
    editable?: boolean
  }>(),
  {
    editable: false
  }
)

const emit = defineEmits<{
  save: [athlete: Athlete]
  cancel: []
}>()

const { athlete, isLoading, save } = useAthlete(props.athleteId)

const canEdit = computed(() => props.editable && !isLoading.value)

const handleSave = async () => {
  await save()
  emit('save', athlete.value!)
}
</script>

<template>
  <div class="space-y-4">
    <!-- Template binds state and events only; no logic -->
    <p>{{ athlete?.name }}</p>
    <button :disabled="!canEdit" @click="handleSave">
      {{ t('save') }}
    </button>
  </div>
</template>
```

---

## Styling with Tailwind CSS

**Rules (per Tailwind utility-first philosophy):**

- Use Tailwind utility classes exclusively — no custom CSS in `<style>` blocks unless scoped component-specific behavior is absolutely necessary.
- Build layouts with `flex` and `grid` utilities: `flex flex-col gap-4`, `grid grid-cols-3 gap-6`.
- Responsive classes use Tailwind breakpoints: `flex-col md:flex-row lg:flex-row xl:flex-row`.
- Spacing via Tailwind scale: `p-4`, `m-2`, `gap-6` — no custom pixel values.
- Colors from Tailwind palette: `bg-blue-500`, `text-gray-700`, `border-red-300`. Never `bg-#1a2b3c` or hardcoded hex.
- State variants for interactivity: `hover:bg-blue-600`, `focus:ring-2 focus:ring-blue-500`, `disabled:opacity-50`, `group-hover:text-white`.
- Use `@apply` in `<style scoped>` **only** for repeated utility combinations within a single component, not globally. Prefer extracting a sub-component over `@apply`.

```vue
<template>
  <div class="flex flex-col gap-4 md:flex-row lg:gap-6">
    <!-- Responsive grid -->
    <section class="flex-1 p-4 md:p-6 bg-white rounded-lg shadow">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">{{ t('athletes') }}</h2>
      <ul class="space-y-2">
        <li
          v-for="athlete in athletes"
          :key="athlete.id"
          class="p-3 hover:bg-gray-50 rounded cursor-pointer transition"
        >
          {{ athlete.name }}
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
/* Use @apply sparingly for scoped repeated patterns */
.card-header {
  @apply text-lg font-semibold text-gray-900 mb-4;
}
</style>
```

**Dark mode** (if Tailwind dark mode is enabled):

- Use `dark:` prefix for dark-mode variants: `bg-white dark:bg-gray-900`, `text-gray-900 dark:text-white`.
- Test both light and dark modes in Storybook and Playwright.

---

## Internationalization (i18n)

Supported languages: **German** (de) and **English** (en). No hardcoded strings.

**Slice structure** (under `features/<feature>/<slice>/i18n/`):

```
i18n/
  keys.ts    # Translation key paths — type-safe keys for the component
  de.ts      # German translations (one file)
  en.ts      # English translations (one file)
  index.ts   # Re-exports de and en for parent feature aggregation
```

**Rules:**

- One `de.ts` and one `en.ts` per slice — not language-specific folders (`de/`, `en/`).
- Nested objects within `de.ts`/`en.ts` are fine for logical grouping, but keep structure flat where possible (match parent feature i18n paths).
- `keys.ts` exports paths as constants — use in components for type-safe access:

```ts
// i18n/keys.ts
export const athleteFormKeys = {
  title: 'athleteForm.title',
  nameLabel: 'athleteForm.nameLabel',
  saveButton: 'athleteForm.saveButton',
  errors: {
    nameRequired: 'athleteForm.errors.nameRequired'
  }
}
```

- Access translations via `useTranslation()` composable (provided by `@shared/lib/i18n`):

```vue
<script setup lang="ts">
import { useTranslation } from '@shared/lib/i18n'
import { athleteFormKeys } from '../i18n/keys'

const { t } = useTranslation()
</script>

<template>
  <form>
    <label :for="nameId">{{ t(athleteFormKeys.nameLabel) }}</label>
    <input :id="nameId" type="text" required />
    <button type="submit">{{ t(athleteFormKeys.saveButton) }}</button>
  </form>
</template>
```

- Parent feature bundles slice i18n (e.g. `features/athlete/i18n/de.ts` aggregates slices):

```ts
// features/athlete/i18n/de.ts
import { registerAthleteSliceDe } from './register-athlete/i18n'
import { editAthleteSliceDe } from './edit-athlete/i18n'

export const athleteFeatureDe = {
  registerAthlete: registerAthleteSliceDe,
  editAthlete: editAthleteSliceDe
}
```

---

## Responsive Design

**Rules:**

- Use Tailwind breakpoints: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px), `2xl` (1536px).
- Build mobile-first: start with base (mobile) classes, add breakpoint variants for larger screens.
- Test on actual devices or emulated viewports: mobile (320–480px), tablet (768px), desktop (1280px+).
- Use `flex-col md:flex-row` for stacking content vertically on mobile, horizontally on tablet+.
- Avoid fixed pixel widths for layout containers — use `max-w-*` for reading width and let content flow.

```vue
<template>
  <!-- Mobile stack, tablet+ row -->
  <div class="flex flex-col gap-4 md:flex-row md:gap-6">
    <aside class="w-full md:w-64">Side nav</aside>
    <main class="flex-1">Content</main>
  </div>
</template>
```

- If Tailwind provides a responsive component (e.g. `hidden sm:block`), use it. Avoid CSS `@media` queries when Tailwind utilities cover the need.

---

## Accessibility (a11y)

Accessibility is not optional. Every component must meet **WCAG 2.1 Level AA** standards.

**Rules:**

### ARIA Attributes

- Use **semantic HTML** first: `<button>`, `<form>`, `<label>`, `<section>`, `<nav>`, not divs styled as buttons.
- Every interactive element must have a **descriptive `aria-label`** or be associated with visible text via `aria-labelledby`:

```vue
<!-- ✅ Button with aria-label -->
<button aria-label="Close dialog" @click="closeDialog">
  <XIcon />
</button>

<!-- ✅ Input with label -->
<label for="athleteName">{{ t('keys.name') }}</label>
<input id="athleteName" type="text" />

<!-- ✅ Field with description -->
<input id="birthDate" type="date" aria-describedby="birthDateHint" required />
<span id="birthDateHint" class="text-sm text-gray-500">
  {{ t('keys.dateFormat') }}
</span>
```

- Decorative icons must have `aria-hidden="true"`:

```vue
<button @click="send">
  <SendIcon aria-hidden="true" />
  {{ t('send') }}
</button>
```

- Form field errors: use `aria-live="polite"` or `role="alert"` so screen readers announce validation messages:

```vue
<div v-if="fieldError" role="alert" class="text-red-600">
  {{ fieldError }}
</div>
```

- Dialogs/modals must have `role="dialog"` and focus trap to prevent keyboard navigation outside:

```vue
<div role="dialog" aria-labelledby="dialogTitle" aria-modal="true">
  <h2 id="dialogTitle">{{ t('confirmDelete') }}</h2>
  <!-- Content -->
</div>
```

### Keyboard Navigation

- All interactive elements (`buttons`, `inputs`, `links`) must be keyboard-reachable (via **Tab**, **Enter**, **Space**).
- Do **not** disable `:focus` styles — style them distinctly: `focus:ring-2 focus:ring-blue-500 focus:outline-none`.
- Menu/dropdown components must support **Arrow keys** (up/down) and **Escape** to close.
- Test by tabbing through the page; focus indicator must be visible at all times.

### Color & Contrast

- Text color contrast must be at least **4.5:1** for normal text, **3:1** for large text (per WCAG AA).
- Never use color alone to convey meaning — pair with text, icons, or patterns: "Status: ✓ Approved" not just a green dot.
- Avoid red-green combinations without additional visual indicators.

### Focus Management

- When opening a modal/dialog, move focus into it and trap it (do not allow Tab beyond the modal).
- When closing a modal, restore focus to the trigger button.
- Lazy-loaded lists: announce new items to screen readers via `aria-live="polite"`.

### Testing Accessibility

- Use **Lighthouse Accessibility audit** in Chrome DevTools (run before marking complete).
- Use **axe DevTools** browser extension to catch ARIA violations.
- Test with screen readers (NVDA on Windows, JAWS if available, VoiceOver on macOS).
- Minimum: test navigation with keyboard only (Tab, Enter, Esc, Arrow keys).

---

## Testing: Storybook

Every UI component must have a `.stories.ts` file showing all interactive states and variants.

**File structure:**

- `ui/<ComponentName>.vue`
- `ui/<ComponentName>.stories.ts`
- `ui/<ComponentName>.e2e.spec.ts`

**Story conventions (CSF 3 with TypeScript):**

```ts
// ui/AthleteCard.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3'
import AthleteCard from './AthleteCard.vue'
import type { Athlete } from '@shared/types'

const mockAthlete: Athlete = {
  id: '1',
  name: 'John Doe',
  belt: 'white',
  dob: '2010-05-15'
}

const meta = {
  component: AthleteCard,
  tags: ['autodocs'],
  argTypes: {
    athlete: { control: 'object', description: 'Athlete data' },
    editable: { control: 'boolean', description: 'Allow inline editing' }
  }
} satisfies Meta<typeof AthleteCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    athlete: mockAthlete,
    editable: false
  }
}

export const Editable: Story = {
  args: {
    athlete: mockAthlete,
    editable: true
  }
}

export const Mobile: Story = {
  args: {
    athlete: mockAthlete,
    editable: false
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    }
  }
}

export const Loaded: Story = {
  args: {
    athlete: mockAthlete,
    editable: false
  },
  play: async ({ canvasElement }) => {
    // Interaction test — optional but encouraged
    const button = canvasElement.querySelector('button')
    await expect(button).toBeVisible()
  }
}
```

**Story guidelines:**

- `title` path: `Features/Athlete/AthleteCard`, `Pages/Dashboard/Dashboard`, `Shared/UI/Badge`, `Widgets/Navigation/Navigation`.
- Create stories for **all** component states: default, loading, error, empty, disabled, focused.
- Use `parameters: { viewport: { defaultViewport: 'mobile1' } }` for mobile variants.
- Include `play` functions to test interactions within Storybook UI.
- Set `tags: ['autodocs']` to auto-generate documentation.

---

## Testing: Playwright E2E

Every UI component must have a `.e2e.spec.ts` file testing critical user interactions.

**File structure:** (same as Storybook)

- `ui/<ComponentName>.e2e.spec.ts`

**Playwright test conventions:**

```ts
// ui/AthleteCard.e2e.spec.ts
import { expect, test } from '@playwright/test'

test.describe('AthleteCard', { tag: '@regression' }, () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/athletes')
  })

  test('renders athlete name and belt rank', { tag: ['@smoke', '@critical'] }, async ({ page }) => {
    const card = page.locator('[data-testid="athlete-card-1"]')
    await expect(card).toBeVisible()
    await expect(card.locator('text=John Doe')).toBeVisible()
  })

  test('edit button is disabled when not editable', async ({ page }) => {
    const card = page.locator('[data-testid="athlete-card-1"]')
    const editButton = card.locator('button:has-text("Edit")')
    await expect(editButton).toBeDisabled()
  })

  test('renders on mobile viewport', { tag: '@regression' }, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    const card = page.locator('[data-testid="athlete-card-1"]')
    await expect(card).toBeVisible()
  })

  test('keyboard focus is visible on button', async ({ page }) => {
    const editButton = page.locator('[data-testid="athlete-card-1"] button')
    await editButton.focus()
    await expect(editButton).toBeFocused()
  })
})
```

**Playwright best practices:**

- Use **built-in locators** over CSS selectors: `getByRole('button')`, `getByLabel('Name')`, `getByTestId('athlete-card')`.
- Avoid testing implementation details — test **user-visible behavior** only.
- Use `data-testid` for elements where role/label/text locators are insufficient.
- Tag every test with at least `@regression`. Add `@smoke` for fast sanity checks, `@critical` for blocking flows.
- Keep tests **isolated**: each test should set up state via `beforeEach`.

**Test tags:**

| Tag           | When to use                                                                    |
| ------------- | ------------------------------------------------------------------------------ |
| `@smoke`      | Quick "still renders" checks — route loads, component mounts, basic UI visible |
| `@critical`   | Must-not-break flows — auth, core navigation, tournament data forms            |
| `@regression` | Full coverage — every E2E test **must** have this tag                          |

Run by tag:

```bash
npm run test:e2e              # Run all (@regression)
npm run test:e2e:smoke       # Run @smoke only
npm run test:e2e:critical    # Run @critical only
```

---

## Component File Naming

- **Component files:** `PascalCase.vue` (e.g. `AthleteCard.vue`, `TournamentForm.vue`)
- **Composable files:** `use<Name>.ts` (e.g. `useAthlete.ts`, `useFormValidation.ts`)
- **Story files:** `<ComponentName>.stories.ts` (e.g. `AthleteCard.stories.ts`)
- **E2E test files:** `<ComponentName>.e2e.spec.ts` (e.g. `AthleteCard.e2e.spec.ts`)

---

## Completion Checklist

After creating or modifying UI components:

1. ✅ **Component uses `<script setup lang="ts">`** — no Options API
2. ✅ **No business logic in template** — use composables and computed for state
3. ✅ **Styling is Tailwind utilities only** — no custom CSS (except scoped `@apply`)
4. ✅ **All text via `t(keys.translationKey)`** — no hardcoded strings
5. ✅ **Responsive classes used** — tested on mobile (375px), tablet (768px), desktop (1280px+)
6. ✅ **Accessibility checklist:**
   - Semantic HTML (`<button>`, `<label>`, `<section>`, etc.)
   - ARIA labels on interactive elements
   - Decorative icons have `aria-hidden="true"`
   - Error messages have `role="alert"` or `aria-live="polite"`
   - Keyboard navigation works (Tab, Enter, Escape, Arrow keys)
   - Focus styles visible (not removed)
   - Lighthouse Accessibility audit passed (no regressions)
7. ✅ **Storybook story created** — `<ComponentName>.stories.ts` with ≥3 stories (default, variant, mobile)
8. ✅ **Playwright E2E test created** — `<ComponentName>.e2e.spec.ts` with `@regression`, `@smoke`, `@critical` tags
9. ✅ **Run linters:**
   ```bash
   npm run lint:fix
   npm run type:check
   npm run format:fix
   ```
10. ✅ **Tests pass:**
    ```bash
    npm run test:storybook
    npm run test:e2e:regression
    npm run test:coverage
    ```

---

## Quick-Reference: Common Patterns

### Form with i18n validation

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTranslation } from '@shared/lib/i18n'
import { formKeys } from '../i18n/keys'

const { t } = useTranslation()
const name = ref('')
const error = computed(() => (!name.value ? t(formKeys.errors.nameRequired) : ''))
</script>

<template>
  <form @submit.prevent="submit">
    <div>
      <label for="name" class="block text-sm font-medium text-gray-900 mb-2">
        {{ t(formKeys.nameLabel) }}
      </label>
      <input
        id="name"
        v-model="name"
        type="text"
        required
        class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
        :aria-describedby="error ? 'nameError' : undefined"
      />
      <div v-if="error" id="nameError" role="alert" class="mt-1 text-sm text-red-600">
        {{ error }}
      </div>
    </div>
    <button
      type="submit"
      class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      :disabled="!!error"
    >
      {{ t(formKeys.submit) }}
    </button>
  </form>
</template>
```

### Responsive grid

```vue
<template>
  <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    <div
      v-for="item in items"
      :key="item.id"
      class="p-4 bg-white rounded-lg shadow hover:shadow-lg transition"
    >
      {{ item.name }}
    </div>
  </div>
</template>
```

### Icon button with aria-label

```vue
<button
  aria-label="Delete athlete"
  class="p-2 text-gray-600 hover:text-red-600 focus:ring-2 focus:ring-red-500 rounded"
  @click="deleteAthlete"
>
  <TrashIcon aria-hidden="true" class="w-5 h-5" />
</button>
```
