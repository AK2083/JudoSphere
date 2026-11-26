import { createApp } from 'vue'

import { App } from '@app'
import { setupI18n, setupPinia, setupRouter } from '@app/providers'
import { installUnhandledErrorForwarding, installVueErrorForwarding } from '@shared/api'
import { applyPersistedThemeOnStartup } from '@shared/lib'

import '@app/styles.css'

applyPersistedThemeOnStartup()
installUnhandledErrorForwarding()

const app = createApp(App)
installVueErrorForwarding(app)
setupPinia(app)
setupI18n(app)
setupRouter(app)
app.mount('#app')
