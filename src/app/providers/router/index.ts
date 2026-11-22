import type { App } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

import { HomePage } from '@pages/home'
import { SettingsPage } from '@pages/settings'

/**
 * Root Vue Router instance. Routes import page components from `@pages/*` only.
 */
export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsPage
    }
  ]
})

/**
 * Registers Vue Router on the Vue application composition root.
 * @param app - Vue application instance
 */
export function setupRouter(app: App): void {
  app.use(router)
}
