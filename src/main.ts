import { App } from '@app'
import { setupPinia } from '@app/providers'
import { createApp } from '@shared/api'

import '@app/styles.css'

const app = createApp(App)
setupPinia(app)
app.mount('#app')
