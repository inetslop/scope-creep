The automated checks failed after your change for {{TASK_ID}} ({{TASK_TITLE}}). This is fix round {{ROUND}}.

Failing stage: {{STAGE}}
- "check" = `npm run check` (typecheck, lint, unit tests)
- "smoke" = `npm run smoke` (the game built and played in a real browser on desktop and mobile)

Output:
```
{{OUTPUT}}
```

Find the root cause and fix it in the game code. Do not weaken or delete tests, lint rules or invariants. Re-run `npm run check` and `npm run smoke` until both pass. Then end with:

DELETE: <path of a file to delete, if a file must go: one line per file; you can't delete files yourself>
SUMMARY: <what you changed overall, including this fix>
STATUS: DONE
