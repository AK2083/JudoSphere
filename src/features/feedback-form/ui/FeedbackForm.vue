<script setup lang="ts">
import { computed, getCurrentInstance, toRef } from 'vue'
import { ArrowDownTrayIcon, PaperClipIcon } from '@heroicons/vue/24/outline'

import { type KnownFingerprintStatus, useTranslation } from '@shared/api'

import translationKeys from '../i18n/keys'
import { formatAttachedExcerptPreview } from '../model/formatAttachedExcerptPreview'
import {
  readTextSelection,
  restoreCollapsedSelectionAfterContextMenu,
  type TextSelectionSnapshot
} from '../model/preserveCollapsedTextSelection'
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
  notesMaxLength,
  knownDisplay,
  knownStatusMessageKey,
  loadState,
  attachedExcerpt,
  attachmentState,
  attachmentErrorReason,
  canPrepareSave,
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

const notesCountLabel = computed(() =>
  t(translationKeys.notesCount, {
    current: notes.value.length,
    max: notesMaxLength
  })
)

const attachmentMessage = computed(() => {
  switch (attachmentState.value) {
    case 'attaching':
      return t(translationKeys.attachmentAttaching)
    case 'attached':
      return formatAttachedExcerptPreview(attachedExcerpt.value)
    case 'error':
      return attachmentErrorReason.value === 'missing'
        ? t(translationKeys.attachmentMissing)
        : t(translationKeys.attachmentError)
    default:
      return t(translationKeys.attachmentIdle)
  }
})

/** Captured on right mouse down so context-menu word selection can be undone. */
let notesSelectionBeforeContextMenu: TextSelectionSnapshot | null = null

function onNotesInput(event: Event): void {
  setNotes((event.target as HTMLTextAreaElement).value)
}

function onNotesMouseDown(event: MouseEvent): void {
  if (event.button !== 2) {
    notesSelectionBeforeContextMenu = null
    return
  }
  notesSelectionBeforeContextMenu = readTextSelection(event.currentTarget as HTMLTextAreaElement)
}

function onNotesContextMenu(event: MouseEvent): void {
  const snapshot = notesSelectionBeforeContextMenu
  notesSelectionBeforeContextMenu = null
  if (!snapshot) {
    return
  }
  restoreCollapsedSelectionAfterContextMenu(event.currentTarget as HTMLTextAreaElement, snapshot)
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
          rows="3"
          :value="notes"
          :maxlength="notesMaxLength"
          :placeholder="t(translationKeys.notesPlaceholder)"
          aria-describedby="feedback-form-notes-help feedback-form-notes-count"
          @input="onNotesInput"
          @mousedown="onNotesMouseDown"
          @contextmenu="onNotesContextMenu"
        />
        <p
          id="feedback-form-notes-count"
          class="feedback-form__notes-count"
          data-testid="feedback-form-notes-count"
          aria-live="polite"
        >
          {{ notesCountLabel }}
        </p>
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
        <div class="feedback-form__attachment-row">
          <input
            id="feedback-form-attachment-status"
            class="feedback-form__attachment-input"
            type="text"
            readonly
            :value="attachmentMessage"
            aria-readonly="true"
            aria-labelledby="feedback-form-attachment-label"
            aria-describedby="feedback-form-attachment-help"
            data-testid="feedback-form-attachment-status"
          />
          <button
            type="button"
            class="feedback-form__button feedback-form__button--secondary feedback-form__attachment-upload"
            :disabled="attachmentState === 'attaching' || draftSaveFeedback === 'saving'"
            :aria-label="t(translationKeys.attachAction)"
            :title="t(translationKeys.attachAction)"
            @click="onAttach"
          >
            <PaperClipIcon
              class="feedback-form__attachment-upload-icon"
              width="20"
              height="20"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      <div class="feedback-form__actions">
        <button
          type="button"
          class="feedback-form__button feedback-form__button--primary"
          data-testid="feedback-form-prepare"
          :disabled="
            !canPrepareSave || draftSaveFeedback === 'saving' || attachmentState === 'attaching'
          "
          @click="onPrepareSave"
        >
          <ArrowDownTrayIcon class="feedback-form__button-icon" aria-hidden="true" />
          <span>{{ t(translationKeys.prepareAction) }}</span>
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
      </div>
    </form>
  </section>
</template>

<style scoped>
.feedback-form {
  --feedback-border: color-mix(in srgb, var(--js-color-fg, #000000) 24%, transparent);
  --feedback-gap: 1.6rem;

  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
  width: 100%;
  height: auto;
  min-height: 0;
  padding: 0;
  overflow: hidden;
  color: var(--js-color-fg, #000000);
  background: transparent;
}

.feedback-form__header {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: 0.55rem;
  padding-right: 2rem;
}

.feedback-form__header h2 {
  margin: 0;
  font-size: 1.15rem;
  line-height: 1.25;
}

.feedback-form__header p,
.feedback-form__help {
  margin: 0;
  color: var(--js-color-fg-muted, #0a0a0a);
  font-size: 0.85rem;
  line-height: 1.3;
}

.feedback-form__body {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: var(--feedback-gap);
  min-height: 0;
  overflow: hidden;
}

.feedback-form__field,
.feedback-form__status,
.feedback-form__attachment {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: 0.25rem;
}

.feedback-form__actions {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: 0.35rem;
  align-items: flex-start;
}

.feedback-form__label {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.25;
}

.feedback-form__notes {
  box-sizing: border-box;
  width: 100%;
  height: 5.5rem;
  min-height: 5.5rem;
  max-height: 5.5rem;
  padding: 0.5rem 0.65rem;
  border: 1px solid var(--feedback-border);
  border-radius: 0.35rem;
  background: var(--js-color-surface, #ffffff);
  color: var(--js-color-fg, #000000);
  font: inherit;
  font-size: 0.9rem;
  line-height: 1.35;
  resize: none;
  overflow: hidden;
}

.feedback-form__notes:focus,
.feedback-form__notes:focus-visible {
  outline: none;
  border-color: color-mix(in srgb, var(--js-color-fg, #000000) 55%, transparent);
}

.feedback-form__notes-count {
  margin: 0;
  align-self: flex-end;
  color: var(--js-color-fg-muted, #0a0a0a);
  font-size: 0.75rem;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.feedback-form__status-value {
  margin: 0;
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--feedback-border);
  border-radius: 0.35rem;
  background: var(--js-color-surface, #ffffff);
  font-size: 0.85rem;
  line-height: 1.3;
  overflow: hidden;
}

.feedback-form__attachment-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
}

.feedback-form__attachment-input {
  box-sizing: border-box;
  flex: 1 1 auto;
  min-width: 0;
  height: 2rem;
  padding: 0 0.65rem;
  border: 1px solid var(--feedback-border);
  border-radius: 0.35rem;
  background: var(--js-color-surface, #ffffff);
  color: var(--js-color-fg, #000000);
  font: inherit;
  font-size: 0.85rem;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.feedback-form__attachment-input:focus,
.feedback-form__attachment-input:focus-visible {
  outline: none;
  border-color: color-mix(in srgb, var(--js-color-fg, #000000) 55%, transparent);
}

.feedback-form__attachment-upload {
  flex: 0 0 auto;
  width: 2rem;
  min-height: 2rem;
  height: 2rem;
  padding: 0;
  margin-left: auto;
}

.feedback-form__attachment-upload-icon {
  display: block;
  width: 1.25rem !important;
  height: 1.25rem !important;
  min-width: 1.25rem;
  min-height: 1.25rem;
  flex: none;
  color: inherit;
  stroke: currentColor;
  fill: none;
  filter: none;
  box-shadow: none;
  text-shadow: none;
}

.feedback-form__status[data-known-status='known'] .feedback-form__status-value,
.feedback-form__status[data-known-status='in_progress'] .feedback-form__status-value,
.feedback-form__attachment[data-attachment-state='attached'] .feedback-form__attachment-input {
  background: color-mix(in srgb, #1f7a3f 10%, var(--js-color-surface, #ffffff));
}

.feedback-form__status[data-known-status='error'] .feedback-form__status-value,
.feedback-form__attachment[data-attachment-state='error'] .feedback-form__attachment-input {
  background: color-mix(in srgb, #b42318 10%, var(--js-color-surface, #ffffff));
}

.feedback-form__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  align-self: flex-start;
  min-height: 2rem;
  padding: 0.35rem 0.75rem;
  border: 1px solid var(--feedback-border);
  border-radius: 0.35rem;
  font: inherit;
  font-size: 0.85rem;
  line-height: 1.2;
  cursor: pointer;
}

.feedback-form__button-icon {
  display: block;
  width: 1rem;
  height: 1rem;
  color: inherit;
  stroke: currentColor;
  fill: none;
  filter: none;
  box-shadow: none;
  text-shadow: none;
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
  padding: 0.45rem 0.65rem;
  border-radius: 0.35rem;
  border: 1px solid var(--feedback-border);
  font-size: 0.85rem;
  line-height: 1.3;
  overflow: hidden;
}

.feedback-form__save-feedback--success {
  background: color-mix(in srgb, #1f7a3f 14%, var(--js-color-surface, #ffffff));
  border-color: color-mix(in srgb, #1f7a3f 45%, var(--feedback-border));
}

.feedback-form__save-feedback--error {
  background: color-mix(in srgb, #b42318 12%, var(--js-color-surface, #ffffff));
  border-color: color-mix(in srgb, #b42318 45%, var(--feedback-border));
}

@media (max-width: 480px) {
  .feedback-form {
    --feedback-gap: 1.25rem;
  }

  .feedback-form__notes {
    height: 4.75rem;
    min-height: 4.75rem;
    max-height: 4.75rem;
  }
}
</style>
