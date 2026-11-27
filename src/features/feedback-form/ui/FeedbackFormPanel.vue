<script setup lang="ts">
import { computed, watch } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'

import { useTranslation } from '@shared/api'

import translationKeys from '../i18n/keys'
import { useFeedbackFormLauncher } from '../model/useFeedbackFormLauncher'
import FeedbackForm from './FeedbackForm.vue'

const { t } = useTranslation()
const { isOpen, context, closeFeedbackForm } = useFeedbackFormLauncher()

const open = computed(() => isOpen.value)

const formBind = computed(() => {
  const current = context.value
  const base: {
    fingerprint: string | null | undefined
    initialNotes: string | undefined
    logExcerptRaw: string | null | undefined
    knownStatusOverride?: typeof current.knownStatusOverride
  } = {
    fingerprint: current.fingerprint,
    initialNotes: current.initialNotes,
    logExcerptRaw: current.logExcerptRaw
  }
  if (current.knownStatusOverride !== undefined) {
    base.knownStatusOverride = current.knownStatusOverride
  }
  return base
})

watch(open, (value) => {
  if (!value) {
    return
  }
  queueMicrotask(() => {
    const closeButton = document.querySelector<HTMLButtonElement>(
      '[data-testid="feedback-form-panel-close"]'
    )
    closeButton?.focus()
  })
})

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    closeFeedbackForm()
  }
}
</script>

<template>
  <div
    v-if="open"
    class="feedback-form-panel"
    role="dialog"
    aria-modal="true"
    :aria-label="t(translationKeys.title)"
    data-testid="feedback-form-panel"
    @keydown="onKeydown"
  >
    <div
      class="feedback-form-panel__backdrop"
      data-testid="feedback-form-panel-backdrop"
      @click="closeFeedbackForm"
    />
    <div class="feedback-form-panel__sheet">
      <div class="feedback-form-panel__toolbar">
        <button
          type="button"
          class="feedback-form-panel__close"
          data-testid="feedback-form-panel-close"
          :aria-label="t(translationKeys.panelClose)"
          :title="t(translationKeys.panelClose)"
          @click="closeFeedbackForm"
        >
          <XMarkIcon class="feedback-form-panel__close-icon" aria-hidden="true" />
        </button>
      </div>
      <div class="feedback-form-panel__body">
        <FeedbackForm
          :key="`${context.source}:${context.fingerprint ?? ''}:${context.initialNotes}`"
          v-bind="formBind"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.feedback-form-panel {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: center;
  padding: 0.75rem;
}

.feedback-form-panel__backdrop {
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, var(--js-color-fg, #000000) 35%, transparent);
}

.feedback-form-panel__sheet {
  --feedback-panel-inset: 1.25rem;
  --feedback-panel-width: min(40rem, calc(100vw - 1.5rem));

  position: relative;
  z-index: 1;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: var(--feedback-panel-width);
  height: auto;
  max-width: calc(100vw - 1.5rem);
  max-height: calc(100dvh - 1.5rem);
  padding: var(--feedback-panel-inset);
  overflow: hidden;
  resize: none;
  border: 1px solid color-mix(in srgb, var(--js-color-fg, #000000) 24%, transparent);
  border-radius: 0.35rem;
  background: var(--js-color-bg, #f6f6f6);
  box-shadow: 0 0.5rem 1.5rem color-mix(in srgb, var(--js-color-fg, #000000) 18%, transparent);
}

.feedback-form-panel__toolbar {
  position: absolute;
  top: var(--feedback-panel-inset);
  right: var(--feedback-panel-inset);
  z-index: 2;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0;
}

.feedback-form-panel__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  padding: 0;
  border: none;
  border-radius: 0.35rem;
  background: transparent;
  color: var(--js-color-fg, #000000);
  cursor: pointer;
}

.feedback-form-panel__close-icon {
  display: block;
  width: 1.15rem;
  height: 1.15rem;
  color: inherit;
  stroke: currentColor;
  fill: none;
  filter: none;
  box-shadow: none;
  text-shadow: none;
}

.feedback-form-panel__close:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--js-color-fg, #000000) 45%, transparent);
  outline-offset: 2px;
}

.feedback-form-panel__body {
  flex: 0 1 auto;
  min-height: 0;
  overflow: hidden;
}

@media (max-width: 480px) {
  .feedback-form-panel {
    padding: 0.5rem;
  }

  .feedback-form-panel__sheet {
    --feedback-panel-inset: 1rem;
    --feedback-panel-width: calc(100vw - 1rem);
    max-width: calc(100vw - 1rem);
    max-height: calc(100dvh - 1rem);
  }
}
</style>
