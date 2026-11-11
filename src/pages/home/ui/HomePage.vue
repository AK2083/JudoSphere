<script setup lang="ts">
import { GreetForm } from '@/features/greet'
</script>

<template>
  <main class="home">
    <h1>JudoSphere</h1>
    <p>
      Offline-first software for smaller judo competitions and clubs. The host application serves
      the UI on the local network.
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
