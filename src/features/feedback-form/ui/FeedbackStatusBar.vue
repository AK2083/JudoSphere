<script setup lang="ts">
import { ChatBubbleLeftRightIcon } from '@heroicons/vue/24/outline'

import { useTranslation } from '@shared/api'

import translationKeys from '../i18n/keys'
import { useFeedbackFormLauncher } from '../model/useFeedbackFormLauncher'

const { t } = useTranslation()
const {
  recoveryAvailable,
  openFeedbackForm,
  openFeedbackFormFromRecovery,
  dismissFeedbackRecoveryOffer
} = useFeedbackFormLauncher()

function onStatusBarOpen(): void {
  openFeedbackForm({ source: 'status-bar' })
}
</script>

<template>
  <div class="feedback-status-bar" data-testid="feedback-status-bar">
    <div class="feedback-status-bar__start">
      <div
        v-if="recoveryAvailable"
        class="feedback-status-bar__recovery"
        role="status"
        aria-live="polite"
        data-testid="feedback-recovery-offer"
      >
        <p class="feedback-status-bar__recovery-copy">
          {{ t(translationKeys.recoveryOffer) }}
        </p>
        <div class="feedback-status-bar__recovery-actions">
          <button
            type="button"
            class="feedback-status-bar__button"
            data-testid="feedback-recovery-open"
            @click="openFeedbackFormFromRecovery"
          >
            {{ t(translationKeys.recoveryOpen) }}
          </button>
          <button
            type="button"
            class="feedback-status-bar__button"
            data-testid="feedback-recovery-dismiss"
            @click="dismissFeedbackRecoveryOffer"
          >
            {{ t(translationKeys.recoveryDismiss) }}
          </button>
        </div>
      </div>
    </div>

    <div class="feedback-status-bar__end" data-testid="app-shell-status-end">
      <button
        type="button"
        class="feedback-status-bar__open"
        data-testid="feedback-status-open"
        :aria-label="t(translationKeys.statusBarOpen)"
        :title="t(translationKeys.statusBarOpen)"
        @click="onStatusBarOpen"
      >
        <ChatBubbleLeftRightIcon class="feedback-status-bar__icon" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.feedback-status-bar {
  display: flex;
  flex: 1 1 auto;
  align-items: stretch;
  min-width: 0;
  width: 100%;
}

.feedback-status-bar__start {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  min-width: 0;
  padding: 0.15rem 0.5rem;
}

.feedback-status-bar__end {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: flex-end;
  padding: 0.15rem 0.35rem;
}

.feedback-status-bar__recovery {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.5rem;
  align-items: center;
  width: 100%;
}

.feedback-status-bar__recovery-copy {
  margin: 0;
  flex: 1 1 12rem;
  color: var(--js-color-fg-muted, #0a0a0a);
  font-size: 0.75rem;
  line-height: 1.25;
}

.feedback-status-bar__recovery-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.feedback-status-bar__open,
.feedback-status-bar__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-height: 1.5rem;
  height: 1.5rem;
  padding: 0 0.45rem;
  border: none;
  border-radius: 0.35rem;
  background: transparent;
  color: var(--js-color-fg, #000000);
  font: inherit;
  font-size: 0.75rem;
  line-height: 1.2;
  text-decoration: none;
  cursor: pointer;
}

.feedback-status-bar__open {
  width: 1.5rem;
  padding: 0;
}

.feedback-status-bar__icon {
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

.feedback-status-bar__open:hover,
.feedback-status-bar__open:focus-visible,
.feedback-status-bar__button:hover,
.feedback-status-bar__button:focus-visible {
  color: var(--js-color-fg, #000000);
  outline: 2px solid color-mix(in srgb, var(--js-color-fg, #000000) 45%, transparent);
  outline-offset: 2px;
}
</style>
