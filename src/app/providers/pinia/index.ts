import type { App } from 'vue'

import { createPinia } from '@shared/api'

/**
 * Registers Pinia on the Vue application composition root.
 * @param app - Vue application instance
 */
export function setupPinia(app: App): void {
  app.use(createPinia())
}
