// Monotone rocket factory, drawn as one SVG string per redraw.
//
// The scene is 800 x 472 and anchored bottom-left (xMinYMax slice). The
// rocket stands in the gap between the app's sidebar and the chat column,
// so it stays in view whether the right side panel is open or not.
// Inspired by steel-ring rocket stacking and clean full-flow engines; no
// real company's logo, name or vehicle is drawn.

import type { Factory, Stage } from '../types'

export const RINGS = 8

/** The build stages in order; the readout lights one pip per stage. */
export const STAGES: readonly Stage[] = ['stack', 'cryo', 'engines', 'fire', 'catch']

/** What the readout calls each stage. */
export const STAGE_LABEL: Record<Stage, string> = {
  stack: 'STACKING',
  cryo: 'CRYO PROOF',
  engines: 'ENGINE INSTALL',
  fire: 'STATIC FIRE',
  catch: 'CATCH TEST',
}

/** The stage after `s`; the catch test is the last, and the next turn starts a new build. */
export const nextStage = (s: Stage): Stage => STAGES[Math.min(STAGES.length - 1, STAGES.indexOf(s) + 1)] ?? 'stack'

const W = 800
const H = 472
const HORIZON = 300

// Rocket on its test stand
const RX = 175
const RW = 26
const BASE = 345
const RH = 18
const RAIL_Y = 160
const CRANE_PARK = 220
// Hot-staging ring on top of the booster, vented
const HS = 6
// Tower arms ("chopsticks"): parked down the tower, or closed just under the grid fins
const ARM_PARK = 262
const ARM_LEN = 52
const ARM_OPEN = 0.18
// How dark the veil behind the chat column is, 0 to 1
const LANE = 0.74

// Steel grays, darkest to lightest
const G = {
  bg: '#0c0d0e',
  wall: '#121314',
  bay: '#161719',
  roof: '#18191b',
  floor: '#0f1011',
  line: '#18191b',
  edge: '#2a2b2e',
  d1: '#1a1b1d',
  d2: '#222326',
  d3: '#2a2b2e',
  d4: '#303134',
  d5: '#35363a',
  m1: '#3a3b3e',
  m2: '#45474a',
  m3: '#4a4c50',
  m4: '#55575a',
  m5: '#5d5f63',
  l1: '#6f7175',
  l2: '#77797d',
  l3: '#8c8e92',
  l4: '#9a9ca0',
  l5: '#a8aaad',
  l6: '#b8babd',
  hi: '#d9dadc',
  white: '#f4f4f4',
}

const person = (x: number, y: number, s: number, c: string) =>
  `<rect x="${x}" y="${y}" width="${3.4 * s}" height="${9 * s}" rx="${1.7 * s}" fill="${c}"/>` +
  `<circle cx="${x + 1.7 * s}" cy="${y - 2.4 * s}" r="${2.1 * s}" fill="${G.l6}"/>`

const bell = (x: number, y: number, s: number, c: string) =>
  `<path d="M${x - 2 * s} ${y}L${x + 2 * s} ${y}L${x + 3.2 * s} ${y + 6 * s}L${x - 3.2 * s} ${y + 6 * s}Z" fill="${c}"/>`

const ring = (y: number, extra = '') =>
  `<g${extra}><rect x="${RX}" y="${y}" width="${RW}" height="${RH}" fill="${G.l3}"/>` +
  `<rect x="${RX + 5}" y="${y}" width="6" height="${RH}" fill="${G.l5}"/>` +
  `<rect x="${RX + 19}" y="${y}" width="7" height="${RH}" fill="${G.l1}"/>` +
  `<rect x="${RX}" y="${y}" width="${RW}" height="1" fill="${G.m5}"/></g>`

const times = (n: number, f: (i: number) => string) => Array.from({ length: n }, (_, i) => f(i)).join('')

// Heat-shield tiles: a flat-topped hex pattern, dark tiles with light gaps.
const HEX_R = 1.7
const HEX_H = HEX_R * Math.sqrt(3)
const hex = (cx: number, cy: number) => {
  const r = HEX_R * 0.82
  const h = HEX_H * 0.82
  const p = [
    [cx - r, cy],
    [cx - r / 2, cy - h / 2],
    [cx + r / 2, cy - h / 2],
    [cx + r, cy],
    [cx + r / 2, cy + h / 2],
    [cx - r / 2, cy + h / 2],
  ]
  return `M${p.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join('L')}Z`
}
const HEX_DEFS =
  `<defs><pattern id="hx" width="${(HEX_R * 3).toFixed(2)}" height="${HEX_H.toFixed(3)}" patternUnits="userSpaceOnUse">` +
  `<rect width="${(HEX_R * 3).toFixed(2)}" height="${HEX_H.toFixed(3)}" fill="#3a3c3f"/>` +
  `<path d="${hex(HEX_R, HEX_H / 2)}${hex(HEX_R * 2.5, 0)}${hex(HEX_R * 2.5, HEX_H)}" fill="#151617"/></pattern></defs>`

/** A ship standing in a work cell: steel on one side, black hex tiles on the windward side. */
const tiledShip = (x: number, top: number, bottom: number, steel: string) =>
  `<path d="M${x} ${top + 26}Q${x} ${top + 8} ${x + 7} ${top}Q${x + 14} ${top + 8} ${x + 14} ${top + 26}V${bottom}H${x}Z" fill="${steel}"/>` +
  `<path d="M${x + 7} ${top}Q${x + 14} ${top + 8} ${x + 14} ${top + 26}V${bottom}H${x + 7}Z" fill="url(#hx)"/>` +
  `<path d="M${x - 3} ${top + 22}L${x} ${top + 18}V${top + 34}L${x - 3} ${top + 34}Z" fill="${steel}"/>` +
  `<path d="M${x - 4} ${bottom - 30}L${x} ${bottom - 36}V${bottom - 8}L${x - 4} ${bottom - 8}Z" fill="${steel}"/>`

/** The booster's forward section: the vented hot-staging ring and three fixed grid fins. */
const forward = (top: number) =>
  `<rect x="${RX}" y="${top - HS}" width="${RW}" height="${HS}" fill="${G.d5}"/>` +
  `<g fill="${G.l1}">${times(6, i => `<rect x="${RX + 2 + i * 4}" y="${top - HS + 1.5}" width="1.6" height="${HS - 3}"/>`)}</g>` +
  `<rect x="${RX}" y="${top - HS}" width="${RW}" height="1" fill="${G.l3}"/>` +
  // side fins stick out left and right; the third faces us
  `<g fill="none" stroke="${G.l2}" stroke-width=".8"><rect x="${RX - 6}" y="${top + 3}" width="6" height="9"/><rect x="${RX + RW}" y="${top + 3}" width="6" height="9"/>` +
  `<rect x="${RX + 9}" y="${top + 4}" width="8" height="7"/><path d="M${RX - 3} ${top + 3}V${top + 12}M${RX + RW + 3} ${top + 3}V${top + 12}M${RX + 13} ${top + 4}V${top + 11}M${RX + 9} ${top + 7.5}H${RX + 17}"/></g>`

/** Faint, darker weld lines where one barrel section (three rings) meets the next, counted from the top. */
const sectionSeams = (top: number, upTo: number) => {
  let out = ''
  for (let y = top + 3 * RH; y < upTo; y += 3 * RH) {
    out += `<rect x="${RX}" y="${y - 0.5}" width="${RW}" height="1.6" fill="${G.d5}"/>`
  }
  return out
}

/** Bare engines under the aft: a back row in shade and a front row in light. */
const engines = () =>
  [181, 186.5, 192, 197.5].map(x => bell(x, BASE + 1, 0.9, G.m2)).join('') +
  [178.2, 183.6, 189, 194.4, 199.8].map(x => bell(x, BASE + 2, 0.95, G.m5)).join('') +
  bell(189, BASE + 3, 0.95, G.l2)

/** The cart a new ring rolls in on, under the lifted stack. */
const transferCart = () =>
  `<rect x="${RX - 1}" y="${BASE}" width="${RW + 2}" height="9" rx="1" fill="${G.m3}"/>` +
  `<circle cx="${RX + 4}" cy="${BASE + 12.5}" r="2.5" fill="${G.d1}"/><circle cx="${RX + RW - 4}" cy="${BASE + 12.5}" r="2.5" fill="${G.d1}"/>`

/** One tower arm; open arms swing out of line and read short, closed ones reach past the booster. */
const arm = (y: number, isFront: boolean, cls: string) =>
  `<rect${cls} x="163" y="${isFront ? y + 1 : y - 2}" width="${ARM_LEN}" height="${isFront ? 3.5 : 3}" fill="${isFront ? G.m5 : G.d5}"/>`

const LOOP_STYLE = `
.ec{animation:ec 14s ease-in-out infinite}@keyframes ec{0%{transform:translateX(160px)}30%,70%{transform:translateX(0)}100%{transform:translateX(160px)}}
.eu{animation:eu 14s ease-in-out infinite}@keyframes eu{0%,32%{transform:translateY(0);opacity:1}48%,62%{transform:translateY(-14px);opacity:1}63%,100%{transform:translateY(-14px);opacity:0}}
.ln{animation:ln 40s linear infinite}@keyframes ln{to{transform:translateX(-90px)}}
.aL{transform-box:fill-box;transform-origin:0 50%;animation:aL 9s ease-in-out infinite alternate}@keyframes aL{from{transform:rotate(-4deg)}to{transform:rotate(14deg)}}
.aR{transform-box:fill-box;transform-origin:0 50%;animation:aR 9s ease-in-out infinite alternate}@keyframes aR{from{transform:rotate(4deg)}to{transform:rotate(-14deg)}}
.c1{animation:c1 18s linear infinite}@keyframes c1{from{transform:translateX(-120px)}to{transform:translateX(920px)}}
.c2{animation:c2 26s linear infinite}@keyframes c2{from{transform:translateX(900px)}to{transform:translateX(-140px)}}
.agf{animation:agf 26s linear infinite}@keyframes agf{0%{transform:translate(240px,412px);opacity:1}44%{transform:translate(700px,412px)}47%{opacity:1}47.1%{opacity:0}50%{transform:translate(740px,362px)}94%{transform:translate(280px,362px)}97%{opacity:0}97.1%{opacity:1}100%{transform:translate(240px,412px);opacity:1}}
.agb{animation:agb 26s linear infinite}@keyframes agb{0%{transform:translate(240px,412px);opacity:0}44%{transform:translate(700px,412px)}47%{opacity:0}47.1%{opacity:1}50%{transform:translate(740px,362px)}94%{transform:translate(280px,362px)}97%{opacity:1}97.1%{opacity:0}100%{transform:translate(240px,412px);opacity:0}}
.w1{animation:w1 20s linear infinite alternate}@keyframes w1{to{transform:translateX(90px)}}
.w2{animation:w2 14s linear infinite alternate}@keyframes w2{to{transform:translateX(-70px)}}
.w3{animation:w3 18s linear infinite alternate}@keyframes w3{to{transform:translateX(-140px)}}
.pr{animation:pr 22s linear infinite alternate}@keyframes pr{to{transform:translateX(200px)}}
.pw{animation:pw 11s ease-in-out infinite alternate}@keyframes pw{to{transform:translateX(26px)}}
.co{transform-box:fill-box;transform-origin:50% 50%;animation:co 6s linear infinite}@keyframes co{to{transform:rotate(360deg)}}
.rm{transform-box:fill-box;transform-origin:50% 100%;animation:rm 5s ease-in-out infinite}@keyframes rm{0%,100%{transform:scaleY(.45)}40%,70%{transform:scaleY(1)}}
.uf{animation:uf .8s linear infinite}@keyframes uf{to{stroke-dashoffset:-16}}
.sp{animation:sp 44s linear infinite}@keyframes sp{from{transform:translateX(860px)}to{transform:translateX(-120px)}}
.tc{animation:tc 16s ease-in-out infinite alternate}@keyframes tc{to{transform:translateX(70px)}}
.bk{animation:bk 30s ease-in-out infinite alternate}@keyframes bk{from{transform:translateX(-80px)}to{transform:translateX(150px)}}
.fs1{animation:fs 1.2s steps(6) infinite}.fs2{animation:fs 1.2s steps(6) infinite .4s}.fs3{animation:fs 1.2s steps(6) infinite .8s}
@keyframes fs{from{transform:translate(0,0);opacity:1}to{transform:translate(5px,15px);opacity:0}}
.bb{animation:bb 1.2s ease-in-out infinite alternate}@keyframes bb{to{transform:translateY(-1px)}}
.bc{animation:bc 2s steps(1) infinite}@keyframes bc{50%{opacity:.2}}
.lf{animation:lf 10s ease-in-out infinite alternate}@keyframes lf{to{transform:translateY(-120px)}}
.dm{animation:dm .3s steps(2) infinite}@keyframes dm{50%{opacity:.55}}
.df{animation:dm .3s steps(2) 24}
.d1{animation:d1 11s ease-in-out infinite alternate}@keyframes d1{50%{transform:translate(14px,-30px)}100%{transform:translate(-6px,-70px)}}
.d2{animation:d2 13s ease-in-out infinite alternate}@keyframes d2{50%{transform:translate(-12px,30px)}100%{transform:translate(8px,60px)}}
.r1{transform-box:fill-box;transform-origin:0 100%;animation:r1 3s ease-in-out infinite alternate}@keyframes r1{from{transform:rotate(-20deg)}to{transform:rotate(25deg)}}
.r2{transform-box:fill-box;transform-origin:100% 100%;animation:r2 3.6s ease-in-out infinite alternate}@keyframes r2{from{transform:rotate(18deg)}to{transform:rotate(-24deg)}}
.ws{animation:ws .34s steps(2) infinite}@keyframes ws{50%{opacity:.1}}
.ws2{animation:ws .4s steps(2) infinite .1s}
.vt{animation:vt 6s ease-out infinite}@keyframes vt{0%{transform:translate(0,0) scale(.6);opacity:0}20%{opacity:.22}100%{transform:translate(-26px,-40px) scale(1.8);opacity:0}}
.vt2{animation:vt 6s ease-out infinite 3s}
.cl{animation:cl 12s steps(1) infinite}@keyframes cl{0%,82%{opacity:0}83%,94%{opacity:1}95%,100%{opacity:0}}
.sc{transform-box:fill-box;transform-origin:0 50%;animation:sc 2.4s steps(4) infinite}.sc2{transform-box:fill-box;transform-origin:0 50%;animation:sc 2.4s steps(4) infinite .6s}@keyframes sc{0%{transform:scaleX(.3)}50%{transform:scaleX(1)}100%{transform:scaleX(.6)}}
.sw{animation:sw 9s ease-in-out infinite}@keyframes sw{0%{transform:translateY(130px);opacity:0}30%,70%{opacity:1}100%{transform:translateY(-10px);opacity:0}}
.hud{animation:bc 1.4s steps(1) infinite}
.tk{transform-box:fill-box;transform-origin:50% 100%;animation:tk 14s ease-out both}@keyframes tk{from{transform:scaleY(0)}to{transform:scaleY(1)}}
.tv1{animation:tv 4.5s ease-out infinite}.tv2{animation:tv 4.5s ease-out infinite 1.5s}.tv3{animation:tv 4.5s ease-out infinite 3s}
@keyframes tv{0%{transform:translate(0,0) scale(.5);opacity:0}15%{opacity:.3}100%{transform:translate(22px,-34px) scale(2);opacity:0}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
`

/** Steam puffs of the static fire, each class with its whole shorthand, delay included. */
const STEAM_CLASSES = [0, 1, 2]
  .map(i => {
    const delay = (3.4 + i * 0.35).toFixed(2)
    return (
      `.stL${i},.stR${i}{transform-box:fill-box;transform-origin:50% 50%}` +
      `.stL${i}{animation:stL 4.5s ease-out ${delay}s both}.stR${i}{animation:stR 4.5s ease-out ${delay}s both}`
    )
  })
  .join('')

/**
 * One-shot for the redraw right after a turn: the stack grows from below, as in a stacking bay.
 * The crane lifts the stack one ring higher, a new ring rolls in underneath on a cart, the
 * stack is set down on it and the new seam flares. The first ring just rolls in.
 */
const stackStyle = (rings: number, top: number) => {
  const cable = top + RH - HS - (RAIL_Y + 8)
  const scale = (len: number) => (Math.max(10, len) / 10).toFixed(2)
  const lifted =
    rings > 1
      ? `.cr{animation:cr 6s ease-in-out both}@keyframes cr{0%{transform:translateX(${CRANE_PARK}px)}20%,82%{transform:translateX(0)}100%{transform:translateX(${CRANE_PARK}px)}}` +
        `.cb{transform-box:fill-box;transform-origin:50% 0;animation:cb 6s ease-in-out both}@keyframes cb{0%,20%{transform:scaleY(1)}28%{transform:scaleY(${scale(cable)})}40%,64%{transform:scaleY(${scale(cable - RH - 6)})}74%{transform:scaleY(${scale(cable - RH)})}84%,100%{transform:scaleY(1)}}` +
        `.os{animation:os 6s ease-in-out both}@keyframes os{0%,28%{transform:translateY(${RH}px)}40%,64%{transform:translateY(-6px)}74%,100%{transform:translateY(0)}}`
      : ''
  return (
    lifted +
    `.nr{animation:nr 6s ease-in-out both}@keyframes nr{0%,40%{transform:translateX(70px)}62%,100%{transform:translateX(0)}}` +
    `.nc{animation:nc 6s ease-in-out both}@keyframes nc{0%,74%{opacity:1}84%,100%{opacity:0}}` +
    `.sm{animation:sm 6s ease-out both}@keyframes sm{0%,73%{opacity:0}75%{opacity:1}100%{opacity:0}}` +
    `.sk{animation:sk 6s steps(1) both}@keyframes sk{0%,73%{opacity:0}74%,86%{opacity:1}87%,100%{opacity:0}}` +
    // inspection crawler runs along the fresh seam once it has cooled
    `.sx{animation:sx 2.8s ease-in-out 5s both}@keyframes sx{0%{opacity:0;transform:translateX(0)}12%{opacity:1}50%{transform:translateX(${RW}px)}88%{opacity:1}100%{opacity:0;transform:translateX(0)}}`
  )
}

/** One-shot when the booster reaches the static-fire stage: flame, flash and steam. */
// T-3, T-2, T-1, then IGNITION: each readout word shows in its own window of the 6 s one-shot
const COUNTDOWN = ['T-3', 'T-2', 'T-1', 'IGNITION']
const countdownStyle = () =>
  COUNTDOWN.map((_, i) => {
    const from = ((i * 100) / 6).toFixed(1)
    const to = (((i + 1) * 100) / 6).toFixed(1)
    const last = i === COUNTDOWN.length - 1
    return `.cd${i}{animation:cd${i} 6s steps(1) both}@keyframes cd${i}{0%{opacity:0}${from}%{opacity:1}${last ? '75%' : `${to}%`},100%{opacity:0}}`
  }).join('')

const FIRE_STYLE =
  countdownStyle() +
  // water deluge sprays up from the plate under the stand just before ignition
  `.dl{animation:dl 4.2s ease-out 2.6s both}@keyframes dl{0%{opacity:0;transform:translateY(8px)}15%,75%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-4px)}}` +
  `.sf{animation:sf 2.8s ease-in-out 3.1s both}@keyframes sf{0%{opacity:0}15%,85%{opacity:1}100%{opacity:0}}${STEAM_CLASSES}` +
  `@keyframes stL{0%{transform:translate(0,0) scale(.4);opacity:0}20%{opacity:.4}100%{transform:translate(-110px,-14px) scale(2.4);opacity:0}}` +
  `@keyframes stR{0%{transform:translate(0,0) scale(.4);opacity:0}20%{opacity:.4}100%{transform:translate(110px,-14px) scale(2.4);opacity:0}}`

/** One-shot when the cold proof test starts: clamps close, the umbilical swings in, the tanks fill, oxygen first. */
const CRYO_STYLE =
  `.hcL{animation:hcL 1.2s ease-in-out both}@keyframes hcL{from{transform:translateX(-3px)}to{transform:translateX(0)}}` +
  `.hcR{animation:hcR 1.2s ease-in-out both}@keyframes hcR{from{transform:translateX(3px)}to{transform:translateX(0)}}` +
  `.qi{transform-box:fill-box;transform-origin:100% 50%;animation:qi 2s ease-in-out .6s both}@keyframes qi{from{transform:scaleX(.3)}to{transform:scaleX(1)}}` +
  `.tkL{transform-box:fill-box;transform-origin:50% 100%;animation:tk 6s ease-out 2s both}` +
  `.tkM{transform-box:fill-box;transform-origin:50% 100%;animation:tk 5s ease-out 6.5s both}`

/** One-shot as the catch test starts: the umbilical pulls back and the clamps open first. */
const RELEASE_STYLE =
  `.qo{transform-box:fill-box;transform-origin:100% 50%;animation:qo 1.6s ease-in-out both}@keyframes qo{from{transform:scaleX(1)}to{transform:scaleX(.3)}}` +
  `.hoL{animation:hoL 1s ease-in-out .4s both}@keyframes hoL{from{transform:translateX(0)}to{transform:translateX(-3px)}}` +
  `.hoR{animation:hoR 1s ease-in-out .4s both}@keyframes hoR{from{transform:translateX(0)}to{transform:translateX(3px)}}`

/** One-shot when the catch test starts: the arms ride up, close under the fins, lift the booster and set it back. */
const catchStyle = (rise: number) =>
  `.ch{animation:ch 7s ease-in-out both}@keyframes ch{0%{transform:translateY(${rise}px)}35%,55%{transform:translateY(0)}70%,85%{transform:translateY(-14px)}100%{transform:translateY(0)}}` +
  `.ac{transform-box:fill-box;transform-origin:0 50%;animation:ac 7s ease-in-out both}@keyframes ac{0%,35%{transform:scaleX(${ARM_OPEN})}50%,100%{transform:scaleX(1)}}` +
  `.bl{animation:bl 7s ease-in-out both}@keyframes bl{0%,55%{transform:translateY(0)}70%,85%{transform:translateY(-14px)}100%{transform:translateY(0)}}`

export type SceneOptions = {
  /** false draws a still picture: no CSS at all. */
  animate: boolean
  /** The brand on the plate above the rocket; empty or left out draws no plate. */
  brand?: string
}

const escXml = (t: string) =>
  t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Brand plate: hung from the roof truss above the rocket, kept left of the reading lane.
const PLATE_CX = 175
const PLATE_Y = 106
const PLATE_H = 18
const PLATE_MAX_W = 72
const PLATE_FONT = 8
const PLATE_CH = PLATE_FONT * 0.62

/** A steel plate with the brand stenciled on it, hung on two cables. */
const brandPlate = (name: string) => {
  const label = name.toUpperCase()
  const natural = Array.from(label).length * PLATE_CH
  const w = Math.min(PLATE_MAX_W, Math.max(36, natural + 14))
  const textW = Math.min(natural, w - 10)
  const x = PLATE_CX - w / 2
  const cable = (cx: number) => `<rect x="${cx.toFixed(1)}" y="50" width="1" height="${PLATE_Y - 50}" fill="${G.d5}"/>`
  const rivet = (cx: number) => `<circle cx="${cx.toFixed(1)}" cy="${PLATE_Y + 3.5}" r=".9" fill="${G.m5}"/>`
  return (
    `<g>${cable(x + 6)}${cable(x + w - 7)}` +
    `<rect x="${x.toFixed(1)}" y="${PLATE_Y}" width="${w.toFixed(1)}" height="${PLATE_H}" fill="${G.d3}" stroke="${G.m2}" stroke-width="1"/>` +
    `<rect x="${x.toFixed(1)}" y="${PLATE_Y}" width="${w.toFixed(1)}" height="1.5" fill="${G.m3}"/>` +
    rivet(x + 6.5) +
    rivet(x + w - 6.5) +
    `<text x="${PLATE_CX}" y="${PLATE_Y + 12.5}" text-anchor="middle" font-size="${PLATE_FONT}" font-weight="700" ` +
    `font-family="ui-monospace,Menlo,monospace" fill="${G.l6}" textLength="${textW.toFixed(1)}" ` +
    `lengthAdjust="spacingAndGlyphs">${escXml(label)}</text></g>`
  )
}

export function buildScene(f: Factory, { animate, brand = '' }: SceneOptions): string {
  const rings = Math.max(0, Math.min(RINGS, f.rings))
  const complete = rings >= RINGS
  const top = BASE - rings * RH
  const stage: Stage = STAGES.includes(f.stage) ? f.stage : 'stack'
  const stacking = animate && f.last === 'stack' && stage === 'stack' && rings > 0
  // the redraw right after the booster moved to a new stage plays that stage's one-shot
  const entering = animate && f.last === 'stage'
  const hasEngines = stage === 'engines' || stage === 'fire' || stage === 'catch'
  const firing = entering && stage === 'fire'
  const catching = entering && stage === 'catch'
  // What runs in each stage, as in the real flow: crews stack rings and install engines; the
  // pad is cleared for the cold proof test, the static fire and the catch test, and drones
  // inspect instead. Activities of other stages are not drawn at all, so they cost nothing.
  const crewed = stage === 'stack' || stage === 'engines'
  const fueled = stage === 'cryo' || stage === 'fire'
  const cryoIn = entering && stage === 'cryo'
  // The hall runs on a skeleton crew between turns: beacons, one truck on the far lane and the
  // bridge crane. The rest of the hall traffic, the sparks and the test cell run only while
  // Claude works. Movers that sit wholly under the chat veil stay still.
  const busy = animate && f.working
  const mv = (cls: string) => (busy ? ` class="${cls}"` : '')
  const o: string[] = [HEX_DEFS]

  // ---------- hall ----------
  o.push(`<rect width="${W}" height="${H}" fill="${G.bg}"/>`)
  o.push(`<rect y="30" width="${W}" height="${HORIZON - 30}" fill="${G.wall}"/>`)
  o.push(`<g fill="${G.bay}">${times(16, i => `<rect x="${6 + i * 50}" y="56" width="38" height="200"/>`)}</g>`)
  // tall work cells, as in a big assembly bay: ships parked in two of them, tiled on one side
  o.push(tiledShip(216, 70, 256, '#2a2b2e') + tiledShip(716, 70, 256, '#2a2b2e'))
  o.push(`<rect class="bc" x="732" y="150" width="2" height="2" fill="#e6e6e6"/>`)
  o.push(
    `<g fill="#1c1d1f">${times(16, i => [112, 162, 212].map(y => `<rect x="${6 + i * 50}" y="${y}" width="38" height="2.5"/>`).join(''))}</g>` +
      `<g fill="#2b2c2f">${times(16, i => [108, 158, 208].map((y, k) => `<rect x="${12 + i * 50 + ((i + k) % 3) * 9}" y="${y}" width="3" height="1.6"/>`).join(''))}</g>`,
  )
  o.push(`<rect width="${W}" height="30" fill="${G.roof}"/>`)
  o.push(`<path d="${times(41, i => `${i ? 'L' : 'M'}${i * 20} ${i % 2 ? 28 : 10}`)}" stroke="#202123" stroke-width="1.5" fill="none"/>`)
  o.push(`<rect y="48" width="${W}" height="2" fill="${G.d2}"/>`)

  // ceiling gantry robot
  o.push(`<g><rect x="560" y="44" width="22" height="8" fill="${G.m1}"/><rect x="570" y="52" width="2" height="14" fill="${G.m3}"/><rect x="565" y="66" width="12" height="3" fill="${G.m4}"/></g>`)

  // engine line along the back wall
  o.push(`<g${mv('ln')}>${times(12, i => `<rect x="${340 + i * 45}" y="290" width="12" height="2" fill="${G.d3}"/><rect x="${345 + i * 45}" y="280" width="2" height="10" fill="${G.d3}"/>${bell(346 + i * 45, 270, 1.3, '#3d3f42')}`)}</g>`)

  // ring line behind the rocket: a steel coil unrolls into the ring roller, and a robot welds the seam
  o.push(
    `<rect x="206" y="294" width="56" height="4" fill="${G.d3}"/><circle cx="214" cy="286" r="7" fill="${G.d4}" stroke="${G.m2}" stroke-width="1.5"/>` +
      `<g${animate && stage === 'stack' ? ' class="co"' : ''}><path d="M214 280V292M208 286H220" stroke="${G.m4}" stroke-width="1"/></g>` +
      `<rect x="214" y="292" width="20" height="1.2" fill="${G.m4}"/><circle cx="236" cy="290" r="2" fill="${G.m3}"/><circle cx="236" cy="295" r="2" fill="${G.m3}"/>` +
      `<ellipse cx="248" cy="285" rx="5" ry="9" fill="none" stroke="${G.l1}" stroke-width="2.4"/>` +
      `<rect x="255" y="276" width="2" height="18" fill="${G.m2}"/><rect x="250" y="276" width="7" height="1.6" fill="${G.m3}"/>` +
      (stage === 'stack' && busy ? `<g class="dm"><circle cx="252" cy="279" r="1.2" fill="${G.white}"/></g>` : ''),
  )

  // forklift carrying a ring
  o.push(`<g><rect x="520" y="288" width="18" height="8" rx="2" fill="${G.m1}"/><rect x="532" y="281" width="6" height="7" fill="${G.m2}"/><rect x="516" y="276" width="2" height="18" fill="${G.m2}"/><ellipse cx="509" cy="283" rx="9" ry="3" fill="none" stroke="${G.m4}" stroke-width="2"/><circle cx="523" cy="297" r="2" fill="${G.d1}"/><circle cx="535" cy="297" r="2" fill="${G.d1}"/></g>`)

  // catch tower in the far background
  o.push(
    `<rect x="604" y="140" width="4" height="160" fill="#26272a"/><rect x="618" y="140" width="4" height="160" fill="#26272a"/>` +
      `<path d="${times(8, i => `M608 ${145 + i * 20}L618 ${160 + i * 20}M618 ${145 + i * 20}L608 ${160 + i * 20}`)}" stroke="${G.d2}" stroke-width="1"/>` +
      `<rect x="600" y="136" width="26" height="4" fill="#2e2f32"/>` +
      `<rect${mv('aL')} x="622" y="196" width="46" height="3" fill="${G.m1}"/><rect${mv('aR')} x="622" y="212" width="46" height="3" fill="${G.m1}"/>` +
      `<rect class="bc" x="611" y="130" width="4" height="4" fill="#cfd0d2"/>`,
  )

  // engine test cell, far right
  o.push(
    `<rect x="712" y="250" width="70" height="50" fill="${G.roof}" stroke="${G.edge}"/><rect x="712" y="250" width="70" height="3" fill="${G.edge}"/>` +
      bell(735, 262, 1.3, G.m3) +
      (busy
        ? `<g class="cl"><path d="M732 270L738 270L742 296L728 296Z" fill="#fff" opacity=".35"/><g class="dm" fill="#fff"><ellipse cx="735" cy="276" rx="2" ry="1.2"/><ellipse cx="735" cy="283" rx="1.6" ry="1"/><ellipse cx="735" cy="290" rx="1.3" ry=".8"/></g><rect x="712" y="250" width="70" height="50" fill="#fff" opacity=".04"/></g>`
        : '') +
      `<rect x="756" y="262" width="20" height="12" fill="#101112"/><rect${mv('sc')} x="758" y="265" width="14" height="2" fill="${G.m4}"/><rect${mv('sc2')} x="758" y="269" width="10" height="2" fill="${G.m2}"/>`,
  )

  // ---------- floor ----------
  o.push(`<rect y="${HORIZON}" width="${W}" height="${H - HORIZON}" fill="${G.floor}"/><rect y="${HORIZON}" width="${W}" height="1" fill="${G.edge}"/>`)
  o.push(`<g stroke="${G.line}" stroke-width="1.2">${[-900, -500, -150, 170, 470, 780, 1150, 1600].map(x => `<path d="M400 ${HORIZON}L${x} ${H}"/>`).join('')}<path d="M0 318H800M0 385H800M0 440H800"/></g>`)

  // Everything standing on the floor is keyed by the y where it meets the floor
  // (larger is nearer the viewer) and drawn far to near, so a truck on the lane
  // behind the test stand passes behind the rocket instead of across it.
  const floor: Array<[number, string]> = []
  const onFloor = (y: number, svg: string) => floor.push([y, svg])

  // self-driving floor cart on its painted route, which loops around the weld
  // station: one copy shows on the near leg (in front), one on the far leg (behind)
  o.push(`<path d="M240 412L700 412L740 362L280 362Z" fill="none" stroke="#1f2022" stroke-width="1.5" stroke-dasharray="4 4"/>`)
  const cart = (cls: string) =>
    `<g${mv(cls)} transform="translate(240 412)"><rect x="-9" y="-5" width="18" height="7" rx="2" fill="${G.m2}"/><rect x="-6" y="-9" width="12" height="4" fill="#2f3033" stroke="${G.m4}" stroke-width=".7"/><rect class="bc" x="7" y="-3" width="2" height="2" fill="#e6e6e6"/></g>`
  onFloor(414, cart('agf'))
  if (busy) onFloor(364, cart('agb'))

  // ring weld station
  onFloor(
    399,
    `<g transform="translate(560 382)"><rect x="-26" y="12" width="52" height="5" fill="${G.edge}"/>` +
      `<ellipse rx="22" ry="12" fill="none" stroke="${G.l1}" stroke-width="5"/><ellipse rx="22" ry="12" fill="none" stroke="${G.l3}" stroke-width="1.5"/>` +
      `<rect x="-40" y="-2" width="6" height="16" fill="${G.m1}"/><rect${mv('r1')} x="-37" y="-18" width="3" height="18" fill="${G.m5}"/>` +
      `<rect x="34" y="-2" width="6" height="16" fill="${G.m1}"/><rect${mv('r2')} x="34" y="-18" width="3" height="18" fill="${G.m5}"/>` +
      (busy
        ? `<g class="ws"><circle cx="-22" cy="-3" r="1.6" fill="${G.white}"/><circle cx="-25" cy="1" r=".7" fill="#ccc"/></g>` +
          `<g class="ws2"><circle cx="22" cy="-4" r="1.6" fill="${G.white}"/><circle cx="25" cy="0" r=".7" fill="#ccc"/></g>`
        : '') +
      `${person(-6, 28, 1, G.l2)}</g>`,
  )

  // ---------- service tower & test stand ----------
  // From here to the welders, everything is one floor item: the stand meets the floor at y 400.
  const standFrom = o.length
  o.push(`<rect x="150" y="190" width="3" height="208" fill="${G.d5}"/><rect x="160" y="190" width="3" height="208" fill="${G.d5}"/>`)
  o.push(`<path d="${times(10, i => `M153 ${200 + i * 20}L160 ${214 + i * 20}M160 ${200 + i * 20}L153 ${214 + i * 20}`)}" stroke="${G.edge}" stroke-width="1"/>`)
  o.push(`<rect class="bc" x="153" y="184" width="7" height="4" fill="${G.hi}"/>`)
  // work light from the tower top onto the rocket: a still, faint cone
  o.push(`<path d="M157 190L172 ${BASE}L208 ${BASE}Z" fill="#fff" opacity=".035"/>`)
  // umbilical down the tower and into the stand; it flows during the cold test and the static fire
  const hose = `M157 206V388Q157 393 162 393H171`
  o.push(`<path d="${hose}" fill="none" stroke="#3c3e41" stroke-width="2"/>`)
  if (fueled && animate) {
    o.push(`<path class="uf" d="${hose}" fill="none" stroke="#d6dde2" stroke-width="1" stroke-dasharray="2 6"/>`)
  }
  o.push(`<g${crewed ? ' class="lf"' : ''}><rect x="151" y="392" width="11" height="2" fill="${G.l2}"/>${person(154.5, 384, 0.75, G.l5)}</g>`)
  o.push(`<rect x="166" y="360" width="44" height="6" fill="#3c3e41"/><rect x="168" y="366" width="5" height="32" fill="${G.d4}"/><rect x="203" y="366" width="5" height="32" fill="${G.d4}"/><rect x="160" y="396" width="56" height="4" fill="#26272a"/>`)

  // oxygen venting, only while the tanks are cold
  if (animate && fueled) {
    o.push(`<g fill="#cfd0d2"><circle class="vt" cx="174" cy="350" r="5" opacity="0"/><circle class="vt2" cx="172" cy="${Math.min(330, top + 10)}" r="5" opacity="0"/></g>`)
  }

  // cold proof test: hydraulic rams push on the aft in place of engine thrust
  if (stage === 'cryo') {
    o.push(
      [181, 195]
        .map(x => `<rect x="${x - 2}" y="352" width="4" height="8" fill="${G.m2}"/><rect${animate ? ' class="rm"' : ''} x="${x - 1}" y="${BASE + 3}" width="2" height="${352 - BASE - 3}" fill="${G.l4}"/>`)
        .join(''),
    )
  }

  // static fire, played once as the booster reaches that stage
  if (firing) {
    o.push(
      `<g class="dl" opacity="0"><g class="df" fill="#e9eef2">${[166, 172, 204, 210]
        .map((x, i) => `<rect x="${x}" y="${368 + (i % 2) * 4}" width="1.4" height="${26 - (i % 2) * 4}" opacity=".7"/><ellipse cx="${x + 0.7}" cy="${367 + (i % 2) * 4}" rx="3" ry="1.6" opacity=".5"/>`)
        .join('')}</g></g>`,
    )
    o.push(
      `<g class="sf" opacity="0"><ellipse cx="188" cy="398" rx="70" ry="10" fill="#fff" opacity=".12"/><path d="M178 360L198 360L193 396L183 396Z" fill="#fff" opacity=".35"/>` +
        `<g class="df" fill="#fff"><ellipse cx="188" cy="368" rx="4" ry="2.4"/><ellipse cx="188" cy="378" rx="3.4" ry="2"/><ellipse cx="188" cy="387" rx="2.8" ry="1.7"/></g>` +
        `<rect y="${HORIZON}" width="${W}" height="${H - HORIZON}" fill="#fff" opacity=".04"/></g>`,
    )
    // steam rolling out across the floor from the stand
    o.push(
      `<g fill="#e6e6e6">${[0, 1, 2]
        .map(i => {
          const y = 392 - i * 5
          return (
            `<ellipse class="stL${i}" cx="182" cy="${y}" rx="12" ry="5" opacity="0"/>` +
            `<ellipse class="stR${i}" cx="194" cy="${y}" rx="12" ry="5" opacity="0"/>`
          )
        })
        .join('')}</g>`,
    )
  }

  // engine install: the cart brings bare engines up into the aft
  if (stage === 'engines') {
    o.push(`<g class="ec" transform="translate(160 0)"><rect x="176" y="390" width="26" height="6" rx="2" fill="${G.m3}"/><circle cx="180" cy="397" r="2" fill="${G.d1}"/><circle cx="198" cy="397" r="2" fill="${G.d1}"/><g class="eu">${bell(189, 382, 1.2, G.l3)}</g></g>`)
  }

  // tower arms: parked down the tower with the arms swung open, or closed under the fins for
  // the catch test. The far arm is drawn behind the booster, the near one in front.
  const armY = stage === 'catch' && rings > 0 ? top + 14 : ARM_PARK
  const armsClosed = stage === 'catch' && rings > 0
  const armOpen = armsClosed ? '' : ` transform="translate(163 0) scale(${ARM_OPEN} 1) translate(-163 0)"`
  const armClass = catching ? ' class="ac"' : ''
  o.push(`<g${catching ? ' class="ch"' : ''}><g${armOpen}>${arm(armY, false, armClass)}</g></g>`)

  // hold-down clamps at the base: closed for the cold test and the static fire, open otherwise
  if (rings > 0) {
    const closed = fueled
    const clamp = (x: number, side: 'L' | 'R') => {
      const shift = closed ? 0 : side === 'L' ? -3 : 3
      const cls = cryoIn ? ` class="hc${side}"` : catching ? ` class="ho${side}"` : ''
      const hook = side === 'L' ? x : x - 2
      return `<g${cls}${cls || shift === 0 ? '' : ` transform="translate(${shift} 0)"`}><rect x="${x}" y="${BASE - 3}" width="2.4" height="${360 - BASE + 3}" fill="${G.m3}"/><rect x="${hook}" y="${BASE - 3}" width="4.4" height="1.6" fill="${G.l1}"/></g>`
    }
    o.push(clamp(RX - 3, 'L') + clamp(RX + RW + 0.6, 'R'))
  }

  // ---------- the booster: grows from below, forward section on top ----------
  if (catching) o.push('<g class="bl">')
  o.push(`<rect x="${RX}" y="${BASE}" width="${RW}" height="2" fill="${G.d5}"/>`)
  if (hasEngines) o.push(engines())
  if (rings > 0) {
    // rings above the newest one: on a stacking redraw they ride the crane up and down as one
    const upper: string[] = []
    for (let i = 1; i < rings; i++) upper.push(ring(BASE - (i + 1) * RH))
    upper.push(sectionSeams(top, BASE - RH))
    const newest = ring(BASE - RH) + (BASE - RH > top && (rings - 1) % 3 === 0 ? sectionSeams(BASE - RH - 3 * RH, BASE) : '')
    if (rings === 1) {
      o.push(stacking ? `<g class="nr">${newest}${forward(top)}<g class="nc">${transferCart()}</g></g>` : newest + forward(top))
    } else if (stacking) {
      o.push(`<g class="os">${upper.join('')}${forward(top)}</g><g class="nr">${newest}<g class="nc">${transferCart()}</g></g>`)
    } else {
      o.push(newest + upper.join('') + forward(top))
    }
  }
  // cold proof test: two tanks, oxygen below and methane above, split by a shared dome that
  // stays bare steel. Each frosts on its own and vents at its top.
  if (stage === 'cryo' && rings > 0) {
    const dome = Math.min(BASE - RH, top + Math.max(1, Math.round((rings * 3) / 8)) * RH)
    const band = (y0: number, y1: number, cls: string) =>
      `<g${cryoIn ? ` class="${cls}"` : ''}><rect x="${RX}" y="${y0}" width="${RW}" height="${y1 - y0}" fill="#e9eef2" opacity=".32"/>` +
      `<g fill="#f4f6f8" opacity=".5">${times(Math.floor((y1 - y0) / 9), i => `<rect x="${RX}" y="${y0 + 4 + i * 9}" width="${RW}" height="1"/>`)}</g></g>`
    o.push(band(dome + 3, BASE, 'tkL') + band(top, dome - 3, 'tkM'))
    if (animate) {
      const vent = (y: number) => `${['tv1', 'tv2', 'tv3'].map(c => `<circle class="${c}" cx="${RX + RW - 3}" cy="${y}" r="3" opacity="0"/>`).join('')}`
      o.push(`<g fill="#e6e6e6">${vent(top - 2)}${vent(dome + 4)}</g>`)
    }
  }
  // the new ring's weld seam flares white as it lands, then cools to steel
  if (stacking && rings > 1) {
    const seam = BASE - RH
    o.push(
      `<rect class="sm" x="${RX - 1}" y="${seam - 1}" width="${RW + 2}" height="2" fill="#f4f4f4" opacity="0"/>` +
        `<g class="sk" opacity="0"><g class="df" fill="#fff">${[2, 9, 17, 24]
          .map((dx, i) => `<circle cx="${RX + dx}" cy="${seam + (i % 2 ? 2 : -2)}" r="${i % 2 ? 0.8 : 1.2}"/>`)
          .join('')}</g></g>` +
        `<g class="sx" opacity="0"><rect x="${RX - 1}" y="${seam - 2}" width="4" height="4" rx="1" fill="${G.m5}"/><rect x="${RX + 0.5}" y="${seam - 7}" width="1" height="14" fill="#fff" opacity=".45"/></g>`,
    )
  }
  if (rings > 0 && animate && crewed) {
    o.push(`<g class="sw" opacity="0"><rect x="${RX + 6}" y="${top}" width="4" height="${Math.min(40, rings * RH)}" fill="#fff" opacity=".12"/></g>`)
  }

  if (catching) o.push('</g>')

  // welders on while Claude is working: they prepare the bottom joint for the next ring
  if (f.working && stage === 'stack' && rings > 0 && !complete) {
    const y = BASE - 1
    o.push(
      `<g class="dm"><circle cx="${RX}" cy="${y}" r="2.2" fill="${G.white}"/><circle cx="${RX - 3}" cy="${y + 3}" r="1" fill="#d0d0d0"/><circle cx="${RX + 2}" cy="${y - 3}" r=".8" fill="#d0d0d0"/></g>` +
        `<g class="ws2"><circle cx="${RX + RW}" cy="${y}" r="2" fill="${G.white}"/><circle cx="${RX + RW + 3}" cy="${y + 3}" r=".9" fill="#d0d0d0"/></g>`,
    )
  }
  // near tower arm and the carriage that rides the tower
  o.push(
    `<g${catching ? ' class="ch"' : ''}><g${armOpen}>${arm(armY, true, armClass)}</g>` +
      `<rect x="146" y="${armY - 4}" width="19" height="9" fill="${G.m2}" stroke="${G.m5}" stroke-width=".8"/><rect class="bc" x="148" y="${armY - 2}" width="2" height="2" fill="#e6e6e6"/></g>`,
  )
  // booster umbilical on its post at the stand's edge: swung in and connected while the tanks
  // are cold, pulled back otherwise
  if (rings > 0) {
    const connected = fueled
    const cls = cryoIn ? ' class="qi"' : catching ? ' class="qo"' : ''
    const swing = cls || connected ? '' : ` transform="translate(210 0) scale(.3 1) translate(-210 0)"`
    o.push(
      `<rect x="209" y="${BASE - 15}" width="3" height="${360 - BASE + 15}" fill="${G.d5}"/>` +
        `<g${swing}><rect${cls} x="201" y="${BASE - 13}" width="9" height="5" fill="${G.m4}"/></g>`,
    )
  }
  // a tech pacing the stand platform, in front of the engines; gone when the pad is cleared
  if (crewed) o.push(`<g class="pw">${person(170, 353.7, 0.7, G.l3)}</g>`)
  onFloor(400, o.splice(standFrom).join(''))

  // boom lift beside the rocket: the basket rides up to the top ring and back down;
  // the basket's lamp is always on, and its welder throws sparks while Claude works.
  // It drives off when the pad is cleared.
  if (crewed) onFloor(
    408,
    `<rect class="bm" x="210" y="330" width="3" height="67" fill="${G.m5}"/>` +
      `<rect x="200" y="397" width="22" height="7" rx="2" fill="${G.m3}"/><circle cx="204" cy="405" r="3" fill="${G.d1}"/><circle cx="218" cy="405" r="3" fill="${G.d1}"/>` +
      `<rect class="bc" x="218" y="395" width="3" height="2" fill="#e6e6e6"/>` +
      `<g class="bs">${person(205, 317, 0.75, G.l4)}<rect x="202" y="323" width="13" height="7" fill="${G.m2}" stroke="${G.m5}" stroke-width=".8"/>` +
      `<rect x="201" y="321" width="2" height="2" fill="${G.hi}"/>` +
      (f.working && animate
        ? `<g class="dm" fill="#fff"><circle cx="201" cy="319" r="1.3"/><circle cx="203" cy="315" r=".6"/><circle cx="200" cy="324" r=".7"/></g>`
        : '') +
      `</g>`,
  )

  // ---------- floor traffic and crew, keyed by where wheels and feet meet the floor ----------
  onFloor(343, `<g class="c2"><rect x="0" y="330" width="34" height="9" rx="3" fill="#3f4144"/><rect x="2" y="324" width="11" height="7" rx="2" fill="${G.m4}"/><circle cx="6" cy="340" r="2.8" fill="${G.d1}"/><circle cx="29" cy="340" r="2.8" fill="${G.d1}"/><rect class="bc" x="5" y="322" width="3" height="2" fill="#e6e6e6"/></g>`)
  // the near lane sits above the bottom strip of the window, which the app's own UI covers
  onFloor(404, `<g${mv('c1')}><rect x="0" y="386" width="46" height="12" rx="4" fill="${G.m3}"/><rect x="22" y="377" width="17" height="10" rx="3" fill="${G.m5}"/><rect x="3" y="374" width="15" height="12" fill="#2f3033" stroke="${G.m5}"/><circle cx="9" cy="400" r="4" fill="${G.d1}"/><circle cx="37" cy="400" r="4" fill="${G.d1}"/><rect class="bc" x="35" y="374" width="3" height="2" fill="#e6e6e6"/></g>`)
  if (crewed) onFloor(381, `<g class="pr">${person(20, 372, 1, G.l2)}<rect x="16" y="372" width="34" height="2.4" rx="1" fill="${G.m4}"/>${person(44, 372, 1, G.l2)}</g>`)
  if (crewed) onFloor(395, `<g class="w1">${person(222, 386, 1, G.l3)}</g>`)
  onFloor(411, `<g${mv('w2')}>${person(740, 402, 1, G.l2)}</g>`)
  onFloor(338, `<g${mv('w3')}>${person(690, 330, 0.9, G.l1)}</g>`)
  onFloor(300, person(470, 292, 0.8, G.l1) + person(478, 293, 0.8, G.m5) + person(640, 295, 0.8, G.l1))
  if (crewed) onFloor(361, `${person(226, 352, 1, G.l4)}<rect x="230" y="355" width="5" height="6" fill="#d0d0d0" opacity=".5"/>`)

  // transporter bringing a ship's nose section across the middle lane, behind the test stand;
  // its windward half is covered in black hex tiles
  onFloor(
    368,
    `<g${mv('sp')}><rect x="0" y="359" width="46" height="5" rx="1" fill="${G.m2}"/>` +
      `<g fill="${G.d1}">${times(7, i => `<circle cx="${4 + i * 6.3}" cy="366" r="2"/>`)}</g>` +
      `<rect x="6" y="355" width="32" height="4" fill="${G.d5}"/>` +
      `<path d="M8 355L36 355Q36 342 22 332Q8 342 8 355Z" fill="${G.l5}"/><path d="M22 332Q36 342 36 355L22 355Z" fill="url(#hx)"/>` +
      `<path d="M5 344L9 340V352L5 352Z" fill="${G.m5}"/>` +
      `<rect x="40" y="351" width="6" height="8" rx="1" fill="${G.m5}"/><rect class="bc" x="42" y="348" width="2" height="2" fill="#e6e6e6"/></g>`,
  )
  // a barrel section on a weld jig in front of the test cell, a welder and a shower of sparks
  onFloor(
    318,
    `<rect x="688" y="313" width="3" height="5" fill="${G.d5}"/><rect x="709" y="313" width="3" height="5" fill="${G.d5}"/><rect x="684" y="317" width="32" height="2" fill="${G.edge}"/>` +
      `<ellipse cx="700" cy="303" rx="13" ry="11" fill="none" stroke="${G.l1}" stroke-width="4"/><ellipse cx="700" cy="303" rx="13" ry="11" fill="none" stroke="${G.l3}" stroke-width="1"/>` +
      person(718, 309, 0.85, G.l2) +
      (busy
        ? `<g class="dm"><circle cx="713" cy="302" r="1.6" fill="${G.white}"/></g>` +
          `<g fill="#e6e6e6">${['fs1', 'fs2', 'fs3'].map((c, i) => `<circle class="${c}" cx="${712 + i}" cy="303" r=".8"/>`).join('')}</g>`
        : ''),
  )
  // a tech pushing a tool cart along the right side
  onFloor(
    358,
    `<g${mv('tc')}>${person(688, 347, 1, G.l3)}<rect x="694" y="349" width="14" height="5" rx="1" fill="${G.m4}"/><rect x="695" y="346" width="12" height="2" fill="${G.m2}"/>` +
      `<circle cx="697" cy="356" r="1.6" fill="${G.d1}"/><circle cx="705" cy="356" r="1.6" fill="${G.d1}"/></g>`,
  )
  // still clutter costs nothing to draw: crates and a stack of spare rings
  onFloor(
    331,
    `<rect x="766" y="316" width="16" height="14" fill="${G.d4}" stroke="${G.m1}"/><rect x="782" y="320" width="14" height="10" fill="${G.d5}" stroke="${G.m1}"/><rect x="770" y="306" width="10" height="10" fill="${G.d5}" stroke="${G.m1}"/>`,
  )
  onFloor(
    374,
    `<g fill="none" stroke-width="3">${times(3, i => `<ellipse cx="776" cy="${368 - i * 6}" rx="14" ry="4" stroke="${i === 2 ? G.l3 : G.l1}"/>`)}</g>`,
  )

  // far to near; the sort keeps ties in the order they were added
  for (const [, svg] of floor.sort((a, b) => a[0] - b[0])) o.push(svg)

  // inspection drones
  if (!crewed) o.push(`<g class="d1"><g class="bb"><rect x="212" y="300" width="8" height="2" fill="${G.l3}"/><rect x="210" y="299" width="3" height="1" fill="${G.m4}"/><rect x="219" y="299" width="3" height="1" fill="${G.m4}"/><rect class="bc" x="215" y="302" width="2" height="1" fill="#e6e6e6"/></g></g>`)
  if (!crewed) o.push(`<g class="d2"><g class="bb"><rect x="136" y="230" width="7" height="2" fill="${G.l3}"/><rect x="134" y="229" width="3" height="1" fill="${G.m4}"/><rect x="142" y="229" width="3" height="1" fill="${G.m4}"/></g></g>`)

  // second bridge crane in the right bay, carrying a barrel section along the rail
  o.push(
    `<g class="bk"><rect x="600" y="163" width="18" height="5" fill="${G.m5}"/><rect x="608" y="168" width="1.5" height="40" fill="${G.l1}"/>` +
      `<rect x="594" y="208" width="30" height="14" fill="${G.l1}"/><rect x="600" y="208" width="6" height="14" fill="${G.l3}"/><rect x="594" y="208" width="30" height="1" fill="${G.m5}"/></g>`,
  )

  // overhead crane: parked, or bringing the ring this redraw stacks
  o.push(`<rect x="160" y="${RAIL_Y}" width="640" height="3" fill="#333437"/>`)
  o.push(
    `<g${stacking ? ' class="cr"' : ''} transform="translate(${CRANE_PARK} 0)"><rect x="${RX + 4}" y="${RAIL_Y + 3}" width="18" height="5" fill="${G.m5}"/>` +
      `<rect${stacking ? ' class="cb"' : ''} x="${RX + 12}" y="${RAIL_Y + 8}" width="1.5" height="10" fill="${G.l1}"/></g>`,
  )

  // reading lane: a soft dark veil where the chat column sits (with the
  // right panel open or closed), so text stays readable without frosted glass
  const lane = [
    [212, 6, 0.18],
    [218, 5, 0.38],
    [223, 5, 0.58],
    [228, 422, LANE],
    [650, 5, 0.58],
    [655, 5, 0.38],
    [660, 6, 0.18],
  ] as const
  o.push(`<g fill="${G.bg}">${lane.map(([x, w, a]) => `<rect x="${x}" width="${w}" height="${H}" opacity="${a}"/>`).join('')}</g>`)

  // brand plate above the rocket, drawn after the veil so it stays bright
  if (brand.trim() !== '') {
    o.push(brandPlate(brand.trim()))
  }

  // build readout, above the tower, clear of the chat
  const mono = 'font-size="7" font-family="ui-monospace,Menlo,monospace"'
  const label = stage === 'stack' ? `STACK ${rings}/${RINGS}` : STAGE_LABEL[stage]
  o.push(`<text${f.working ? ' class="hud"' : ''} x="140" y="167" ${mono} fill="${G.l4}">${label}</text>`)
  if (firing) {
    o.push(COUNTDOWN.map((t, i) => `<text class="cd${i}" x="192" y="167" ${mono} fill="${G.hi}" opacity="0">${t}</text>`).join(''))
  }
  o.push(`<text x="140" y="176" ${mono} fill="${G.l1}">B-${String(f.build).padStart(2, '0')} \u00b7 W${f.welds}</text>`)
  // one pip per stage: done, now, still to come
  const at = STAGES.indexOf(stage)
  o.push(times(STAGES.length, i => `<rect x="${140 + i * 7}" y="179" width="5" height="2" fill="${i < at ? G.l1 : i === at ? G.hi : G.d5}"/>`))

  // Rule of this file: every animated class carries the whole `animation:` shorthand,
  // delay included. A rule that sets `animation-delay` alone froze the desktop backdrop.
  // The boom lift rides as high as the rocket is tall; its mast stretches from the floor to the basket.
  const rise = Math.max(12, Math.min(120, 320 - top))
  const lift = !crewed
    ? ''
    : `.bs{animation:bs 22s ease-in-out infinite}@keyframes bs{0%,15%{transform:translateY(0)}45%,62%{transform:translateY(-${rise}px)}90%,100%{transform:translateY(0)}}` +
    `.bm{transform-box:fill-box;transform-origin:50% 100%;animation:bm 22s ease-in-out infinite}@keyframes bm{0%,15%{transform:scaleY(1)}45%,62%{transform:scaleY(${((67 + rise) / 67).toFixed(3)})}90%,100%{transform:scaleY(1)}}`
  const oneShot =
    (stacking ? stackStyle(rings, top) : '') +
    (cryoIn ? CRYO_STYLE : '') +
    (firing ? FIRE_STYLE : '') +
    (catching ? RELEASE_STYLE + catchStyle(ARM_PARK - (top + 14)) : '')
  const style = animate ? `<style>${LOOP_STYLE}${lift}${oneShot}</style>` : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMinYMax slice">${style}${o.join('')}</svg>`
}
