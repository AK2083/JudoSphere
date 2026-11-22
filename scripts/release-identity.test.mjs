#!/usr/bin/env node
/**
 * Run: node --test scripts/release-identity.test.mjs
 */

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  formatReleaseTag,
  mapReleaseChannel,
  parseChannelVersion,
  parseReleaseTag,
  syncReleaseIdentity
} from './lib/release-identity.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const syncScript = path.join(root, 'scripts/sync-release-identity.mjs')
const mapScript = path.join(root, 'scripts/map-release-channel.mjs')

/**
 * @param {string} script
 * @param {NodeJS.ProcessEnv} env
 */
function runCli(script, env) {
  return spawnSync(process.execPath, [script], {
    cwd: root,
    env: { ...process.env, ...env },
    encoding: 'utf8'
  })
}

test('parseChannelVersion accepts channel.counter prereleases', () => {
  assert.deepEqual(parseChannelVersion('1.0.0-alpha.1'), {
    core: '1.0.0',
    channel: 'alpha',
    counter: 1,
    version: '1.0.0-alpha.1'
  })
})

test('parseChannelVersion rejects build metadata and unknown channels', () => {
  assert.throws(() => parseChannelVersion('1.0.0+Example'), /build metadata/)
  assert.throws(() => parseChannelVersion('1.0.0'), /prerelease channel/)
  assert.throws(() => parseChannelVersion('1.0.0-gamma.1'), /unsupported channel/)
  assert.throws(() => parseChannelVersion('1.0.0-alpha'), /\{channel\}\.\{counter\}/)
  assert.throws(() => parseChannelVersion('not-a-version'), /must match/)
})

test('parseReleaseTag round-trips tag identity with manual mixed-case designation', () => {
  assert.deepEqual(parseReleaseTag('v1.0.0-beta.2+Example'), {
    version: '1.0.0-beta.2',
    versionName: 'Example',
    tag: 'v1.0.0-beta.2+Example',
    channel: 'beta',
    core: '1.0.0',
    counter: 2
  })
  assert.equal(formatReleaseTag('1.0.0-rc.2', 'Nova'), 'v1.0.0-rc.2+Nova')
})

test('mapReleaseChannel preserves core, counter, and manual designation', () => {
  assert.deepEqual(
    mapReleaseChannel({
      sourceTag: 'v1.0.0-alpha.1+Example',
      targetChannel: 'beta'
    }),
    {
      version: '1.0.0-beta.1',
      versionName: 'Example',
      tag: 'v1.0.0-beta.1+Example',
      channel: 'beta',
      core: '1.0.0',
      counter: 1,
      sourceTag: 'v1.0.0-alpha.1+Example',
      sourceVersion: '1.0.0-alpha.1',
      sourceChannel: 'alpha'
    }
  )

  assert.equal(
    mapReleaseChannel({
      version: '1.0.0-beta.3',
      versionName: 'Nova',
      targetChannel: 'rc'
    }).tag,
    'v1.0.0-rc.3+Nova'
  )
})

test('mapReleaseChannel rejects skips and backwards moves', () => {
  assert.throws(
    () =>
      mapReleaseChannel({
        sourceTag: 'v1.0.0-alpha.1+Example',
        targetChannel: 'rc'
      }),
    /only the next channel/
  )
  assert.throws(
    () =>
      mapReleaseChannel({
        sourceTag: 'v1.0.0-beta.1+Example',
        targetChannel: 'alpha'
      }),
    /only the next channel/
  )
})

test('syncReleaseIdentity writes SemVer without +metadata into three manifests', () => {
  const tempRoot = mkdtempSync(path.join(tmpdir(), 'judosphere-release-identity-'))
  try {
    mkdirSync(path.join(tempRoot, 'src-tauri'), { recursive: true })
    writeFileSync(
      path.join(tempRoot, 'package.json'),
      `${JSON.stringify({ name: 'judosphere', version: '0.0.0' }, null, 2)}\n`
    )
    writeFileSync(
      path.join(tempRoot, 'src-tauri/tauri.conf.json'),
      `${JSON.stringify({ productName: 'judosphere', version: '0.0.0' }, null, 2)}\n`
    )
    writeFileSync(
      path.join(tempRoot, 'src-tauri/Cargo.toml'),
      '[package]\nname = "judosphere"\nversion = "0.0.0"\n'
    )

    const result = syncReleaseIdentity({
      rootDir: tempRoot,
      version: '1.0.0-alpha.1'
    })

    assert.equal(result.version, '1.0.0-alpha.1')
    assert.deepEqual(result.files, [
      'package.json',
      'src-tauri/tauri.conf.json',
      'src-tauri/Cargo.toml'
    ])
    assert.equal(
      JSON.parse(readFileSync(path.join(tempRoot, 'package.json'), 'utf8')).version,
      '1.0.0-alpha.1'
    )
    assert.equal(
      JSON.parse(readFileSync(path.join(tempRoot, 'src-tauri/tauri.conf.json'), 'utf8')).version,
      '1.0.0-alpha.1'
    )
    assert.match(
      readFileSync(path.join(tempRoot, 'src-tauri/Cargo.toml'), 'utf8'),
      /^version = "1\.0\.0-alpha\.1"$/m
    )
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('syncReleaseIdentity fails clearly when a manifest is missing', () => {
  const tempRoot = mkdtempSync(path.join(tmpdir(), 'judosphere-release-identity-missing-'))
  try {
    assert.throws(
      () => syncReleaseIdentity({ rootDir: tempRoot, version: '1.0.0-alpha.1' }),
      /missing required file: package\.json/
    )
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('sync CLI rejects invalid env and maps happy-path output shape', () => {
  const rejectedMeta = runCli(syncScript, {
    RELEASE_VERSION: '1.0.0+Example',
    RELEASE_VERSION_NAME: 'Example'
  })
  assert.notEqual(rejectedMeta.status, 0)
  assert.match(rejectedMeta.stderr, /build metadata|must match/)

  const rejectedName = runCli(syncScript, {
    RELEASE_VERSION: '1.0.0-alpha.1',
    RELEASE_VERSION_NAME: 'Has Space'
  })
  assert.notEqual(rejectedName.status, 0)

  const tempRoot = mkdtempSync(path.join(tmpdir(), 'judosphere-release-identity-cli-'))
  try {
    mkdirSync(path.join(tempRoot, 'src-tauri'), { recursive: true })
    writeFileSync(
      path.join(tempRoot, 'package.json'),
      `${JSON.stringify({ name: 'judosphere', version: '0.0.0' }, null, 2)}\n`
    )
    writeFileSync(
      path.join(tempRoot, 'src-tauri/tauri.conf.json'),
      `${JSON.stringify({ version: '0.0.0' }, null, 2)}\n`
    )
    writeFileSync(
      path.join(tempRoot, 'src-tauri/Cargo.toml'),
      '[package]\nname = "judosphere"\nversion = "0.0.0"\n'
    )

    const ok = runCli(syncScript, {
      RELEASE_VERSION: '1.0.0-alpha.1',
      RELEASE_VERSION_NAME: 'Example',
      RELEASE_ROOT: tempRoot
    })
    assert.equal(ok.status, 0, ok.stderr)
    assert.deepEqual(JSON.parse(ok.stdout), {
      version: '1.0.0-alpha.1',
      versionName: 'Example',
      tag: 'v1.0.0-alpha.1+Example',
      files: ['package.json', 'src-tauri/tauri.conf.json', 'src-tauri/Cargo.toml']
    })
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('map CLI prints promoted identity JSON', () => {
  const ok = runCli(mapScript, {
    SOURCE_TAG: 'v1.0.0-alpha.1+Example',
    TARGET_CHANNEL: 'beta'
  })
  assert.equal(ok.status, 0, ok.stderr)
  assert.equal(JSON.parse(ok.stdout).tag, 'v1.0.0-beta.1+Example')
  assert.equal(JSON.parse(ok.stdout).versionName, 'Example')

  const skip = runCli(mapScript, {
    SOURCE_TAG: 'v1.0.0-alpha.1+Example',
    TARGET_CHANNEL: 'rc'
  })
  assert.notEqual(skip.status, 0)
})

test('Linux release matrix ships deb+appimage and never RPM', () => {
  const workflow = readFileSync(
    path.join(root, '.github/workflows/release-tauri-build.yml'),
    'utf8'
  )
  assert.match(workflow, /platform: ubuntu-26\.04[\s\S]*?args: --bundles deb,appimage/)
  assert.doesNotMatch(
    workflow,
    /platform: ubuntu-26\.04[\s\S]*?args: --bundles[^\n]*rpm/
  )

  const tauriConf = JSON.parse(
    readFileSync(path.join(root, 'src-tauri/tauri.conf.json'), 'utf8')
  )
  const targets = tauriConf.bundle?.targets
  assert.ok(Array.isArray(targets), 'bundle.targets must be an explicit list')
  assert.ok(targets.includes('deb'))
  assert.ok(targets.includes('appimage'))
  assert.ok(!targets.includes('rpm'))
  assert.notEqual(targets, 'all')
})

test('Windows release matrix ships nsis and never MSI', () => {
  const workflow = readFileSync(
    path.join(root, '.github/workflows/release-tauri-build.yml'),
    'utf8'
  )
  assert.match(workflow, /platform: windows-latest[\s\S]*?args: --bundles nsis/)
  assert.doesNotMatch(
    workflow,
    /platform: windows-latest[\s\S]*?args: --bundles[^\n]*msi/
  )

  const tauriConf = JSON.parse(
    readFileSync(path.join(root, 'src-tauri/tauri.conf.json'), 'utf8')
  )
  const targets = tauriConf.bundle?.targets
  assert.ok(Array.isArray(targets), 'bundle.targets must be an explicit list')
  assert.ok(targets.includes('nsis'))
  assert.ok(!targets.includes('msi'))
})
