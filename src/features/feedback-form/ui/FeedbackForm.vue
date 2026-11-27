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
  /** Optional raw log extract; sanitized on the host before attach. */
  logExcerptRaw?: string | null
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
const {
  notes,
  knownDisplay,
  knownStatusMessageKey,
  loadState,
  attachmentState,
  hasAttachment,
  draftSaveFeedback,
  setNotes,
  attachSanitizedLogExtract,
  prepareAndSaveDraft
} = useFeedbackForm({
  fingerprint: toRef(props, 'fingerprint'),
  initialNotes: props.initialNotes,
  logExcerptRaw: toRef(props, 'logExcerptRaw'),
  useKnownStatusOverride,
  knownStatusOverride: toRef(props, 'knownStatusOverride')
})

const statusMessage = computed(() => t(knownStatusMessageKey.value))

const attachmentMessage = computed(() => {
  switch (attachmentState.value) {
    case 'attaching':
      return t(translationKeys.attachmentAttaching)
    case 'attached':
      return t(translationKeys.attachmentAttached)
    case 'error':
      return t(translationKeys.attachmentError)
    default:
      return t(translationKeys.attachmentIdle)
  }
})

function onNotesInput(event: Event): void {
  setNotes((event.target as HTMLTextAreaElement).value)
}

async function onAttach(): Promise<void> {
  await attachSanitizedLogExtract()
}

async function onPrepareSave(): Promise<void> {
  await prepareAndSaveDraft()
}

/**
 * Blocks native form submit; explicit prepare uses the draft action instead.
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

      <div class="feedback-form__attachment" :data-attachment-state="attachmentState">
        <h3 id="feedback-form-attachment-label" class="feedback-form__label">
          {{ t(translationKeys.attachmentLabel) }}
        </h3>
        <p id="feedback-form-attachment-help" class="feedback-form__help">
          {{ t(translationKeys.attachmentHelp) }}
        </p>
        <p
          class="feedback-form__attachment-value"
          role="status"
          aria-live="polite"
          aria-labelledby="feedback-form-attachment-label"
          aria-describedby="feedback-form-attachment-help"
          data-testid="feedback-form-attachment-status"
        >
          {{ attachmentMessage }}
        </p>
        <button
          type="button"
          class="feedback-form__button feedback-form__button--secondary"
          :disabled="attachmentState === 'attaching' || draftSaveFeedback === 'saving'"
          @click="onAttach"
        >
          {{ t(translationKeys.attachAction) }}
        </button>
      </div>

      <div class="feedback-form__actions">
        <button
          type="button"
          class="feedback-form__button feedback-form__button--primary"
          data-testid="feedback-form-prepare"
          :disabled="draftSaveFeedback === 'saving' || attachmentState === 'attaching'"
          @click="onPrepareSave"
        >
          {{ t(translationKeys.prepareAction) }}
        </button>

        <p
          v-if="draftSaveFeedback === 'success'"
          class="feedback-form__save-feedback feedback-form__save-feedback--success"
          role="status"
          aria-live="polite"
          data-testid="feedback-form-prepare-success"
        >
          {{ t(translationKeys.prepareSuccess) }}
        </p>
        <p
          v-else-if="draftSaveFeedback === 'error'"
          class="feedback-form__save-feedback feedback-form__save-feedback--error"
          role="alert"
          aria-live="assertive"
          data-testid="feedback-form-prepare-error"
        >
          {{ t(translationKeys.prepareError) }}
        </p>
        <p
          v-else-if="hasAttachment"
          class="feedback-form__help"
          data-testid="feedback-form-attachment-ready"
        >
          {{ t(translationKeys.attachmentAttached) }}
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
.feedback-form__status,
.feedback-form__attachment,
.feedback-form__actions {
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

.feedback-form__status-value,
.feedback-form__attachment-value {
  margin: 0;
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--feedback-border);
  border-radius: 0.35rem;
  background: var(--js-color-surface, #ffffff);
  line-height: 1.4;
}

.feedback-form__status[data-known-status='known'] .feedback-form__status-value,
.feedback-form__status[data-known-status='in_progress'] .feedback-form__status-value,
.feedback-form__attachment[data-attachment-state='attached'] .feedback-form__attachment-value {
  background: color-mix(in srgb, #1f7a3f 10%, var(--js-color-surface, #ffffff));
}

.feedback-form__status[data-known-status='error'] .feedback-form__status-value,
.feedback-form__attachment[data-attachment-state='error'] .feedback-form__attachment-value {
  background: color-mix(in srgb, #b42318 10%, var(--js-color-surface, #ffffff));
}

.feedback-form__button {
  align-self: flex-start;
  min-height: 2.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--feedback-border);
  border-radius: 0.35rem;
  font: inherit;
  line-height: 1.25;
  cursor: pointer;
}

.feedback-form__button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.feedback-form__button:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--js-color-fg, #000000) 45%, transparent);
  outline-offset: 2px;
}

.feedback-form__button--primary {
  background: var(--js-color-fg, #000000);
  border-color: var(--js-color-fg, #000000);
  color: var(--js-color-bg, #f6f6f6);
}

.feedback-form__button--secondary {
  background: var(--js-color-surface, #ffffff);
  color: var(--js-color-fg, #000000);
}

.feedback-form__save-feedback {
  margin: 0;
  padding: 0.65rem 0.85rem;
  border-radius: 0.35rem;
  border: 1px solid var(--feedback-border);
  line-height: 1.35;
}

.feedback-form__save-feedback--success {
  background: color-mix(in srgb, #1f7a3f 14%, var(--js-color-surface, #ffffff));
  border-color: color-mix(in srgb, #1f7a3f 45%, var(--feedback-border));
}

.feedback-form__save-feedback--error {
  background: color-mix(in srgb, #b42318 12%, var(--js-color-surface, #ffffff));
  border-color: color-mix(in srgb, #b42318 45%, var(--feedback-border));
}
</style>
