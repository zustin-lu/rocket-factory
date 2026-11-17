import { expect, test } from 'claude-code/testing'
import type { On } from 'claude-code'

import { countdown, isFinalCountdown, swapLimitsRow, telemetryOf, weldFlare } from './limits-band'

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
  // 5HR and WK: label, two ends around a stretching middle, and a tail. CTX: label and
  // its number, no bar. Then the telemetry dot.
  expect(svgs).toHaveLength(13)
  for (const svg of svgs) expect(svg.props.alt.trim()).not.toBe('')
  // Rocket steel track and ring seams, not Limits' greens.
  expect(svgs.some(s => s.props.source.includes('#3a3b3e'))).toBe(true)
  expect(svgs.some(s => s.props.source.includes('#3fb950'))).toBe(false)
  expect(svgs.at(-1)!.props.alt).toBe('Usage read just now')
  expect(svgs.some(s => s.props.alt.includes('84.2k/200k'))).toBe(true)
  expect(svgs.some(s => s.props.source.includes('>T-2h</text>'))).toBe(true)
  await desk.unmount()

  const term = await $.ui.mount({ ...BAND, surface: 'terminal' })
  for (const text of ['5HR ', 'WK ', 'CTX ', /24%/, /61%/, /42%/, ' T-2h', /▰/, '•']) {
    expect(await term.find({ type: 'Text', text })).toBeDefined()
  }
  // The context shows as a number, with no token count. WK, 61% used with 72h of 168h
  // left, is on track to run out before its reset, so it is red and carries the beacon.
  expect(await term.find({ type: 'Text', text: /84\.2k/ })).toBeUndefined()
  expect(await term.findAll({ type: 'Text', text: ' ●' })).toHaveLength(1)
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

test('a brand leads the band on desktop and terminal', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  seed(on, { ...READING, 'rocket-factory.brand': 'Acme' })

  const desk = await $.ui.mount({ ...BAND, surface: 'desktop' })
  const svgs = (await desk.findAll({ type: 'Svg' })) as unknown as { props: { alt: string; source: string } }[]
  expect(svgs).toHaveLength(14)
  expect(svgs[0]!.props.alt).toBe('Brand: Acme')
  expect(svgs[0]!.props.source).toContain('>ACME</text>')
  await desk.unmount()

  const term = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await term.find({ type: 'Text', text: 'ACME' })).toBeDefined()
  await term.unmount()
})

test('a meter in the red vents vapor', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  const hot = { ...READING, 'limits.context': { tokens: 180_000, window: 200_000, percent: 90 } }
  seed(on, hot)
  const desk = await $.ui.mount({ ...BAND, surface: 'desktop' })
  const svgs = (await desk.findAll({ type: 'Svg' })) as unknown as { props: { alt: string; source: string } }[]
  const ctx = svgs.find(s => s.props.alt.startsWith('Context 90%'))!
  expect(ctx.props.source).toContain('class="vp2"')
  expect(ctx.props.source).not.toMatch(/\{animation-delay:/)
  await desk.unmount()
  const term = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await term.find({ type: 'Text', text: ' ●' })).toBeDefined()
  await term.unmount()
})

test('calm mode draws the vent as a still puff', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  seed(on, {
    ...READING,
    'limits.context': { tokens: 180_000, window: 200_000, percent: 90 },
    'rocket-factory.look': 'calm',
  })
  const desk = await $.ui.mount({ ...BAND, surface: 'desktop' })
  const svgs = (await desk.findAll({ type: 'Svg' })) as unknown as { props: { alt: string; source: string } }[]
  const ctx = svgs.find(s => s.props.alt.startsWith('Context 90%'))!
  expect(ctx.props.source).toContain('<circle')
  expect(ctx.props.source).not.toContain('class="vp')
  await desk.unmount()
})

test('countdowns and telemetry', () => {
  expect(countdown(2 * 3_600_000)).toBe('T-2h')
  expect(countdown(-5)).toBe('T-0')
  expect(telemetryOf(true, 0)).toBe('refreshing')
  expect(telemetryOf(false, 60_000)).toBe('fresh')
  expect(telemetryOf(false, 11 * 60_000)).toBe('stale')
})

test('while Claude works, propellant flows along the bars; at rest only the frost line shows', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  seed(on, READING)
  const bars = async (isWorking: boolean) => {
    const ui = await $.ui.mount({ ...BAND, surface: 'desktop', props: { ...BAND.props, isWorking } })
    const svgs = (await ui.findAll({ type: 'Svg' })) as unknown as { props: { alt: string; source: string } }[]
    await ui.unmount()
    return svgs.filter(s => s.props.alt.includes('limit')).map(s => s.props.source)
  }
  const working = await bars(true)
  expect(working).toHaveLength(2)
  for (const src of working) {
    expect(src).not.toContain('var(')
    expect(src).not.toContain('--')
    expect(src).toContain('class="pf"')
    expect(src).toContain('class="fl"')
  }
  const idle = await bars(false)
  for (const src of idle) {
    expect(src).not.toContain('class="pf"')
    expect(src).toContain('stroke-opacity=".8"')
  }
})

test('idle band: the now tick breathes, the dot beats, the plate glints; calm keeps all still', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  const sources = async (look: string) => {
    const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
    const svgs = (await ui.findAll({ type: 'Svg' })) as unknown as { props: { alt: string; source: string } }[]
    await ui.unmount()
    return svgs
  }
  seed(on, { ...READING, 'rocket-factory.brand': 'Acme' })
  const svgs = await sources('on')
  expect(svgs.find(s => s.props.alt.startsWith('5-hour'))!.props.source).toContain('class="bt"')
  expect(svgs.at(-1)!.props.source).toContain('class="hb"')
  expect(svgs[0]!.props.source).toContain('class="gl"')
  for (const s of svgs) {
    expect(s.props.source).not.toMatch(/\{animation-delay:/)
    expect(s.props.source).not.toContain('var(')
    // A moving piece goes into a frame, where the desktop plays CSS animation; a still one stays an image.
    expect((s.props as { isInteractive?: boolean }).isInteractive === true).toBe(s.props.source.includes('animation:'))
  }
})

test('calm mode: no idle animation', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  seed(on, { ...READING, 'rocket-factory.brand': 'Acme', 'rocket-factory.look': 'calm' })
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  const svgs = (await ui.findAll({ type: 'Svg' })) as unknown as { props: { source: string } }[]
  await ui.unmount()
  for (const s of svgs) expect(s.props.source).not.toContain('animation:')
})

test('a seam flares once when the fill crosses into a new ring', () => {
  const t = 1_000_000
  expect(weldFlare('T', 20, t)).toBeUndefined() // first reading: quiet
  expect(weldFlare('T', 24, t + 10)).toBeUndefined() // same ring
  expect(weldFlare('T', 26, t + 20)).toBe(2) // 25% is the second seam
  expect(weldFlare('T', 26, t + 1000)).toBe(2) // still playing on a redraw
  expect(weldFlare('T', 26, t + 5000)).toBeUndefined() // played out
  expect(weldFlare('T', 3, t + 6000)).toBeUndefined() // window reset: no flare
})

test('the final countdown is the last hour before a reset', () => {
  expect(isFinalCountdown(30 * 60_000)).toBe(true)
  expect(isFinalCountdown(2 * 3_600_000)).toBe(false)
  expect(isFinalCountdown(0)).toBe(false)
})
