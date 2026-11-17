import { expect, test } from 'claude-code/testing'

import { BRAND_MAX, cleanBrand, storedBrand } from './brand'
import { buildScene } from './scene'

const FACTORY = { rings: 3, build: 1, welds: 0, working: false, last: 'idle' } as const

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

test('working: frost climbs the rocket and the top vents; stacking flares the new seam', async () => {
  const working = buildScene({ ...FACTORY, working: true }, { animate: true })
  expect(working).toContain('class="tk"')
  expect(working).toContain('class="tv2"')
  expect(buildScene({ ...FACTORY, working: true }, { animate: false })).not.toContain('class="tk"')
  const stacked = buildScene({ ...FACTORY, last: 'stack' }, { animate: true })
  expect(stacked).toContain('class="sm"')
  const fired = buildScene({ ...FACTORY, rings: 8, last: 'stack' }, { animate: true })
  expect(fired).toContain('class="stL0"')
  expect(buildScene({ ...FACTORY, last: 'stack' }, { animate: true })).not.toContain('class="stL0"')
})

test('no CSS custom properties, which the app scrub strips with the whole <style>', async () => {
  const shapes = [
    buildScene({ ...FACTORY, working: true }, { animate: true, brand: 'CyberSkill' }),
    buildScene({ ...FACTORY, rings: 8, last: 'stack' }, { animate: true, brand: 'CyberSkill' }),
  ]
  for (const svg of shapes) {
    expect(svg).not.toContain('var(')
    expect(svg).not.toContain('--')
    // Every animated rule carries the whole shorthand: a delay-only rule froze the backdrop.
    expect(svg).not.toMatch(/\{animation-delay:/)
    expect(svg).not.toContain('style="animation-delay')
    expect(svg.length).toBeLessThan(131_072)
  }
  expect(shapes[0]).toContain('translateY(-54px)')
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
  expect(svg).toContain('class="sa"')
  expect(svg).toContain('class="pw"')
  expect(svg).toContain('class="uf"')
  expect(svg).toContain('45%,62%{transform:translateY(-29px)}') // 3 rings: the basket rides 29px up, level with the top ring
  expect(buildScene(FACTORY, { animate: true })).not.toContain('class="uf"')
})
