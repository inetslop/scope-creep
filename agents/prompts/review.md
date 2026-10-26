You are reviewing a change to "Scope Creep" (abstract Bauhaus-style twin-stick roguelite, Phaser 3 + TypeScript). Another session on this machine implemented it and the automated checks already pass. You are the fresh pair of eyes. You run unattended.

# Task {{TASK_ID}} - {{TASK_TITLE}}

{{TASK_BODY}}

# The change

```diff
{{DIFF}}
```

# Checklist
1. Does it meet every acceptance criterion?
2. Bugs: wrong logic, listeners or timers not removed on scene shutdown, pooled objects never despawned, NaN/undefined risks, movement not scaled by dt.
3. Does it work on desktop (mouse + keyboard) and on a phone (touch, 412x915 portrait)? Does UI fit both?
4. Does it follow CLAUDE.md: the flat Bauhaus art style (ink outlines, no glow), content as data, no Phaser imports in src/core or src/content, palette colors, scene keys from SCENES?
5. Is there anything in the diff unrelated to the task?

If you find real problems, FIX them in the code with small, targeted edits, then run `npm run check` and `npm run smoke`. Do not rewrite working code for style.

End with exactly one of these lines:
VERDICT: APPROVE
VERDICT: REJECT: <the remaining problem you could not fix>
