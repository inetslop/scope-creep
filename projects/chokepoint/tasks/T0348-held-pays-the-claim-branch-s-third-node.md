---
id: T0348
title: "Held pays: the claim branch's third node"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-01T08:42:47Z
---

## Goal
The tech tree's claim branch gets its third node, **Held pays**: waves that lost lives pay coins — one coin per life lost — so a run that held on is paid for the waves it held, not only the ones it cleaned. A third sink for the coins E9's multipliers pour in, and the payout lands where E12's held-wave marks already live: the run's story.

## Details
- **The node.** The claim branch in the Tech scene grows a third card under "Clean ×2" and "Flawless": name **Held pays**, price **155 coins** (depth 3 on the branch's re-priced curve, T0288 — Clean ×2 is 30 at depth 1, Flawless 85 at depth 2; confirm the exact rounding against the depth function in `core/tech.ts`). Gated on Flawless, as the siblings gate in branch order. One dry line of card text: "a wave that leaks pays 1 coin per life it lost." Owned mark like the siblings.
- **The rule.** When a wave ends having lost one or more lives, the run earns +1 coin per life lost that wave, paid at the wave's end — the same moment the ledger closes the wave's per-wave record (T0333). Whatever the ledger recorded as that wave's leaks pays, including the death wave, which closes at the run's end like any other wave.
- **The coin formula.** The term joins `coinsForRun` inside the multiplied sum (where Flawless's +10 lives, T0313), so the stats card's live coin tally, the pause's worth line (T0087) and the claim card's recipe line (T0075) all pick it up, and the level-augment multiplier and Iron's 2× apply to it like every other coin. The recipe's multiplier line is unchanged.
- **The recipe line.** The claim card reads "waves +N · stopped +N · clean +N · held +N" — the held term shows only when it pays more than 0, so a clean run's line and a no-node run's line stay byte-identical.
- **The moment.** When the term pays, one small muted "+N" coin pop rises at the exit gate (the Toll blip's look, T0255) and the coin chime's low note plays once (T0009's shape, volume 0.08) — one pop and one note per held wave: a wave that leaked 3 lives pays one "+3" pop, not three. Silent with sound off.
- **Without the node, nothing changes:** no term, no pop, no sound, the recipe line and the worth line byte-identical.
- The node's content rides the claim branch's own pattern (its node files sit in `src/content/tech/`, per T0211), so the Tech scene reads it with no new scene code.

## Acceptance criteria
- [ ] The Tech scene's claim branch shows a third card, **Held pays**, at 155 coins (the re-priced depth-3 price) with the one-line text; it is gated on Flawless, and buying it spends the coins and wears the owned mark.
- [ ] With the node owned, a wave ends having lost 1 life: the coin tally on the stats card rises by 1 at the wave's end, with the muted "+1" coin pop at the exit gate and one low coin-chime note; a wave that lost 3 lives pays one "+3" pop, not three.
- [ ] The claim card's recipe line shows "· held +N" exactly when a held wave paid, and the term sums into the coins shown under the level multiplier and Iron's 2×; a run with no leaks, or without the node, shows the old line.
- [ ] The pause's worth line includes the held coins mid-run (the same formula the claim card uses).
- [ ] A run that ends on a wave that lost 2 lives shows "held +2" on the claim card (node owned) — the death wave pays like any other wave.
- [ ] A run without the node is unchanged: no term, no pop, no sound, recipe line and worth line byte-identical.
- [ ] Unit tests on the coin formula: the held term at 0, 1 and multiple lives lost in one wave; its interplay with the level multiplier and Iron's 2×; the death wave's held coins.

## Design (architect, desktop)

### Files
- edit `src/content/tech/claim.ts` — add `heldPerLife` to `ClaimNode`, the `held-pays` node, and a `heldPay(owned)` helper.
- edit `src/core/profile.ts` — `RunResult.held?: number`; `coinsForRun` gains a `heldPay` param + `held` term; `recordRun` passes `heldPay(old.purchased)`.
- edit `src/core/run.ts` — add `get heldLives()`.
- edit `src/ui/hud/StatsCard.ts` — import `heldPay`, keep `this.heldPay`, pass `held`+`heldPay` in the tally call.
- edit `src/scenes/PauseScene.ts` — import `heldPay`, pass `held`+`heldPay` in the worth call.
- edit `src/scenes/RewardsScene.ts` — import `heldPay`, pass `held`+`heldPay` in the coins call, add the `held +N` recipe term.
- edit `src/scenes/GameOverScene.ts` — pass `held: run.heldLives` in the `recordRun` call (line 30).
- edit `src/systems/RunFlow.ts` — import `heldPay`, add `heldMoment()`, call it in `clearWave` and the `run.over` branch.
- edit `tests/core/tech.test.ts`, `tests/core/profile.test.ts`, `tests/core/run.test.ts` — see Tests.

### Interfaces
`src/content/tech/claim.ts`:
```ts
export interface ClaimNode { id: string; name: string; line: string; price: number; pay: number; flawless: number; heldPerLife: number; requires: string | null; }
// in CLAIM_NODES, after the flawless entry:
{ id: 'held-pays', name: 'Held pays', line: 'a wave that leaks pays 1 coin per life it lost', price: 30, pay: 0, flawless: 0, heldPerLife: 1, requires: 'flawless' }
// existing two nodes gain heldPerLife: 0. New helper, modeled on flawlessPay:
export function heldPay(owned: readonly string[]): number { let pay = 0; for (const node of CLAIM_NODES) if (owned.includes(node.id)) pay += node.heldPerLife; return pay; }
```
`src/core/profile.ts`: add `held?: number;` to `RunResult` (doc: "lives the run lost, the ledger's leaks summed, the death wave included"). Change the signature and body:
```ts
export function coinsForRun(result: RunResult, cleanPay = 1, mul = 1, levelMul = 1, flawlessPay = 0, heldPay = 0): number {
  const flawless = result.waves > 0 && result.clean === result.waves ? flawlessPay : 0;
  const held = (result.held ?? 0) * heldPay;
  return Math.floor((result.waves + Math.floor(result.stopped / 10) + result.clean * cleanPay + flawless + held) * mul * levelMul);
}
```
`recordRun`'s coins line gains `heldPay(old.purchased)` as the 6th argument. `src/core/run.ts`: `get heldLives(): number { let n = 0; for (const r of this.story) n += r.leaks; return n; }` (put after the `finalScore` getter).

### Steps
1. `claim.ts`: add the `heldPerLife` field + node + `heldPay()`.
2. `profile.ts`: `RunResult.held`, `coinsForRun` param+term, `recordRun` arg.
3. `run.ts`: `heldLives` getter.
4. The three coin surfaces — in each, pass `held: <run>.heldLives` into the `coinsForRun` object and append `heldPay(<purchased>)` as the 6th arg: `StatsCard.update` (use `this.heldPay`, add `private readonly heldPay` set in the constructor next to `flawlessPay`), `PauseScene.create`, `RewardsScene.create`. In `GameOverScene` add `held: run.heldLives` to the `recordRun` object.
5. `RewardsScene` recipe line (lines 126-128): before it, `const heldCoins = run.heldLives * heldPay(profile.purchased);`; after the `flawless` push add `if (heldCoins > 0) coinRecipeParts.push(`held +${heldCoins * mul}`);`.
6. `RunFlow.ts`: add `private heldMoment(): void` that reads `this.run.story[this.run.story.length - 1]` (its `leaks`), returns early when `leaks <= 0 || heldPay(this.run.techOwned) <= 0`, computes the exit anchor `const pts = this.s.board.path.points; const ex = (pts[pts.length - 1]!.x + pts[pts.length - 2]!.x) / 2; const ey = (pts[pts.length - 1]!.y + pts[pts.length - 2]!.y) / 2;`, then `this.s.fx.popText(ex, ey, `+${leaks}`, PALETTE.muted); this.s.sfx?.coinBlip();`. Call `this.heldMoment();` after the `Wave N cleared` `popText` in `clearWave` (line ~174), and as the first statement of the `if (run.over)` branch in `update` (before `this.endRun()`, line ~83).

### Pitfalls
- **No double fire:** `clearWave` and the `run.over` branch are mutually exclusive per wave (a wave either clears or kills the run); the `run.over` branch runs once (phase leaves `wave`), so the death-wave pop fires exactly once. Intentional quit (`endRunIntentionally`) never enters that branch, so no pop on quit.
- **Pop color:** "muted" reads as `PALETTE.muted`; the mechanism is the Toll blip (`fx.popText`, rises/fades, existing `live>=MAX` guard). If the intent was the gold toll look, drop the 4th arg. `coinBlip()` already is the chime's low E5 note at volume 0.08 — reuse it, add no Sfx method.
- **Without the node:** `heldPay=0` ⇒ term 0, recipe `heldCoins=0` (no term), `heldMoment` early-returns — stats tally, worth line, recipe line, and the old byte-exact line all unchanged.
- **Recipe line width:** the `recipe()` helper already shrinks to `maxW` and `stack()` sizes the card from content, so the longer "waves +N · stopped +N · clean +N · held +N" fits at 412x915/1280x720 with no hand-picked y. `held` and `flawless` are mutually exclusive (flawless ⟹ no leaks).
- **`held` optional:** use `result.held ?? 0`; every coin call site passes it, existing tests (which omit it) still pass. `heldLives` is O(waves) — called each frame by StatsCard, cheap (≤~60).

### Tests
- `tests/core/profile.test.ts`: `coinsForRun` held term — `held:0→0`, `held:1→1`, `held:3→3` (one coin per life, one wave); `held:3` with `heldPay:0→0` (no node); `held:3,cleanPay:2,mul:2→20` (Iron), `held:3,levelMul:1.25→11`, `held:3,mul:2,levelMul:1.25→22`.
- `tests/core/run.test.ts`: `heldLives` — 0 fresh; 1 after a wave that leaked 1 then cleared; 3 after a second wave that leaks 1 then `leak(START.lives - 1)` (death wave's 2 leaks included).
- `tests/core/tech.test.ts`: update the claim-row test to 3 nodes incl. `heldPerLife` (`['held-pays','Held pays',30,0,0,1,'flawless']`); add `heldPay([])→0`, `heldPay(['clean2','flawless'])→0`, `heldPay(['held-pays'])→1`; add `expect(nodeCost(CLAIM_NODES, 'held-pays')).toBe(155)` (depth-3 price) next to the `nodeCost(... 'flawless')` check; import `heldPay`.
