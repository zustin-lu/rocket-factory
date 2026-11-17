import { expect, test } from 'claude-code/testing'

import { checkLimits, installSteps, limitsStatus, shortNotice } from './limits-gate'

test('limitsStatus reads enabledPlugins', async () => {
  expect(limitsStatus({ 'limits@claude-mods': true })).toBe('enabled')
  expect(limitsStatus({ 'limits@other-market': true })).toBe('enabled')
  expect(limitsStatus({ 'limits@claude-mods': false })).toBe('disabled')
  expect(limitsStatus({ 'rocket-factory@local-mods': true })).toBe('missing')
  expect(limitsStatus({ 'limits-extra@x': true })).toBe('missing')
  expect(limitsStatus(undefined)).toBe('missing')
})

// The test harness's $ has no settings noun, so these stand in for it.
const withPlugins = (enabledPlugins: unknown) =>
  ({
    settings: {
      read: async (args?: { key?: string }) =>
        args?.key === 'enabledPlugins' ? enabledPlugins : { enabledPlugins },
    },
  }) as never

test('checkLimits asks the merged settings', async () => {
  expect(await checkLimits(withPlugins({ 'limits@claude-mods': true }))).toBe('enabled')
  expect(await checkLimits(withPlugins({ 'caveman@caveman': true }))).toBe('missing')
  expect(await checkLimits(withPlugins({ 'limits@claude-mods': false }))).toBe('disabled')
})

test('a failed settings read leaves the theme free to turn on', async () => {
  const broken = { settings: { read: async () => Promise.reject(new Error('no settings')) } } as never
  expect(await checkLimits(broken)).toBe('enabled')
})

test('the notices name the command to run', async () => {
  expect(shortNotice('missing')).toContain('/plugin install limits@claude-mods')
  expect(shortNotice('disabled')).toContain('/plugin enable limits@claude-mods')
  expect(installSteps('missing')).toContain('/plugin marketplace add Ryan-LT/claude-mods')
  expect(installSteps('missing')).toContain('/rocket-factory')
})
