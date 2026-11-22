import { describe, expect, it } from 'vitest'

import {
  APP_VERSION,
  APP_VERSION_NAME,
  appVersion,
  DEFAULT_APP_VERSION_NAME,
  resolveAppVersionName
} from './appVersion'

describe('appVersion', () => {
  it('exposes the package.json semantic version for the shell notch', () => {
    expect(APP_VERSION).toBe('0.0.0')
    expect(appVersion.version).toBe(APP_VERSION)
  })

  it('falls back to an empty designation when VITE_APP_VERSION_NAME is unset', () => {
    expect(DEFAULT_APP_VERSION_NAME).toBe('')
    expect(APP_VERSION_NAME).toBe('')
    expect(appVersion.versionName).toBe('')
  })
})

describe('resolveAppVersionName', () => {
  it('uses the env override when set (manual per-release designation)', () => {
    expect(resolveAppVersionName('Example')).toBe('Example')
    expect(resolveAppVersionName('Nova')).toBe('Nova')
  })

  it('trims whitespace around the override', () => {
    expect(resolveAppVersionName('  Example  ')).toBe('Example')
  })

  it('falls back to empty string when override is undefined, empty, or blank', () => {
    expect(resolveAppVersionName(undefined)).toBe('')
    expect(resolveAppVersionName('')).toBe('')
    expect(resolveAppVersionName('   ')).toBe('')
  })

  it('accepts an explicit fallback for tests or alternate defaults', () => {
    expect(resolveAppVersionName(undefined, 'LocalOnly')).toBe('LocalOnly')
    expect(resolveAppVersionName('Example', 'LocalOnly')).toBe('Example')
  })
})
