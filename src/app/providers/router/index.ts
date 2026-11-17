import { HomePage } from '@pages/home'
import { type App, createRouter, createWebHistory } from '@shared/api'

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
