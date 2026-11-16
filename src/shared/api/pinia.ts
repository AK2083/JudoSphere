import {
  createPinia as createPiniaInstance,
  defineStore as definePiniaStore,
  type Pinia,
  type Store,
  type StoreDefinition,
  storeToRefs as piniaStoreToRefs
} from 'pinia'

/**
 * Creates a Pinia instance for app / Storybook provider wiring.
 */
export const createPinia = createPiniaInstance

/**
 * Defines a Pinia store for feature or entity `model/` layers.
 */
export const defineStore = definePiniaStore

/**
 * Converts store state and getters into Vue refs for setup usage.
 */
export const storeToRefs = piniaStoreToRefs

export type { Pinia, Store, StoreDefinition }
