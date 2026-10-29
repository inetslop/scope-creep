import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { archiveRoadmap } from '../planning.ts';

const roadmap = `# Roadmap

## Epics

### E1 — Rewards (done — closed 2026-10-29)
**Goal:** keep something.
- T0001 — done

This cycle (55) E1 closed.

### E2 — Tech tree (active)
**Goal:** spend coins.
- T0103 (L) — the screen

This cycle (55) E2 opened.

This cycle (56) nothing new in E2.

### Enemy queue (non-epic)

Queue order (cycle 49): Mute next.

Queue order (cycle 56): Ward next.

## Later

Ideas.
`;

describe('archiveRoadmap', () => {
  const { kept, archived } = archiveRoadmap(roadmap);
  it('moves a done epic out whole and leaves a one-line stub', () => {
    assert.match(kept, /^### E1 — Rewards \(done; history in planning\/archive\/ROADMAP\.md\)$/m);
    assert.doesNotMatch(kept, /keep something|E1 closed/);
    assert.match(archived, /### E1 — Rewards \(done — closed 2026-10-29\)\n\*\*Goal:\*\* keep something\./);
  });
  it('keeps only the newest cycle note of each kind in a section', () => {
    assert.match(kept, /This cycle \(56\) nothing new in E2\./);
    assert.match(kept, /Queue order \(cycle 56\): Ward next\./);
    assert.doesNotMatch(kept, /This cycle \(55\) E2 opened|cycle 49/);
    assert.match(archived, /### E2 — Tech tree \(active\) \(older notes\)\n\nThis cycle \(55\) E2 opened\./);
  });
  it('keeps the plan itself and is a no-op the second time', () => {
    assert.match(kept, /\*\*Goal:\*\* spend coins\.\n- T0103 \(L\) — the screen/);
    assert.match(kept, /## Later\n\nIdeas\.\n$/);
    assert.deepEqual(archiveRoadmap(kept), { kept, archived: '' });
  });
});
