You are reviewing a change to "Draft Arena" (multiplayer .io arena, TypeScript + Canvas 2D, a frozen engine in engine/ and the game in src/). Another session on this machine implemented it and the automated checks already pass. You are the fresh pair of eyes. You run unattended.

# Task {{TASK_ID}} - {{TASK_TITLE}}

{{TASK_BODY}}

# The change

```diff
{{DIFF}}
```

# Checklist
1. Does it meet every acceptance criterion, and follow the "## Design" section (files, names, signatures)?
2. Bugs: wrong logic, NaN/undefined risks, movement or timers not scaled by dt, `Math.random` instead of `ctx.rng`, a `path()` that reads anything but its arguments, state kept in module-level variables instead of `mem`/`slots`.
3. Bandwidth: a weapon firing many `step()` projectiles (they are sent every tick) where a `path()` would do.
4. Does it work on desktop (mouse + keyboard) and on a phone (touch, 412x915 portrait)? Does HUD text fit both?
5. Does it follow CLAUDE.md: nothing under engine/ (it is reverted anyway), only engine/api.ts imported from the engine, colors from PALETTE, the Critters style (creatures drawn by drawCritter() with a face, candy shots, confetti effects, no glow or gradients, sticker-card HUD)?
6. Is it laid out for parallel work: each content item in its own file named after its id, registered with one line next to its kind; a HUD element in its own .ts and .css (base.css and other elements' css untouched); a new upgrade's talent line in its tree's file; shared files (rules.ts, palette.ts) changed only where the task needs?
7. Does the text the player reads (an upgrade's description, a HUD line) say what it really does, with the numbers the code uses?
8. Is there anything in the diff unrelated to the task, or a weakened check (a lint rule, a test, the vitest include list)?

If you find real problems, FIX them in the code with small, targeted edits, then run `npm run check` and `npm run smoke`. Do not rewrite working code for style.

End with exactly one of these lines:
VERDICT: APPROVE
VERDICT: REJECT: <the remaining problem you could not fix>
