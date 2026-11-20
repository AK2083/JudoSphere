import { ref } from 'vue'

import { NOTCH_DETAILS_ID } from './constants'
import { useNarrowViewport } from './useNarrowViewport'
import { useNotchDisclosure } from './useNotchDisclosure'
import { useNotchDrag } from './useNotchDrag'

/**
 * Brand-notch facade: viewport, disclosure, and horizontal drag for `BrandNotch`.
 * @returns Reactive notch state and pointer handlers for the widget UI
 */
export function useBrandNotch() {
  const notchEl = ref<HTMLElement | null>(null)
  const isDraggingNotch = ref(false)
  const suppressTriggerClick = ref(false)

  const { isNarrowViewport, onNarrowViewportChange } = useNarrowViewport()

  const { notchOpen, notchExpanded, onNotchPointerLeave, onNotchTriggerClick, openNotch } =
    useNotchDisclosure({
      isNarrowViewport,
      notchEl,
      isDraggingNotch,
      onNarrowViewportChange,
      consumeTriggerClickSuppression: () => {
        const suppressed = suppressTriggerClick.value
        suppressTriggerClick.value = false
        return suppressed
      }
    })

  const { notchPositionStyle, onNotchPointerDown, onNotchPointerMove, onNotchPointerUp } =
    useNotchDrag({
      notchEl,
      isDraggingNotch,
      notchExpanded,
      onTapFromTrigger: openNotch,
      onDragEnd: () => {
        suppressTriggerClick.value = true
      }
    })

  return {
    NOTCH_DETAILS_ID,
    isNarrowViewport,
    notchOpen,
    notchEl,
    isDraggingNotch,
    notchExpanded,
    notchPositionStyle,
    onNotchPointerLeave,
    onNotchPointerDown,
    onNotchPointerMove,
    onNotchPointerUp,
    onNotchTriggerClick
  }
}
