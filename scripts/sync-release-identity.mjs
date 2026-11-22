#!/usr/bin/env node
/**
 * Syncs a release SemVer into package.json, tauri.conf.json, and Cargo.toml.
 *
 * Build metadata / designation is not written into those version fields (Cargo
 * rejects `+meta`). You choose the designation manually each release
 * (`RELEASE_VERSION_NAME`, e.g. Example or any other name); it becomes part of
 * the Git tag `v{version}+{versionName}` and later `VITE_APP_VERSION_NAME`.
 *
 * Usage:
 *   RELEASE_VERSION=1.0.0-alpha.1 RELEASE_VERSION_NAME=Example \
 *     node scripts/sync-release-identity.mjs
 *
 * Optional:
 *   RELEASE_ROOT=/path/to/repo   # defaults to repo root (parent of scripts/)
 *
 * Prints JSON: `{ version, versionName, tag, files }` for workflow outputs.
 *
 * Related:
 *   node scripts/map-release-channel.mjs   # alpha → beta → rc mapping
 */

import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import {
  formatReleaseTag,
  parseChannelVersion,
  parseVersionName,
  syncReleaseIdentity
} from './lib/release-identity.mjs'

const rootDir =
  process.env.RELEASE_ROOT?.trim() ||
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

try {
  const version = parseChannelVersion(process.env.RELEASE_VERSION ?? '').version
  const versionName = parseVersionName(process.env.RELEASE_VERSION_NAME ?? '')
  const synced = syncReleaseIdentity({ rootDir, version })
  const tag = formatReleaseTag(synced.version, versionName)

  process.stdout.write(
    `${JSON.stringify({
      version: synced.version,
      versionName,
      tag,
      files: synced.files
    })}\n`
  )
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`${message}\n`)
  process.exitCode = 1
}
