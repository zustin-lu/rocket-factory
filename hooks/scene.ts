// Monotone rocket factory, drawn as one SVG string per redraw.
//
// The scene is 800 x 472 and anchored bottom-left (xMinYMax slice). The
// rocket stands in the gap between the app's sidebar and the chat column,
// so it stays in view whether the right side panel is open or not.
// Inspired by steel-ring rocket stacking and clean full-flow engines; no
// real company's logo, name or vehicle is drawn.

import type { Factory } from '../types'

export const RINGS = 8

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

const LOOP_STYLE = `
.ec{animation:ec 14s ease-in-out infinite}@keyframes ec{0%{transform:translateX(160px)}30%,70%{transform:translateX(0)}100%{transform:translateX(160px)}}
.eu{animation:eu 14s ease-in-out infinite}@keyframes eu{0%,32%{transform:translateY(0);opacity:1}48%,62%{transform:translateY(-14px);opacity:1}63%,100%{transform:translateY(-14px);opacity:0}}
.ln{animation:ln 40s linear infinite}@keyframes ln{to{transform:translateX(-90px)}}
.aL{transform-box:fill-box;transform-origin:0 50%;animation:aL 9s ease-in-out infinite alternate}@keyframes aL{from{transform:rotate(-4deg)}to{transform:rotate(14deg)}}
.aR{transform-box:fill-box;transform-origin:0 50%;animation:aR 9s ease-in-out infinite alternate}@keyframes aR{from{transform:rotate(4deg)}to{transform:rotate(-14deg)}}
.c1{animation:c1 18s linear infinite}@keyframes c1{from{transform:translateX(-120px)}to{transform:translateX(920px)}}
.c2{animation:c2 26s linear infinite}@keyframes c2{from{transform:translateX(900px)}to{transform:translateX(-140px)}}
.fk{animation:fk 30s ease-in-out infinite alternate}@keyframes fk{to{transform:translateX(-260px)}}
.agv{animation:agv 26s linear infinite}@keyframes agv{0%{transform:translate(240px,412px)}44%{transform:translate(700px,412px)}50%{transform:translate(740px,362px)}94%{transform:translate(280px,362px)}100%{transform:translate(240px,412px)}}
.w1{animation:w1 20s linear infinite alternate}@keyframes w1{to{transform:translateX(90px)}}
.w2{animation:w2 14s linear infinite alternate}@keyframes w2{to{transform:translateX(-70px)}}
.w3{animation:w3 18s linear infinite alternate}@keyframes w3{to{transform:translateX(-140px)}}
.pr{animation:pr 22s linear infinite alternate}@keyframes pr{to{transform:translateX(200px)}}
.bb{animation:bb .6s ease-in-out infinite alternate}@keyframes bb{to{transform:translateY(-1px)}}
.bc{animation:bc 2s steps(1) infinite}@keyframes bc{50%{opacity:.2}}
.lf{animation:lf 10s ease-in-out infinite alternate}@keyframes lf{to{transform:translateY(-120px)}}
.dm{animation:dm .12s steps(2) infinite}@keyframes dm{50%{opacity:.55}}
.gt{animation:gt 16s ease-in-out infinite alternate}@keyframes gt{to{transform:translateX(-300px)}}
.dp{transform-box:fill-box;transform-origin:50% 0;animation:dp 16s ease-in-out infinite}@keyframes dp{0%,20%,80%,100%{transform:scaleY(1)}40%,60%{transform:scaleY(3)}}
.d1{animation:d1 11s ease-in-out infinite alternate}@keyframes d1{50%{transform:translate(14px,-30px)}100%{transform:translate(-6px,-70px)}}
.d2{animation:d2 13s ease-in-out infinite alternate}@keyframes d2{50%{transform:translate(-12px,30px)}100%{transform:translate(8px,60px)}}
.r1{transform-box:fill-box;transform-origin:0 100%;animation:r1 3s ease-in-out infinite alternate}@keyframes r1{from{transform:rotate(-20deg)}to{transform:rotate(25deg)}}
.r2{transform-box:fill-box;transform-origin:100% 100%;animation:r2 3.6s ease-in-out infinite alternate}@keyframes r2{from{transform:rotate(18deg)}to{transform:rotate(-24deg)}}
.ws{animation:ws .2s steps(2) infinite}@keyframes ws{50%{opacity:.1}}
.ws2{animation:ws .27s steps(2) infinite .1s}
.vt{animation:vt 6s ease-out infinite}@keyframes vt{0%{transform:translate(0,0) scale(.6);opacity:0}20%{opacity:.22}100%{transform:translate(-26px,-40px) scale(1.8);opacity:0}}
.vt2{animation:vt 6s ease-out infinite 3s}
.cl{animation:cl 12s steps(1) infinite}@keyframes cl{0%,82%{opacity:0}83%,94%{opacity:1}95%,100%{opacity:0}}
.sc{transform-box:fill-box;transform-origin:0 50%;animation:sc 2.4s steps(4) infinite}@keyframes sc{0%{transform:scaleX(.3)}50%{transform:scaleX(1)}100%{transform:scaleX(.6)}}
.sw{animation:sw 9s ease-in-out infinite}@keyframes sw{0%{transform:translateY(130px);opacity:0}30%,70%{opacity:1}100%{transform:translateY(-10px);opacity:0}}
.hud{animation:bc 1.4s steps(1) infinite}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
`

/** One-shot animations for the redraw right after a turn: the crane brings a ring. */
const stackStyle = (drop: number, fires: boolean) => `
.cr{animation:cr 5s ease-in-out both}@keyframes cr{0%{transform:translateX(${CRANE_PARK}px)}24%,76%{transform:translateX(0)}100%{transform:translateX(${CRANE_PARK}px)}}
.nr{animation:nr 5s ease-in-out both}@keyframes nr{0%{transform:translate(${CRANE_PARK}px,-${drop}px)}24%{transform:translate(0,-${drop}px)}62%,100%{transform:translate(0,0)}}
.cb{transform-box:fill-box;transform-origin:50% 0;animation:cb 5s ease-in-out both}@keyframes cb{0%,24%{transform:scaleY(1)}62%{transform:scaleY(${((10 + drop) / 10).toFixed(2)})}76%,100%{transform:scaleY(1)}}
.nl{animation:nl 5s steps(1) both}@keyframes nl{0%,61%{opacity:0}62%,100%{opacity:1}}
.sf{animation:${fires ? 'sf 2.8s ease-in-out 5.6s both' : 'none'}}@keyframes sf{0%{opacity:0}15%,85%{opacity:1}100%{opacity:0}}
`

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
  const stacking = animate && f.last === 'stack' && rings > 0
  const drop = top - (RAIL_Y + 18)
  const o: string[] = []

  // ---------- hall ----------
  o.push(`<rect width="${W}" height="${H}" fill="${G.bg}"/>`)
  o.push(`<rect y="30" width="${W}" height="${HORIZON - 30}" fill="${G.wall}"/>`)
  o.push(`<g fill="${G.bay}">${times(16, i => `<rect x="${6 + i * 50}" y="56" width="38" height="200"/>`)}</g>`)
  o.push(`<rect width="${W}" height="30" fill="${G.roof}"/>`)
  o.push(`<path d="${times(41, i => `${i ? 'L' : 'M'}${i * 20} ${i % 2 ? 28 : 10}`)}" stroke="#202123" stroke-width="1.5" fill="none"/>`)
  o.push(`<rect y="48" width="${W}" height="2" fill="${G.d2}"/>`)

  // ceiling gantry robot
  o.push(`<g class="gt"><rect x="560" y="44" width="22" height="8" fill="${G.m1}"/><rect class="dp" x="570" y="52" width="2" height="14" fill="${G.m3}"/><rect x="565" y="66" width="12" height="3" fill="${G.m4}"/></g>`)

  // engine line along the back wall
  o.push(`<g class="ln">${times(14, i => `<rect x="${250 + i * 45}" y="290" width="12" height="2" fill="${G.d3}"/><rect x="${255 + i * 45}" y="280" width="2" height="10" fill="${G.d3}"/>${bell(256 + i * 45, 270, 1.3, '#3d3f42')}`)}</g>`)

  // forklift carrying a ring
  o.push(`<g class="fk"><rect x="520" y="288" width="18" height="8" rx="2" fill="${G.m1}"/><rect x="532" y="281" width="6" height="7" fill="${G.m2}"/><rect x="516" y="276" width="2" height="18" fill="${G.m2}"/><ellipse cx="509" cy="283" rx="9" ry="3" fill="none" stroke="${G.m4}" stroke-width="2"/><circle cx="523" cy="297" r="2" fill="${G.d1}"/><circle cx="535" cy="297" r="2" fill="${G.d1}"/></g>`)

  // catch tower in the far background
  o.push(
    `<rect x="604" y="140" width="4" height="160" fill="#26272a"/><rect x="618" y="140" width="4" height="160" fill="#26272a"/>` +
      `<path d="${times(8, i => `M608 ${145 + i * 20}L618 ${160 + i * 20}M618 ${145 + i * 20}L608 ${160 + i * 20}`)}" stroke="${G.d2}" stroke-width="1"/>` +
      `<rect x="600" y="136" width="26" height="4" fill="#2e2f32"/>` +
      `<rect class="aL" x="622" y="196" width="46" height="3" fill="${G.m1}"/><rect class="aR" x="622" y="212" width="46" height="3" fill="${G.m1}"/>` +
      `<rect class="bc" x="611" y="130" width="4" height="4" fill="#cfd0d2"/>`,
  )

  // engine test cell, far right
  o.push(
    `<rect x="712" y="250" width="70" height="50" fill="${G.roof}" stroke="${G.edge}"/><rect x="712" y="250" width="70" height="3" fill="${G.edge}"/>` +
      bell(735, 262, 1.3, G.m3) +
      (animate
        ? `<g class="cl"><path d="M732 270L738 270L742 296L728 296Z" fill="#fff" opacity=".35"/><g class="dm" fill="#fff"><ellipse cx="735" cy="276" rx="2" ry="1.2"/><ellipse cx="735" cy="283" rx="1.6" ry="1"/><ellipse cx="735" cy="290" rx="1.3" ry=".8"/></g><rect x="712" y="250" width="70" height="50" fill="#fff" opacity=".04"/></g>`
        : '') +
      `<rect x="756" y="262" width="20" height="12" fill="#101112"/><rect class="sc" x="758" y="265" width="14" height="2" fill="${G.m4}"/><rect class="sc" style="animation-delay:.6s" x="758" y="269" width="10" height="2" fill="${G.m2}"/>`,
  )

  // ---------- floor ----------
  o.push(`<rect y="${HORIZON}" width="${W}" height="${H - HORIZON}" fill="${G.floor}"/><rect y="${HORIZON}" width="${W}" height="1" fill="${G.edge}"/>`)
  o.push(`<g stroke="${G.line}" stroke-width="1.2">${[-900, -500, -150, 170, 470, 780, 1150, 1600].map(x => `<path d="M400 ${HORIZON}L${x} ${H}"/>`).join('')}<path d="M0 318H800M0 385H800M0 440H800"/></g>`)

  // self-driving floor cart on its painted route
  o.push(`<path d="M240 412L700 412L740 362L280 362Z" fill="none" stroke="#1f2022" stroke-width="1.5" stroke-dasharray="4 4"/>`)
  o.push(`<g class="agv" transform="translate(240 412)"><rect x="-9" y="-5" width="18" height="7" rx="2" fill="${G.m2}"/><rect x="-6" y="-9" width="12" height="4" fill="#2f3033" stroke="${G.m4}" stroke-width=".7"/><rect class="bc" x="7" y="-3" width="2" height="2" fill="#e6e6e6"/></g>`)

  // ring weld station
  o.push(
    `<g transform="translate(560 382)"><rect x="-26" y="12" width="52" height="5" fill="${G.edge}"/>` +
      `<ellipse rx="22" ry="12" fill="none" stroke="${G.l1}" stroke-width="5"/><ellipse rx="22" ry="12" fill="none" stroke="${G.l3}" stroke-width="1.5"/>` +
      `<rect x="-40" y="-2" width="6" height="16" fill="${G.m1}"/><rect class="r1" x="-37" y="-18" width="3" height="18" fill="${G.m5}"/>` +
      `<rect x="34" y="-2" width="6" height="16" fill="${G.m1}"/><rect class="r2" x="34" y="-18" width="3" height="18" fill="${G.m5}"/>` +
      `<g class="ws"><circle cx="-22" cy="-3" r="1.6" fill="${G.white}"/><circle cx="-25" cy="1" r=".7" fill="#ccc"/></g>` +
      `<g class="ws2"><circle cx="22" cy="-4" r="1.6" fill="${G.white}"/><circle cx="25" cy="0" r=".7" fill="#ccc"/></g>` +
      `${person(-6, 28, 1, G.l2)}</g>`,
  )

  // ---------- service tower & test stand ----------
  o.push(`<rect x="150" y="190" width="3" height="208" fill="${G.d5}"/><rect x="160" y="190" width="3" height="208" fill="${G.d5}"/>`)
  o.push(`<path d="${times(10, i => `M153 ${200 + i * 20}L160 ${214 + i * 20}M160 ${200 + i * 20}L153 ${214 + i * 20}`)}" stroke="${G.edge}" stroke-width="1"/>`)
  o.push(`<rect class="bc" x="153" y="184" width="7" height="4" fill="${G.hi}"/>`)
  o.push(`<g class="lf"><rect x="151" y="392" width="11" height="2" fill="${G.l2}"/>${person(154.5, 384, 0.75, G.l5)}</g>`)
  o.push(`<rect x="166" y="360" width="44" height="6" fill="#3c3e41"/><rect x="168" y="366" width="5" height="32" fill="${G.d4}"/><rect x="203" y="366" width="5" height="32" fill="${G.d4}"/><rect x="160" y="396" width="56" height="4" fill="#26272a"/>`)

  // oxygen venting
  if (animate) {
    o.push(`<g fill="#cfd0d2"><circle class="vt" cx="174" cy="350" r="5" opacity="0"/><circle class="vt2" cx="172" cy="${Math.min(330, top + 10)}" r="5" opacity="0"/></g>`)
  }

  // static fire, played once after the last ring lands
  if (stacking && complete) {
    o.push(
      `<g class="sf" opacity="0"><ellipse cx="188" cy="398" rx="70" ry="10" fill="#fff" opacity=".12"/><path d="M178 360L198 360L193 396L183 396Z" fill="#fff" opacity=".35"/>` +
        `<g class="dm" fill="#fff"><ellipse cx="188" cy="368" rx="4" ry="2.4"/><ellipse cx="188" cy="378" rx="3.4" ry="2"/><ellipse cx="188" cy="387" rx="2.8" ry="1.7"/></g>` +
        `<rect y="${HORIZON}" width="${W}" height="${H - HORIZON}" fill="#fff" opacity=".04"/></g>`,
    )
  }

  // engine cluster and the engine-install cart
  o.push([180, 186, 192, 198].map(x => bell(x, BASE + 1, 1.15, G.m4)).join('') + bell(189, BASE + 3, 1.15, G.l1))
  o.push(`<g class="ec" transform="translate(160 0)"><rect x="176" y="390" width="26" height="6" rx="2" fill="${G.m3}"/><circle cx="180" cy="397" r="2" fill="${G.d1}"/><circle cx="198" cy="397" r="2" fill="${G.d1}"/><g class="eu">${bell(189, 382, 1.2, G.l3)}</g></g>`)

  // ---------- the rocket: rings stacked by this session ----------
  for (let i = 0; i < rings; i++) {
    const y = BASE - (i + 1) * RH
    const isNew = stacking && i === rings - 1
    o.push(ring(y, isNew ? ' class="nr"' : ''))
  }
  if (complete) {
    o.push(`<path${stacking ? ' class="nl"' : ''} d="M${RX} ${top}Q${RX + 2} ${top - 24} ${RX + RW / 2} ${top - 30}Q${RX + RW - 2} ${top - 24} ${RX + RW} ${top}Z" fill="${G.l6}"/>`)
  }
  if (rings > 0 && animate) {
    o.push(`<g class="sw" opacity="0"><rect x="${RX + 6}" y="${top}" width="4" height="${Math.min(40, rings * RH)}" fill="#fff" opacity=".12"/></g>`)
  }

  // welders on while Claude is working
  if (f.working && !complete) {
    o.push(
      `<g class="dm"><circle cx="${RX}" cy="${top}" r="2.2" fill="${G.white}"/><circle cx="${RX - 3}" cy="${top + 4}" r="1" fill="#d0d0d0"/><circle cx="${RX + 2}" cy="${top - 3}" r=".8" fill="#d0d0d0"/></g>` +
        `<g class="ws2"><circle cx="${RX + RW}" cy="${top}" r="2" fill="${G.white}"/><circle cx="${RX + RW + 3}" cy="${top + 4}" r=".9" fill="#d0d0d0"/></g>`,
    )
  }

  // inspection drones
  o.push(`<g class="d1"><g class="bb"><rect x="212" y="300" width="8" height="2" fill="${G.l3}"/><rect x="210" y="299" width="3" height="1" fill="${G.m4}"/><rect x="219" y="299" width="3" height="1" fill="${G.m4}"/><rect class="bc" x="215" y="302" width="2" height="1" fill="#e6e6e6"/></g></g>`)
  o.push(`<g class="d2"><g class="bb"><rect x="136" y="230" width="7" height="2" fill="${G.l3}"/><rect x="134" y="229" width="3" height="1" fill="${G.m4}"/><rect x="142" y="229" width="3" height="1" fill="${G.m4}"/></g></g>`)

  // overhead crane: parked, or bringing the ring this redraw stacks
  o.push(`<rect x="160" y="${RAIL_Y}" width="640" height="3" fill="#333437"/>`)
  o.push(
    `<g${stacking ? ' class="cr"' : ''} transform="translate(${CRANE_PARK} 0)"><rect x="${RX + 4}" y="${RAIL_Y + 3}" width="18" height="5" fill="${G.m5}"/>` +
      `<rect${stacking ? ' class="cb"' : ''} x="${RX + 12}" y="${RAIL_Y + 8}" width="1.5" height="10" fill="${G.l1}"/></g>`,
  )

  // ---------- floor traffic and crew ----------
  o.push(`<g class="c2"><rect x="0" y="330" width="34" height="9" rx="3" fill="#3f4144"/><rect x="2" y="324" width="11" height="7" rx="2" fill="${G.m4}"/><circle cx="6" cy="340" r="2.8" fill="${G.d1}"/><circle cx="29" cy="340" r="2.8" fill="${G.d1}"/></g>`)
  o.push(`<g class="c1"><rect x="0" y="420" width="46" height="12" rx="4" fill="${G.m3}"/><rect x="22" y="411" width="17" height="10" rx="3" fill="${G.m5}"/><rect x="3" y="408" width="15" height="12" fill="#2f3033" stroke="${G.m5}"/><circle cx="9" cy="434" r="4" fill="${G.d1}"/><circle cx="37" cy="434" r="4" fill="${G.d1}"/></g>`)
  o.push(`<g class="pr">${person(20, 372, 1, G.l2)}<rect x="16" y="372" width="34" height="2.4" rx="1" fill="${G.m4}"/>${person(44, 372, 1, G.l2)}</g>`)
  o.push(`<g class="w1">${person(222, 386, 1, G.l3)}</g><g class="w2">${person(740, 402, 1, G.l2)}</g><g class="w3">${person(690, 330, 0.9, G.l1)}</g>`)
  o.push(person(470, 292, 0.8, G.l1) + person(478, 293, 0.8, G.m5) + person(640, 295, 0.8, G.l1))
  o.push(`${person(226, 352, 1, G.l4)}<rect x="230" y="355" width="5" height="6" fill="#d0d0d0" opacity=".5"/>`)

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
  o.push(`<text x="140" y="176" ${mono} fill="${G.l1}">B-${String(f.build).padStart(2, '0')} \u00b7 ${rings}/${RINGS} \u00b7 W${f.welds}</text>`)
  if (complete) {
    o.push(`<text x="140" y="167" ${mono} fill="${G.l4}">STATIC FIRE</text>`)
  } else if (f.working) {
    o.push(`<text class="hud" x="140" y="167" ${mono} fill="${G.l4}">WELDING</text>`)
  }

  const style = animate ? `<style>${LOOP_STYLE}${stacking ? stackStyle(drop, complete) : ''}</style>` : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMinYMax slice">${style}${o.join('')}</svg>`
}
