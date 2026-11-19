import { expect, test } from 'claude-code/testing'
import type { On } from 'claude-code'

const ROW = { plugin: 'rocket-factory', component: 'UserMessage' } as const
const prompt = (extra: Record<string, unknown> = {}) => ({
  ...ROW,
  props: { text: 'Ship the **next** stage', origin: { kind: 'composer' }, isExpanded: true, ...extra },
})

const lookIs = (on: On, look: string) =>
  on('state.get', (_, e) => ({ value: e.key === 'look' ? { value: look, version: 1 } : { version: 0 } }) as never)

const engine = (on: On) =>
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine row</Text>
  })

type SvgNode = { props: { alt: string; source: string } }

test('your prompt is a steel plate with a CMD plate and a ringed rail', async ($, on) => {
  engine(on)
  lookIs(on, 'on')
  const ui = await $.ui.mount({ ...prompt(), surface: 'desktop' } as never)
  const svgs = (await ui.findAll({ type: 'Svg' })) as unknown as SvgNode[]
  expect(svgs).toHaveLength(2)
  expect(svgs[0]!.props.source).toContain('▲ CMD')
  expect(svgs[0]!.props.source).toContain('#3a3b3e')
  expect(svgs[1]!.props.source).toContain('<path d="M5 0')
  expect(await ui.find({ type: 'Markdown' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: 'engine row' })).toBeUndefined()
  await ui.unmount()
})

test('a relayed message gets a dim RELAY plate and no rail', async ($, on) => {
  engine(on)
  lookIs(on, 'on')
  const ui = await $.ui.mount({ ...prompt({ origin: { kind: 'peer' }, from: { name: 'Coordinator wave 3' } }), surface: 'desktop' } as never)
  const svgs = (await ui.findAll({ type: 'Svg' })) as unknown as SvgNode[]
  expect(svgs).toHaveLength(1)
  expect(svgs[0]!.props.source).toContain('RELAY · COORDINATOR WAVE 3')
  await ui.unmount()
})

test('the app keeps its own row: terminal, theme off, compact rows, notifications', async ($, on) => {
  engine(on)
  lookIs(on, 'on')
  for (const [row, surface] of [
    [prompt(), 'terminal'],
    [prompt({ isExpanded: false }), 'desktop'],
    [prompt({ origin: { kind: 'task-notification' } }), 'desktop'],
  ] as const) {
    const ui = await $.ui.mount({ ...row, surface } as never)
    expect(await ui.find({ type: 'Text', text: 'engine row' })).toBeDefined()
    await ui.unmount()
  }
})

test('with the theme off the bubble is the app own', async ($, on) => {
  engine(on)
  lookIs(on, 'off')
  const ui = await $.ui.mount({ ...prompt(), surface: 'desktop' } as never)
  expect(await ui.find({ type: 'Text', text: 'engine row' })).toBeDefined()
  await ui.unmount()
})

test('a prompt sent through the desktop app (an SDK host) is a steel plate too', async ($, on) => {
  engine(on)
  lookIs(on, 'on')
  const ui = await $.ui.mount({ ...prompt({ origin: { kind: 'sdk' } }), surface: 'desktop' } as never)
  const svgs = (await ui.findAll({ type: 'Svg' })) as unknown as SvgNode[]
  expect(svgs[0]!.props.source).toContain('▲ CMD')
  await ui.unmount()
})
