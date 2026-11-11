import { invoke } from '@tauri-apps/api/core'

/**
 * Invokes the Tauri greet command.
 * @param name - Name to greet.
 * @returns Greeting message from the host.
 */
export async function greet(name: string): Promise<string> {
  return invoke<string>('greet', { name })
}
