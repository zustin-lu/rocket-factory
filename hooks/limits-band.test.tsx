import { expect, test } from 'claude-code/testing'
import type { On } from 'claude-code'

import { swapLimitsRow } from './limits-band'

const BAND = {
  plugin: 'rocket-factory',
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isWorking: false,
    maxRows: 20,
    bodyColumns: 120,
    scroll: { offset: 0, bodyRows: 20 },
    view: {},
  },
} as const

const inHours = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString()

/** Stands for the session's state: Limits' shared values and rocket-factory's look. */
const seed = (on: On, values: Record<string, unknown>) =>
  on('state.get', (_, e) => {
    const k = `${e.plugin}.${e.key}`
    return { value: k in values ? { value: values[k], version: 1 } : { version: 0 } } as never
  })

const READING = {
  'limits.snapshot': {
    limits: [
      { kind: 'seven_day', percentUsed: 61, resetsAt: inHours(72) },
      { kind: 'five_hour', percentUsed: 23.5, resetsAt: inHours(2) },
    ],
    at: Date.now(),
  },
  'limits.now': Date.now(),
  'limits.context': { tokens: 84_200, window: 200_000, percent: 42 },
  'limits.refreshing': false,
}

test('the Rocket band draws Limits figures on desktop and terminal', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  seed(on, READING)

  const desk = await $.ui.mount({ ...BAND, surface: 'desktop' })
  const svgs = (await desk.findAll({ type: 'Svg' })) as unknown as { props: { alt: string; source: string } }[]
  // Label, two ends around a stretching middle, and a tail per meter: 5HR, WK, CTX.
  expect(svgs).toHaveLength(15)
  for (const svg of svgs) expect(svg.props.alt.trim()).not.toBe('')
  // Rocket steel track and ring seams, not Limits' greens.
  expect(svgs.some(s => s.props.source.includes('#3a3b3e'))).toBe(true)
  expect(svgs.some(s => s.props.source.includes('#3fb950'))).toBe(false)
  expect(await desk.find({ type: 'Text', text: /⟳/ })).toBeDefined()
  await desk.unmount()

  const term = await $.ui.mount({ ...BAND, surface: 'terminal' })
  for (const text of ['5HR ', 'WK ', 'CTX ', ' 24%', ' 61%', '84.2k/200k', /▰/]) {
    expect(await term.find({ type: 'Text', text })).toBeDefined()
  }
  await term.unmount()
})

test('with the look off, or nothing read yet, the band passes to Limits', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  seed(on, { ...READING, 'rocket-factory.look': 'off' })
  const off = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(await off.find({ type: 'Svg' })).toBeUndefined()
  expect(await off.find({ type: 'Text', text: 'engine' })).toBeDefined()
  await off.unmount()
})

test('a fresh chat with no reading passes', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  seed(on, {})
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: 'engine' })).toBeDefined()
  await ui.unmount()
})

test('the Rocket row takes Limits\' place; Limits\' row is left out', () => {
  const p = (plugin: string) => ({ plugin })
  expect(swapLimitsRow([p('quick-replies'), p('limits'), p('rocket-factory')])?.map(r => r.plugin)).toEqual([
    'quick-replies',
    'rocket-factory',
  ])
  expect(swapLimitsRow([p('rocket-factory@local-mods'), p('x'), p('limits@claude-mods')])?.map(r => r.plugin)).toEqual([
    'x',
    'rocket-factory@local-mods',
  ])
  // Either row missing: the band is left as it is.
  expect(swapLimitsRow([p('limits'), p('x')])).toBeUndefined()
  expect(swapLimitsRow([p('rocket-factory')])).toBeUndefined()
})
