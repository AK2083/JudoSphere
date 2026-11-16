import { type Preview, setup } from '@storybook/vue3-vite'

import { i18n } from '@app/providers'
import { createPinia } from '@shared/api'

import '@app/styles.css'

setup((app) => {
  app.use(createPinia())
  app.use(i18n)
})

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    },
    a11y: {
      test: 'todo'
    }
  }
}

export default preview
