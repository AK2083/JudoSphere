import { defineComponent, h, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useNotchDisclosure } from './useNotchDisclosure'

function dispatchPointerDown(target: EventTarget): void {
  const event = new PointerEvent('pointerdown', { bubbles: true })
  Object.defineProperty(event, 'target', { value: target })
  document.dispatchEvent(event)
}

function mountDisclosure(options?: { narrow?: boolean; dragging?: boolean; suppress?: boolean }) {
  const isNarrowViewport = ref(options?.narrow ?? true)
  const isDraggingNotch = ref(options?.dragging ?? false)
  const notchEl = ref<HTMLElement | null>(document.createElement('div'))
  const listeners = new Set<(narrow: boolean) => void>()
  const consumeTriggerClickSuppression = vi.fn(() => options?.suppress ?? false)

  let api!: ReturnType<typeof useNotchDisclosure>
  const wrapper = mount(
    defineComponent({
      setup() {
        api = useNotchDisclosure({
          isNarrowViewport,
          notchEl,
          isDraggingNotch,
          onNarrowViewportChange: (listener) => {
            listeners.add(listener)
            return () => listeners.delete(listener)
          },
          consumeTriggerClickSuppression
        })
        return () => h('div')
      }
    })
  )

  return {
    api,
    wrapper,
    isNarrowViewport,
    isDraggingNotch,
    notchEl,
    listeners,
    consumeTriggerClickSuppression
  }
}

describe('useNotchDisclosure', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('keeps the notch expanded on wide viewports', () => {
    const { api, wrapper } = mountDisclosure({ narrow: false })

    expect(api.notchExpanded.value).toBe(true)
    api.openNotch()
    expect(api.notchOpen.value).toBe(false)

    wrapper.unmount()
  })

  it('opens on trigger click when narrow and not suppressed', () => {
    const { api, wrapper } = mountDisclosure({ narrow: true })

    api.onNotchTriggerClick(new MouseEvent('click'))

    expect(api.notchOpen.value).toBe(true)
    expect(api.notchExpanded.value).toBe(true)

    wrapper.unmount()
  })

  it('ignores trigger click when suppression is active', () => {
    const { api, wrapper, consumeTriggerClickSuppression } = mountDisclosure({
      narrow: true,
      suppress: true
    })
    const event = new MouseEvent('click')
    const preventDefault = vi.spyOn(event, 'preventDefault')

    api.onNotchTriggerClick(event)

    expect(consumeTriggerClickSuppression).toHaveBeenCalled()
    expect(api.notchOpen.value).toBe(false)
    expect(preventDefault).toHaveBeenCalled()

    wrapper.unmount()
  })

  it('ignores trigger click when already open', () => {
    const { api, wrapper } = mountDisclosure({ narrow: true })
    api.openNotch()

    api.onNotchTriggerClick(new MouseEvent('click'))

    expect(api.notchOpen.value).toBe(true)

    wrapper.unmount()
  })

  it('closes on pointer leave after the grace window', () => {
    const { api, wrapper } = mountDisclosure({ narrow: true })
    api.openNotch()

    api.onNotchPointerLeave()
    expect(api.notchOpen.value).toBe(true)

    vi.advanceTimersByTime(400)
    api.onNotchPointerLeave()
    expect(api.notchOpen.value).toBe(false)

    wrapper.unmount()
  })

  it('does not close on pointer leave while dragging', () => {
    const { api, wrapper, isDraggingNotch } = mountDisclosure({ narrow: true })
    api.openNotch()
    vi.advanceTimersByTime(400)
    isDraggingNotch.value = true

    api.onNotchPointerLeave()

    expect(api.notchOpen.value).toBe(true)

    wrapper.unmount()
  })

  it('returns early from close when the viewport is already wide', () => {
    const { api, wrapper, isNarrowViewport } = mountDisclosure({ narrow: true })
    api.openNotch()
    isNarrowViewport.value = false
    vi.advanceTimersByTime(400)

    api.onNotchPointerLeave()

    expect(api.notchOpen.value).toBe(true)

    wrapper.unmount()
  })

  it('closes on outside pointerdown', () => {
    const { api, wrapper } = mountDisclosure({ narrow: true })
    api.openNotch()
    vi.advanceTimersByTime(400)

    dispatchPointerDown(document.body)

    expect(api.notchOpen.value).toBe(false)

    wrapper.unmount()
  })

  it('ignores outside pointerdown while closed, dragging, or wide', () => {
    const { api, wrapper, isDraggingNotch, isNarrowViewport } = mountDisclosure({
      narrow: true
    })

    dispatchPointerDown(document.body)
    expect(api.notchOpen.value).toBe(false)

    api.openNotch()
    vi.advanceTimersByTime(400)
    isDraggingNotch.value = true
    dispatchPointerDown(document.body)
    expect(api.notchOpen.value).toBe(true)

    isDraggingNotch.value = false
    isNarrowViewport.value = false
    dispatchPointerDown(document.body)
    expect(api.notchOpen.value).toBe(true)

    wrapper.unmount()
  })

  it('does not close for pointerdown inside the notch element', () => {
    const { api, wrapper, notchEl } = mountDisclosure({ narrow: true })
    api.openNotch()
    vi.advanceTimersByTime(400)

    const child = document.createElement('button')
    notchEl.value?.appendChild(child)
    dispatchPointerDown(child)

    expect(api.notchOpen.value).toBe(true)

    wrapper.unmount()
  })

  it('closes when the viewport becomes wide', () => {
    const { api, wrapper, listeners } = mountDisclosure({ narrow: true })
    api.openNotch()

    for (const listener of listeners) {
      listener(true)
    }
    expect(api.notchOpen.value).toBe(true)

    for (const listener of listeners) {
      listener(false)
    }

    expect(api.notchOpen.value).toBe(false)

    wrapper.unmount()
  })
})
