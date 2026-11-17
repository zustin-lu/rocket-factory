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
  expect(working).toContain('class="vw vw2"')
  expect(buildScene({ ...FACTORY, working: true }, { animate: false })).not.toContain('class="tk"')
  const stacked = buildScene({ ...FACTORY, last: 'stack' }, { animate: true })
  expect(stacked).toContain('class="sm"')
  const fired = buildScene({ ...FACTORY, rings: 8, last: 'stack' }, { animate: true })
  expect(fired).toContain('class="stL"')
  expect(buildScene({ ...FACTORY, last: 'stack' }, { animate: true })).not.toContain('class="stL"')
})
