<script setup lang="ts">
import { ref, greet } from "@/shared/api";

const greetMsg = ref("");
const name = ref("");

async function onSubmit() {
  greetMsg.value = await greet(name.value);
}
</script>

<template>
  <form class="greet" @submit.prevent="onSubmit">
    <input v-model="name" placeholder="Name…" />
    <button type="submit">Greet</button>
  </form>
  <p v-if="greetMsg">{{ greetMsg }}</p>
</template>

<style scoped>
.greet {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

input,
button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  color: #0f0f0f;
  background-color: #ffffff;
  box-shadow: 0 2px 2px rgba(0, 0, 0, 0.2);
}

button {
  cursor: pointer;
}

button:hover {
  border-color: #396cd8;
}

@media (prefers-color-scheme: dark) {
  input,
  button {
    color: #ffffff;
    background-color: #0f0f0f98;
  }
}
</style>
