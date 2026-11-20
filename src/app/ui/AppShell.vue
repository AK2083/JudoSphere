<script setup lang="ts">
import { RouterView } from 'vue-router'

import { AppNavigation, BrandNotch } from '@widgets'
</script>

<template>
  <div class="app-shell">
    <BrandNotch />

    <div class="app-shell__body">
      <AppNavigation />

      <main class="app-shell__main" id="main-content">
        <RouterView />
      </main>
    </div>

    <footer class="app-shell__status" role="contentinfo">
      <div class="app-shell__status-start" />
      <div class="app-shell__status-end" data-testid="app-shell-status-end" />
    </footer>
  </div>
</template>

<style scoped>
.app-shell {
  --app-shell-border: color-mix(in srgb, var(--js-color-fg, #000000) 16%, transparent);
  --app-shell-surface: var(--js-color-surface, #ffffff);
  --app-shell-notch-clearance: 4.5rem;

  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  background: var(--js-color-bg, #f6f6f6);
  color: var(--js-color-fg, #000000);
}

@media (max-width: 767px) {
  .app-shell {
    --app-shell-notch-clearance: 0;
  }
}

.app-shell__body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  padding-top: var(--app-shell-notch-clearance);
  transition: padding-top 220ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .app-shell__body {
    transition: none;
  }
}

.app-shell__main {
  flex: 1 1 auto;
  min-width: 0;
  overflow: auto;
}

.app-shell__status {
  display: flex;
  align-items: stretch;
  min-height: 2rem;
  border-top: 1px solid var(--app-shell-border);
  background: var(--app-shell-surface);
}

.app-shell__status-start {
  flex: 1 1 auto;
  min-width: 0;
}

.app-shell__status-end {
  flex: 0 0 8rem;
  min-width: 8rem;
}

@media (min-width: 768px) {
  .app-shell__body {
    flex-direction: row;
    padding-top: 0;
  }

  .app-shell__main {
    padding-top: var(--app-shell-notch-clearance);
  }
}
</style>
