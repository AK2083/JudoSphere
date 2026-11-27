<script setup lang="ts">
import { computed, getCurrentInstance, toRef } from 'vue'

import { type KnownFingerprintStatus, useTranslation } from '@shared/api'

import translationKeys from '../i18n/keys'
import { useFeedbackForm } from '../model/useFeedbackForm'

const props = defineProps<{
  /** Linked error fingerprint from preprocess / recovery flows. */
  fingerprint?: string | null
  /** Seed notes when opening a prepared draft context. */
  initialNotes?: string
  /**
   * When the attribute is present (including `null`), skip the host known-status read.
   * Used by Storybook and tests for deterministic known-status states.
   */
  knownStatusOverride?: KnownFingerprintStatus | null
}>()

const rawProps = getCurrentInstance()?.vnode.props
const useKnownStatusOverride =
  rawProps != null && ('knownStatusOverride' in rawProps || 'known-status-override' in rawProps)

const { t } = useTranslation()
const { notes, knownDisplay, knownStatusMessageKey, loadState, setNotes } = useFeedbackForm({
  fingerprint: toRef(props, 'fingerprint'),
  initialNotes: props.initialNotes,
  useKnownStatusOverride,
  knownStatusOverride: toRef(props, 'knownStatusOverride')
})

const statusMessage = computed(() => t(knownStatusMessageKey.value))

function onNotesInput(event: Event): void {
  setNotes((event.target as HTMLTextAreaElement).value)
}

/**
 * Blocks native form submit. Prepare/save draft is owned by a later Task.
 */
function onSubmit(): void {
  return
}
</script>

<template>
  <section class="feedback-form" aria-labelledby="feedback-form-title">
    <header class="feedback-form__header">
      <h2 id="feedback-form-title">{{ t(translationKeys.title) }}</h2>
      <p>{{ t(translationKeys.description) }}</p>
    </header>

    <form class="feedback-form__body" @submit.prevent="onSubmit">
      <div class="feedback-form__field">
        <label class="feedback-form__label" for="feedback-form-notes">
          {{ t(translationKeys.notesLabel) }}
        </label>
        <p id="feedback-form-notes-help" class="feedback-form__help">
          {{ t(translationKeys.notesHelp) }}
        </p>
        <textarea
          id="feedback-form-notes"
          class="feedback-form__notes"
          rows="5"
          :value="notes"
          :placeholder="t(translationKeys.notesPlaceholder)"
          aria-describedby="feedback-form-notes-help"
          @input="onNotesInput"
        />
      </div>

      <div
        class="feedback-form__status"
        :data-known-status="knownDisplay"
        :data-load-state="loadState"
      >
        <h3 id="feedback-form-known-label" class="feedback-form__label">
          {{ t(translationKeys.knownStatusLabel) }}
        </h3>
        <p id="feedback-form-known-help" class="feedback-form__help">
          {{ t(translationKeys.knownStatusHelp) }}
        </p>
        <p
          class="feedback-form__status-value"
          role="status"
          aria-live="polite"
          aria-labelledby="feedback-form-known-label"
          aria-describedby="feedback-form-known-help"
        >
          {{ statusMessage }}
        </p>
      </div>
    </form>
  </section>
</template>

<style scoped>
.feedback-form {
  --feedback-border: color-mix(in srgb, var(--js-color-fg, #000000) 24%, transparent);
  --feedback-space: 0.75rem;
  --feedback-gap: 1.25rem;

  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--feedback-gap);
  width: 100%;
  padding: 1rem;
  color: var(--js-color-fg, #000000);
  background: var(--js-color-bg, #f6f6f6);
}

.feedback-form__header {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.feedback-form__header h2 {
  margin: 0;
  font-size: 1.35rem;
  line-height: 1.3;
}

.feedback-form__header p,
.feedback-form__help {
  margin: 0;
  color: var(--js-color-fg-muted, #0a0a0a);
}

.feedback-form__body {
  display: flex;
  flex-direction: column;
  gap: var(--feedback-gap);
}

.feedback-form__field,
.feedback-form__status {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.feedback-form__label {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.3;
}

.feedback-form__notes {
  box-sizing: border-box;
  width: 100%;
  min-height: 7rem;
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--feedback-border);
  border-radius: 0.35rem;
  background: var(--js-color-surface, #ffffff);
  color: var(--js-color-fg, #000000);
  font: inherit;
  line-height: 1.4;
  resize: vertical;
}

.feedback-form__notes:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--js-color-fg, #000000) 45%, transparent);
  outline-offset: 2px;
}

.feedback-form__status-value {
  margin: 0;
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--feedback-border);
  border-radius: 0.35rem;
  background: var(--js-color-surface, #ffffff);
  line-height: 1.4;
}

.feedback-form__status[data-known-status='known'] .feedback-form__status-value,
.feedback-form__status[data-known-status='in_progress'] .feedback-form__status-value {
  background: color-mix(in srgb, #1f7a3f 10%, var(--js-color-surface, #ffffff));
}

.feedback-form__status[data-known-status='error'] .feedback-form__status-value {
  background: color-mix(in srgb, #b42318 10%, var(--js-color-surface, #ffffff));
}
</style>
