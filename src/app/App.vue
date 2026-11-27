<script setup lang="ts">
import { onErrorCaptured } from 'vue'

import { notifyFeedbackFailureRecovery } from '@features/feedback-form'
import { createVueErrorCapturedHandler } from '@shared/api'

import AppShell from './ui/AppShell.vue'

const forwardVueError = createVueErrorCapturedHandler()

onErrorCaptured((err, instance, info) => {
  const result = forwardVueError(err, instance, info)
  notifyFeedbackFailureRecovery(err, info)
  return result
})
</script>

<template>
  <AppShell />
</template>
