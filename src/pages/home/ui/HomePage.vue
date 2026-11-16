<script setup lang="ts">
import { GreetForm } from '@features/greet'
import { useTranslation } from '@shared/api'

import translationKeys from '../i18n/keys'

const { t } = useTranslation()
</script>

<template>
  <main class="home">
    <h1 class="text-3xl font-bold underline">
      {{ t(translationKeys.title) }}
    </h1>
    <p>
      {{ t(translationKeys.description) }}
    </p>
    <GreetForm />
  </main>
</template>

<style scoped>
.home {
  margin: 0;
  padding: 10vh 1.5rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
}

.home p {
  max-width: 36rem;
}
</style>
