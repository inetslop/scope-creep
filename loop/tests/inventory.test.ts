import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { buildInventory, changelogLine, namesIn } from '../inventory.ts';
import { parseTask } from '../tasks.ts';

describe('namesIn', () => {
  it('finds names and the descriptions that follow them', () => {
    const src = `[{ id: 'a', name: 'Rhythm', description: '+20% fire rate', x: 1 }, { id: "b", name: "Mass" }]`;
    assert.deepEqual(namesIn(src), [{ name: 'Rhythm', description: '+20% fire rate' }, { name: 'Mass', description: undefined }]);
  });
});

describe('buildInventory', () => {
  it('summarizes content, scenes, systems and other code without reading logic', () => {
    const game = fs.mkdtempSync(path.join(os.tmpdir(), 'inv-'));
    const write = (rel: string, text: string): void => {
      fs.mkdirSync(path.dirname(path.join(game, rel)), { recursive: true });
      fs.writeFileSync(path.join(game, rel), text);
    };
    write('src/content/enemies/wedge.ts', `export const wedge = { id: 'wedge', name: 'Wedge', hp: 1, behavior: 'chase' };`);
    write('src/content/enemies/sentry.ts', `export const sentry = { id: 'sentry', name: 'Sentry', behavior: 'shoot' };`);
    write('src/content/enemies/index.ts', `export const ENEMIES = [wedge];`);
    write('src/content/upgrades/index.ts', `[{ id: 'r', name: 'Rhythm', description: '+20% fire rate' }]`);
    write('src/scenes/GameScene.ts', '');
    write('src/scenes/keys.ts', '');
    write('src/systems/FxSystem.ts', '');
    write('src/audio/Sfx.ts', '');
    const inv = buildInventory(game);
    assert.match(inv, /\*\*Enemies\*\* \(2\): Sentry \(shoot\), Wedge \(chase\)/);
    assert.match(inv, /\*\*Upgrades\*\* \(1\): Rhythm \(\+20% fire rate\)/);
    assert.match(inv, /\*\*Scenes\*\*: Game$/m);
    assert.match(inv, /\*\*Systems\*\*: Fx/);
    assert.match(inv, /audio\/ \(Sfx\)/);
    fs.rmSync(game, { recursive: true, force: true });
  });
});

describe('changelogLine', () => {
  it("uses the dev's summary from the Result section", () => {
    const t = parseTask(
      `---\nid: T0003\ntitle: Procedural sound effects\nfinished_at: 2026-10-27T10:00:00Z\n---\n\n## Goal\nx\n\n## Result (attempt 1, desktop)\n\nAdded src/audio/Sfx.ts with six synthesized sounds. Wired it into the systems.\n\n- Self-review: APPROVE\n`,
      path.join('tasks', 'desktop', 'T0003-x.md'),
    );
    assert.equal(changelogLine(t), '- T0003 Procedural sound effects (desktop, 2026-10-27): Added src/audio/Sfx.ts with six synthesized sounds.');
  });
});
