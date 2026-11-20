import { createApp } from 'vue'

import { App } from '@app'
import { setupI18n, setupPinia, setupRouter } from '@app/providers'

import '@app/styles.css'

const app = createApp(App)
setupPinia(app)
setupI18n(app)
setupRouter(app)
app.mount('#app')
