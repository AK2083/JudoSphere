import { computed, defineComponent, h, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { NOTCH_DRAG_THRESHOLD_PX, NOTCH_OFFSET_STORAGE_KEY } from './constants'
import { useNotchDrag } from './useNotchDrag'

function createNotchElement(width = 120): HTMLElement {
  const el = document.createElement('div')
  Object.defineProperty(el, 'offsetWidth', { configurable: true, get: () => width })
  el.setPointerCapture = vi.fn()
  el.releasePointerCapture = vi.fn()
  el.hasPointerCapture = vi.fn(() => false)
  return el
}

function pointerEvent(
  type: string,
  init: {
    target?: EventTarget | null
    clientX?: number
    pointerId?: number
    pointerType?: string
    button?: number
  } = {}
): PointerEvent {
  const { target = null, ...rest } = init
  const event = new PointerEvent(type, {
    bubbles: true,
    pointerId: 1,
    clientX: 0,
    pointerType: 'mouse',
    button: 0,
    ...rest
  })
  if (target != null) {
    Object.defineProperty(event, 'target', { value: target })
  }
  return event
}

function mountDrag(options?: { expanded?: boolean; width?: number; storedOffset?: string }) {
  const notchEl = ref<HTMLElement | null>(createNotchElement(options?.width ?? 120))
  const isDraggingNotch = ref(false)
  const notchExpanded = computed(() => options?.expanded ?? true)
  const onTapFromTrigger = vi.fn()
  const onDragEnd = vi.fn()

  if (options?.storedOffset != null) {
    localStorage.setItem(NOTCH_OFFSET_STORAGE_KEY, options.storedOffset)
  }

  let api!: ReturnType<typeof useNotchDrag>
  const wrapper = mount(
    defineComponent({
      setup() {
        api = useNotchDrag({
          notchEl,
          isDraggingNotch,
          notchExpanded,
          onTapFromTrigger,
          onDragEnd
        })
        return () => h('div')
      }
    })
  )

  return { api, wrapper, notchEl, isDraggingNotch, onTapFromTrigger, onDragEnd }
}

describe('useNotchDrag', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('innerWidth', 1024)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('restores a stored offset on mount', () => {
    const { api, wrapper } = mountDrag({ storedOffset: '40' })

    expect(api.notchPositionStyle.value.left).toContain('40')

    wrapper.unmount()
  })

  it('ignores invalid stored offsets and getItem failures', () => {
    localStorage.setItem(NOTCH_OFFSET_STORAGE_KEY, 'nope')
    const first = mountDrag()
    expect(first.api.notchPositionStyle.value.left).toContain('0')
    first.wrapper.unmount()

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
    const second = mountDrag()
    expect(second.api.notchPositionStyle.value.left).toContain('0')
    second.wrapper.unmount()
  })

  it('opens via tap when pointer up stays under the threshold on the trigger', () => {
    const { api, wrapper, onTapFromTrigger, notchEl } = mountDrag()
    const trigger = document.createElement('button')
    trigger.className = 'brand-notch__trigger'
    notchEl.value?.appendChild(trigger)

    api.onNotchPointerDown(pointerEvent('pointerdown', { clientX: 100, target: trigger }))
    api.onNotchPointerMove(
      pointerEvent('pointermove', { clientX: 100 + NOTCH_DRAG_THRESHOLD_PX - 1 })
    )
    api.onNotchPointerUp(pointerEvent('pointerup', { clientX: 100 }))

    expect(onTapFromTrigger).toHaveBeenCalledTimes(1)

    wrapper.unmount()
  })

  it('drags horizontally, clamps to the viewport, and persists on drag end', () => {
    const { api, wrapper, isDraggingNotch, onDragEnd, onTapFromTrigger, notchEl } = mountDrag({
      width: 100
    })
    const capture = notchEl.value as HTMLElement & {
      setPointerCapture: ReturnType<typeof vi.fn>
      hasPointerCapture: ReturnType<typeof vi.fn>
      releasePointerCapture: ReturnType<typeof vi.fn>
    }
    capture.hasPointerCapture.mockReturnValue(true)

    api.onNotchPointerDown(pointerEvent('pointerdown', { clientX: 512, pointerId: 7 }))
    api.onNotchPointerMove(pointerEvent('pointermove', { clientX: 512 + 200, pointerId: 7 }))

    expect(isDraggingNotch.value).toBe(true)
    expect(capture.setPointerCapture).toHaveBeenCalledWith(7)

    api.onNotchPointerUp(pointerEvent('pointerup', { clientX: 712, pointerId: 7 }))

    expect(isDraggingNotch.value).toBe(false)
    expect(onDragEnd).toHaveBeenCalledTimes(1)
    expect(onTapFromTrigger).not.toHaveBeenCalled()
    expect(capture.releasePointerCapture).toHaveBeenCalledWith(7)
    expect(localStorage.getItem(NOTCH_OFFSET_STORAGE_KEY)).not.toBeNull()

    wrapper.unmount()
  })

  it('ignores non-primary mouse buttons and mismatched pointer ids', () => {
    const { api, wrapper, onTapFromTrigger } = mountDrag()

    api.onNotchPointerDown(
      pointerEvent('pointerdown', { button: 2, pointerType: 'mouse', clientX: 10 })
    )
    api.onNotchPointerMove(pointerEvent('pointermove', { clientX: 100, pointerId: 1 }))
    api.onNotchPointerUp(pointerEvent('pointerup', { clientX: 100, pointerId: 1 }))

    expect(onTapFromTrigger).not.toHaveBeenCalled()

    api.onNotchPointerDown(pointerEvent('pointerdown', { clientX: 10, pointerId: 1 }))
    api.onNotchPointerMove(pointerEvent('pointermove', { clientX: 100, pointerId: 99 }))
    api.onNotchPointerUp(pointerEvent('pointerup', { clientX: 100, pointerId: 99 }))

    expect(onTapFromTrigger).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it('skips clamping when element width or viewport width is unavailable', () => {
    const zeroWidth = mountDrag({ width: 0 })
    zeroWidth.api.onNotchPointerDown(pointerEvent('pointerdown', { clientX: 100, pointerId: 1 }))
    zeroWidth.api.onNotchPointerMove(pointerEvent('pointermove', { clientX: 140, pointerId: 1 }))
    zeroWidth.api.onNotchPointerUp(pointerEvent('pointerup', { clientX: 140, pointerId: 1 }))
    expect(zeroWidth.api.notchPositionStyle.value.left).toContain('40')
    zeroWidth.wrapper.unmount()

    vi.stubGlobal('innerWidth', 0)
    const zeroViewport = mountDrag({ width: 120 })
    zeroViewport.api.onNotchPointerDown(pointerEvent('pointerdown', { clientX: 100, pointerId: 2 }))
    zeroViewport.api.onNotchPointerMove(pointerEvent('pointermove', { clientX: 150, pointerId: 2 }))
    zeroViewport.api.onNotchPointerUp(pointerEvent('pointerup', { clientX: 150, pointerId: 2 }))
    expect(zeroViewport.api.notchPositionStyle.value.left).toContain('50')
    zeroViewport.wrapper.unmount()

    vi.stubGlobal('innerWidth', undefined)
    localStorage.clear()
    const missingViewport = mountDrag({ width: 120 })
    missingViewport.api.onNotchPointerDown(
      pointerEvent('pointerdown', { clientX: 100, pointerId: 3 })
    )
    missingViewport.api.onNotchPointerMove(
      pointerEvent('pointermove', { clientX: 160, pointerId: 3 })
    )
    missingViewport.api.onNotchPointerUp(pointerEvent('pointerup', { clientX: 160, pointerId: 3 }))
    expect(missingViewport.api.notchPositionStyle.value.left).toBe('calc(50% + 60px)')
    missingViewport.wrapper.unmount()

    vi.stubGlobal('innerWidth', 1024)
    localStorage.clear()
    const missingEl = mountDrag({ width: 120 })
    missingEl.api.onNotchPointerDown(pointerEvent('pointerdown', { clientX: 100, pointerId: 4 }))
    missingEl.notchEl.value = null
    missingEl.api.onNotchPointerMove(pointerEvent('pointermove', { clientX: 160, pointerId: 4 }))
    missingEl.api.onNotchPointerUp(pointerEvent('pointerup', { clientX: 160, pointerId: 4 }))
    expect(missingEl.api.notchPositionStyle.value.left).toBe('calc(50% + 60px)')
    missingEl.wrapper.unmount()
  })

  it('continues an active drag across further pointer moves', () => {
    const { api, wrapper, isDraggingNotch } = mountDrag()

    api.onNotchPointerDown(pointerEvent('pointerdown', { clientX: 200, pointerId: 1 }))
    api.onNotchPointerMove(
      pointerEvent('pointermove', { clientX: 200 + NOTCH_DRAG_THRESHOLD_PX - 1, pointerId: 1 })
    )
    expect(isDraggingNotch.value).toBe(false)

    api.onNotchPointerMove(
      pointerEvent('pointermove', { clientX: 200 + NOTCH_DRAG_THRESHOLD_PX, pointerId: 1 })
    )
    expect(isDraggingNotch.value).toBe(true)

    api.onNotchPointerMove(pointerEvent('pointermove', { clientX: 280, pointerId: 1 }))
    api.onNotchPointerUp(pointerEvent('pointerup', { clientX: 280, pointerId: 1 }))

    expect(isDraggingNotch.value).toBe(false)

    wrapper.unmount()
  })

  it('ignores setItem failures while persisting', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    const { api, wrapper } = mountDrag()

    api.onNotchPointerDown(pointerEvent('pointerdown', { clientX: 100, pointerId: 1 }))
    api.onNotchPointerMove(pointerEvent('pointermove', { clientX: 160, pointerId: 1 }))
    expect(() =>
      api.onNotchPointerUp(pointerEvent('pointerup', { clientX: 160, pointerId: 1 }))
    ).not.toThrow()

    wrapper.unmount()
  })

  it('reclamps on resize and when expanded state changes', async () => {
    const notchExpanded = ref(true)
    const notchEl = ref<HTMLElement | null>(createNotchElement(120))
    const isDraggingNotch = ref(false)
    const raf = vi.fn((cb: (time: number) => void) => {
      cb(0)
      return 1
    })
    vi.stubGlobal('requestAnimationFrame', raf)

    let api!: ReturnType<typeof useNotchDrag>
    const wrapper = mount(
      defineComponent({
        setup() {
          api = useNotchDrag({
            notchEl,
            isDraggingNotch,
            notchExpanded: computed(() => notchExpanded.value),
            onTapFromTrigger: vi.fn(),
            onDragEnd: vi.fn()
          })
          return () => h('div')
        }
      })
    )

    globalThis.dispatchEvent(new Event('resize'))
    notchExpanded.value = false
    await Promise.resolve()

    expect(raf).toHaveBeenCalled()
    expect(api.notchPositionStyle.value.left).toContain('px')

    wrapper.unmount()
  })
})
