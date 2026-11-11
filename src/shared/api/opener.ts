import { openUrl as openExternalUrl } from '@tauri-apps/plugin-opener'

/**
 * Opens a URL with the system default application.
 * @param url - Absolute URL to open.
 * @returns Promise that resolves when the opener finishes.
 */
export const openUrl = openExternalUrl
