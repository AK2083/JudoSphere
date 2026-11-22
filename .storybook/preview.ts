import { type Preview, setup } from '@storybook/vue3-vite'
import { MINIMAL_VIEWPORTS } from 'storybook/viewport'

import { createMemoryHistory, createRouter } from 'vue-router'

import { i18n } from '@app/providers'
import { SettingsPage } from '@pages/settings'
import { createPinia } from '@shared/api'
import { FallbackLanguage, isLanguageCode } from '@shared/lib'

import '@app/styles.css'

setup((app) => {
  app.use(createPinia())
  app.use(i18n)
  app.use(
    createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/',
          name: 'home',
          component: {
            template: '<div class="story-shell-main">Shell main content</div>'
          }
        },
        {
          path: '/settings',
          name: 'settings',
          component: SettingsPage
        }
      ]
    })
  )
})

const preview: Preview = {
  globalTypes: {
    locale: {
      name: 'Locale',
      description: 'Shell chrome i18n locale',
      toolbar: {
        icon: 'globe',
        items: [
          { value: 'de', title: 'Deutsch' },
          { value: 'en', title: 'English' }
        ],
        dynamicTitle: true
      }
    },
    colorScheme: {
      name: 'Color scheme',
      description: 'Force light/dark shell chrome independent of OS preference',
      toolbar: {
        icon: 'paintbrush',
        items: [
          { value: 'system', title: 'System' },
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' }
        ],
        dynamicTitle: true
      }
    }
  },
  initialGlobals: {
    locale: FallbackLanguage,
    colorScheme: 'light',
    viewport: { value: 'desktop', isRotated: false }
  },
  decorators: [
    (story, context) => {
      const localeGlobal = context.globals.locale
      i18n.global.locale.value = isLanguageCode(localeGlobal) ? localeGlobal : FallbackLanguage

      const scheme = (context.globals.colorScheme as string | undefined) ?? 'light'
      const root = document.documentElement
      if (scheme === 'system') {
        root.removeAttribute('data-color-scheme')
      } else {
        root.setAttribute('data-color-scheme', scheme)
      }

      return story()
    }
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    },
    viewport: {
      options: MINIMAL_VIEWPORTS
    },
    a11y: {
      test: 'todo'
    }
  }
}

export default preview
