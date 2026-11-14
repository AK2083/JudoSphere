import type { StorybookConfig } from '@storybook/vue3-vite'
import tailwindcss from '@tailwindcss/vite'
import { mergeConfig } from 'vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-vitest',
    '@storybook/addon-a11y',
    '@storybook/addon-docs'
  ],
  framework: {
    name: '@storybook/vue3-vite',
    options: {
      docgen: 'vue-component-meta'
    }
  },
  async viteFinal(config) {
    return mergeConfig(config, {
      plugins: [tailwindcss()]
    })
  }
}

export default config
