import { type App, createApp as createVueApp, type Ref, ref as createRef } from 'vue'

/**
 * Creates a Vue application instance.
 */
export const createApp = createVueApp

/**
 * Creates a reactive reference.
 */
export const ref = createRef

export type { App, Ref }
