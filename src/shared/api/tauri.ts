import { invoke } from '@tauri-apps/api/core'

/**
 * Invokes the Tauri greet command.
 */
export async function greet(name: string): Promise<string> {
  return invoke<string>('greet', { name })
}
