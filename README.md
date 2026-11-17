# Rocket Factory

A monotone rocket factory theme for Claude Code. The backdrop is a busy hangar:
each turn you run stacks one more ring on the booster, tool calls count as welds,
and when the eighth ring is on, the rocket static-fires and a new build starts.

It also reskins the [Limits](https://github.com/Ryan-LT/claude-mods/tree/main/limits)
usage band (5-hour, weekly and context-window meters) in the same graphite-and-steel look.

## Requirements

Rocket Factory is built around the **Limits** mod (`limits@claude-mods`) and will not
turn on without it. If Limits is missing or disabled, the theme stays off and tells
you what to run.

## Install

1. Install Limits first. At the prompt of a Claude Code terminal session:

   ```
   /plugin install limits --marketplace Ryan-LT/claude-mods
   ```

2. Install Rocket Factory:

   ```
   /plugin install rocket-factory --marketplace zustin-lu/rocket-factory
   ```

   Answer `y` to add the marketplace, then pick a scope (user is the default).

From a shell instead:

```sh
claude plugin install limits --marketplace Ryan-LT/claude-mods
claude plugin install rocket-factory --marketplace zustin-lu/rocket-factory
```

In the desktop app, where `/plugin` does not run: click **+** next to the prompt box,
then **Plugins**, **Add marketplace** with `Ryan-LT/claude-mods`, then **Add plugin**
and pick `limits`. Repeat with `zustin-lu/rocket-factory` and pick `rocket-factory`.

## Use

The theme turns on when a session starts.

| Command | What it does |
| --- | --- |
| `/rocket-factory` or `/rocket-factory on` | Theme on, with motion |
| `/rocket-factory calm` | Theme on, no motion |
| `/rocket-factory off` | Theme off; Limits shows its own band again |
| `/rocket-factory brand <name>` | Shows a brand name on a plate above the rocket and at the start of the usage band (up to 16 characters) |
| `/rocket-factory brand` | Removes the brand name |

The animated backdrop draws in the desktop and mobile apps. The colors are dark-mode only.

While Claude works, frost climbs the stacked rings and the top vents, as in propellant
loading. Each new ring's weld seam flares white and cools as it lands, and the static
fire after the eighth ring rolls steam across the floor. Calm mode, and the system's
reduced-motion setting, keep everything still.

### Reading the usage band

```
[CYBERSKILL]  5HR ▰▰▰▱▱▱▱▱ 24% T-2h    WK ▰▰▰▰▰▱▱▱ 61% ● T-3d    CTX 42%   •
```

- **5HR / WK**: share of the window used. The bright tick on the bar marks how far
  into the window you are, and breathes like a tower beacon; `T-2h` counts down to
  the reset, and blinks in the last hour. When a bar fills into its next segment, that
  seam flares white as if welded on.
- **Colors**: green under 60%, amber from 60%, red from 85% or when your pace would
  run out before the reset. A red meter also vents small vapor puffs, like a tank
  before launch.
- **Tanking**: a frost line marks each bar's fill level. While Claude works, propellant
  flows along the bars and the frost line flickers.
- **CTX**: the context window, as a colored percent. Hover it for the token count.
- **Telemetry dot**: a heartbeat while the reading is fresh, dim after 10 minutes,
  pulsing while it refreshes.
- **Brand plate**: a light glint crosses it every half minute or so.

Calm mode keeps the band still.

### Brand name

If you run Claude Code with more than one config folder (for example a work one and
a personal one), give each its own brand to tell them apart at a glance. The name is
saved in that config folder, so each one keeps its own name between sessions. In
the terminal, the brand shows at the start of the usage band.

## Update

```
/plugin marketplace update rocket-factory
```

## License

MIT
