You are reviewing a change to "Chokepoint" (abstract roguelite tower defence, Phaser 3 + TypeScript). Another session on this machine implemented it and the automated checks already pass. You are the fresh pair of eyes. You run unattended.

# Task {{TASK_ID}} - {{TASK_TITLE}}

{{TASK_BODY}}

# The change

```diff
{{DIFF}}
```

# Checklist
1. Does it meet every acceptance criterion, and follow the "## Design" section (files, names, signatures)?
2. Bugs: wrong logic, listeners or timers not removed on scene shutdown, pooled objects never despawned, NaN/undefined risks, movement or timers not scaled by dt, screen pixels used on the board (board units are CELL-based).
3. Does it work on desktop (mouse + keyboard) and on a phone (touch, 412x915 portrait)? Does UI fit both?
4. Does it follow CLAUDE.md: the bright minimal style (rounded tokens painted in art/textures.ts and shown with artScale(), white cards for UI, no outlines, glow, gradients or themed art), content as data, no Phaser imports in src/core or src/content, PALETTE colors, scene keys from SCENES?
5. Does it keep one concern per file: new logic in its own file and registered with one line (content, ATTACKS, the HUD parts list, HOTKEYS, INVARIANTS, DECORATIONS, MARKS, PAINTERS), GameScene and HudScene not grown?
6. Is there anything in the diff unrelated to the task?

If you find real problems, FIX them in the code with small, targeted edits, then run `npm run check` and `npm run smoke`. Do not rewrite working code for style.

End with exactly one of these lines:
VERDICT: APPROVE
VERDICT: REJECT: <the remaining problem you could not fix>
