import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, ThemeSetArgs } from 'claude-code'

import type { Factory, Look } from '../types'
import { BRAND_MAX, BRAND_STORE_KEY, cleanBrand, storedBrand } from './brand'
import { registerLimitsBand } from './limits-band'
import { checkLimits, installSteps, shortNotice } from './limits-gate'
import { makeColors } from './make-colors.js'
import { buildScene, nextStage, RINGS, STAGE_LABEL } from './scene'

// Graphite and steel: quiet grays, with roles kept muted so code still reads.
const { theme, problems } = makeColors({
  label: 'Rocket Factory',
  only: 'dark',
  roles: {
    accent: '#8fa3b8',
    danger: '#c98a8a',
    success: '#8fb39a',
    warning: '#c9ad7f',
    pro: '#a99cc4',
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#0c0d0e',
        'surface-1': '#111213',
        'surface-2': '#151617',
        'surface-3': '#18191b',
        'text-primary': '#e9e9ea',
        'text-secondary': '#bfc0c2',
        'text-muted': '#929497',
      },
    },
  },
})

const SCENE_NAME = 'rocket-factory'
// Frosted glass hid the whole scene on desktop, so no look uses glass: the
// scene darkens the chat column itself (its reading lane).
const LOOKS = {
  on: { colors: theme, backdrop: { scene: SCENE_NAME, glass: false } },
  calm: { colors: theme, backdrop: { scene: `${SCENE_NAME}-still`, glass: false } },
} satisfies Record<string, ThemeSetArgs>

type Mode = keyof typeof LOOKS

// The look in force; the limits band follows it. session.start applies `on`.
const look = atom({ plugin: 'rocket-factory', key: 'look' } as const, 'on' as Look)

const INITIAL: Factory = { rings: 3, stage: 'stack', build: 1, welds: 0, working: false, last: 'idle' }

// Change the tag when Factory's fields change, so an older stored value reads as INITIAL.
const factory = atom({ plugin: 'rocket-factory', key: 'factory' } as const, INITIAL, {
  shape: 'factory-2',
})

// The brand on the plate above the rocket and at the start of the band; '' is none.
const brand = atom({ plugin: 'rocket-factory', key: 'brand' } as const, '')

/** Sets the brand, or clears it when `raw` is empty, and answers what the command says back. */
const setBrand = async ($: EngineInterface, raw: string): Promise<string> => {
  const { name, isCut } = cleanBrand(raw)
  if (name === '') {
    await $.store.delete(BRAND_STORE_KEY)
    await update($, brand, () => '')

    return 'Brand cleared. Set one with /rocket-factory brand <name>.'
  }
  await $.store.set(BRAND_STORE_KEY, name)
  await update($, brand, () => name)

  return isCut
    ? `Brand set to "${name}" (cut to ${BRAND_MAX} characters).`
    : `Brand set to "${name}". It shows above the rocket and in the limits band.`
}

// Tool calls of the running turn. Counted here and written once at turn end,
// so the scene redraws twice a turn rather than on every call.
let pendingWelds = 0

/**
 * Turns a look on, unless the Limits mod is missing or off: then the theme stays
 * off and the person is told how to install it. Answers the reason it stayed off.
 */
const apply = async ($: EngineInterface, mode: Mode): Promise<string | undefined> => {
  const limits = await checkLimits($)
  if (limits !== 'enabled') {
    await update($, look, (): Look => 'off')
    await $.theme.clear()
    $.ui.status(shortNotice(limits))
    $.ui.toast(shortNotice(limits))

    return installSteps(limits)
  }
  $.ui.status(undefined)
  await update($, look, (): Look => mode)
  const set = await $.theme.set(LOOKS[mode])
  if (!set.isDrawn) {
    $.ui.status(`Rocket factory: ${set.reason}`)
  }

  return undefined
}

export const register: Register = on => {
  registerLimitsBand(on)

  on('session.start', async ($, e, next) => {
    const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))
    if (unpainted !== undefined) {
      $.ui.toast(unpainted)
    }
    $.ui.status(undefined)
    await $.command.register({
      name: 'rocket-factory',
      description:
        'Rocket factory theme, with a Rocket skin for the Limits band: on (default), calm (no motion), off, brand <name>',
    })
    const saved = storedBrand(await $.store.get(BRAND_STORE_KEY))
    await update($, brand, () => saved)
    await apply($, 'on')

    return next(e)
  })

  on('command.run', { command: 'rocket-factory' }, async ($, e) => {
    const arg = e.args.trim() || 'on'
    const brandArg = /^brand(?:\s+([\s\S]*))?$/i.exec(arg)
    if (brandArg) {
      return { text: await setBrand($, brandArg[1] ?? '') }
    }
    if (arg === 'off') {
      await $.theme.clear()
      await update($, look, (): Look => 'off')

      return { text: 'Rocket factory off. Run /rocket-factory to bring it back.' }
    }
    if (arg !== 'on' && arg !== 'calm') {
      return { text: `Unknown option "${arg}". Use: on, calm, off, brand <name>.` }
    }
    const blocked = await apply($, arg)
    if (blocked !== undefined) {
      return { text: blocked }
    }

    return { text: arg === 'calm' ? 'Rocket factory on, without motion.' : 'Rocket factory on.' }
  })

  // A turn starts: the welders switch on. A booster that passed its catch test leaves
  // the stand first, and a new build starts.
  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) {
      pendingWelds = 0
      await update($, factory, (f): Factory =>
        f.stage === 'catch'
          ? { rings: 0, stage: 'stack', build: f.build + 1, welds: 0, working: true, last: 'start' }
          : { ...f, working: true, last: 'start' },
      )
    }

    return next(e)
  })

  // Every tool call is a weld.
  on('tool.call', async ($, e, next) => {
    pendingWelds += 1

    return next(e)
  })

  // A turn ends: the crane stacks one ring. Once all rings are on, each turn moves the
  // booster one stage on: cold proof test, engine install, static fire, catch test.
  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    if (e.agentId === undefined) {
      const welds = pendingWelds
      pendingWelds = 0
      await update($, factory, (f): Factory => {
        const done = { ...f, welds: f.welds + welds, working: false }
        if (f.stage === 'stack' && f.rings < RINGS) {
          return { ...done, rings: f.rings + 1, last: 'stack' }
        }
        const after = nextStage(f.stage)
        return after === f.stage ? { ...done, last: 'idle' } : { ...done, stage: after, last: 'stage' }
      })
    }

    return result
  })

  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    if (e.surface !== 'desktop' && e.surface !== 'mobile') {
      return next(e)
    }
    const still = e.props.scene === `${SCENE_NAME}-still`
    if (e.props.scene !== SCENE_NAME && !still) {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)
    const f = await read($, factory)
    const name = await read($, brand)

    return (
      <Svg
        source={buildScene(f, { animate: !still, brand: name })}
        alt={`Monotone rocket factory${name ? `, branded ${name}` : ''}: build ${f.build}, ring ${Math.min(f.rings, RINGS)} of ${RINGS} stacked, stage ${STAGE_LABEL[f.stage] ?? 'stacking'}; crews, carts and robots at work`}
        isInteractive
      />
    )
  })
}
