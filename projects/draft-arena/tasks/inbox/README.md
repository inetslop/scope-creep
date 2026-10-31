# Task inbox

Drop a task here as a Markdown file, without an id. The PO machine's runner numbers it on its
next loop (within minutes): it gets the next free id, moves into the pool as
`tasks/<id>-<slug>.md` with status `design`, and this file is removed. Only the PO machine hands
out ids, for these and for its own planning cycles, so ids never clash.

Everything but the body is optional:

```
---
title: Remove the kill count from the scoreboard   (else the first "# " heading, else the file name)
size: S                                     (S, M or L; default M)
priority: 1                                 (1 most urgent to 3; default 2)
depends_on: [T0103]                         (ids of existing tasks; unknown ones are dropped)
epic: E2
---

## Goal
What the player gets, and why.

## Details
- Exact values, where things go.

## Acceptance criteria
- [ ] Something you can check.
```

Fields the runner owns (id, status, assignee, ...) are ignored. A file that can't be read (for
example `size: XL`) stays here, and the runner logs why. This README is never imported.
