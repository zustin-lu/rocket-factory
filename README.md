# Rocket Factory

A monotone rocket factory theme for Claude Code. The backdrop is a busy hangar:
each turn you run stacks one more ring on the booster and tool calls count as welds.
Once the eighth ring is on, each further turn moves the booster to its next stage:
cold proof test, engine install, static fire, then a catch test, after which a new
build starts.

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

The booster has a vented hot-staging ring, grid fins and section seams. A ship with
black hex tiles stands in a work cell, and the readout above the tower shows the
stage, the build and the weld count, with one pip per stage.

The bay behind the rocket stands open, and its sky follows your local clock: stars and
pad lights at night, a warm band at dawn and golden hour, gray daylight in between.
Every build looks a little different: the rings come out in slightly different tones,
inspectors leave chalk marks, and a few heat-shield tiles are still missing. The stand
keeps its wear until the next build: frost marks after the cold test, soot after the
static fire.

A tool call that fails is a rejected weld. After that turn a red lamp blinks at a seam,
a grinder throws sparks and the seam is welded again, and the readout counts the
rejects in red (`R2`).

Each stage runs only its own work, as in a real build. When the booster moves to the
next stage, the readout blinks and the tower beacon turns.

| Stage | What happens at the rocket |
| --- | --- |
| Stacking | The crane lifts the stack, a new ring rolls in underneath and its seam flares white, then a crawler inspects the seam. A boom lift, a tower lift and the crew work around the stand. |
| Cryo proof | The crew walks off the pad and drones inspect. The clamps close, the umbilical swings in, the oxygen tank frosts and then the methane tank, and both vent. |
| Engine install | The crew walks back in and a cart lifts engines into the aft. |
| Static fire | The readout counts down to ignition, the water deluge sprays, the engines fire with shock diamonds in the plume, and steam rolls across the floor. |
| Catch test | The umbilical pulls back, the clamps open, and the tower arms close under the grid fins and lift the booster. Then the ship is lowered onto it on cables: a full stack. |

Between turns the hall runs on a skeleton crew: beacons, one truck and the bridge
crane. Trucks, the nose-cone transporter, the floor cart, the test cell, the sparks
and the work light rolling across the hull run only while Claude works, which keeps
the backdrop light on a laptop. Stage changes and rejected welds play once and stop. Everything on
the floor is drawn back to front, so a truck on the far lane passes behind the rocket,
never across it. Behind the chat column the hall is dimmed, and no rail or floor line
runs across it, so the text stays easy to read. Calm mode, and the system's
reduced-motion setting, keep everything still.

### Your messages

In the desktop and mobile apps, each message you send is drawn as a steel plate with
a `▲ CMD` tag and a small rocket rail beside it, so your prompts stand out when you
scroll back through a long session. A message from another session or agent gets a
dimmer `◇ RELAY` tag with its sender's name. The terminal, and `/rocket-factory off`,
keep the app's own bubbles.

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
