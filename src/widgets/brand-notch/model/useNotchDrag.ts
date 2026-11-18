import { computed, type ComputedRef, onMounted, onUnmounted, type Ref, ref, watch } from 'vue'

import { NOTCH_DRAG_THRESHOLD_PX, NOTCH_EDGE_GAP_PX, NOTCH_OFFSET_STORAGE_KEY } from './constants'

type NotchDragOptions = {
  notchEl: Ref<HTMLElement | null>
  isDraggingNotch: Ref<boolean>
  notchExpanded: ComputedRef<boolean>
  onTapFromTrigger: () => void
  onDragEnd: () => void
}

/**
 * Horizontal drag positioning for the brand notch with edge clamping and persistence.
 * @param options - Root element, shared drag flag, expanded state, and gesture callbacks
 * @returns Offset style and pointer handlers
 */
export function useNotchDrag(options: NotchDragOptions): {
  notchPositionStyle: ComputedRef<{ left: string }>
  onNotchPointerDown: (event: PointerEvent) => void
  onNotchPointerMove: (event: PointerEvent) => void
  onNotchPointerUp: (event: PointerEvent) => void
} {
  const { notchEl, isDraggingNotch, notchExpanded, onTapFromTrigger, onDragEnd } = options

  const notchOffsetX = ref(0)

  const notchPositionStyle = computed(() => ({
    left: `calc(50% + ${notchOffsetX.value}px)`
  }))

  let dragPointerId: number | null = null
  let dragStartClientX = 0
  let dragStartOffsetX = 0
  let dragMoved = false
  let dragFromTrigger = false

  function clampNotchOffset(offsetX: number): number {
    const width = notchEl.value?.offsetWidth ?? 0
    const viewport = globalThis.innerWidth ?? 0
    if (viewport <= 0 || width <= 0) {
      return offsetX
    }
    const half = width / 2
    const minCenter = NOTCH_EDGE_GAP_PX + half
    const maxCenter = Math.max(minCenter, viewport - NOTCH_EDGE_GAP_PX - half)
    const center = viewport / 2 + offsetX
    return Math.min(maxCenter, Math.max(minCenter, center)) - viewport / 2
  }

  function persistNotchOffset(): void {
    try {
      globalThis.localStorage?.setItem(NOTCH_OFFSET_STORAGE_KEY, String(notchOffsetX.value))
    } catch {}
  }

  function reclampNotchOffset(): void {
    notchOffsetX.value = clampNotchOffset(notchOffsetX.value)
  }

  function onNotchPointerDown(event: PointerEvent): void {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return
    }
    dragPointerId = event.pointerId
    dragStartClientX = event.clientX
    dragStartOffsetX = notchOffsetX.value
    dragMoved = false
    dragFromTrigger =
      event.target instanceof Element && event.target.closest('.brand-notch__trigger') !== null
  }

  function onNotchPointerMove(event: PointerEvent): void {
    if (dragPointerId !== event.pointerId) {
      return
    }
    const deltaX = event.clientX - dragStartClientX
    if (!dragMoved && Math.abs(deltaX) < NOTCH_DRAG_THRESHOLD_PX) {
      return
    }
    if (!dragMoved) {
      dragMoved = true
      isDraggingNotch.value = true
      notchEl.value?.setPointerCapture(event.pointerId)
    }
    notchOffsetX.value = clampNotchOffset(dragStartOffsetX + deltaX)
  }

  function onNotchPointerUp(event: PointerEvent): void {
    if (dragPointerId !== event.pointerId) {
      return
    }
    const wasDrag = dragMoved
    const fromTrigger = dragFromTrigger
    dragPointerId = null
    dragFromTrigger = false
    isDraggingNotch.value = false

    if (wasDrag) {
      notchOffsetX.value = clampNotchOffset(notchOffsetX.value)
      persistNotchOffset()
      onDragEnd()
    }

    if (notchEl.value?.hasPointerCapture(event.pointerId)) {
      notchEl.value.releasePointerCapture(event.pointerId)
    }

    if (!wasDrag && fromTrigger) {
      onTapFromTrigger()
    }

    dragMoved = false
  }

  onMounted(() => {
    try {
      const storedOffset = globalThis.localStorage?.getItem(NOTCH_OFFSET_STORAGE_KEY)
      if (storedOffset != null && storedOffset !== '') {
        const parsed = Number(storedOffset)
        if (Number.isFinite(parsed)) {
          notchOffsetX.value = parsed
        }
      }
    } catch {
      notchOffsetX.value = 0
    }

    globalThis.addEventListener?.('resize', reclampNotchOffset)
    reclampNotchOffset()
  })

  onUnmounted(() => {
    globalThis.removeEventListener?.('resize', reclampNotchOffset)
  })

  watch(notchExpanded, () => {
    globalThis.requestAnimationFrame?.(() => {
      reclampNotchOffset()
    })
  })

  return {
    notchPositionStyle,
    onNotchPointerDown,
    onNotchPointerMove,
    onNotchPointerUp
  }
}
