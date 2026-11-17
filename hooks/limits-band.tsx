// Rocket skin for the Limits mod (limits@claude-mods).
//
// Limits keeps fetching the usage figures, ticking and raising its 75/90/100% toasts;
// it shares them as plugin state (`limits.snapshot`, `limits.context`, `limits.now`,
// `limits.refreshing`). This file reads that state, draws the band in the Rocket
// Factory look as rocket-factory's own row, and swaps it in for Limits' row in
// `AbovePromptList`. Limits' own files are never touched, so its updates keep the skin.
// With the theme off, or Limits not installed, nothing here draws and Limits shows as it ships.
import type { On } from 'claude-code'

import type { LimitsContext, LimitsLimit, LimitsSnapshot } from '../types'

const SNAPSHOT = { plugin: 'limits', key: 'snapshot' } as const
const NOW = { plugin: 'limits', key: 'now' } as const
const CONTEXT = { plugin: 'limits', key: 'context' } as const
const REFRESHING = { plugin: 'limits', key: 'refreshing' } as const
/** rocket-factory's own look; register.tsx writes it. */
const LOOK = { plugin: 'rocket-factory', key: 'look' } as const
/** The brand shown at the row's start; register.tsx writes it, '' for none. */
const BRAND = { plugin: 'rocket-factory', key: 'brand' } as const

const LIMITS_PLUGIN = 'limits'
const OWN_PLUGIN = 'rocket-factory'
/** A row's plugin may be named bare or as `name@marketplace`. */
const isPlugin = (name: string, want: string) => name === want || name.startsWith(`${want}@`)

// ---------- figures (ported from Limits 0.2.6 so the numbers read the same) ----------

const HOUR = 3_600_000
const MINUTE = 60_000
const WINDOW_MS: Record<string, number> = { five_hour: 5 * HOUR, seven_day: 168 * HOUR }
const LABEL: Record<string, string> = { five_hour: '5HR', seven_day: 'WK', spend_limit: '$' }
const LONG_LABEL: Record<string, string> = { five_hour: '5-hour', seven_day: 'Weekly', spend_limit: 'Spend' }
const ORDER = ['five_hour', 'seven_day', 'spend_limit']

export const fmtTokens = (n: number): string => {
  const short = (v: number, unit: string) => `${Number.isInteger(v) ? v : v.toFixed(1)}${unit}`
  if (n >= 1_000_000) return short(Math.round(n / 100_000) / 10, 'M')
  if (n >= 1_000) return short(Math.round(n / 100) / 10, 'k')
  return String(n)
}

export const fmtSpan = (ms: number): string => {
  if (ms <= 0) return 'now'
  const mins = Math.round(ms / 60_000)
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return mins % 60 ? `${hours}h${mins % 60}m` : `${hours}h`
  const days = Math.floor(hours / 24)
  return hours % 24 ? `${days}d${hours % 24}h` : `${days}d`
}

export const fmtPct = (p: number | undefined): string =>
  p === undefined ? '—' : `${p < 10 && p % 1 !== 0 ? p.toFixed(1) : Math.round(p)}%`

/** A reset time as a launch countdown: `T-2h`, `T-0` once it is due. */
export const countdown = (ms: number): string => `T-${ms <= 0 ? '0' : fmtSpan(ms)}`

const tone = (p: number | undefined): Level =>
  p === undefined ? 'inactive' : p >= 85 ? 'error' : p >= 60 ? 'warning' : 'success'

const labelOf = (kind: string) => LABEL[kind] ?? kind.replace(/_/g, ' ').toUpperCase()
const longLabelOf = (kind: string) => LONG_LABEL[kind] ?? kind.replace(/_/g, ' ')

const sortLimits = (limits: readonly LimitsLimit[]): LimitsLimit[] =>
  [...limits].sort((a, b) => {
    const ia = ORDER.indexOf(a.kind)
    const ib = ORDER.indexOf(b.kind)
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib)
  })

/** A window whose reset time has passed starts over: show it empty, not stale. */
const current = (l: LimitsLimit, at: number): LimitsLimit =>
  l.resetsAt && Date.parse(l.resetsAt) <= at ? { kind: l.kind, percentUsed: 0 } : l

/** How far into the window we are, and when the current rate would run out before the reset. */
const paceOf = (limit: LimitsLimit, at: number) => {
  const length = WINDOW_MS[limit.kind]
  if (!length || !limit.resetsAt) return null
  const left = Date.parse(limit.resetsAt) - at
  if (!Number.isFinite(left)) return null
  const elapsed = Math.min(length, Math.max(0, length - left))
  const elapsedPct = (elapsed / length) * 100
  if (elapsed < length * 0.02) return { elapsedPct, runsOutIn: undefined }
  const rate = limit.percentUsed / elapsed
  const runsOutIn = rate > 0 && limit.percentUsed < 100 ? (100 - limit.percentUsed) / rate : undefined
  return { elapsedPct, runsOutIn: runsOutIn !== undefined && runsOutIn < left ? runsOutIn : undefined }
}

type Level = 'success' | 'warning' | 'error' | 'inactive'

/** One limit, reduced to what the band shows. */
export type Meter = {
  label: string
  pct: number
  level: Level
  reset?: string
  /** The reset is under an hour away: the countdown blinks. */
  isFinal?: boolean
  /** Where "now" sits in the window, 0–1. */
  elapsed?: number
  /** Shown in place of the percent while there is none yet. */
  pctText?: string
  /** No bar: the colored percent alone (the context window, which has no pace or reset). */
  isNumberOnly?: boolean
  alt: string
}

/** A meter in the red: 85% or more, or on track to run out before the reset. Vents vapor. */
export const isWarning = (m: Meter) => m.level === 'error'

/** Under an hour to the reset, and not yet due: the final countdown. */
export const isFinalCountdown = (msLeft: number) => msLeft > 0 && msLeft < HOUR

const toMeter = (raw: LimitsLimit, at: number): Meter => {
  const l = current(raw, at)
  const pace = paceOf(l, at)
  const runsOut = pace?.runsOutIn !== undefined ? fmtSpan(pace.runsOutIn) : undefined
  const reset = l.resetsAt ? countdown(Date.parse(l.resetsAt) - at) : undefined
  return {
    label: labelOf(l.kind),
    pct: l.percentUsed,
    // On track to run out before the reset: red, as Limits does.
    level: runsOut ? 'error' : tone(l.percentUsed),
    reset,
    isFinal: l.resetsAt ? isFinalCountdown(Date.parse(l.resetsAt) - at) : false,
    elapsed: pace ? pace.elapsedPct / 100 : undefined,
    alt:
      `${longLabelOf(l.kind)} limit ${fmtPct(l.percentUsed)} used` +
      (l.resetsAt ? `, resets in ${fmtSpan(Date.parse(l.resetsAt) - at)}` : '') +
      (pace ? `, ${Math.round(pace.elapsedPct)}% of window elapsed` : '') +
      (runsOut ? `, runs out in about ${runsOut}` : ''),
  }
}

export const metersOf = (s: LimitsSnapshot | null, ctx: LimitsContext | null, at: number): Meter[] => {
  const meters = sortLimits(s?.limits ?? []).map(l => toMeter(l, at))
  if (ctx?.percent !== undefined && ctx.tokens !== undefined) {
    const detail = `${fmtTokens(ctx.tokens)}/${fmtTokens(ctx.window)}`
    meters.push({
      label: 'CTX',
      pct: ctx.percent,
      level: tone(ctx.percent),
      isNumberOnly: true,
      alt: `Context ${fmtPct(ctx.percent)} of the window, ${detail} tokens`,
    })
  } else if (ctx) {
    meters.push({
      label: 'CTX',
      pct: 0,
      pctText: '–',
      level: 'inactive',
      isNumberOnly: true,
      alt: `Context window ${fmtTokens(ctx.window)} tokens: the share used shows after the next reply`,
    })
  }
  return meters
}

// ---------- Rocket drawing ----------

/** Rocket Factory roles (the theme's accent family), muted so the band stays quiet. */
const HEX: Record<string, string> = { success: '#8fb39a', warning: '#c9ad7f', error: '#c98a8a' }
/** Rocket text-muted: labels and countdowns. */
const GREY = '#929497'
/** A telemetry dot whose reading has gone stale. */
const DIM = '#55575a'
/** Vented vapor and frost: off-white, like the hangar's venting. */
const VAPOR = '#e6e6e6'
/** Empty track: unpainted steel. */
const STEEL = '#3a3b3e'
/** Seams between the bar's rings: the hangar's background. */
const SEAM = '#0c0d0e'
/** The "now" tick: a bright gantry marker. */
const TICK = '#d9dadc'
/** The bar is stacked from this many rings, like the rocket on the stand. */
const BAR_RINGS = 8

const FONT = 12.5
const CH = FONT * 0.62
const BAR_H = 8
const TEXT_H = 18
const BAR_CY = 8.5
const TICK_R = 7
/** Flat engine end (left) and nose cone (right), drawn apart from the stretching middle. */
const CAP_W = 3
const NOSE_W = 8
const BAR_UNITS = 1000
/** Space inside a meter (label, bar, percent), on top of the row's one-cell gap. */
const INNER = 4
/** Space after a meter's tail, before the next meter. */
const BETWEEN = 16
/** A reading older than this dims the telemetry dot. */
const STALE_MS = 10 * MINUTE

/** Vapor puffs off a red meter, like a tank venting before launch; left out in calm mode. */
// Each puff carries the whole `animation:` shorthand, delay included: a rule setting
// `animation-delay` alone froze the desktop backdrop, so none is used anywhere.
const VENT =
  '.vp1,.vp2,.vp3{transform-box:fill-box;transform-origin:50% 50%}' +
  '.vp1{animation:vp 2.4s ease-out infinite}.vp2{animation:vp 2.4s ease-out infinite .8s}.vp3{animation:vp 2.4s ease-out infinite 1.6s}' +
  '@keyframes vp{0%{transform:translate(0,0) scale(.5);opacity:0}15%{opacity:.85}100%{transform:translate(3px,-11px) scale(1.6);opacity:0}}'
/**
 * Propellant flowing `run` units along a bar's fill, and its frost line flickering, while
 * Claude works. The distance is written in: the app's SVG scrub drops a <style> that uses
 * CSS custom properties (var(--x)), so none are used.
 */
const loading = (run: number) =>
  `.pf{animation:pf 2.6s linear infinite}@keyframes pf{0%{transform:translateX(0);opacity:0}15%,80%{opacity:1}100%{transform:translateX(${run.toFixed(1)}px);opacity:0}}` +
  '.fl{animation:fl 1.1s steps(2) infinite}@keyframes fl{50%{opacity:.45}}'
/** Pulse for the telemetry dot while it refreshes. */
const PULSE = '.pl{animation:pl 1s ease-in-out infinite alternate}@keyframes pl{to{opacity:.3}}'
const NO_MOTION = '@media (prefers-reduced-motion:reduce){*{animation:none!important}}'
/** The "now" tick breathes like the tower beacon. */
const BEACON = '.bt{animation:bt 3.2s ease-in-out infinite}@keyframes bt{0%,100%{opacity:1}50%{opacity:.3}}'
/** A seam flares white as the fill crosses into the next ring, then cools (plays once). */
const WELD =
  '.wf{animation:wf 2.4s ease-out both}@keyframes wf{0%{opacity:0}8%{opacity:1}100%{opacity:0}}' +
  '.wk{animation:wk 2.4s steps(2) both}@keyframes wk{0%,40%{opacity:1}41%,100%{opacity:0}}'
/** The telemetry dot's heartbeat while the reading is fresh: a blip and a ring going out. */
const HEARTBEAT =
  '.hb,.hr{transform-box:fill-box;transform-origin:50% 50%}' +
  '.hb{animation:hb 3s ease-out infinite}@keyframes hb{0%{transform:scale(1)}6%{transform:scale(1.45)}16%,100%{transform:scale(1)}}' +
  '.hr{animation:hr 3s ease-out infinite}@keyframes hr{0%{transform:scale(1);opacity:.7}45%,100%{transform:scale(2.6);opacity:0}}'
/** The final countdown blinks slowly. */
const FINAL = '.fc{animation:fc 2s steps(1) infinite}@keyframes fc{50%{opacity:.35}}'
/** A light streak crosses the brand plate every so often. */
const glint = (w: number) =>
  `.gl{animation:gl 26s linear infinite}@keyframes gl{0%,88%{transform:translateX(-16px)}100%{transform:translateX(${Math.ceil(w + 16)}px)}}`

// ---------- one-shot weld flare ----------

/** Each bar's last ring and when its seam last flared; module memory, so a reload starts quiet. */
const welds = new Map<string, { ring: number; seam?: number; at: number }>()
/** How long a flare stays in the drawing, so redraws in that time keep it playing. */
const FLARE_MS = 3000

/**
 * The seam (1 to BAR_RINGS - 1) to flare when this bar's fill has just crossed into a
 * new ring, else undefined. The first reading after a load never flares.
 */
export const weldFlare = (key: string, pct: number, now: number): number | undefined => {
  const ring = Math.min(BAR_RINGS - 1, Math.floor((Math.max(0, pct) / 100) * BAR_RINGS))
  const last = welds.get(key)
  if (last === undefined || ring < last.ring) {
    welds.set(key, { ring, at: now })
    return undefined
  }
  if (ring > last.ring && ring > 0) {
    welds.set(key, { ring, seam: ring, at: now })
    return ring
  }
  return last.seam !== undefined && now - last.at < FLARE_MS ? last.seam : undefined
}

/**
 * True for an SVG that animates. The desktop app draws a plain Svg as an image, where CSS
 * animation does not play; one drawn with `isInteractive` goes into a sandboxed frame, as
 * the hangar backdrop does, and plays. Only the moving pieces pay for a frame.
 */
export const isMoving = (source: string) => source.includes('animation:')

const paint = (m: Meter) => HEX[m.level] ?? GREY

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const run = (x: number, y: number, text: string, fill: string, bold = false) =>
  `<text x="${x.toFixed(1)}" y="${y}" fill="${fill}"${bold ? ' font-weight="600"' : ''} ` +
  `textLength="${(text.length * CH).toFixed(1)}" lengthAdjust="spacingAndGlyphs">${esc(text)}</text>`

const textSvg = (body: string, width: number, css = '') => {
  const w = Math.ceil(width)
  return {
    source:
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${TEXT_H}" viewBox="0 0 ${w} ${TEXT_H}">` +
      `<style>text{font-size:${FONT}px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre}${css}</style>${body}</svg>`,
    width: w,
    height: TEXT_H,
  }
}

const labelSvg = (m: Meter) => textSvg(run(0, 13, m.label, GREY), m.label.length * CH + INNER)

/** The brand stenciled on a thin steel plate, like the one hung above the rocket; a glint crosses it. */
const brandSvg = (name: string, animate: boolean) => {
  const label = name.toUpperCase()
  const w = Array.from(label).length * CH
  const plateW = w + 12
  const shine = animate
    ? `<clipPath id="plate"><rect x="1.5" y="2" width="${(plateW - 3).toFixed(1)}" height="${TEXT_H - 4}" rx="1.5"/></clipPath>` +
      `<g clip-path="url(#plate)"><path class="gl" d="M4 0h6l-6 ${TEXT_H}h-6z" fill="#fff" opacity=".22"/></g>`
    : ''
  return textSvg(
    `<rect x=".75" y="1.25" width="${(plateW - 1.5).toFixed(1)}" height="${TEXT_H - 2.5}" rx="2" ` +
      `fill="none" stroke="${STEEL}" stroke-width="1.5"/>` +
      run(6, 13, label, TICK, true) +
      shine,
    plateW + INNER,
    animate ? glint(plateW) + NO_MOTION : '',
  )
}

/**
 * The colored percent, a vent when the meter is in the red, then the countdown.
 * `animate` false (calm mode) draws the vapor as a still puff.
 */
const tailSvg = (m: Meter, pad: number, animate: boolean) => {
  const pct = m.pctText ?? fmtPct(m.pct)
  let body = run(INNER, 13, pct, paint(m), true)
  let x = INNER + pct.length * CH
  const venting = isWarning(m)
  if (venting) {
    const cx = (x + 7).toFixed(1)
    body += animate
      ? ['vp1', 'vp2', 'vp3']
          .map(c => `<circle class="${c}" cx="${cx}" cy="13" r="2.2" fill="${VAPOR}" opacity="0"/>`)
          .join('')
      : `<circle cx="${cx}" cy="11" r="2.4" fill="${VAPOR}" opacity=".7"/>` +
        `<circle cx="${(x + 9.5).toFixed(1)}" cy="7" r="1.8" fill="${VAPOR}" opacity=".45"/>`
    x += 12
  }
  const final = m.isFinal === true && animate
  if (m.reset) {
    x += 10
    body += final
      ? `<g class="fc">${run(x, 13, m.reset, TICK, true)}</g>`
      : run(x, 13, m.reset, m.isFinal ? TICK : GREY, m.isFinal === true)
    x += m.reset.length * CH
  }
  const css = (venting && animate ? VENT : '') + (final ? FINAL : '')
  return textSvg(body, x + pad, css ? css + NO_MOTION : '')
}

export type Telemetry = 'fresh' | 'stale' | 'refreshing'

/** How the last reading stands: being fetched, fresh, or older than STALE_MS. */
export const telemetryOf = (isRefreshing: boolean, ageMs: number): Telemetry =>
  isRefreshing ? 'refreshing' : ageMs >= STALE_MS ? 'stale' : 'fresh'

/** The telemetry dot: a heartbeat when fresh, dim when stale, pulsing while it refreshes. */
const telemetrySvg = (t: Telemetry, animate: boolean) => {
  const pulse = t === 'refreshing' && animate
  const beat = t === 'fresh' && animate
  const fill = t === 'stale' ? DIM : TICK
  const cx = 9
  return textSvg(
    (beat ? `<circle class="hr" cx="${cx}" cy="${TEXT_H / 2}" r="3" fill="none" stroke="${TICK}" stroke-width="1"/>` : '') +
      `<circle${pulse ? ' class="pl"' : beat ? ' class="hb"' : ''} cx="${cx}" cy="${TEXT_H / 2}" r="3" fill="${fill}"/>`,
    18,
    pulse ? PULSE + NO_MOTION : beat ? HEARTBEAT + NO_MOTION : '',
  )
}

/** The bar's middle: steel track, role fill, ring seams and the "now" tick; stretches to its box. */
const barSvg = (m: Meter, isLoading: boolean, animate: boolean, flareSeam?: number) => {
  const by = BAR_CY - BAR_H / 2
  const fill = Math.min(1, Math.max(0, m.pct / 100)) * BAR_UNITS
  let body = `<rect x="0" y="${by}" width="${BAR_UNITS}" height="${BAR_H}" fill="${STEEL}"/>`
  if (fill > 0) body += `<rect x="0" y="${by}" width="${fill.toFixed(1)}" height="${BAR_H}" fill="${paint(m)}"/>`
  // Frost haze just under the fill level, as on a steel tank being loaded.
  if (fill > 0 && fill < BAR_UNITS) {
    const haze = Math.min(40, fill)
    body += `<rect x="${(fill - haze).toFixed(1)}" y="${by}" width="${haze.toFixed(1)}" height="${BAR_H}" fill="${VAPOR}" opacity=".16"/>`
  }
  // Propellant flowing along the fill while Claude works.
  const flowW = Math.min(140, fill * 0.6)
  if (isLoading && fill >= 60) {
    body +=
      `<rect class="pf" x="0" y="${by}" width="${flowW.toFixed(1)}" ` +
      `height="${BAR_H}" fill="${VAPOR}" opacity="0"/>`
  }
  for (let i = 1; i < BAR_RINGS; i++) {
    const sx = ((i / BAR_RINGS) * BAR_UNITS).toFixed(1)
    body +=
      `<line x1="${sx}" y1="${by}" x2="${sx}" y2="${by + BAR_H}" stroke="${SEAM}" ` +
      `stroke-width="1.5" vector-effect="non-scaling-stroke"/>`
  }
  // A seam just welded on: a white flare and a few sparks, played once.
  if (flareSeam !== undefined && animate) {
    const sx = (flareSeam / BAR_RINGS) * BAR_UNITS
    body +=
      `<rect class="wf" x="${(sx - 10).toFixed(1)}" y="${by - 2}" width="20" height="${BAR_H + 4}" fill="#fff" opacity="0"/>` +
      `<g class="wk" opacity="0" fill="#fff">` +
      `<rect x="${(sx - 18).toFixed(1)}" y="${by - 3}" width="4" height="1.2"/><rect x="${(sx + 14).toFixed(1)}" y="${by + BAR_H + 2}" width="4" height="1.2"/>` +
      `<rect x="${(sx + 6).toFixed(1)}" y="${by - 4}" width="3" height="1"/></g>`
  }
  // The frost line at the fill level; it flickers while loading.
  if (fill > 0 && fill < BAR_UNITS) {
    body +=
      `<line${isLoading ? ' class="fl"' : ''} x1="${fill.toFixed(1)}" y1="${by - 1}" x2="${fill.toFixed(1)}" y2="${by + BAR_H + 1}" ` +
      `stroke="${VAPOR}" stroke-opacity=".8" stroke-width="2" vector-effect="non-scaling-stroke"/>`
  }
  if (m.elapsed !== undefined) {
    const tx = Math.min(BAR_UNITS, Math.max(0, m.elapsed * BAR_UNITS)).toFixed(1)
    body +=
      `<line${animate ? ' class="bt"' : ''} x1="${tx}" y1="${BAR_CY - TICK_R}" x2="${tx}" y2="${BAR_CY + TICK_R}" stroke="${TICK}" ` +
      `stroke-width="1.5" vector-effect="non-scaling-stroke"/>`
  }
  const css =
    (isLoading ? loading(Math.max(0, fill - flowW)) : '') +
    (animate && m.elapsed !== undefined ? BEACON : '') +
    (animate && flareSeam !== undefined ? WELD : '')
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${BAR_UNITS}" height="${TEXT_H}" ` +
    `viewBox="0 0 ${BAR_UNITS} ${TEXT_H}" preserveAspectRatio="none">` +
    `${css ? `<style>${css}${NO_MOTION}</style>` : ''}${body}</svg>`
  )
}

const capSvg = (m: Meter, side: 'left' | 'right') => {
  const isFilled = side === 'left' ? m.pct > 0 : m.pct >= 100
  const r = BAR_H / 2
  const w = side === 'left' ? CAP_W : NOSE_W
  const d =
    side === 'left'
      ? `M0 ${BAR_CY - r}H${CAP_W}V${BAR_CY + r}H0Z`
      : `M0 ${BAR_CY - r}L${NOSE_W} ${BAR_CY}L0 ${BAR_CY + r}Z`
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${TEXT_H}" ` +
    `viewBox="0 0 ${w} ${TEXT_H}"><path d="${d}" fill="${isFilled ? paint(m) : STEEL}"/></svg>`
  )
}

/** Terminal bar: filled and empty ring glyphs, a tick at "now". */
const barRuns = (m: Meter, width: number): { text: string; color: string }[] => {
  const filled = Math.min(width, Math.max(m.pct > 0 ? 1 : 0, Math.round((m.pct / 100) * width)))
  const tick = m.elapsed === undefined ? -1 : Math.min(width - 1, Math.floor(m.elapsed * width))
  const runs: { text: string; color: string }[] = []
  for (let i = 0; i < width; i++) {
    const [ch, color] = i === tick ? ['┃', 'inactive'] : i < filled ? ['▰', m.level] : ['▱', 'inactive']
    const prev = runs[runs.length - 1]
    if (prev && prev.color === color && i !== tick && i - 1 !== tick) prev.text += ch
    else runs.push({ text: ch, color })
  }
  return runs
}

/**
 * The band's rows with rocket-factory's row moved into Limits' place and Limits' row left out;
 * undefined when either is missing (then the band stays as it is).
 */
export const swapLimitsRow = <R extends { plugin: string }>(rows: readonly R[]): R[] | undefined => {
  const mine = rows.findIndex(r => isPlugin(r.plugin, OWN_PLUGIN))
  const theirs = rows.findIndex(r => isPlugin(r.plugin, LIMITS_PLUGIN))
  if (mine < 0 || theirs < 0) return undefined
  const ours = rows[mine]!
  return rows.flatMap((r, i) => (i === theirs ? [ours] : i === mine ? [] : [r]))
}

// ---------- hooks ----------

/** Adds the Rocket limits band. With the look `off` the hooks pass, and Limits' own band shows. */
export const registerLimitsBand = (on: On) => {
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    // Asked for another plugin's row: not ours to draw.
    if ((e.plugin !== undefined && !isPlugin(e.plugin, OWN_PLUGIN)) || e.props.hasSurvey) return next(e)
    const { value: lookNow = 'on' } = await $.state.get(LOOK)
    if (lookNow === 'off') return next(e)
    const { value: s = null } = await $.state.get(SNAPSHOT)
    if (!s || s.limits.length === 0) return next(e) // nothing read yet: Limits' own row says so
    const { value: nowAt = 0 } = await $.state.get(NOW)
    const { value: ctx = null } = await $.state.get(CONTEXT)
    const { value: isRefreshing = false } = await $.state.get(REFRESHING)
    const { value: brand = '' } = await $.state.get(BRAND)
    const at = nowAt || Date.now()
    const meters = metersOf(s, ctx, at)
    const age = at - s.at
    const telemetry = telemetryOf(isRefreshing, age)
    const telemetryAlt =
      telemetry === 'refreshing'
        ? 'Usage: refreshing'
        : `Usage read ${age < MINUTE ? 'just now' : `${fmtSpan(age)} ago`}${telemetry === 'stale' ? ' (stale)' : ''}`
    // Calm mode keeps the vents, the loading flow and the telemetry dot still.
    const animate = lookNow !== 'calm'
    const isLoading = animate && e.props.isWorking

    if (e.surface !== 'terminal') {
      const { Box, Svg } = $.ui.resolve(e)
      const plate = brand ? brandSvg(brand, animate) : undefined
      const now = Date.now()
      const dot = telemetrySvg(telemetry, animate)
      return (
        <Box flexDirection="row" flexWrap="nowrap" alignItems="center" columnGap={1}>
          {plate ? <Svg source={plate.source} width={plate.width} height={plate.height} alt={`Brand: ${brand}`} isInteractive={isMoving(plate.source)} /> : null}
          {meters.flatMap(m => {
            const label = labelSvg(m)
            const tail = tailSvg(m, BETWEEN, animate)
            const bar = m.isNumberOnly ? '' : barSvg(m, isLoading, animate, weldFlare(m.label, m.pct, now))
            const tailAlt = m.isNumberOnly ? m.alt : `${m.pctText ?? fmtPct(m.pct)}${isWarning(m) ? ', venting' : ''}`
            return [
              <Svg source={label.source} width={label.width} height={label.height} alt={m.label} />,
              m.isNumberOnly ? null : (
                <Box flexDirection="row" alignItems="center" flexGrow={1} width={0} minWidth={0}>
                  <Svg source={capSvg(m, 'left')} width={CAP_W} height={TEXT_H} alt="bar start" />
                  <Box flexDirection="row" alignItems="center" flexGrow={1} width={0} minWidth={0}>
                    <Svg source={bar} height={TEXT_H} alt={m.alt} isInteractive={isMoving(bar)} />
                  </Box>
                  <Svg source={capSvg(m, 'right')} width={NOSE_W} height={TEXT_H} alt="bar end" />
                </Box>
              ),
              <Svg source={tail.source} width={tail.width} height={tail.height} alt={tailAlt} isInteractive={isMoving(tail.source)} />,
            ]
          })}
          <Svg source={dot.source} width={dot.width} height={dot.height} alt={telemetryAlt} isInteractive={isMoving(dot.source)} />
        </Box>
      )
    }

    const { Box, Text } = $.ui.resolve(e)
    const barMeters = meters.filter(m => !m.isNumberOnly).length
    const textCols = meters.reduce(
      (n, m) =>
        n + m.label.length + 2 + (m.pctText ?? fmtPct(m.pct)).length +
        (isWarning(m) ? 2 : 0) + (m.reset ? m.reset.length + 1 : 0),
      0,
    )
    const brandLabel = brand ? brand.toUpperCase() : ''
    const brandCols = brandLabel ? Array.from(brandLabel).length + 5 : 0
    const spare = e.props.bodyColumns - textCols - 3 * meters.length - 4 - brandCols
    const barWidth = Math.min(40, Math.max(8, Math.floor(spare / Math.max(1, barMeters))))
    return (
      <Box flexDirection="row" flexWrap="wrap" columnGap={3}>
        {brandLabel ? (
          <Box flexDirection="row">
            <Text bold>{brandLabel}</Text>
            <Text dimColor> │</Text>
          </Box>
        ) : null}
        {meters.map(m => (
          <Box flexDirection="row">
            <Text dimColor>{m.label} </Text>
            {m.isNumberOnly
              ? null
              : barRuns(m, barWidth).map(r => <Text color={r.color}>{r.text}</Text>)}
            <Text color={m.level} bold>
              {m.isNumberOnly ? '' : ' '}
              {m.pctText ?? fmtPct(m.pct)}
            </Text>
            {isWarning(m) ? <Text color="error"> ●</Text> : null}
            {m.reset ? <Text dimColor> {m.reset}</Text> : null}
          </Box>
        ))}
        {telemetry === 'stale' ? <Text dimColor>•</Text> : telemetry === 'refreshing' ? <Text dimColor>◦</Text> : <Text>•</Text>}
      </Box>
    )
  })

  // Our row takes Limits' place in the band; Limits' row (still drawn, so its timers run) is left out.
  on('ui.render', { component: 'AbovePromptList' }, async ($, e, next) => {
    const swapped = swapLimitsRow(e.props.rows)
    return swapped ? next({ ...e, props: { ...e.props, rows: swapped } }) : next(e)
  })
}
