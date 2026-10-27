import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { gpuPlacement } from '../llama.ts';

describe('GPU placement at llama-server start', () => {
  const plan = { needMib: 10_000, ffn: [[5, 400], [3, 300], [1, 200]] as [number, number][] };

  it('keeps everything on the GPU when it fits with the margin', () => {
    assert.deepEqual(gpuPlacement(plan, 10_640, 640), { args: ['--fit', 'off', '-ngl', '99'], cpuBlocks: [], cpuMib: 0 });
  });

  it('moves just enough of the largest feed-forward weights to the CPU', () => {
    const placed = gpuPlacement(plan, 10_000, 640)!;
    assert.deepEqual(placed.cpuBlocks, [5, 3]);
    assert.equal(placed.cpuMib, 700);
    assert.deepEqual(placed.args.slice(0, 5), ['--fit', 'off', '-ngl', '99', '-ot']);
    const [pattern, buffer] = placed.args[5]!.split('=');
    assert.equal(buffer, 'CPU');
    const re = new RegExp(pattern!);
    assert.ok(re.test('blk.5.ffn_up.weight') && re.test('blk.3.ffn_gate.weight') && re.test('blk.3.ffn_down.weight'));
    assert.ok(!re.test('blk.53.ffn_up.weight') && !re.test('blk.1.ffn_up.weight') && !re.test('blk.5.attn_q.weight'));
  });

  it('leaves the placement to llama.cpp when even every feed-forward weight on the CPU would not fit', () => {
    assert.deepEqual(gpuPlacement(plan, 9_740, 640)?.cpuBlocks, [5, 3, 1]);
    assert.equal(gpuPlacement(plan, 9_739, 640), undefined);
  });
});
