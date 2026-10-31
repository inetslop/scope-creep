/**
 * Builds the site's front page (run by the deploy workflow once every game is in place):
 *
 *   node site/home.ts _site
 *
 * Writes <site>/index.html and <site>/version.json (which the deploy workflow reads to skip a
 * commit that is already live). Each game lives at <site>/<id>/. The page is a light storefront
 * (the owner picked it from five sketches): a hero that rotates through the games, each playing
 * live in its own style (site/scenes.js), the games as tiles, the top players of the day (from the
 * leaderboard, fetched in the browser), what the fleet just shipped, and every machine. Its
 * browser code is site/home.client.js. Like the build log, everything here lives outside the games
 * and reads only the repo (agents/machines.json, task files, git authors), so the agents can't
 * change what it says.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ORIGINAL_PROJECT, projectDir, projectIds } from '../loop/paths.ts';
import { blurbOf, lastFinished, machineView, poolCounts, projectTasks, recentlyShipped, sortMachines, type LastCommit, type MachineConfig, type MachineView, type PoolCounts, type Shipped } from './home-data.ts';

const REPO = path.resolve(import.meta.dirname, '..');

const C = {
  bg: '#edf6f1',
  bg2: '#e1efe8',
  card: '#ffffff',
  ink: '#10232a',
  muted: '#4f6a66',
  faint: 'rgba(16, 35, 42, 0.12)',
  accent: '#e8590c',
  good: '#2f9e44',
  blue: '#1c7ed6',
  yellow: '#ffd43b',
};
const DISPLAY = "Unbounded, 'Arial Black', system-ui, sans-serif";
const BODY = "Figtree, ui-rounded, 'Segoe UI', system-ui, -apple-system, Roboto, Arial, sans-serif";

/** Which live scene (site/scenes.js) draws each game; a game without one shows its screenshot. */
const SCENES: Record<string, string> = { 'draft-arena': 'critters', chokepoint: 'road', 'scope-creep': 'paper' };
/** The game whose top players the page shows (its boards live on the leaderboard Worker, leaderboard/). */
const BOARD_GAME = 'draft-arena';
const LEADERBOARD_URL = process.env.LEADERBOARD_URL || 'https://chokepoint-leaderboard.scope-creep.workers.dev';

const git = (args: string[]): string => execFileSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

function repoUrl(): string | undefined {
  if (process.env.GITHUB_REPOSITORY) return `${process.env.GITHUB_SERVER_URL ?? 'https://github.com'}/${process.env.GITHUB_REPOSITORY}`;
  try {
    const origin = git(['remote', 'get-url', 'origin']).trim();
    const m = /github\.com[:/](.+?)(\.git)?$/.exec(origin);
    return m ? `https://github.com/${m[1]}` : undefined;
  } catch {
    return undefined;
  }
}

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** A time the viewer's browser turns into "12 min ago"; the UTC text is the fallback. */
function when(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `<time datetime="${esc(d.toISOString())}">${esc(d.toISOString().slice(0, 16).replace('T', ' '))} UTC</time>`;
}

const readBlurb = (gameDir: string): string => {
  try {
    return blurbOf(fs.readFileSync(path.join(gameDir, 'CLAUDE.md'), 'utf8'));
  } catch {
    return '';
  }
};

interface GameView {
  id: string;
  title: string;
  blurb: string;
  active: boolean;
  playable: boolean;
  hasLog: boolean;
  counts: PoolCounts;
  lastDone?: string;
  /** The gameplay screenshot (site/screenshots.ts) as a URL relative to the site, if one was taken. */
  preview?: string;
}

const STATE_TEXT: Record<MachineView['state'], string> = { building: 'Building', designing: 'Designing', planning: 'Planning the next tasks', idle: 'Idle', paused: 'Paused' };

/** The hero's chips for a game: where it stands. HTML (a time element), escaped. */
function chips(g: GameView): string[] {
  const open = g.counts.building + g.counts.ready + g.counts.designing + g.counts.design;
  return [
    'Desktop and phone',
    `${g.counts.done} task${g.counts.done === 1 ? '' : 's'} built`,
    ...(g.active && open ? [`${open} in the works`] : []),
    ...(g.lastDone ? [`last one ${when(g.lastDone)}`] : []),
  ];
}

function sceneOrShot(g: GameView, extra: string): string {
  const kind = SCENES[g.id];
  if (kind) return `<canvas data-scene="${kind}" ${extra}></canvas>`;
  return g.preview ? `<img src="${esc(g.preview)}" alt="">` : '';
}

function renderTile(g: GameView): string {
  const tag = g.active ? 'Being built now' : `${g.counts.done} tasks built`;
  const inner = `${sceneOrShot(g, 'data-hover="1"')}
    <span class="tag">${tag}</span>
    <span class="cap"><span><b>${esc(g.title)}</b><small>${g.active ? 'The fleet is building it right now' : 'Parked: still playable'}</small></span>${g.playable ? '<span class="go">Play</span>' : ''}</span>`;
  return g.playable ? `<a class="tile" href="${esc(g.id)}/">${inner}</a>` : `<div class="tile">${inner}</div>`;
}

function renderMachine(m: MachineView, repo: string | undefined): string {
  let status = STATE_TEXT[m.state];
  if (m.task) {
    const id = repo ? `<a href="${esc(`${repo}/blob/main/${path.relative(REPO, m.task.file).split(path.sep).join('/')}`)}">${esc(m.task.id)}</a>` : esc(m.task.id);
    status += ` ${id} <span class="title">${esc(m.task.title)}</span>`;
  }
  const sinceAt = m.task?.since ?? m.planningSince;
  const roles = m.roles.map((r) => (r === 'po' ? 'PO' : r)).join(' · ');
  const work = [m.built ? `${m.built} built` : '', m.designed ? `${m.designed} designed` : ''].filter(Boolean).join(' · ');
  return `<article class="machine ${m.state}">
  <header><span class="dot"></span><b>${esc(m.id)}</b><small>${esc(roles)}</small></header>
  <div class="status">${status}${sinceAt ? ` <span class="since">· since ${when(sinceAt)}</span>` : ''}</div>
  <div class="meta">${esc(m.model)}${m.maxTaskSize ? ` · tasks up to ${esc(m.maxTaskSize)}` : ''}${work ? ` · ${work}` : ''}</div>
</article>`;
}

const STYLE = `
  * { box-sizing: border-box; }
  html { color-scheme: light; }
  body { margin: 0; background: ${C.bg}; color: ${C.ink}; font: 16px/1.45 ${BODY}; overflow-x: hidden; }
  a { color: inherit; }
  :focus-visible { outline: 3px solid ${C.accent}; outline-offset: 3px; }
  canvas[data-scene] { display: block; width: 100%; height: 100%; }
  [hidden] { display: none !important; }

  .bar { position: absolute; top: 0; left: 0; right: 0; z-index: 5; display: flex; align-items: center; gap: 24px; padding: calc(18px + env(safe-area-inset-top, 0px)) 24px 18px; }
  .brand { font: 800 15px/1 ${DISPLAY}; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; }
  .bar nav { display: flex; gap: 18px; font-weight: 600; font-size: 15px; }
  .bar nav a { text-decoration: none; color: ${C.muted}; }
  .bar nav a:hover { color: ${C.ink}; }
  .pill { margin-left: auto; display: inline-flex; align-items: center; gap: 8px; background: rgba(237, 246, 241, 0.85); backdrop-filter: blur(8px); border-radius: 999px; padding: 8px 14px; font-size: 14px; font-weight: 600; text-decoration: none; }
  .live { width: 9px; height: 9px; border-radius: 50%; background: #ff5d73; animation: ring 1.6s infinite; flex: none; }
  @keyframes ring { 0% { box-shadow: 0 0 0 0 rgba(255, 93, 115, 0.7); } 100% { box-shadow: 0 0 0 10px rgba(255, 93, 115, 0); } }
  @media (max-width: 640px) { .bar nav { display: none; } }

  .hero { position: relative; height: clamp(520px, 76vh, 700px); overflow: hidden; background: ${C.bg2}; }
  .layer { position: absolute; inset: 0; opacity: 0; transition: opacity 0.9s; }
  .layer.on { opacity: 1; }
  .layer canvas, .layer img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transform: scale(1.08); animation: kenburns 26s ease-in-out infinite alternate; }
  @keyframes kenburns { to { transform: scale(1.2) translate(-2%, 1%); } }
  .scrim { position: absolute; inset: 0; pointer-events: none; background: linear-gradient(90deg, rgba(237, 246, 241, 0.95) 0%, rgba(237, 246, 241, 0.7) 40%, rgba(237, 246, 241, 0.15) 74%), linear-gradient(0deg, ${C.bg} 0%, rgba(237, 246, 241, 0) 30%); }
  .copy { position: relative; z-index: 2; height: 100%; max-width: 1200px; margin: 0 auto; padding: 0 24px 44px; display: flex; flex-direction: column; justify-content: flex-end; gap: 16px; }
  .h-status { display: inline-flex; gap: 8px; align-items: center; font-weight: 800; font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase; color: ${C.accent}; }
  .h-status.parked { color: ${C.muted}; }
  .h-status.parked .live { background: ${C.muted}; animation: none; }
  h1 { margin: 0; font: 800 clamp(44px, 9vw, 112px)/0.92 ${DISPLAY}; letter-spacing: -2px; text-wrap: balance; min-height: 1em; }
  h1 .clip { display: inline-block; overflow: hidden; vertical-align: bottom; padding-bottom: 0.06em; }
  h1 .ch { display: inline-block; transform: translateY(110%); animation: rise 0.75s cubic-bezier(0.2, 0.9, 0.2, 1) forwards; }
  @keyframes rise { to { transform: translateY(0); } }
  .blurb { margin: 0; max-width: 54ch; font-size: 18px; line-height: 1.5; color: ${C.muted}; min-height: 3em; }
  .chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .chips span { border: 1px solid ${C.faint}; background: rgba(255, 255, 255, 0.6); border-radius: 999px; padding: 6px 12px; font-size: 14px; }
  .cta { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
  .btn { display: inline-flex; align-items: center; justify-content: center; min-height: 52px; padding: 0 28px; border-radius: 14px; font-weight: 800; font-size: 17px; text-decoration: none; transition: transform 0.15s; }
  .btn.play { background: ${C.ink}; color: #fff; box-shadow: 0 10px 28px rgba(16, 35, 42, 0.25); }
  .btn.play:hover { transform: translateY(-2px) scale(1.03); }
  .btn.ghost { background: rgba(16, 35, 42, 0.07); }
  .picker { display: flex; gap: 10px; margin-left: auto; }
  .picker button { font: inherit; cursor: pointer; border: 0; background: rgba(16, 35, 42, 0.06); color: ${C.ink}; border-radius: 12px; padding: 8px 12px 10px; min-height: 44px; display: grid; gap: 6px; text-align: left; font-size: 13px; font-weight: 700; min-width: 116px; }
  .picker button[aria-pressed="true"] { background: ${C.card}; box-shadow: 0 6px 20px rgba(16, 35, 42, 0.12); }
  .track { height: 3px; border-radius: 3px; background: ${C.faint}; overflow: hidden; }
  .fill { display: block; height: 100%; width: 0; background: ${C.accent}; }
  @media (max-width: 760px) { .picker { margin-left: 0; width: 100%; } .picker button { flex: 1; min-width: 0; } }

  main { max-width: 1200px; margin: 0 auto; padding: 0 24px; display: grid; gap: 40px; }
  main + main { padding-bottom: 56px; }
  section { display: grid; gap: 16px; }
  h2 { margin: 0; font: 500 20px/1.2 ${DISPLAY}; display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
  h2 small { font: 600 14px/1.3 ${BODY}; color: ${C.muted}; }
  .tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
  .tile { position: relative; border-radius: 18px; overflow: hidden; aspect-ratio: 16 / 10; text-decoration: none; background: ${C.card}; color: #eef6f4; box-shadow: 0 10px 30px rgba(16, 35, 42, 0.14); transition: transform 0.35s cubic-bezier(0.2, 0.9, 0.2, 1), box-shadow 0.35s; }
  a.tile:hover, a.tile:focus-visible { transform: translateY(-6px); box-shadow: 0 22px 44px rgba(16, 35, 42, 0.22); }
  .tile canvas, .tile img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s; }
  a.tile:hover canvas, a.tile:hover img { transform: scale(1.06); }
  .tile .cap { position: absolute; left: 0; right: 0; bottom: 0; padding: 44px 18px 16px; background: linear-gradient(0deg, rgba(10, 22, 28, 0.9), rgba(10, 22, 28, 0)); display: flex; align-items: end; justify-content: space-between; gap: 12px; }
  .tile .cap b { display: block; font: 800 22px/1.1 ${DISPLAY}; }
  .tile .cap small { color: #c9dbd6; font-size: 14px; }
  .tile .go { background: ${C.yellow}; color: ${C.ink}; font-weight: 800; border-radius: 10px; padding: 9px 16px; transform: translateY(12px); opacity: 0; transition: transform 0.25s, opacity 0.25s; }
  a.tile:hover .go, a.tile:focus-visible .go { transform: none; opacity: 1; }
  @media (hover: none) { .tile .go { transform: none; opacity: 1; } }
  .tile .tag { position: absolute; top: 14px; left: 14px; font-size: 12px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; padding: 5px 10px; border-radius: 999px; background: rgba(10, 22, 28, 0.72); color: ${C.yellow}; }

  .rows { display: grid; gap: 20px; }
  .rows.two { grid-template-columns: 1fr 1fr; }
  @media (max-width: 820px) { .rows.two { grid-template-columns: 1fr; } }
  .panel { background: ${C.card}; border-radius: 18px; padding: 18px 20px; display: grid; gap: 12px; align-content: start; box-shadow: 0 4px 0 ${C.faint}; min-width: 0; }
  .panel h3 { margin: 0; font: 500 17px/1.2 ${DISPLAY}; display: flex; justify-content: space-between; gap: 10px; align-items: baseline; flex-wrap: wrap; }
  .panel h3 small { font: 600 13px/1 ${BODY}; color: ${C.muted}; }
  .board { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
  .board li { display: grid; grid-template-columns: 2em 1fr auto; gap: 10px; align-items: center; padding: 8px 12px; border-radius: 12px; background: ${C.bg}; font-variant-numeric: tabular-nums; }
  .board li:first-child { box-shadow: inset 0 0 0 2px ${C.accent}; }
  .board li.empty { display: block; color: ${C.muted}; box-shadow: none; }
  .board .r { font-weight: 800; color: ${C.muted}; }
  .board li:first-child .r { color: ${C.accent}; }
  .board .n { font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .board .s { font-weight: 800; }
  .note { margin: 0; color: ${C.muted}; font-size: 14px; }
  .shipped { list-style: none; margin: 0; padding: 0; display: grid; }
  .shipped li { display: grid; grid-template-columns: 4.4em 1fr auto; gap: 10px; padding: 8px 2px; border-bottom: 1px solid ${C.faint}; align-items: baseline; }
  .shipped li:last-child { border-bottom: 0; }
  .shipped .id { font-weight: 800; color: #0ca678; font-variant-numeric: tabular-nums; }
  .shipped .t { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .shipped .m { color: ${C.muted}; font-size: 13px; white-space: nowrap; }

  .ticker { margin-block: 40px; border-block: 1px solid ${C.faint}; overflow: hidden; white-space: nowrap; padding-block: 14px; }
  .ticker .run { display: inline-flex; gap: 48px; animation: tick 60s linear infinite; padding-left: 24px; }
  @keyframes tick { to { transform: translateX(-50%); } }
  .ticker span { color: ${C.muted}; font-size: 15px; }
  .ticker b { color: ${C.ink}; }
  .ticker em { font-style: normal; color: ${C.good}; font-weight: 700; }

  .fleet { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
  .machine { background: ${C.card}; border-radius: 14px; padding: 12px 14px; display: grid; gap: 4px; box-shadow: 0 3px 0 ${C.faint}; min-width: 0; }
  .machine header { display: flex; align-items: center; gap: 8px; }
  .machine header small { margin-left: auto; font-size: 11px; font-weight: 800; letter-spacing: 0.6px; text-transform: uppercase; color: ${C.muted}; }
  .machine .dot { width: 10px; height: 10px; border-radius: 50%; background: #b6c4c0; flex: none; }
  .machine.building .dot { background: ${C.good}; box-shadow: 0 0 0 4px rgba(47, 158, 68, 0.18); }
  .machine.designing .dot { background: ${C.blue}; box-shadow: 0 0 0 4px rgba(28, 126, 214, 0.18); }
  .machine.planning .dot { background: #0ca678; box-shadow: 0 0 0 4px rgba(12, 166, 120, 0.18); }
  .machine.idle .dot { background: ${C.yellow}; }
  .machine.paused { opacity: 0.55; }
  .machine .status { font-weight: 700; font-size: 14px; overflow-wrap: anywhere; }
  .machine .status .title, .machine .since { font-weight: 400; }
  .machine .since { color: ${C.muted}; }
  .machine .meta { color: ${C.muted}; font-size: 13px; overflow-wrap: anywhere; }
  footer { color: ${C.muted}; font-size: 13px; }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation: none !important; transition: none !important; }
    h1 .ch { transform: none; }
  }
`;

function renderPage(d: { games: GameView[]; machines: MachineView[]; active?: GameView; shipped: Shipped[]; repo?: string; sha: string; generatedAt: string }): string {
  const busy = d.machines.filter((m) => m.state === 'building' || m.state === 'designing' || m.state === 'planning');
  const paused = d.machines.filter((m) => m.state === 'paused').length;
  const sha = d.repo ? `<a href="${esc(`${d.repo}/commit/${d.sha}`)}">${esc(d.sha.slice(0, 7))}</a>` : esc(d.sha.slice(0, 7));
  const boardGame = d.games.find((g) => g.id === BOARD_GAME);
  const data = {
    games: d.games.map((g) => ({ id: g.id, title: g.title, blurb: g.blurb, active: g.active, playable: g.playable, hasLog: g.hasLog, chips: chips(g) })),
    board: boardGame ? { url: LEADERBOARD_URL, game: boardGame.title } : null,
  };
  // "</script>" can't appear inside the JSON block.
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  const tick = busy.map((m) => `<span><b>${esc(m.id)}</b> <em>${STATE_TEXT[m.state].toLowerCase()}</em> ${m.task ? `${esc(m.task.id)} · ${esc(m.task.title)}` : ''}</span>`).join('');
  const client = `${fs.readFileSync(path.join(import.meta.dirname, 'scenes.js'), 'utf8')}\n${fs.readFileSync(path.join(import.meta.dirname, 'home.client.js'), 'utf8')}`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Scope Creep</title>
<meta name="description" content="Browser games built around the clock by a fleet of local LLM agents.">
<meta name="theme-color" content="${C.bg}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;600;800&family=Unbounded:wght@500;800&display=swap">
<style>${STYLE}</style>
</head>
<body>
<header class="bar">
  <a class="brand" href="#top">Scope Creep</a>
  <nav><a href="#games">Games</a>${boardGame ? '<a href="#players">Top players</a>' : ''}<a href="#shipped">Just shipped</a><a href="#fleet">Fleet</a></nav>
  ${d.active ? `<a class="pill" href="${esc(d.active.id)}/"><span class="live"></span>Building ${esc(d.active.title)}</a>` : ''}
</header>

<section class="hero" id="top">
  ${d.games.map((g, i) => `<div class="layer${i === 0 ? ' on' : ''}" data-game="${i}">${sceneOrShot(g, `data-zoom="1.25" data-hero="${i}"`)}</div>`).join('\n  ')}
  <div class="scrim"></div>
  <div class="copy">
    <div class="h-status" id="h-status"><span class="live"></span><span id="h-status-text">${d.games[0]?.active ? 'Being built right now' : 'Playable'}</span></div>
    <h1 id="h-title">${esc(d.games[0]?.title ?? 'Scope Creep')}</h1>
    <p class="blurb" id="h-blurb">${esc(d.games[0]?.blurb ?? '')}</p>
    <div class="chips" id="h-chips"></div>
    <div class="cta">
      <a class="btn play" id="h-play" href="${esc(d.games[0]?.id ?? '')}/">Play now</a>
      <a class="btn ghost" id="h-log" href="${esc(d.games[0]?.id ?? '')}/build-log/">Build log</a>
      ${d.games.length > 1 ? `<div class="picker">${d.games.map((g, i) => `<button type="button" data-pick="${i}" aria-pressed="${i === 0}">${esc(g.title)}<span class="track"><span class="fill"></span></span></button>`).join('')}</div>` : ''}
    </div>
  </div>
</section>

<main>
<section id="games">
  <h2>Every game, playable <small>Browser games built around the clock by a fleet of local LLM agents. The fleet builds one at a time; the others stay playable.</small></h2>
  <div class="tiles">
  ${d.games.map(renderTile).join('\n  ')}
  </div>
</section>

<div class="rows" id="rows">
  ${boardGame ? `<section class="panel" id="players" hidden>
    <h3>Top players today <small>${esc(boardGame.title)}</small></h3>
    <ol class="board" id="top-players"></ol>
    <p class="note">Your best life of the day goes on the board when you are knocked out. <a href="${esc(boardGame.id)}/">Get on it</a>.</p>
  </section>` : ''}
  ${d.active && d.shipped.length ? `<section class="panel" id="shipped">
    <h3>Just shipped <small>${esc(d.active.title)}</small></h3>
    <ul class="shipped">
      ${d.shipped.map((t) => `<li><span class="id">${esc(t.id)}</span><span class="t" title="${esc(t.title)}">${esc(t.title)}</span><span class="m">${esc(t.by || 'the fleet')} · ${when(t.at)}</span></li>`).join('\n      ')}
    </ul>
  </section>` : ''}
</div>
</main>

${tick ? `<div class="ticker" aria-hidden="true"><div class="run">${tick}${tick}</div></div>` : ''}

<main>
<section id="fleet">
  <h2>The fleet <small>${d.machines.length} machines · ${busy.length} working · ${paused} paused. Each runs its own local model and takes the work it can handle.</small></h2>
  <div class="fleet">
  ${d.machines.map((m) => renderMachine(m, d.repo)).join('\n  ')}
  </div>
</section>
<footer>Updated ${when(d.generatedAt)} from ${sha}${d.repo ? ` · <a href="${esc(d.repo)}">source on GitHub</a>` : ''}. Machine states come from the task files and git history, so they are as fresh as the last deploy.</footer>
</main>

<script type="application/json" id="page-data">${json}</script>
<script>
${client}
</script>
</body>
</html>
`;
}

/** The last commit a machine's runner made (authors are agent-<id>), if any. */
function lastPush(id: string): LastCommit | undefined {
  try {
    const [at, subject] = git(['log', '-1', '--format=%cI%x1f%s', `--author=^agent-${id} <`]).trim().split('\x1f');
    return at ? { at, subject: subject ?? '' } : undefined;
  } catch {
    return undefined;
  }
}

function main(): void {
  const site = process.argv[2];
  if (!site || !fs.existsSync(site)) throw new Error('usage: node site/home.ts <site folder with one folder per game>');

  const fleet = JSON.parse(fs.readFileSync(path.join(REPO, 'agents', 'machines.json'), 'utf8')) as { machines: Record<string, MachineConfig>; loop?: { project?: string } };
  const activeId = fleet.loop?.project || ORIGINAL_PROJECT;
  const games: GameView[] = projectIds().map((id) => {
    const index = path.join(site, id, 'index.html');
    const html = fs.existsSync(index) ? fs.readFileSync(index, 'utf8') : '';
    const tasks = projectTasks(projectDir(id));
    return {
      id,
      title: /<title>([^<]+)<\/title>/.exec(html)?.[1]?.trim() || id,
      blurb: readBlurb(path.join(projectDir(id), 'game')),
      active: id === activeId,
      playable: html !== '',
      hasLog: fs.existsSync(path.join(site, id, 'build-log', 'index.html')),
      counts: poolCounts(tasks),
      lastDone: lastFinished(tasks),
      // The commit in the URL makes browsers fetch each deploy's new screenshot.
      preview: fs.existsSync(path.join(site, id, 'preview.jpg')) ? `${id}/preview.jpg?v=${git(['rev-parse', '--short', 'HEAD']).trim()}` : undefined,
    };
  });
  games.sort((a, b) => Number(b.active) - Number(a.active));

  const activeTasks = projectTasks(projectDir(activeId));
  const machines = sortMachines(Object.entries(fleet.machines).map(([id, m]) => machineView(id, m, activeTasks, lastPush(id))));
  const sha = git(['rev-parse', 'HEAD']).trim();
  const generatedAt = new Date().toISOString();

  fs.writeFileSync(path.join(site, 'index.html'), renderPage({ games, machines, active: games.find((g) => g.active), shipped: recentlyShipped(activeTasks), repo: repoUrl(), sha, generatedAt }));
  // The deploy workflow reads this to skip a commit that is already live.
  fs.writeFileSync(path.join(site, 'version.json'), JSON.stringify({ sha, builtAt: generatedAt }, null, 2));
  // The first game's build log used to be at the site root: keep old links working.
  if (fs.existsSync(path.join(site, ORIGINAL_PROJECT, 'build-log', 'index.html')) && !fs.existsSync(path.join(site, 'build-log'))) {
    fs.mkdirSync(path.join(site, 'build-log'));
    const to = `../${ORIGINAL_PROJECT}/build-log/`;
    fs.writeFileSync(path.join(site, 'build-log', 'index.html'), `<!doctype html><meta charset="utf-8"><title>Moved</title><meta http-equiv="refresh" content="0; url=${to}"><a href="${to}">The build log moved here.</a>\n`);
  }
  console.log(`front page: ${games.length} games, ${machines.length} machines -> ${path.join(site, 'index.html')}`);
}

main();
