import { App } from '@app'
import { setupI18n, setupPinia } from '@app/providers'
import { createApp } from '@shared/api'

import '@app/styles.css'

const app = createApp(App)
setupPinia(app)
setupI18n(app)
app.mount('#app')
