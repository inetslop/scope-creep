import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseArchitectResult } from '../architect.ts';

const design = `DESIGN:
## Files
- create \`src/content/enemies/hex.ts\` - the enemy definition
- edit \`src/content/enemies/index.ts\` - register it
## Steps
1. Copy wedge.ts.
DEPENDS_ON: T0003, t0004
STATUS: READY`;

describe('parseArchitectResult', () => {
  it('extracts the design and dependencies from a READY answer', () => {
    const r = parseArchitectResult(`I read the code.\n\n${design}`);
    assert.equal(r.kind, 'ready');
    assert.match(r.design, /^## Files/);
    assert.doesNotMatch(r.design, /DEPENDS_ON|STATUS/);
    assert.deepEqual(r.dependsOn, ['T0003', 'T0004']);
  });

  it('accepts "none" as no dependencies', () => {
    const r = parseArchitectResult(design.replace('T0003, t0004', 'none'));
    assert.deepEqual(r.dependsOn, []);
  });

  it('reports rejections with their reason', () => {
    const r = parseArchitectResult('Looked around.\nSTATUS: REJECT: hexagon enemies already exist');
    assert.equal(r.kind, 'reject');
    assert.equal(r.reason, 'hexagon enemies already exist');
  });

  it('flags answers without a READY status or without a real design', () => {
    assert.equal(parseArchitectResult(design.replace('STATUS: READY', '')).kind, 'invalid');
    assert.equal(parseArchitectResult('DESIGN:\nok\nSTATUS: READY').kind, 'invalid');
  });
});
