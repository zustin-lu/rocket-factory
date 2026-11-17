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
  /** Where "now" sits in the window, 0–1. */
  elapsed?: number
  /** Plain text after the percent (the context's token count). */
  detail?: string
  /** Shown in place of the percent while there is none yet. */
  pctText?: string
  alt: string
}

const toMeter = (raw: LimitsLimit, at: number): Meter => {
  const l = current(raw, at)
  const pace = paceOf(l, at)
  const runsOut = pace?.runsOutIn !== undefined ? fmtSpan(pace.runsOutIn) : undefined
  const reset = l.resetsAt ? fmtSpan(Date.parse(l.resetsAt) - at) : undefined
  return {
    label: labelOf(l.kind),
    pct: l.percentUsed,
    // On track to run out before the reset: red, as Limits does.
    level: runsOut ? 'error' : tone(l.percentUsed),
    reset,
    elapsed: pace ? pace.elapsedPct / 100 : undefined,
    alt:
      `${longLabelOf(l.kind)} limit ${fmtPct(l.percentUsed)} used` +
      (reset ? `, resets in ${reset}` : '') +
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
      detail,
      alt: `Context ${detail} tokens, ${fmtPct(ctx.percent)} of the window`,
    })
  } else if (ctx) {
    meters.push({
      label: 'CTX',
      pct: 0,
      pctText: '–',
      level: 'inactive',
      detail: `–/${fmtTokens(ctx.window)}`,
      alt: 'Context: the token count shows after the next reply',
    })
  }
  return meters
}

// ---------- Rocket drawing ----------

/** Rocket Factory roles (the theme's accent family), muted so the band stays quiet. */
const HEX: Record<string, string> = { success: '#8fb39a', warning: '#c9ad7f', error: '#c98a8a' }
/** Rocket text-muted: labels, details, the clock. */
const GREY = '#929497'
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
const GAP = 22
const ICON = 11

const paint = (m: Meter) => HEX[m.level] ?? GREY

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const run = (x: number, y: number, text: string, fill: string, bold = false) =>
  `<text x="${x.toFixed(1)}" y="${y}" fill="${fill}"${bold ? ' font-weight="600"' : ''} ` +
  `textLength="${(text.length * CH).toFixed(1)}" lengthAdjust="spacingAndGlyphs">${esc(text)}</text>`

const clockIcon = (x: number, cy: number, color: string) => {
  const r = ICON / 2 - 0.75
  const cx = x + ICON / 2
  return (
    `<g fill="none" stroke="${color}" stroke-width="1.3" stroke-linecap="round">` +
    `<circle cx="${cx.toFixed(1)}" cy="${cy}" r="${r}"/>` +
    `<path d="M${cx.toFixed(1)} ${cy - r + 2}V${cy}l${(r * 0.55).toFixed(1)} ${(r * 0.45).toFixed(1)}"/></g>`
  )
}

const textSvg = (body: string, width: number) => {
  const w = Math.ceil(width)
  return {
    source:
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${TEXT_H}" viewBox="0 0 ${w} ${TEXT_H}">` +
      `<style>text{font-size:${FONT}px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre}</style>${body}</svg>`,
    width: w,
    height: TEXT_H,
  }
}

const labelSvg = (m: Meter) => textSvg(run(0, 13, m.label, GREY), m.label.length * CH)

/** The brand, bright and bold, with a steel divider after it. */
const brandSvg = (name: string) => {
  const label = name.toUpperCase()
  const w = Array.from(label).length * CH
  return textSvg(
    run(0, 13, label, TICK, true) + `<rect x="${(w + 8).toFixed(1)}" y="3" width="1.5" height="12" fill="${STEEL}"/>`,
    w + 14,
  )
}

const tailSvg = (m: Meter, pad: number) => {
  const pct = m.pctText ?? fmtPct(m.pct)
  let body = run(0, 13, pct, paint(m), true)
  let x = pct.length * CH
  if (m.detail) {
    body += run(x + CH, 13, m.detail, GREY)
    x += (m.detail.length + 1) * CH
  }
  if (m.reset) {
    x += 8
    body += clockIcon(x, TEXT_H / 2, GREY)
    x += ICON + 4
    body += run(x, 13, m.reset, GREY)
    x += m.reset.length * CH
  }
  return textSvg(body, x + pad)
}

/** The bar's middle: steel track, role fill, ring seams and the "now" tick; stretches to its box. */
const barSvg = (m: Meter) => {
  const by = BAR_CY - BAR_H / 2
  const fill = Math.min(1, Math.max(0, m.pct / 100)) * BAR_UNITS
  let body = `<rect x="0" y="${by}" width="${BAR_UNITS}" height="${BAR_H}" fill="${STEEL}"/>`
  if (fill > 0) body += `<rect x="0" y="${by}" width="${fill.toFixed(1)}" height="${BAR_H}" fill="${paint(m)}"/>`
  for (let i = 1; i < BAR_RINGS; i++) {
    const sx = ((i / BAR_RINGS) * BAR_UNITS).toFixed(1)
    body +=
      `<line x1="${sx}" y1="${by}" x2="${sx}" y2="${by + BAR_H}" stroke="${SEAM}" ` +
      `stroke-width="1.5" vector-effect="non-scaling-stroke"/>`
  }
  if (m.elapsed !== undefined) {
    const tx = Math.min(BAR_UNITS, Math.max(0, m.elapsed * BAR_UNITS)).toFixed(1)
    body +=
      `<line x1="${tx}" y1="${BAR_CY - TICK_R}" x2="${tx}" y2="${BAR_CY + TICK_R}" stroke="${TICK}" ` +
      `stroke-width="1.5" vector-effect="non-scaling-stroke"/>`
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${BAR_UNITS}" height="${TEXT_H}" ` +
    `viewBox="0 0 ${BAR_UNITS} ${TEXT_H}" preserveAspectRatio="none">${body}</svg>`
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
    const ageText = isRefreshing ? '…' : age < MINUTE ? 'now' : fmtSpan(age)

    if (e.surface !== 'terminal') {
      const { Box, Svg, Text } = $.ui.resolve(e)
      const plate = brand ? brandSvg(brand) : undefined
      return (
        <Box flexDirection="row" flexWrap="nowrap" alignItems="center" columnGap={1}>
          {plate ? <Svg source={plate.source} width={plate.width} height={plate.height} alt={`Brand: ${brand}`} /> : null}
          {meters.flatMap((m, i) => {
            const label = labelSvg(m)
            const tail = tailSvg(m, i < meters.length - 1 ? GAP - 8 : 0)
            return [
              <Svg source={label.source} width={label.width} height={label.height} alt={m.label} />,
              <Box flexDirection="row" alignItems="center" flexGrow={1} width={0} minWidth={0}>
                <Svg source={capSvg(m, 'left')} width={CAP_W} height={TEXT_H} alt="bar start" />
                <Box flexDirection="row" alignItems="center" flexGrow={1} width={0} minWidth={0}>
                  <Svg source={barSvg(m)} height={TEXT_H} alt={m.alt} />
                </Box>
                <Svg source={capSvg(m, 'right')} width={NOSE_W} height={TEXT_H} alt="bar end" />
              </Box>,
              <Svg source={tail.source} width={tail.width} height={tail.height} alt={m.pctText ?? fmtPct(m.pct)} />,
            ]
          })}
          <Text dimColor>⟳ {ageText}</Text>
        </Box>
      )
    }

    const { Box, Text } = $.ui.resolve(e)
    const textCols = meters.reduce(
      (n, m) =>
        n + m.label.length + 2 + (m.pctText ?? fmtPct(m.pct)).length +
        (m.detail ? m.detail.length + 1 : 0) + (m.reset ? m.reset.length + 3 : 0),
      0,
    )
    const brandLabel = brand ? brand.toUpperCase() : ''
    const brandCols = brandLabel ? Array.from(brandLabel).length + 5 : 0
    const spare = e.props.bodyColumns - textCols - 3 * meters.length - (ageText.length + 4) - brandCols
    const barWidth = Math.min(40, Math.max(8, Math.floor(spare / meters.length)))
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
            {barRuns(m, barWidth).map(r => (
              <Text color={r.color}>{r.text}</Text>
            ))}
            <Text color={m.level} bold> {m.pctText ?? fmtPct(m.pct)}</Text>
            {m.detail ? <Text dimColor> {m.detail}</Text> : null}
            {m.reset ? <Text dimColor> ◷ {m.reset}</Text> : null}
          </Box>
        ))}
        <Text dimColor>⟳ {ageText}</Text>
      </Box>
    )
  })

  // Our row takes Limits' place in the band; Limits' row (still drawn, so its timers run) is left out.
  on('ui.render', { component: 'AbovePromptList' }, async ($, e, next) => {
    const swapped = swapLimitsRow(e.props.rows)
    return swapped ? next({ ...e, props: { ...e.props, rows: swapped } }) : next(e)
  })
}
