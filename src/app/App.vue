<script setup lang="ts">
import { onErrorCaptured } from 'vue'

import { createVueErrorCapturedHandler } from '@shared/api'

import AppShell from './ui/AppShell.vue'

onErrorCaptured(createVueErrorCapturedHandler())
</script>

<template>
  <AppShell />
</template>
