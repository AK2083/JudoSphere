import { createApp as createVueApp, ref as createRef } from 'vue'
import type { App, Ref } from 'vue'

/**
 * Creates a Vue application instance.
 */
export const createApp = createVueApp

/**
 * Creates a reactive reference.
 */
export const ref = createRef

export type { App, Ref }
