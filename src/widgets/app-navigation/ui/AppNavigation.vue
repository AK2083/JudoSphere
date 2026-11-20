<script setup lang="ts">
import { ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '@heroicons/vue/24/outline'

import { RouterLink, useTranslation } from '@shared/api'

import { translationKeys } from '../i18n'
import { useAppNavigation } from '../model/useAppNavigation'

const { t } = useTranslation()

const { navCollapsed, primaryDestinations, settingsDestination, toggleNavCollapsed } =
  useAppNavigation()

function destinationLabel(key: string): string {
  return t(key)
}
</script>

<template>
  <nav
    class="app-navigation"
    :class="{ 'app-navigation--collapsed': navCollapsed }"
    :aria-label="t(translationKeys.label)"
  >
    <ul class="app-navigation__list">
      <li v-for="item in primaryDestinations" :key="item.key">
        <RouterLink
          v-if="item.to"
          class="app-navigation__link"
          :to="item.to"
          exact-active-class="app-navigation__link--active"
          :title="navCollapsed ? destinationLabel(item.key) : undefined"
          :aria-label="navCollapsed ? destinationLabel(item.key) : undefined"
        >
          <component :is="item.icon" class="app-navigation__icon" aria-hidden="true" />
          <span class="app-navigation__label" :aria-hidden="navCollapsed ? 'true' : undefined">
            {{ destinationLabel(item.key) }}
          </span>
        </RouterLink>
        <span
          v-else
          class="app-navigation__link app-navigation__link--placeholder"
          role="link"
          aria-disabled="true"
          tabindex="-1"
          :title="destinationLabel(item.key)"
          :aria-label="destinationLabel(item.key)"
        >
          <component :is="item.icon" class="app-navigation__icon" aria-hidden="true" />
          <span class="app-navigation__label" :aria-hidden="navCollapsed ? 'true' : undefined">
            {{ destinationLabel(item.key) }}
          </span>
        </span>
      </li>
    </ul>

    <div class="app-navigation__footer">
      <span
        class="app-navigation__link app-navigation__link--placeholder"
        role="link"
        aria-disabled="true"
        tabindex="-1"
        :title="destinationLabel(settingsDestination.key)"
        :aria-label="destinationLabel(settingsDestination.key)"
      >
        <component :is="settingsDestination.icon" class="app-navigation__icon" aria-hidden="true" />
        <span class="app-navigation__label" :aria-hidden="navCollapsed ? 'true' : undefined">
          {{ destinationLabel(settingsDestination.key) }}
        </span>
      </span>

      <button
        type="button"
        class="app-navigation__toggle"
        :title="navCollapsed ? t(translationKeys.expand) : t(translationKeys.collapse)"
        :aria-label="navCollapsed ? t(translationKeys.expand) : t(translationKeys.collapse)"
        :aria-expanded="!navCollapsed"
        @click="toggleNavCollapsed"
      >
        <ChevronDoubleRightIcon
          v-if="navCollapsed"
          class="app-navigation__icon"
          aria-hidden="true"
        />
        <ChevronDoubleLeftIcon v-else class="app-navigation__icon" aria-hidden="true" />
        <span class="app-navigation__label" :aria-hidden="navCollapsed ? 'true' : undefined">
          {{ navCollapsed ? t(translationKeys.expand) : t(translationKeys.collapse) }}
        </span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.app-navigation {
  --app-navigation-border: color-mix(in srgb, var(--js-color-fg, #000000) 16%, transparent);
  --app-navigation-surface: var(--js-color-surface, #ffffff);
  --app-navigation-width: 14rem;
  --app-navigation-width-collapsed: 3.5rem;

  display: flex;
  flex: 0 0 auto;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: 0.25rem;
  border-bottom: 1px solid var(--app-navigation-border);
  background: var(--app-navigation-surface);
  color: var(--js-color-fg, #000000);
}

.app-navigation__list,
.app-navigation__footer {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  padding: 0.5rem 0.75rem;
  list-style: none;
}

.app-navigation__list {
  flex: 1 1 auto;
  min-width: 0;
}

.app-navigation__footer {
  flex: 0 0 auto;
  margin-left: auto;
  justify-content: flex-end;
}

.app-navigation__link,
.app-navigation__toggle {
  --app-navigation-icon-size: 1.25rem;

  display: inline-grid;
  grid-template-columns: var(--app-navigation-icon-size) minmax(0, auto);
  align-items: center;
  column-gap: 0.65rem;
  min-height: 2.25rem;
  padding: 0.4rem 0.7rem;
  border: none;
  border-radius: 0.35rem;
  background: transparent;
  color: var(--js-color-fg, #000000);
  font: inherit;
  line-height: 1.25;
  text-decoration: none;
  cursor: pointer;
}

.app-navigation__link:hover,
.app-navigation__link:focus-visible,
.app-navigation__toggle:hover,
.app-navigation__toggle:focus-visible {
  color: var(--js-color-fg, #000000);
  outline: 2px solid color-mix(in srgb, var(--js-color-fg, #000000) 45%, transparent);
  outline-offset: 2px;
}

.app-navigation__link--active,
.app-navigation__link.router-link-active {
  color: var(--js-color-fg, #000000);
  background: color-mix(in srgb, var(--js-color-fg, #000000) 12%, transparent);
  font-weight: 700;
}

.app-navigation__link--placeholder {
  color: var(--js-color-fg, #000000);
  cursor: pointer;
}

.app-navigation__icon {
  display: block;
  width: var(--app-navigation-icon-size);
  height: var(--app-navigation-icon-size);
  justify-self: center;
  translate: 0 -0.0625rem;
  color: inherit;
  stroke: currentColor;
  fill: none;
  filter: none;
  box-shadow: none;
  text-shadow: none;
}

.app-navigation__label {
  display: block;
  margin: 0;
  line-height: var(--app-navigation-icon-size);
  white-space: nowrap;
}

@media (min-width: 768px) {
  .app-navigation {
    flex: 0 0 var(--app-navigation-width);
    flex-direction: column;
    flex-wrap: nowrap;
    align-items: stretch;
    width: var(--app-navigation-width);
    min-height: 100%;
    gap: 0.5rem;
    border-bottom: none;
    border-right: 1px solid var(--app-navigation-border);
    transition:
      width 160ms ease,
      flex-basis 160ms ease;
  }

  .app-navigation--collapsed {
    flex-basis: var(--app-navigation-width-collapsed);
    width: var(--app-navigation-width-collapsed);
  }

  .app-navigation__list,
  .app-navigation__footer {
    flex-direction: column;
    flex-wrap: nowrap;
    align-items: stretch;
    gap: 0.65rem;
    padding: 0.75rem;
  }

  .app-navigation__list {
    flex: 1 1 auto;
  }

  .app-navigation__footer {
    margin-left: 0;
    margin-top: auto;
    justify-content: flex-start;
    padding-top: 0.75rem;
    border-top: 1px solid var(--app-navigation-border);
  }

  .app-navigation__link,
  .app-navigation__toggle {
    width: 100%;
    justify-items: start;
  }

  .app-navigation__list > li {
    display: flex;
    align-items: stretch;
  }

  .app-navigation__list > li > .app-navigation__link {
    flex: 1 1 auto;
  }

  .app-navigation--collapsed .app-navigation__link,
  .app-navigation--collapsed .app-navigation__toggle {
    grid-template-columns: 1fr;
    justify-items: center;
    padding-inline: 0.5rem;
  }

  .app-navigation--collapsed .app-navigation__label {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
}

@media (max-width: 767px) {
  .app-navigation {
    position: relative;
    z-index: 10;
  }

  .app-navigation__toggle {
    display: none;
  }
}
</style>
