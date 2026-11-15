import { invoke } from '@tauri-apps/api/core'

/**
 * Reads a value from the host `app_kv` table via a Tauri command.
 * @param key - Storage key.
 * @returns Stored value, or `null` when missing.
 */
export async function getAppValue(key: string): Promise<string | null> {
  return invoke<string | null>('get_app_value', { key })
}

/**
 * Writes a value into the host `app_kv` table via a Tauri command.
 * @param key - Storage key.
 * @param value - Value to store.
 */
export async function setAppValue(key: string, value: string): Promise<void> {
  await invoke('set_app_value', { key, value })
}

/**
 * Deletes a key from the host `app_kv` table via a Tauri command.
 * @param key - Storage key.
 */
export async function deleteAppValue(key: string): Promise<void> {
  await invoke('delete_app_value', { key })
}
