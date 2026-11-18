import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { NARROW_VIEWPORT_QUERY, NOTCH_DETAILS_ID } from './constants'
import { useBrandNotch } from './useBrandNotch'

function createMatchMedia(matches: boolean) {
  const listeners = new Set<() => void>()
  return {
    matches,
    media: NARROW_VIEWPORT_QUERY,
    addEventListener: (_type: string, listener: () => void) => {
      listeners.add(listener)
    },
    removeEventListener: (_type: string, listener: () => void) => {
      listeners.delete(listener)
    },
    dispatch(next: boolean) {
      this.matches = next
      for (const listener of listeners) {
        listener()
      }
    }
  }
}

function mountBrandNotch() {
  let api!: ReturnType<typeof useBrandNotch>
  const wrapper = mount(
    defineComponent({
      setup() {
        api = useBrandNotch()
        return () => h('div')
      }
    })
  )
  return { api, wrapper }
}

describe('useBrandNotch', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('innerWidth', 1024)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('wires disclosure and drag through the facade', () => {
    const mql = createMatchMedia(true)
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => mql)
    )

    const { api, wrapper } = mountBrandNotch()
    const el = document.createElement('div')
    Object.defineProperty(el, 'offsetWidth', { get: () => 100 })
    el.setPointerCapture = vi.fn()
    el.releasePointerCapture = vi.fn()
    el.hasPointerCapture = vi.fn(() => false)
    api.notchEl.value = el

    expect(api.NOTCH_DETAILS_ID).toBe(NOTCH_DETAILS_ID)
    expect(api.isNarrowViewport.value).toBe(true)
    expect(api.notchExpanded.value).toBe(false)

    const trigger = document.createElement('button')
    trigger.className = 'brand-notch__trigger'
    el.appendChild(trigger)

    const down = new PointerEvent('pointerdown', {
      pointerId: 1,
      clientX: 200,
      pointerType: 'mouse',
      button: 0
    })
    Object.defineProperty(down, 'target', { value: trigger })
    api.onNotchPointerDown(down)
    api.onNotchPointerUp(
      new PointerEvent('pointerup', { pointerId: 1, clientX: 200, pointerType: 'mouse' })
    )

    expect(api.notchOpen.value).toBe(true)

    api.onNotchPointerDown(
      new PointerEvent('pointerdown', {
        pointerId: 2,
        clientX: 200,
        pointerType: 'mouse',
        button: 0
      })
    )
    api.onNotchPointerMove(
      new PointerEvent('pointermove', { pointerId: 2, clientX: 260, pointerType: 'mouse' })
    )
    api.onNotchPointerUp(
      new PointerEvent('pointerup', { pointerId: 2, clientX: 260, pointerType: 'mouse' })
    )

    const click = new MouseEvent('click')
    const preventDefault = vi.spyOn(click, 'preventDefault')
    api.onNotchTriggerClick(click)
    expect(preventDefault).toHaveBeenCalled()

    wrapper.unmount()
  })
})
