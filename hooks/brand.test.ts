import { expect, test } from 'claude-code/testing'

import { BRAND_MAX, cleanBrand, storedBrand } from './brand'
import { buildScene, nextStage, STAGES } from './scene'

const FACTORY = { rings: 3, stage: 'stack', build: 1, welds: 0, working: false, last: 'idle' } as const

test('cleanBrand tidies and cuts the name', async () => {
  expect(cleanBrand('  Acme   Corp \n')).toEqual({ name: 'Acme Corp', isCut: false })
  expect(cleanBrand('')).toEqual({ name: '', isCut: false })
  const long = cleanBrand('x'.repeat(BRAND_MAX + 5))
  expect(long.name).toHaveLength(BRAND_MAX)
  expect(long.isCut).toBe(true)
  expect(storedBrand(42)).toBe('')
  expect(storedBrand(' Work ')).toBe('Work')
})

test('the scene hangs a plate only when there is a brand', async () => {
  expect(buildScene(FACTORY, { animate: false })).not.toContain('lengthAdjust="spacingAndGlyphs">')
  const branded = buildScene(FACTORY, { animate: false, brand: 'R&D <lab>' })
  expect(branded).toContain('>R&amp;D &lt;LAB&gt;</text>')
  expect(branded).not.toContain('<lab>')
})

test('cryo: two tanks frost and vent; stacking flares the new seam and a crawler inspects it', async () => {
  const cryo = buildScene({ ...FACTORY, rings: 8, stage: 'cryo', last: 'stage' }, { animate: true })
  expect(cryo).toContain('class="tkL"')
  expect(cryo).toContain('class="tkM"')
  expect(cryo.match(/class="tv2"/g)?.length).toBe(2) // vents at the top and at the shared dome
  expect(cryo).toContain('class="hcL"')
  expect(cryo).toContain('class="qi"')
  // stacking has no frost any more: tanks only get cold in the proof test
  expect(buildScene({ ...FACTORY, working: true }, { animate: true })).not.toContain('class="tv2"')
  expect(buildScene({ ...FACTORY, rings: 4, last: 'stack' }, { animate: true })).toContain('class="sx"')
  const stacked = buildScene({ ...FACTORY, last: 'stack' }, { animate: true })
  expect(stacked).toContain('class="sm"')
  const fired = buildScene({ ...FACTORY, rings: 8, stage: 'fire', last: 'stage' }, { animate: true })
  expect(fired).toContain('class="stL0"')
  expect(buildScene({ ...FACTORY, rings: 8, stage: 'fire', last: 'idle' }, { animate: true })).not.toContain('class="stL0"')
  expect(buildScene({ ...FACTORY, last: 'stack' }, { animate: true })).not.toContain('class="stL0"')
})

test('no CSS custom properties, which the app scrub strips with the whole <style>', async () => {
  const shapes = [
    buildScene({ ...FACTORY, working: true }, { animate: true, brand: 'CyberSkill' }),
    buildScene({ ...FACTORY, rings: 8, stage: 'fire', last: 'stage' }, { animate: true, brand: 'CyberSkill' }),
    buildScene({ ...FACTORY, rings: 8, stage: 'catch', last: 'stage' }, { animate: true, brand: 'CyberSkill' }),
    buildScene({ ...FACTORY, rings: 5, last: 'stack' }, { animate: true, brand: 'CyberSkill' }),
  ]
  for (const svg of shapes) {
    expect(svg).not.toContain('var(')
    expect(svg).not.toContain('--')
    // Every animated rule carries the whole shorthand: a delay-only rule froze the backdrop.
    expect(svg).not.toMatch(/\{animation-delay:/)
    expect(svg).not.toContain('style="animation-delay')
    expect(svg.length).toBeLessThan(131_072)
  }
})

test('floor items draw far to near: the back-lane truck passes behind the rocket', async () => {
  const svg = buildScene({ ...FACTORY, working: true }, { animate: true })
  const at = (s: string) => {
    const i = svg.indexOf(s)
    expect(i).toBeGreaterThan(-1)
    return i
  }
  const stand = at('<rect x="166" y="360"')
  const rocket = at(`<rect x="175" y="${345 - 18}"`)
  // back-lane truck and the beam porters stand behind the stand
  expect(at('class="c2"')).toBeLessThan(stand)
  expect(at('class="pr"')).toBeLessThan(stand)
  // near-lane truck passes in front of the rocket
  expect(at('class="c1"')).toBeGreaterThan(rocket)
  // workers behind a truck are drawn before it
  expect(at('class="w3"')).toBeLessThan(at('class="c2"'))
  // and a worker nearer than the truck is drawn after it
  expect(at('class="w2"')).toBeGreaterThan(at('class="c1"'))
  // the floor cart's far-leg copy is behind the weld station, its near-leg copy in front
  const station = at('<g transform="translate(560 382)">')
  expect(at('class="agb"')).toBeLessThan(station)
  expect(at('class="agf"')).toBeGreaterThan(station)
  expect(buildScene(FACTORY, { animate: false })).not.toContain('class="agb"')

  // the nose-cone transporter runs behind the stand; the near truck stays above the window's bottom strip
  expect(at('class="sp"')).toBeLessThan(stand)
  expect(svg).toMatch(/class="c1">[^]*?cy="400"/)
  expect(svg).toContain('class="bk"')
  expect(svg).toContain('class="fs2"')
  // rocket-side crew: boom lift in front of the stand, arm, platform tech, umbilical flow while working
  expect(at('class="bs"')).toBeGreaterThan(stand)
  expect(svg).toContain('<rect x="146" y="258"') // tower-arm carriage parked down the tower
  expect(svg).toContain('class="pw"')
  expect(buildScene({ ...FACTORY, rings: 8, stage: 'cryo' }, { animate: true })).toContain('class="uf"')
  expect(svg).toContain('45%,62%{transform:translateY(-29px)}') // 3 rings: the basket rides 29px up, level with the top ring
  expect(buildScene(FACTORY, { animate: true })).not.toContain('class="uf"')
})

test('stages run stack, cryo, engines, fire, catch, and the catch test is the last', async () => {
  expect(STAGES).toEqual(['stack', 'cryo', 'engines', 'fire', 'catch'])
  expect(nextStage('stack')).toBe('cryo')
  expect(nextStage('fire')).toBe('catch')
  expect(nextStage('catch')).toBe('catch')
})

test('the stack grows from below: the crane lifts the stack and a new ring rolls in under it', async () => {
  const svg = buildScene({ ...FACTORY, rings: 4, last: 'stack' }, { animate: true })
  expect(svg).toContain('class="os"')
  expect(svg).toContain('class="nr"')
  expect(svg).toContain('class="cr"')
  // the old stack starts one ring low, on the stand, and ends where it is drawn
  expect(svg).toContain('0%,28%{transform:translateY(18px)}')
  // the first ring only rolls in; no crane lift
  const first = buildScene({ ...FACTORY, rings: 1, last: 'stack' }, { animate: true })
  expect(first).toContain('class="nr"')
  expect(first).not.toContain('class="os"')
})

test('V3 look: hot-staging ring, grid fins, section seams, engines only from the engine stage', async () => {
  const stacked = buildScene({ ...FACTORY, rings: 8, stage: 'stack' }, { animate: false })
  expect(stacked).toContain(`y="${345 - 8 * 18 - 6}" width="26" height="6"`) // hot-staging ring above the top ring
  expect(stacked).not.toContain('class="ec"')
  const withEngines = buildScene({ ...FACTORY, rings: 8, stage: 'engines' }, { animate: true })
  expect(withEngines).toContain('class="ec"')
  const cryo = buildScene({ ...FACTORY, rings: 8, stage: 'cryo' }, { animate: true })
  expect(cryo).toContain('class="rm"')
  expect(cryo).toContain('CRYO PROOF')
})

test('catch test: the tower arms close under the fins and lift the booster', async () => {
  const svg = buildScene({ ...FACTORY, rings: 8, stage: 'catch', last: 'stage' }, { animate: true })
  expect(svg).toContain('class="ch"')
  expect(svg).toContain('class="ac"')
  expect(svg).toContain('class="bl"')
  // parked arms are swung open; closed ones have no open transform
  expect(buildScene(FACTORY, { animate: false })).toContain('scale(0.18 1)')
  expect(buildScene({ ...FACTORY, rings: 8, stage: 'catch' }, { animate: false })).not.toContain('scale(0.18 1)')
})

test('hex tiles: one pattern, used by the parked ships and the transported nose section', async () => {
  const svg = buildScene(FACTORY, { animate: true })
  expect(svg.match(/<pattern id="hx"/g)?.length).toBe(1)
  expect(svg.match(/url\(#hx\)/g)?.length).toBe(3)
})

test('each stage runs only its own activities', async () => {
  const stack = buildScene({ ...FACTORY, working: true }, { animate: true })
  const fire = buildScene({ ...FACTORY, rings: 8, stage: 'fire', last: 'stage' }, { animate: true })
  // crews and the boom lift work while stacking; the pad is cleared for the static fire
  expect(stack).toContain('class="pw"')
  expect(stack).toContain('class="bs"')
  expect(fire).not.toContain('class="pw"')
  expect(fire).not.toContain('class="bs"')
  expect(fire).not.toContain('class="pr"')
  // drones inspect only while the pad is cleared; the ring line turns only while stacking
  expect(stack).not.toContain('class="d1"')
  expect(fire).toContain('class="d1"')
  expect(stack).toContain('class="co"')
  expect(fire).not.toContain('class="co"')
  // venting only while the tanks are cold
  expect(stack).not.toContain('class="vt"')
  expect(fire).toContain('class="vt"')
  // the static fire counts down, sprays the deluge, then fires
  expect(fire).toContain('>IGNITION</text>')
  expect(fire).toContain('class="dl"')
  // the catch test pulls the umbilical back and opens the clamps
  const caught = buildScene({ ...FACTORY, rings: 8, stage: 'catch', last: 'stage' }, { animate: true })
  expect(caught).toContain('class="qo"')
  expect(caught).toContain('class="hoR"')
})

test('the hall runs on a skeleton crew between turns', async () => {
  const idle = buildScene(FACTORY, { animate: true })
  const busy = buildScene({ ...FACTORY, working: true }, { animate: true })
  // one truck, the bridge crane and the rocket-side crew keep moving between turns
  expect(idle).toContain('class="c2"')
  expect(idle).toContain('class="bk"')
  expect(idle).toContain('class="pw"')
  // the rest of the hall, the sparks and the test cell wait for Claude to work
  for (const cls of ['c1', 'sp', 'agf', 'ln', 'r1', 'ws', 'fs1', 'cl', 'w2', 'tc']) {
    expect(idle).not.toContain(`class="${cls}"`)
    expect(busy).toContain(`class="${cls}"`)
  }
  // movers wholly under the chat veil never move
  expect(busy).not.toContain('class="fk"')
  expect(busy).not.toContain('class="gt"')
  // flickers inside a one-shot stop with it
  const fire = buildScene({ ...FACTORY, rings: 8, stage: 'fire', last: 'stage' }, { animate: true })
  expect(fire).toContain('class="df"')
  expect(fire).toContain('.df{animation:dm .3s steps(2) 24}')
})

test('the sky through the bay door follows the hour, and each build looks its own way', async () => {
  const night = buildScene(FACTORY, { animate: false, hour: 23 })
  const day = buildScene(FACTORY, { animate: false, hour: 12 })
  expect(night).toContain('stop-color="#0a0c10"')
  expect(night).toContain('fill="#d8dade"') // stars
  expect(day).toContain('stop-color="#2c333c"')
  expect(day).not.toContain('fill="#d8dade"')
  // the same build always draws the same; another build differs
  const b7 = buildScene({ ...FACTORY, rings: 8, build: 7 }, { animate: false, hour: 12 })
  expect(buildScene({ ...FACTORY, rings: 8, build: 7 }, { animate: false, hour: 12 })).toBe(b7)
  expect(buildScene({ ...FACTORY, rings: 8, build: 8 }, { animate: false, hour: 12 })).not.toBe(b7)
})

test('the stand keeps its wear, and the ship is stacked after the catch', async () => {
  const fresh = buildScene({ ...FACTORY, rings: 8, stage: 'cryo' }, { animate: false })
  const fired = buildScene({ ...FACTORY, rings: 8, stage: 'fire', last: 'stage' }, { animate: true })
  const caughtIdle = buildScene({ ...FACTORY, rings: 8, stage: 'catch' }, { animate: false })
  expect(fresh).not.toContain('fill="#cfd6dc"')
  expect(fired).toContain('fill="#cfd6dc"') // frost marks from the cold test
  expect(fired).toContain('class="so"') // soot settles as the fire ends
  expect(caughtIdle).toContain(`<path d="M175 195V`) // ship sits on the hot-staging ring
  const catching = buildScene({ ...FACTORY, rings: 8, stage: 'catch', last: 'stage' }, { animate: true })
  expect(catching).toContain('class="sh"')
  expect(catching).toContain('class="shc"')
  expect(buildScene({ ...FACTORY, rings: 8, stage: 'fire' }, { animate: false })).not.toContain('class="sh"')
})

test('a failed tool call is a rejected weld; stage changes hand over; one-shots stay one-shots', async () => {
  const flawed = buildScene({ ...FACTORY, flawed: 1, rejects: 2 }, { animate: true })
  expect(flawed).toContain('class="rj"')
  expect(flawed).toContain('class="rf"')
  expect(flawed).toContain('>R2</tspan>')
  expect(buildScene({ ...FACTORY, flawed: 1, working: true }, { animate: true })).not.toContain('class="rj"')
  expect(buildScene({ ...FACTORY, flawed: 1 }, { animate: false })).not.toContain('class="rj"')
  const handover = buildScene({ ...FACTORY, rings: 8, stage: 'engines', last: 'stage' }, { animate: true })
  expect(handover).toContain('class="rb"')
  expect(handover).toContain('class="wi"')
  expect(buildScene({ ...FACTORY, rings: 8, stage: 'cryo', last: 'stage' }, { animate: true })).toContain('class="wo"')
  // between turns the new pieces add no loop; while Claude works only the hull light does
  const loops = (svg: string) => (svg.match(/infinite/g) ?? []).length
  const idle = buildScene({ ...FACTORY, rings: 8, stage: 'fire', flawed: 1 }, { animate: true })
  expect(idle).not.toContain('class="hl"')
  expect(buildScene({ ...FACTORY, working: true }, { animate: true })).toContain('class="hl"')
  for (const cls of ['.rj{', '.rg{', '.rf{', '.rw{', '.hf{', '.rb{', '.wi{', '.wo{', '.sh{', '.shc{', '.so{']) {
    for (const svg of [flawed, handover, idle, catchingAll()]) {
      const at = svg.indexOf(cls)
      if (at > -1) expect(svg.slice(at, svg.indexOf('}', at))).not.toContain('infinite')
    }
  }
  expect(loops(idle)).toBe(loops(buildScene({ ...FACTORY, rings: 8, stage: 'fire' }, { animate: true })))
})

const catchingAll = () => buildScene({ ...FACTORY, rings: 8, stage: 'catch', last: 'stage', flawed: 1 }, { animate: true })

test('no thin horizontal line runs behind the chat column', async () => {
  for (const stage of STAGES) {
    const svg = buildScene({ ...FACTORY, rings: 8, stage, working: true }, { animate: true })
    for (const [, attrs] of svg.matchAll(/<rect ([^>]*)>/g)) {
      const num = (name: string) => Number(new RegExp(`(?:^| )${name}="([^"]+)"`).exec(attrs)?.[1] ?? 0)
      if (num('height') > 3) continue
      expect(num('x') < 300 && num('x') + num('width') > 580).toBe(false)
    }
    expect(svg).not.toMatch(/M0 \d+H800/)
  }
})
