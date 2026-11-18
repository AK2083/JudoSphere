import { describe, expect, it } from 'vitest'

import { APP_VERSION, APP_VERSION_NAME, appVersion } from './appVersion'

describe('appVersion', () => {
  it('exposes a non-empty semantic version from package.json', () => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+/)
    expect(appVersion.version).toBe(APP_VERSION)
  })

  it('exposes a non-empty version name for the shell notch', () => {
    expect(APP_VERSION_NAME.length).toBeGreaterThan(0)
    expect(appVersion.versionName).toBe(APP_VERSION_NAME)
  })
})
