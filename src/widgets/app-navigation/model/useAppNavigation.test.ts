import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAppNavigation } from './useAppNavigation'

const NAV_COLLAPSED_STORAGE_KEY = 'judosphere.app-shell.nav-collapsed'

function mountNavigation() {
  let api!: ReturnType<typeof useAppNavigation>
  const wrapper = mount(
    defineComponent({
      setup() {
        api = useAppNavigation()
        return () => h('div')
      }
    })
  )
  return { api, wrapper }
}

describe('useAppNavigation', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('exposes primary destinations and settings', () => {
    const { api, wrapper } = mountNavigation()

    expect(api.primaryDestinations).toHaveLength(3)
    expect(api.primaryDestinations[0]?.to).toBe('/')
    expect(api.settingsDestination.to).toBeNull()
    expect(api.navCollapsed.value).toBe(false)

    wrapper.unmount()
  })

  it('restores collapsed state from localStorage on mount', () => {
    localStorage.setItem(NAV_COLLAPSED_STORAGE_KEY, '1')
    const { api, wrapper } = mountNavigation()

    expect(api.navCollapsed.value).toBe(true)

    wrapper.unmount()
  })

  it('persists collapsed state when toggled', async () => {
    const { api, wrapper } = mountNavigation()

    api.toggleNavCollapsed()
    await Promise.resolve()

    expect(api.navCollapsed.value).toBe(true)
    expect(localStorage.getItem(NAV_COLLAPSED_STORAGE_KEY)).toBe('1')

    api.toggleNavCollapsed()
    await Promise.resolve()

    expect(api.navCollapsed.value).toBe(false)
    expect(localStorage.getItem(NAV_COLLAPSED_STORAGE_KEY)).toBe('0')

    wrapper.unmount()
  })

  it('falls back to expanded when localStorage getItem throws on mount', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('denied')
      },
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0
    })

    const { api, wrapper } = mountNavigation()

    expect(api.navCollapsed.value).toBe(false)

    wrapper.unmount()
  })

  it('ignores localStorage setItem failures while toggling', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })

    const { api, wrapper } = mountNavigation()

    expect(() => api.toggleNavCollapsed()).not.toThrow()
    await Promise.resolve()
    expect(api.navCollapsed.value).toBe(true)

    wrapper.unmount()
  })
})
