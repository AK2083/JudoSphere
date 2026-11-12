import {
  type App,
  computed as vueComputed,
  createApp as createVueApp,
  type Ref,
  ref as createRef
} from 'vue'

/**
 * Creates a Vue application instance.
 */
export const createApp = createVueApp

/**
 * Creates a reactive reference.
 */
export const ref = createRef

/**
 * Creates a computed reactive value.
 */
export const computed = vueComputed

export type { App, Ref }
