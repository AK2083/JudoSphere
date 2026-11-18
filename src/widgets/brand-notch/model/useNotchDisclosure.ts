import { computed, type ComputedRef, onMounted, onUnmounted, type Ref, ref } from 'vue'

import { NOTCH_LEAVE_GRACE_MS } from './constants'

type NotchDisclosureOptions = {
  isNarrowViewport: Ref<boolean>
  notchEl: Ref<HTMLElement | null>
  isDraggingNotch: Ref<boolean>
  onNarrowViewportChange: (listener: (narrow: boolean) => void) => () => void
  consumeTriggerClickSuppression: () => boolean
}

/**
 * Narrow-viewport open/close for the brand notch (tap open, leave/outside close).
 * @param options - Viewport flag, root element, drag flag, and viewport change hook
 * @returns Disclosure state and pointer/click handlers
 */
export function useNotchDisclosure(options: NotchDisclosureOptions): {
  notchOpen: Ref<boolean>
  notchExpanded: ComputedRef<boolean>
  onNotchPointerLeave: () => void
  onNotchTriggerClick: (event: MouseEvent) => void
  openNotch: () => void
} {
  const {
    isNarrowViewport,
    notchEl,
    isDraggingNotch,
    onNarrowViewportChange,
    consumeTriggerClickSuppression
  } = options

  const notchOpen = ref(false)
  const notchExpanded = computed(() => !isNarrowViewport.value || notchOpen.value)

  let leaveGraceUntil = 0
  let unsubscribeViewport: (() => void) | undefined

  function openNotch(): void {
    if (!isNarrowViewport.value) {
      return
    }
    notchOpen.value = true
    leaveGraceUntil = Date.now() + NOTCH_LEAVE_GRACE_MS
  }

  function closeNotch(): void {
    if (!isNarrowViewport.value) {
      return
    }
    notchOpen.value = false
  }

  function onDocumentPointerDown(event: PointerEvent): void {
    if (!notchOpen.value || !isNarrowViewport.value || isDraggingNotch.value) {
      return
    }
    const target = event.target
    if (target instanceof Node && notchEl.value?.contains(target)) {
      return
    }
    closeNotch()
  }

  function onNotchPointerLeave(): void {
    if (isDraggingNotch.value || Date.now() < leaveGraceUntil) {
      return
    }
    closeNotch()
  }

  function onNotchTriggerClick(event: MouseEvent): void {
    if (consumeTriggerClickSuppression()) {
      event.preventDefault()
      return
    }
    if (notchOpen.value) {
      return
    }
    openNotch()
  }

  onMounted(() => {
    unsubscribeViewport = onNarrowViewportChange((narrow) => {
      if (!narrow) {
        notchOpen.value = false
      }
    })
    globalThis.document?.addEventListener('pointerdown', onDocumentPointerDown)
  })

  onUnmounted(() => {
    unsubscribeViewport?.()
    globalThis.document?.removeEventListener('pointerdown', onDocumentPointerDown)
  })

  return {
    notchOpen,
    notchExpanded,
    onNotchPointerLeave,
    onNotchTriggerClick,
    openNotch
  }
}
