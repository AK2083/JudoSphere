import { onMounted, ref, watch } from 'vue'
import { BuildingLibraryIcon, Cog6ToothIcon, HomeIcon, UsersIcon } from '@heroicons/vue/24/outline'

import { translationKeys } from '../i18n'

/** localStorage key for the persisted sidebar collapsed state. */
const NAV_COLLAPSED_STORAGE_KEY = 'judosphere.app-shell.nav-collapsed'

/**
 * App-navigation destinations and collapse state for the shell chrome.
 * @returns Destinations, collapse state, and toggle helper for `AppNavigation`
 */
export function useAppNavigation() {
  const navCollapsed = ref(false)

  const primaryDestinations = [
    { key: translationKeys.home, to: '/', icon: HomeIcon },
    { key: translationKeys.clubs, to: null, icon: BuildingLibraryIcon },
    { key: translationKeys.participants, to: null, icon: UsersIcon }
  ] as const

  const settingsDestination = {
    key: translationKeys.settings,
    to: null,
    icon: Cog6ToothIcon
  } as const

  function toggleNavCollapsed(): void {
    navCollapsed.value = !navCollapsed.value
  }

  onMounted(() => {
    try {
      navCollapsed.value = globalThis.localStorage?.getItem(NAV_COLLAPSED_STORAGE_KEY) === '1'
    } catch {
      navCollapsed.value = false
    }
  })

  watch(navCollapsed, (collapsed) => {
    try {
      globalThis.localStorage?.setItem(NAV_COLLAPSED_STORAGE_KEY, collapsed ? '1' : '0')
    } catch {}
  })

  return {
    navCollapsed,
    primaryDestinations,
    settingsDestination,
    toggleNavCollapsed
  }
}
