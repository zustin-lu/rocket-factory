/** What the factory has built so far in this session. */
export type Factory = {
  /** Rings stacked on the booster, 0 to RINGS. */
  rings: number
  /** Which build this is; goes up after each static fire. */
  build: number
  /** Tool calls made while building this rocket. */
  welds: number
  /** True while Claude is working on a turn: the welders are on. */
  working: boolean
  /** What happened last, so a redraw plays the right one-shot animation. */
  last: 'idle' | 'start' | 'stack'
}

declare module 'claude-code' {
  interface PluginState {
    /** `brand`: the name on the plate and the band, `''` for none. */
    'rocket-factory': { factory: Shaped<Factory>; look: Look; brand: string }
  }
}

/** Which Rocket look is on: the limits band follows it, and `off` gives Limits back its own band. */
export type Look = 'on' | 'calm' | 'off'

// ---- Read-only: the state the Limits mod (limits@claude-mods) shares. ----
// Mirrors limits' own types/index.d.ts (0.2.6); rocket-factory only reads these, never writes them.

/** One usage window as Limits stored it. */
export type LimitsLimit = { kind: string; percentUsed: number; resetsAt?: string; checkedAt?: number }
/** Limits' current reading, and when (ms). */
export type LimitsSnapshot = { limits: LimitsLimit[]; at: number }
/** This session's context window, as Limits last saw it. */
export type LimitsContext = { tokens?: number; window: number; percent?: number }

declare module 'claude-code' {
  interface PluginState {
    'limits': {
      snapshot: LimitsSnapshot | null
      now: number
      alerted: Record<string, number>
      refreshing: boolean
      context: LimitsContext | null
    }
  }
}
