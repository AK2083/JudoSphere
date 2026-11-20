<script setup lang="ts">
import { useTranslation } from '@shared/api'

import translationKeys from '../i18n/keys'

const { t } = useTranslation()
</script>

<template>
  <div class="settings-page">
    <h1>{{ t(translationKeys.title) }}</h1>
    <p>{{ t(translationKeys.description) }}</p>
  </div>
</template>

<style scoped>
.settings-page {
  padding: 1rem;
}
</style>
