import type { On } from 'claude-code'

// The person's messages drawn as steel plates, like the brand plate on the usage band:
// a rounded steel frame, a "▲ CMD" plate on top and a ringed rail beside it, so a
// prompt is easy to find while scrolling. A message from another session or agent
// gets a dimmer plate ("◇ RELAY") and no rail. Everything else keeps the app's row.

const LOOK = { plugin: 'rocket-factory', key: 'look' } as const

/** Steel frame and plate outline: the band's unpainted steel. */
const STEEL = '#3a3b3e'
/** The plate's fill: one step above the hangar floor. */
const PLATE = '#151617'
/** Plate lettering and the rail's nose: the band's bright gantry marker. */
const TICK = '#d9dadc'
/** The rail's ring segments. */
const RING = '#8c8e92'
/** A relay's dimmer frame and lettering. */
const RELAY_EDGE = '#2a2b2e'
const RELAY_TEXT = '#77797d'

const FONT = 11
const CH = FONT * 0.62
const PLATE_H = 17

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Plate lettering, cut to fit; a sender's name may be long. */
const plateLabel = (text: string, max = 40) => {
  const chars = Array.from(text.toUpperCase())
  return chars.length > max ? `${chars.slice(0, max - 1).join('')}…` : chars.join('')
}

/** A label stenciled on a thin outlined plate, drawn as the band draws its brand plate. */
export const plateSvg = (label: string, edge: string, ink: string) => {
  const text = plateLabel(label)
  const w = Math.ceil(Array.from(text).length * CH + 14)
  return {
    source:
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${PLATE_H}" viewBox="0 0 ${w} ${PLATE_H}">` +
      `<rect x=".75" y=".75" width="${w - 1.5}" height="${PLATE_H - 1.5}" rx="3" fill="none" stroke="${edge}" stroke-width="1.5"/>` +
      `<text x="7" y="12" fill="${ink}" font-size="${FONT}" font-weight="600" letter-spacing=".6" ` +
      `font-family="ui-monospace,SFMono-Regular,Menlo,monospace" textLength="${(w - 14).toFixed(1)}" lengthAdjust="spacingAndGlyphs">${esc(text)}</text></svg>`,
    width: w,
    height: PLATE_H,
  }
}

/** The rail beside a prompt: a nose cone on four stacked rings, like the rocket on the stand. */
export const railSvg = () => {
  const rings = [0, 1, 2, 3].map(i => `<rect x="3.5" y="${12 + i * 9}" width="3" height="7" rx="1" fill="${RING}"/>`).join('')
  return {
    source:
      `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="48" viewBox="0 0 10 48">` +
      `<path d="M5 0L9.5 9H.5Z" fill="${TICK}"/>${rings}</svg>`,
    width: 10,
    height: 48,
  }
}

export const registerBubble = (on: On) => {
  on('ui.render', { component: 'UserMessage' }, async ($, e, next) => {
    if (e.surface !== 'desktop' && e.surface !== 'mobile') return next(e)
    // a compact row (a long message under a speaker label) keeps the app's own drawing
    if (!e.props.isExpanded) return next(e)
    const { value: look = 'on' } = await $.state.get(LOOK)
    if (look === 'off') return next(e)

    const kind = e.props.origin.kind
    const from = e.props.from
    // typed by the person: at the terminal, through the desktop app (an SDK host) or a phone
    const isOwn = from === undefined && (kind === 'composer' || kind === 'bridge' || kind === 'sdk' || kind === 'unclassified')
    if (!isOwn && from === undefined) return next(e) // task notifications and the like

    const { Box, Svg, Markdown } = $.ui.resolve(e)
    const plate = isOwn ? plateSvg('▲ CMD', STEEL, TICK) : plateSvg(`◇ RELAY · ${from?.name ?? ''}`, RELAY_EDGE, RELAY_TEXT)
    const rail = railSvg()

    return (
      <Box flexDirection="row" justifyContent="flex-end" alignItems="flex-start" columnGap={1} paddingLeft={6}>
        <Box
          flexDirection="column"
          flexShrink={1}
          rowGap={1}
          borderStyle="round"
          borderColor={isOwn ? STEEL : RELAY_EDGE}
          backgroundColor={PLATE}
          paddingX={1}
          paddingY={1}
        >
          <Svg source={plate.source} width={plate.width} height={plate.height} alt={isOwn ? 'Your message' : `Relayed from ${from?.name ?? 'another session'}`} />
          <Markdown text={e.props.text} dimColor={!isOwn} />
        </Box>
        {isOwn ? <Svg source={rail.source} width={rail.width} height={rail.height} alt="" /> : <Box width={1} />}
      </Box>
    )
  })
}
