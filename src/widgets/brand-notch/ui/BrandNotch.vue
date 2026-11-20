<script setup lang="ts">
import { SparklesIcon } from '@heroicons/vue/24/outline'

import { useTranslation } from '@shared/api'
import { appVersion } from '@shared/config'

import { translationKeys } from '../i18n'
import { NOTCH_BRAND_ID, NOTCH_VERSION_ID } from '../model/constants'
import { useBrandNotch } from '../model/useBrandNotch'

const { t } = useTranslation()

const {
  NOTCH_DETAILS_ID,
  isNarrowViewport,
  notchOpen,
  notchEl,
  isDraggingNotch,
  notchExpanded,
  notchPositionStyle,
  onNotchPointerLeave,
  onNotchPointerDown,
  onNotchPointerMove,
  onNotchPointerUp,
  onNotchTriggerClick
} = useBrandNotch()

function setNotchEl(el: unknown): void {
  notchEl.value = el instanceof HTMLElement ? el : null
}
</script>

<template>
  <header
    :ref="setNotchEl"
    class="brand-notch"
    :class="{
      'brand-notch--expanded': notchExpanded,
      'brand-notch--dragging': isDraggingNotch
    }"
    :style="notchPositionStyle"
    role="banner"
    :aria-label="notchExpanded ? undefined : t(translationKeys.name)"
    :aria-labelledby="notchExpanded ? NOTCH_BRAND_ID : undefined"
    :aria-describedby="notchExpanded ? NOTCH_VERSION_ID : undefined"
    @pointerdown="onNotchPointerDown"
    @pointermove="onNotchPointerMove"
    @pointerup="onNotchPointerUp"
    @pointercancel="onNotchPointerUp"
    @pointerleave="onNotchPointerLeave"
  >
    <button
      v-if="isNarrowViewport && !notchOpen"
      type="button"
      class="brand-notch__trigger"
      :aria-expanded="false"
      :aria-controls="NOTCH_DETAILS_ID"
      :title="t(translationKeys.name)"
      :aria-label="t(translationKeys.show)"
      @click="onNotchTriggerClick"
    >
      <SparklesIcon class="brand-notch__icon" aria-hidden="true" />
    </button>

    <div
      :id="NOTCH_DETAILS_ID"
      class="brand-notch__details"
      :aria-hidden="isNarrowViewport && !notchOpen ? 'true' : undefined"
    >
      <div class="brand-notch__details-inner">
        <p :id="NOTCH_BRAND_ID" class="brand-notch__brand">
          {{ t(translationKeys.name) }}
        </p>
        <p :id="NOTCH_VERSION_ID" class="brand-notch__version">
          {{
            t(translationKeys.version, {
              version: appVersion.version,
              versionName: appVersion.versionName
            })
          }}
        </p>
      </div>
    </div>
  </header>
</template>

<style scoped>
.brand-notch {
  --brand-notch-border: color-mix(in srgb, var(--js-color-fg, #000000) 16%, transparent);
  --brand-notch-bg: color-mix(in srgb, var(--js-color-fg, #000000) 8%, var(--js-color-bg, #ffffff));

  position: absolute;
  top: 0;
  left: 50%;
  z-index: 40;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: max-content;
  max-width: min(16rem, calc(100vw - 1rem));
  padding: 0.4rem 1.2rem 0.7rem;
  border: 1px solid var(--brand-notch-border);
  border-top: none;
  border-radius: 0 0 1.15rem 1.15rem;
  background: var(--brand-notch-bg);
  box-shadow: 0 0.35rem 0.85rem color-mix(in srgb, #000 18%, transparent);
  color: var(--js-color-fg, #000000);
  text-align: center;
  transform: translateX(-50%);
  pointer-events: auto;
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.brand-notch--dragging {
  cursor: grabbing;
}

.brand-notch__trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.35rem;
  height: 1.35rem;
  padding: 0;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.brand-notch__trigger:focus-visible {
  outline: 2px solid color-mix(in srgb, currentColor 45%, transparent);
  outline-offset: 2px;
}

.brand-notch__icon {
  width: 0.85rem;
  height: 0.85rem;
  color: inherit;
  stroke: currentColor;
  fill: none;
  filter: none;
  box-shadow: none;
  text-shadow: none;
}

.brand-notch__details {
  display: grid;
  grid-template-rows: 1fr;
  width: 100%;
  opacity: 1;
}

.brand-notch__details-inner {
  overflow: hidden;
  min-height: 0;
}

.brand-notch__brand {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  line-height: 1.15;
}

.brand-notch__version {
  margin: 0.15rem 0 0;
  font-size: 0.7rem;
  line-height: 1.2;
  letter-spacing: 0.02em;
  color: var(--js-color-fg-muted, currentColor);
}

@media (max-width: 767px) {
  .brand-notch {
    z-index: 50;
    padding: 0.25rem 0.4rem 0.35rem;
    transition: padding 220ms ease;
  }

  .brand-notch--expanded {
    padding: 0.35rem 1rem 0.65rem;
  }

  .brand-notch__details {
    grid-template-rows: 0fr;
    opacity: 0;
    transition:
      grid-template-rows 220ms ease,
      opacity 180ms ease;
  }

  .brand-notch--expanded .brand-notch__details {
    grid-template-rows: 1fr;
    opacity: 1;
  }

  .brand-notch__brand {
    margin-top: 0.3rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .brand-notch,
  .brand-notch__details {
    transition: none;
  }
}
</style>
