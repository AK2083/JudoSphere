<script setup lang="ts">
import { GreetForm } from '@features/greet'
import { useTranslation } from '@shared/api'

import translationKeys from '../i18n/keys'

const { t } = useTranslation()
</script>

<template>
  <div class="home">
    <h1 class="text-3xl font-bold underline">
      {{ t(translationKeys.title) }}
    </h1>
    <p>
      {{ t(translationKeys.description) }}
    </p>
    <GreetForm />
  </div>
</template>

<style scoped>
.home {
  box-sizing: border-box;
  margin: 0;
  width: 100%;
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
