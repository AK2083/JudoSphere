<script setup lang="ts">
import { ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'

const greetMsg = ref('')
const name = ref('')

async function greet() {
  // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
  greetMsg.value = await invoke('greet', { name: name.value })
}
</script>

<template>
  <main
    class="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4"
  >
    <div class="max-w-2xl w-full space-y-8 text-center">
      <h1 class="text-5xl font-underlined text-red-900 dark:text-red">Hello world!</h1>

      <div class="flex justify-center gap-8">
        <a
          href="https://vite.dev"
          target="_blank"
          rel="noopener noreferrer"
          class="transition-transform hover:scale-110"
        >
          <img src="/vite.svg" class="w-24 h-24" alt="Vite logo" />
        </a>
        <a
          href="https://tauri.app"
          target="_blank"
          rel="noopener noreferrer"
          class="transition-transform hover:scale-110"
        >
          <img src="/tauri.svg" class="w-24 h-24" alt="Tauri logo" />
        </a>
        <a
          href="https://vuejs.org/"
          target="_blank"
          rel="noopener noreferrer"
          class="transition-transform hover:scale-110"
        >
          <img src="./assets/vue.svg" class="w-24 h-24" alt="Vue logo" />
        </a>
      </div>

      <p class="text-lg text-gray-600 dark:text-gray-300">
        Click on the Tauri, Vite, and Vue logos to learn more.
      </p>

      <form @submit.prevent="greet" class="flex flex-col sm:flex-row gap-4 justify-center">
        <input
          id="greet-input"
          v-model="name"
          type="text"
          placeholder="Enter a name..."
          class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
        <button
          type="submit"
          class="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-md hover:shadow-lg"
        >
          Greet
        </button>
      </form>

      <p v-if="greetMsg" class="text-xl font-semibold text-green-600 dark:text-green-400">
        {{ greetMsg }}
      </p>
    </div>
  </main>
</template>
