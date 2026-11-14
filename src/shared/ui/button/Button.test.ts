import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Button from './Button.vue'

describe('Button', () => {
  it('renders the label', () => {
    const wrapper = mount(Button, {
      props: { label: 'Save' }
    })

    expect(wrapper.text()).toContain('Save')
  })

  it('applies primary styling when primary is set', () => {
    const wrapper = mount(Button, {
      props: { label: 'Primary', primary: true }
    })

    expect(wrapper.classes()).toContain('storybook-button--primary')
  })

  it('applies the requested size class', () => {
    const wrapper = mount(Button, {
      props: { label: 'Large', size: 'large' }
    })

    expect(wrapper.classes()).toContain('storybook-button--large')
  })

  it('emits click with an id', async () => {
    const wrapper = mount(Button, {
      props: { label: 'Go' }
    })

    await wrapper.trigger('click')

    expect(wrapper.emitted('click')).toEqual([[1]])
  })
})
