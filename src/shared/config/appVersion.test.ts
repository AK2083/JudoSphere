import { describe, expect, it } from 'vitest'

import { APP_VERSION, APP_VERSION_NAME, appVersion } from './appVersion'

describe('appVersion', () => {
  it('exposes the package.json semantic version for the shell notch', () => {
    expect(APP_VERSION).toBe('0.0.0')
    expect(appVersion.version).toBe(APP_VERSION)
  })

  it('exposes the starlight version name for the shell notch', () => {
    expect(APP_VERSION_NAME).toBe('starlight')
    expect(appVersion.versionName).toBe(APP_VERSION_NAME)
  })
})
