#!/usr/bin/env node
/**
 * Maps a release identity to the next SemVer channel (alpha → beta → rc)
 * while preserving core version, prerelease counter, and the manually chosen
 * designation from the source tag (any name you entered, e.g. Starlet).
 *
 * Usage (from Git tag — preferred; designation comes from the tag):
 *   SOURCE_TAG=v1.0.0-alpha.1+Starlet TARGET_CHANNEL=beta \
 *     node scripts/map-release-channel.mjs
 *
 * Usage (from parts):
 *   RELEASE_VERSION=1.0.0-alpha.1 RELEASE_VERSION_NAME=Starlet TARGET_CHANNEL=beta \
 *     node scripts/map-release-channel.mjs
 *
 * Prints JSON:
 *   {
 *     version, versionName, tag, channel, core, counter,
 *     sourceTag, sourceVersion, sourceChannel
 *   }
 *
 * Related:
 *   node scripts/sync-release-identity.mjs   # write SemVer into manifests
 */

import process from 'node:process'

import { mapReleaseChannel } from './lib/release-identity.mjs'

try {
  const sourceTag = process.env.SOURCE_TAG?.trim()
  const mapped = sourceTag
    ? mapReleaseChannel({
        sourceTag,
        targetChannel: process.env.TARGET_CHANNEL ?? ''
      })
    : mapReleaseChannel({
        version: process.env.RELEASE_VERSION ?? '',
        versionName: process.env.RELEASE_VERSION_NAME ?? '',
        targetChannel: process.env.TARGET_CHANNEL ?? ''
      })

  process.stdout.write(`${JSON.stringify(mapped)}\n`)
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`${message}\n`)
  process.exitCode = 1
}
