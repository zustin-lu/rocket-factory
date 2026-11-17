// Rocket Factory is opinionated: the theme ships with its Rocket skin for the Limits
// band, and it does not turn on without the Limits mod (limits@claude-mods).
// The check reads `enabledPlugins` from the merged settings, the same list the
// engine loads plugins from.
import type { EngineInterface } from 'claude-code'

export const LIMITS_ID = 'limits@claude-mods'
const LIMITS_MARKETPLACE = 'Ryan-LT/claude-mods'

export type LimitsStatus = 'enabled' | 'disabled' | 'missing'

/** Where Limits stands in an `enabledPlugins` map: on, listed but off, or not there. */
export const limitsStatus = (enabledPlugins: unknown): LimitsStatus => {
  if (enabledPlugins === null || typeof enabledPlugins !== 'object') return 'missing'
  const entries = Object.entries(enabledPlugins as Record<string, unknown>).filter(
    ([id]) => id === 'limits' || id.startsWith('limits@'),
  )
  if (entries.length === 0) return 'missing'

  return entries.some(([, on]) => on === true) ? 'enabled' : 'disabled'
}

/** Reads the merged settings. A failed read lets the theme on rather than blocking it. */
export async function checkLimits($: EngineInterface): Promise<LimitsStatus> {
  try {
    return limitsStatus(await $.settings.read({ key: 'enabledPlugins' }))
  } catch {
    return 'enabled'
  }
}

/** One line for a toast or the status line. */
export const shortNotice = (status: Exclude<LimitsStatus, 'enabled'>): string =>
  status === 'disabled'
    ? `Rocket Factory needs the Limits mod, which is turned off. Run /plugin enable ${LIMITS_ID}.`
    : `Rocket Factory needs the Limits mod. Run /plugin install ${LIMITS_ID}.`

/** The full steps, answered by /rocket-factory. */
export const installSteps = (status: Exclude<LimitsStatus, 'enabled'>): string =>
  status === 'disabled'
    ? [
        'Rocket Factory stays off: the Limits mod is installed but turned off.',
        'Rocket Factory is built around it, so it needs Limits on.',
        '',
        `1. /plugin enable ${LIMITS_ID}`,
        '2. /reload-plugins',
        '3. /rocket-factory',
      ].join('\n')
    : [
        'Rocket Factory stays off: the Limits mod is not installed.',
        'Rocket Factory is built around it: it shows your 5-hour and weekly usage in the Rocket look.',
        '',
        `1. /plugin marketplace add ${LIMITS_MARKETPLACE}  (skip if claude-mods is already added)`,
        `2. /plugin install ${LIMITS_ID}`,
        '3. /reload-plugins',
        '4. /rocket-factory',
      ].join('\n')
