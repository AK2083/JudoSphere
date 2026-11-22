/**
 * Shared release-identity helpers for sync + channel promotion.
 *
 * SemVer written into package/tauri/Cargo never includes `+build` metadata
 * (Cargo rejects it). The release designation (codename) is chosen manually per
 * release, carried in the Git tag as `v{version}+{versionName}`, and later
 * baked via `VITE_APP_VERSION_NAME`. It is not a fixed project constant.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

/** SemVer core + optional prerelease (no build metadata). */
export const VERSION_RE =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?$/

/**
 * Per-release designation entered manually (e.g. Starlet, Nova).
 * SemVer build-metadata charset: letters, digits, hyphen; case preserved.
 */
export const VERSION_NAME_RE = /^[A-Za-z][0-9A-Za-z-]{0,63}$/

/** Full release tag: `v{version}+{versionName}` (versionName is manual input). */
export const RELEASE_TAG_RE = /^v(.+)\+([A-Za-z][0-9A-Za-z-]{0,63})$/

/** Ordered SemVer prerelease channels for Test → Staging → Production. */
export const RELEASE_CHANNELS = Object.freeze(['alpha', 'beta', 'rc'])

/**
 * @typedef {{
 *   core: string
 *   channel: string
 *   counter: number
 *   version: string
 * }} ParsedChannelVersion
 */

/**
 * @typedef {{
 *   version: string
 *   versionName: string
 *   tag: string
 *   channel: string
 *   core: string
 *   counter: number
 * }} ReleaseIdentity
 */

/**
 * @param {string} value
 * @param {RegExp} pattern
 * @param {string} label
 * @returns {string}
 */
export function requireMatch(value, pattern, label) {
  const trimmed = value?.trim?.() ?? ''
  if (!pattern.test(trimmed)) {
    throw new Error(`${label} must match ${pattern}; got ${JSON.stringify(value ?? '')}`)
  }
  return trimmed
}

/**
 * @param {string} version
 * @returns {ParsedChannelVersion}
 */
export function parseChannelVersion(version) {
  const trimmed = version?.trim?.() ?? ''
  if (trimmed.includes('+')) {
    throw new Error(`version must not include build metadata (+…); got ${JSON.stringify(version)}`)
  }
  const matched = requireMatch(version, VERSION_RE, 'version')

  const prereleaseIndex = matched.indexOf('-')
  if (prereleaseIndex === -1) {
    throw new Error(
      `version must include a prerelease channel (${RELEASE_CHANNELS.join('|')}); got ${JSON.stringify(version)}`
    )
  }

  const core = matched.slice(0, prereleaseIndex)
  const prerelease = matched.slice(prereleaseIndex + 1)
  const parts = prerelease.split('.')
  const channel = parts[0]
  const counterRaw = parts[1]

  if (!RELEASE_CHANNELS.includes(channel)) {
    throw new Error(
      `unsupported channel ${JSON.stringify(channel)}; expected one of ${RELEASE_CHANNELS.join(', ')}`
    )
  }
  if (parts.length !== 2 || !/^[1-9]\d*$/.test(counterRaw ?? '')) {
    throw new Error(
      `version prerelease must be "{channel}.{counter}" (e.g. alpha.1); got ${JSON.stringify(prerelease)}`
    )
  }

  return {
    core,
    channel,
    counter: Number(counterRaw),
    version: matched
  }
}

/**
 * @param {string} versionName
 * @returns {string}
 */
export function parseVersionName(versionName) {
  return requireMatch(versionName, VERSION_NAME_RE, 'versionName')
}

/**
 * @param {string} version
 * @param {string} versionName
 * @returns {string}
 */
export function formatReleaseTag(version, versionName) {
  return `v${version}+${versionName}`
}

/**
 * @param {string} tag
 * @returns {ReleaseIdentity}
 */
export function parseReleaseTag(tag) {
  const matched = requireMatch(tag, RELEASE_TAG_RE, 'tag')
  const [, versionPart, versionName] = matched.match(RELEASE_TAG_RE) ?? []
  const parsed = parseChannelVersion(versionPart)
  parseVersionName(versionName)

  return {
    version: parsed.version,
    versionName,
    tag: matched,
    channel: parsed.channel,
    core: parsed.core,
    counter: parsed.counter
  }
}

/**
 * Maps alpha → beta → rc while preserving core, counter, and the manually
 * chosen designation. Only the immediate next channel is allowed (no skipping Staging).
 *
 * @param {{ sourceTag?: string, version?: string, versionName?: string, targetChannel: string }} input
 * @returns {ReleaseIdentity & { sourceTag: string, sourceVersion: string, sourceChannel: string }}
 */
export function mapReleaseChannel(input) {
  const targetChannel = input.targetChannel?.trim?.() ?? ''
  if (!RELEASE_CHANNELS.includes(targetChannel)) {
    throw new Error(
      `targetChannel must be one of ${RELEASE_CHANNELS.join(', ')}; got ${JSON.stringify(input.targetChannel ?? '')}`
    )
  }

  /** @type {ReleaseIdentity} */
  let source
  if (input.sourceTag) {
    source = parseReleaseTag(input.sourceTag)
  } else {
    const version = parseChannelVersion(input.version ?? '').version
    const versionName = parseVersionName(input.versionName ?? '')
    const parsed = parseChannelVersion(version)
    source = {
      version: parsed.version,
      versionName,
      tag: formatReleaseTag(parsed.version, versionName),
      channel: parsed.channel,
      core: parsed.core,
      counter: parsed.counter
    }
  }

  const sourceIndex = RELEASE_CHANNELS.indexOf(source.channel)
  const targetIndex = RELEASE_CHANNELS.indexOf(targetChannel)
  if (targetIndex !== sourceIndex + 1) {
    throw new Error(
      `cannot map ${source.channel} → ${targetChannel}; only the next channel is allowed (${RELEASE_CHANNELS.join(' → ')})`
    )
  }

  const version = `${source.core}-${targetChannel}.${source.counter}`
  const tag = formatReleaseTag(version, source.versionName)

  return {
    version,
    versionName: source.versionName,
    tag,
    channel: targetChannel,
    core: source.core,
    counter: source.counter,
    sourceTag: source.tag,
    sourceVersion: source.version,
    sourceChannel: source.channel
  }
}

/**
 * Writes the same SemVer (without +codename) into the three host manifests.
 *
 * @param {{ rootDir: string, version: string }} input
 * @returns {{ version: string, files: string[] }}
 */
export function syncReleaseIdentity(input) {
  const version = parseChannelVersion(input.version).version
  const rootDir = input.rootDir

  const files = [
    {
      relativePath: 'package.json',
      transform: (raw) => {
        const pkg = JSON.parse(raw)
        pkg.version = version
        return `${JSON.stringify(pkg, null, 2)}\n`
      }
    },
    {
      relativePath: 'src-tauri/tauri.conf.json',
      transform: (raw) => {
        const conf = JSON.parse(raw)
        conf.version = version
        return `${JSON.stringify(conf, null, 2)}\n`
      }
    },
    {
      relativePath: 'src-tauri/Cargo.toml',
      transform: (raw) => {
        const next = raw.replace(/^version\s*=\s*"[^"]*"/m, `version = "${version}"`)
        if (next === raw) {
          throw new Error('Could not find package version in src-tauri/Cargo.toml')
        }
        return next
      }
    }
  ]

  /** @type {string[]} */
  const written = []
  for (const file of files) {
    const absolute = path.join(rootDir, file.relativePath)
    let before
    try {
      before = readFileSync(absolute, 'utf8')
    } catch (error) {
      const code = /** @type {NodeJS.ErrnoException} */ (error).code
      if (code === 'ENOENT') {
        throw new Error(`missing required file: ${file.relativePath}`)
      }
      throw error
    }
    const after = file.transform(before)
    writeFileSync(absolute, after)
    written.push(file.relativePath)
  }

  return { version, files: written }
}
