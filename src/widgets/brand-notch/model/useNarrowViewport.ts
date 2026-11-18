import { onMounted, onUnmounted, type Ref, ref } from 'vue'

import { NARROW_VIEWPORT_QUERY } from './constants'

/**
 * Tracks whether the viewport matches the shell narrow breakpoint.
 * @returns Narrow-viewport flag and a subscribe helper for dependent effects
 */
export function useNarrowViewport(): {
  isNarrowViewport: Ref<boolean>
  onNarrowViewportChange: (listener: (narrow: boolean) => void) => () => void
} {
  const isNarrowViewport = ref(
    typeof globalThis.matchMedia === 'function'
      ? globalThis.matchMedia(NARROW_VIEWPORT_QUERY).matches
      : false
  )

  let media: MediaQueryList | undefined
  const listeners = new Set<(narrow: boolean) => void>()

  function sync(): void {
    const narrow = media?.matches ?? false
    isNarrowViewport.value = narrow
    for (const listener of listeners) {
      listener(narrow)
    }
  }

  function onNarrowViewportChange(listener: (narrow: boolean) => void): () => void {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  onMounted(() => {
    if (typeof globalThis.matchMedia !== 'function') {
      return
    }
    media = globalThis.matchMedia(NARROW_VIEWPORT_QUERY)
    sync()
    media.addEventListener('change', sync)
  })

  onUnmounted(() => {
    media?.removeEventListener('change', sync)
    listeners.clear()
  })

  return {
    isNarrowViewport,
    onNarrowViewportChange
  }
}
