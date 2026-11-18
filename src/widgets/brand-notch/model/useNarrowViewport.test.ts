import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { NARROW_VIEWPORT_QUERY } from './constants'
import { useNarrowViewport } from './useNarrowViewport'

type MockMql = {
  matches: boolean
  media: string
  addEventListener: (type: string, listener: () => void) => void
  removeEventListener: (type: string, listener: () => void) => void
  dispatch: (matches: boolean) => void
}

function createMatchMedia(matches: boolean): MockMql {
  const listeners = new Set<() => void>()
  const mql: MockMql = {
    matches,
    media: NARROW_VIEWPORT_QUERY,
    addEventListener: (_type, listener) => {
      listeners.add(listener)
    },
    removeEventListener: (_type, listener) => {
      listeners.delete(listener)
    },
    dispatch: (next) => {
      mql.matches = next
      for (const listener of listeners) {
        listener()
      }
    }
  }
  return mql
}

function mountViewport() {
  let api!: ReturnType<typeof useNarrowViewport>
  const wrapper = mount(
    defineComponent({
      setup() {
        api = useNarrowViewport()
        return () => h('div')
      }
    })
  )
  return { api, wrapper }
}

describe('useNarrowViewport', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('reads the initial matchMedia result', () => {
    const mql = createMatchMedia(true)
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => mql)
    )

    const { api, wrapper } = mountViewport()

    expect(api.isNarrowViewport.value).toBe(true)
    expect(globalThis.matchMedia).toHaveBeenCalledWith(NARROW_VIEWPORT_QUERY)

    wrapper.unmount()
  })

  it('defaults to wide when matchMedia is unavailable', () => {
    vi.stubGlobal('matchMedia', undefined)

    const { api, wrapper } = mountViewport()

    expect(api.isNarrowViewport.value).toBe(false)

    wrapper.unmount()
  })

  it('notifies subscribers when the viewport crosses the breakpoint', () => {
    const mql = createMatchMedia(false)
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => mql)
    )

    const { api, wrapper } = mountViewport()
    const listener = vi.fn()
    const unsubscribe = api.onNarrowViewportChange(listener)

    mql.dispatch(true)

    expect(api.isNarrowViewport.value).toBe(true)
    expect(listener).toHaveBeenCalledWith(true)

    unsubscribe()
    mql.dispatch(false)

    expect(listener).toHaveBeenCalledTimes(1)
    expect(api.isNarrowViewport.value).toBe(false)

    wrapper.unmount()
  })

  it('removes the media listener on unmount', () => {
    const mql = createMatchMedia(false)
    const removeSpy = vi.spyOn(mql, 'removeEventListener')
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => mql)
    )

    const { wrapper } = mountViewport()
    wrapper.unmount()

    expect(removeSpy).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('treats a missing matches value as wide during sync', () => {
    const mql = createMatchMedia(true)
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => mql)
    )

    const { api, wrapper } = mountViewport()
    ;(mql as { matches: boolean | undefined }).matches = undefined
    mql.dispatch(undefined as unknown as boolean)

    expect(api.isNarrowViewport.value).toBe(false)

    wrapper.unmount()
  })
})
