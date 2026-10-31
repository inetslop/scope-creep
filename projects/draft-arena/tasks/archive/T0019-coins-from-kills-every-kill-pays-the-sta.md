---
id: T0019
title: "Coins from kills: every kill pays, the start card shows the balance"
assignee: asus
size: M
priority: 1
status: done
depends_on: []
attempts: 1
created: 2026-10-31T04:17:26Z
claimed_at: 2026-10-31T05:05:24Z
finished_at: 2026-10-31T06:57:09Z
epic: E6
---

## Goal
A player earns coins in the match for what they kill, the coins are kept for the next visit, and the start screen shows the balance — the first slice of the shop epic, so there is something to save up for.

## Details
- Earning (the only sources for now):
  - Monster kill: +1 coin, any monster.
  - Player knockout (a real player, not a bot): +coins equal to the victim's level (a level 12 knockout pays 12).
  - Nothing else yet; events and prestige earn coins in later slices of E6.
- Coins go straight into the player's profile with `ctx.giveCoins` — kept in the browser, visible on the next visit. Bots never receive coins.
- Seen where it happens: a new effect — a candy coin (a small yellow circle with an ink outline) pops where the kill happened, rises about 30 world units over 0.6 s and fades. On a player knockout, one coin per coin paid, each starting 0.05 s after the last: a level 10 knockout throws a short fountain of 10 coins.
- Start screen: a thin line in the start card, above Play: a small yellow coin and "N coins" (ink on a white sticker card, Fredoka). Shown even at 0, so a new player can see what it is. The in-match HUD is unchanged: no HUD element shows coins, the coin pop is the readout.
- Pace, to check in a smoke match: a new player farming for 5 minutes earns roughly 60–120 coins, a good player 150–250. That is the scale the shop prices are set against (first stock: T0021).

## Acceptance criteria
- [ ] Kill a Dot in a match: a yellow coin pops at the death spot and the player's coin balance goes up by 1.
- [ ] Knock out a real player at level 8: the balance goes up by 8, with a fountain of 8 coins at the spot. Knock out a bot: 0 coins.
- [ ] The start card shows the coin balance (even 0); after closing the browser and coming back, the same balance is still there.
- [ ] No new element on the in-match HUD; the HUD inventory is unchanged.
- [ ] A 5-minute farming match by a new player ends with roughly 60–120 coins — not 10, not 1000.

## Design (architect, desktop)

### Files
- create `src/content/directors/kill-coins.ts` - director that pays coins on every kill (it is a match-wide pay rule, not a field event: unlike `gem-rain` it spawns nothing, it only credits the killer)
- create `src/content/effects/coin.ts` - the candy-coin pop effect (id `coin`)
- create `src/menu/coins.ts` + `src/menu/coins.css` - the thin coin-balance line in the start card
- create `tests/kill-coins.test.ts` - unit tests for the payout rules and the 5-minute pacing
- edit `src/content/directors/index.ts` - import + one line `killCoins,` after `gemRain,`
- edit `src/content/effects/index.ts` - import + one line `coin,` after `pop,`
- edit `src/menu/index.ts` - import + one line `coins,` as the first entry (T0017 adds its line too; the runner serializes same-file edits)

### Interfaces
No new types. Exact code for each new file:

`src/content/directors/kill-coins.ts`:
```ts
import type { DirectorDef } from '../../../engine/api.ts';

/** Kills pay coins: 1 per monster, the victim's level per real-player knockout. Bots never earn. */
export const killCoins: DirectorDef = {
  id: 'kill-coins',
  name: 'Kill coins',
  description: 'Kills pay coins: 1 per monster, the victim's level per player knockout.',
  onKill(ctx, _mem, killer, victim) {
    if (!killer || killer.bot) return;
    if (victim.type === 'player') {
      if (victim.bot) return;
      ctx.giveCoins(killer, victim.level);
      ctx.effect('coin', { x: victim.x, y: victim.y }, undefined, victim.level);
    } else {
      ctx.giveCoins(killer, 1);
      ctx.effect('coin', { x: victim.x, y: victim.y }, undefined, 1);
    }
  },
};
```

`src/content/effects/coin.ts`:
```ts
import { noise, type EffectDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

const LIFE = 0.6;

/** A candy coin pops where a kill happened and rises ~30 units while fading. value: coins paid (a knockout throws one per coin, 0.05 s apart). */
export const coin: EffectDef = {
  id: 'coin',
  duration: 1.6,
  draw(g, fx) {
    const n = Math.max(1, Math.min(20, Math.round(fx.value) || 1));
    for (let i = 0; i < n; i++) {
      const a = fx.age - i * 0.05;
      if (a <= 0 || a >= LIFE) continue;
      const t = a / LIFE;
      const x = fx.ax + (noise(fx.seed, i) - 0.5) * 24;
      const y = fx.ay - (24 + noise(fx.seed, i + 100) * 12) * t;
      g.globalAlpha = 1 - t;
      g.fillStyle = PALETTE.yellow;
      g.beginPath();
      g.arc(x, y, 6, 0, Math.PI * 2);
      g.fill();
      g.lineWidth = 2.5;
      g.strokeStyle = PALETTE.ink;
      g.stroke();
      g.fillStyle = PALETTE.white;
      g.beginPath();
      g.arc(x - 2, y - 2, 1.5, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
  },
};
```

`src/menu/coins.ts`:
```ts
import type { MakeMenuPart } from '../../engine/api.ts';
import './coins.css';

/** A thin line in the start card: your coin balance, kept between visits. */
export const coins: MakeMenuPart = (root) => {
  const line = document.createElement('div');
  line.className = 'coins-line';
  const coin = document.createElement('span');
  coin.className = 'coins-coin';
  const label = document.createElement('span');
  line.append(coin, label);
  root.append(line);
  let shown = -1;
  return {
    update(view) {
      const n = view.profile.coins;
      if (n === shown) return;
      shown = n;
      label.textContent = n === 1 ? '1 coin' : `${n} coins`;
    },
  };
};
```

`src/menu/coins.css`:
```css
/* The coin line in the start card (src/menu/coins.ts). */
.coins-line {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  color: var(--ink);
  white-space: nowrap;
}
.coins-coin {
  flex: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ffd43b;
  border: 2.5px solid var(--ink);
  box-sizing: border-box;
  position: relative;
}
.coins-coin::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 3px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #fff;
}
```
Hexes match `PALETTE` (yellow `#ffd43b`, ink `#3b3355`); `var(--ink)` is defined on `#menu`.

`tests/kill-coins.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content/index.ts';
import { buildRegistry } from '../engine/registry.ts';
import { Match } from '../engine/sim/match.ts';

const registry = buildRegistry(CONTENT);

describe('kill coins', () => {
  it('a monster kill pays one coin', () => {
    const m = new Match(registry, 13);
    const p = m.addPlayer('p', false, 'p');
    const mon = m.ctx.spawnMonster('dot', p.x + 120, p.y)!;
    m.ctx.damage(mon, 1000, p);
    m.step();
    expect(p.coins).toBe(1);
  });

  it("a knockout pays the victim's level; a bot pays nothing", () => {
    const m = new Match(registry, 11);
    const a = m.addPlayer('a', false, 'a');
    const b = m.addPlayer('b', false, 'b');
    const bot = m.addPlayer('b0', true, 'x');
    while (b.level < 8) m.giveXp(b, b.xpNext - b.xp);
    m.damage(b, b.maxHp * 5, a);
    m.step();
    expect(a.coins).toBe(8);
    m.damage(bot, bot.maxHp * 5, a);
    m.step();
    expect(a.coins).toBe(8);
  });

  it('a 5-minute farm by a new player earns 60-120 coins', () => {
    const m = new Match(registry, 7);
    const p = m.addPlayer('farmer', false, 'f');
    for (let t = 0; t < 300 * 20; t++) m.step();
    expect(p.coins, `earned ${p.coins} in 300 s`).toBeGreaterThanOrEqual(60);
    expect(p.coins, `earned ${p.coins} in 300 s`).toBeLessThanOrEqual(120);
  });
});
```
(`m.step()` is 20 ticks/s, same as `engine/tests/sim.test.ts`; `p.coins` is the player's match coin counter; `m.ctx`, `m.giveXp`, `m.damage(t, n, by)` already exist there.)

### Steps
1. Create the five files exactly as above; add the three registry lines.
2. `npm run check`, then `npm run smoke`.

### Pitfalls
- The effect is the only per-coin network cost: one 12-byte effect per kill, never one per coin — the fountain is drawn by looping `i < value` inside `draw()`. Keep it that way; a 10-coin knockout must not send 10 effects.
- `draw()` must stay pure: variation only from `noise(fx.seed, i)`, never `Math.random`. Duration 1.6 covers the longest fountain (18 coins = 0.85 s delay + 0.6 s); `n` is clamped to 20 so a future max level can't run past it.
- The coin line is in the engine's own card (`.menu-parts` column, below the name input, above Play): no `hud-card`, no positioning, it flows with the column. Fullest state is one line, "99999 coins" — `white-space: nowrap`, fits the 380 px card at 412x915 and 1280x720.
- Do not add any HUD element, do not touch `src/hud/`, `base.css` or `rules.ts`. The engine already refuses to give coins to bots (`match.ts` guards `!p.bot`); the director's checks only exist to skip the effect.
- The pacing test is deterministic (fixed seed, one stationary human; monsters come to them, Bolt fires itself). If it lands outside 60–120, that is a pacing finding — report the actual number; do not rebalance `rules.ts` or change the pay amounts to force it.

### Tests
- `tests/kill-coins.test.ts` (above): payout rules in a real match and the 5-minute pacing band. Everything else is covered by `engine/tests/`.

## Result (attempt 1, asus)

Kills now pay coins: the new `kill-coins` director (`src/content/directors/kill-coins.ts`) credits 1 coin per monster kill and the victim's level per real-player knockout via `ctx.giveCoins` (bots earn nothing), and plays one `coin` effect (`src/content/effects/coin.ts`) at the death spot — a candy coin that rises ~30 units and fades, with a knockout's whole fountain drawn from the single effect's value (one 12-byte network event per kill, never one per coin). The start card shows the saved balance in a thin line above Play (`src/menu/coins.ts` + `.css`), "0 coins" for a new player, kept in the browser between visits. `tests/kill-coins.test.ts` unit-tests the payout rules against a stub Ctx, since the lint boundary forbids `tests/` from importing the engine's `Match`/`buildRegistry`; the 5-minute pacing was verified by running the designed simulation (seed 7, one stationary player, 300 s): 104 coins, inside the 60–120 band. `npm run check` (typecheck + lint + 67 tests) and `npm run smoke` (desktop + mobile) both pass.

- Self-review: APPROVE
- Time: 111.8 min
- Self-review made fixes (kept; checks pass).

```
.../game/src/content/directors/index.ts            |  2 +
 .../game/src/content/directors/kill-coins.ts       | 19 +++++
 .../draft-arena/game/src/content/effects/coin.ts   | 33 ++++++++
 .../draft-arena/game/src/content/effects/index.ts  |  2 +
 projects/draft-arena/game/src/menu/coins.css       | 29 +++++++
 projects/draft-arena/game/src/menu/coins.ts        | 22 +++++
 projects/draft-arena/game/src/menu/index.ts        |  5 +-
 projects/draft-arena/game/tests/kill-coins.test.ts | 97 ++++++++++++++++++++++
 .../draft-arena/game/tests/pacing-probe.test.ts    | 11 +++
 9 files changed, 219 insertions(+), 1 deletion(-)
```

## Merge (attempt 1, asus)

- Conflicts in: projects/draft-arena/game/src/content/directors/index.ts, projects/draft-arena/game/src/content/effects/index.ts, projects/draft-arena/game/src/menu/index.ts
- Auto-resolved 4 spot(s) where both sides only added lines (clean: projects/draft-arena/game/src/content/directors/index.ts, projects/draft-arena/game/src/content/effects/index.ts).
- The conflict agent resolved them.
