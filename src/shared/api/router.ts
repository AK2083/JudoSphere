import {
  createMemoryHistory as createVueMemoryHistory,
  createRouter as createVueRouter,
  createWebHistory as createVueWebHistory,
  type RouteLocationNormalizedLoaded,
  type Router,
  type RouteRecordRaw,
  RouterLink,
  RouterView,
  useRoute as useVueRoute,
  useRouter as useVueRouter
} from 'vue-router'

/**
 * Creates a Vue Router instance for app / Storybook provider wiring.
 * Swap this facade if the router library changes; callers keep using `@shared/api`.
 */
export const createRouter = createVueRouter

/**
 * Creates HTML5 history for the host / LAN browser app.
 */
export const createWebHistory = createVueWebHistory

/**
 * Creates in-memory history for Storybook and isolated tests.
 */
export const createMemoryHistory = createVueMemoryHistory

/**
 * Returns the active router instance from the current component tree.
 */
export const useRouter = useVueRouter

/**
 * Returns the active route from the current component tree.
 */
export const useRoute = useVueRoute

export { RouterLink, RouterView }

export type { RouteLocationNormalizedLoaded, Router, RouteRecordRaw }
