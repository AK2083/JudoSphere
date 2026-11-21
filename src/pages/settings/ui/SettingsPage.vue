<script setup lang="ts">
import { useTranslation } from '@shared/api'
import { type LanguageCode } from '@shared/lib'

import translationKeys from '../i18n/keys'
import { useSettingsPreferences } from '../model/useSettingsPreferences'

const { t } = useTranslation()
const { theme, language, themeOptions, languageOptions, setTheme, setLanguage } =
  useSettingsPreferences()

function onLanguageChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value as LanguageCode
  setLanguage(value)
}
</script>

<template>
  <div class="settings-page">
    <header class="settings-page__header">
      <h1>{{ t(translationKeys.title) }}</h1>
      <p>{{ t(translationKeys.description) }}</p>
    </header>

    <form class="settings-page__form" @submit.prevent>
      <div class="settings-page__row">
        <div class="settings-page__copy">
          <h2 id="settings-theme-label" class="settings-page__label">
            {{ t(translationKeys.themeLabel) }}
          </h2>
          <p id="settings-theme-help" class="settings-page__help">
            {{ t(translationKeys.themeHelp) }}
          </p>
        </div>

        <div
          class="settings-page__theme-group"
          role="group"
          aria-labelledby="settings-theme-label"
          aria-describedby="settings-theme-help"
        >
          <button
            v-for="option in themeOptions"
            :key="option.value"
            type="button"
            class="settings-page__theme-button"
            :class="{ 'settings-page__theme-button--active': theme === option.value }"
            :aria-pressed="theme === option.value"
            @click="setTheme(option.value)"
          >
            <component :is="option.icon" class="settings-page__theme-icon" aria-hidden="true" />
            <span class="settings-page__theme-label">{{ t(option.labelKey) }}</span>
          </button>
        </div>
      </div>

      <div class="settings-page__row">
        <div class="settings-page__copy">
          <label class="settings-page__label" for="settings-language">
            {{ t(translationKeys.languageLabel) }}
          </label>
          <p id="settings-language-help" class="settings-page__help">
            {{ t(translationKeys.languageHelp) }}
          </p>
        </div>

        <select
          id="settings-language"
          class="settings-page__control"
          :value="language"
          aria-describedby="settings-language-help"
          @change="onLanguageChange"
        >
          <option v-for="option in languageOptions" :key="option.code" :value="option.code">
            {{ option.label }}
          </option>
        </select>
      </div>
    </form>
  </div>
</template>

<style scoped>
.settings-page {
  --settings-space: 0.75rem;
  --settings-row-gap: 1.5rem;
  --settings-copy-gap: 0.35rem;
  --settings-icon-size: 1.25rem;
  --settings-hit: 2.5rem;
  --settings-control-width: 22.5rem;
  --settings-border: color-mix(in srgb, var(--js-color-fg, #000000) 24%, transparent);
  --settings-border-strong: color-mix(in srgb, var(--js-color-fg, #000000) 40%, transparent);
  --settings-active-bg: color-mix(in srgb, var(--js-color-fg, #000000) 12%, transparent);

  container-type: inline-size;
  container-name: settings-page;
  display: flex;
  flex-direction: column;
  gap: var(--settings-row-gap);
  max-width: 52rem;
  padding: 1rem;
}

.settings-page__header {
  display: flex;
  flex-direction: column;
  gap: var(--settings-copy-gap);
}

.settings-page__header h1 {
  margin: 0;
  font-size: 1.5rem;
  line-height: 1.3;
}

.settings-page__header p,
.settings-page__help {
  margin: 0;
  color: var(--js-color-fg-muted, #0a0a0a);
}

.settings-page__form {
  display: flex;
  flex-direction: column;
  gap: var(--settings-row-gap);
}

.settings-page__row {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--settings-space);
  align-items: stretch;
}

.settings-page__copy {
  display: flex;
  flex-direction: column;
  gap: var(--settings-copy-gap);
  min-width: 0;
}

.settings-page__label {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.3;
}

.settings-page__theme-group {
  display: flex;
  flex-wrap: nowrap;
  align-items: stretch;
  box-sizing: border-box;
  width: 100%;
  border: 1px solid var(--settings-border);
  border-radius: 0.35rem;
  overflow: hidden;
  background: var(--js-color-surface, #ffffff);
}

.settings-page__theme-button {
  display: inline-grid;
  flex: 1 1 0;
  grid-template-columns: var(--settings-icon-size) minmax(0, auto);
  justify-content: center;
  justify-items: center;
  align-items: center;
  column-gap: 0.65rem;
  min-width: 0;
  min-height: var(--settings-hit);
  padding: 0 0.85rem;
  border: none;
  border-right: 1px solid var(--settings-border);
  border-radius: 0;
  background: transparent;
  color: var(--js-color-fg, #000000);
  font: inherit;
  line-height: 1.25;
  cursor: pointer;
}

.settings-page__theme-button:last-child {
  border-right: none;
}

.settings-page__theme-button:hover,
.settings-page__theme-button:focus-visible {
  background: var(--settings-active-bg);
  outline: 2px solid var(--settings-border-strong);
  outline-offset: -2px;
}

.settings-page__theme-button--active {
  background: var(--settings-active-bg);
  font-weight: 700;
}

.settings-page__theme-icon {
  display: block;
  width: var(--settings-icon-size);
  height: var(--settings-icon-size);
  color: inherit;
  stroke: currentColor;
  fill: none;
}

.settings-page__theme-label {
  white-space: nowrap;
}

.settings-page__control {
  box-sizing: border-box;
  width: 100%;
  min-height: var(--settings-hit);
  padding: 0.4rem 0.65rem;
  border: 1px solid var(--settings-border);
  border-radius: 0.35rem;
  background: var(--js-color-surface, #ffffff);
  color: var(--js-color-fg, #000000);
  font: inherit;
}

@container settings-page (min-width: 46rem) {
  .settings-page__row {
    grid-template-columns: minmax(0, 1fr) var(--settings-control-width);
    gap: var(--settings-space) 1.5rem;
    align-items: center;
  }

  .settings-page__help {
    white-space: nowrap;
  }

  .settings-page__theme-group,
  .settings-page__control {
    width: var(--settings-control-width);
  }

  .settings-page__theme-button {
    justify-items: start;
  }
}
</style>
