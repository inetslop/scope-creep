/**
 * Builds the site's front page (run by the deploy workflow once every game is in place):
 *
 *   node site/home.ts _site
 *
 * Writes <site>/index.html, which lists the games (play and build log links, how far each one
 * is) and the fleet (every machine and what it is doing), and <site>/version.json, which the
 * deploy workflow reads to skip a commit that is already live. Each game lives at <site>/<id>/.
 * Like the build log, everything here lives outside the games and reads only the repo
 * (agents/machines.json, task files, git authors), so the agents can't change what it says.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ORIGINAL_PROJECT, projectDir, projectIds } from '../loop/paths.ts';
import { lastFinished, machineView, poolCounts, projectTasks, sortMachines, type LastCommit, type MachineConfig, type MachineView, type PoolCounts } from './home-data.ts';

const REPO = path.resolve(import.meta.dirname, '..');

/** Chokepoint's bright minimal palette (projects/chokepoint/game/src/content/palette.ts). */
const C = {
  ground: '#d9e2e0',
  island: '#edf2f1',
  card: '#ffffff',
  cardDeep: '#d3dcdb',
  ink: '#2c3a40',
  muted: '#6f8287',
  faint: '#a7b6b9',
  green: '#5cb85f',
  greenDeep: '#3d8a41',
  blue: '#3c86d6',
  blueDeep: '#255fa3',
  teal: '#24a99c',
  yellow: '#f3c33c',
};
const FONT = 'ui-rounded, "SF Pro Rounded", "Segoe UI", system-ui, -apple-system, Roboto, Arial, sans-serif';

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

/** The game's one-line description: the first sentences of its CLAUDE.md (written by humans). */
function blurb(gameDir: string): string {
  try {
    const lines = fs.readFileSync(path.join(gameDir, 'CLAUDE.md'), 'utf8').split(/\r?\n/).filter((l) => l.trim() && !l.startsWith('#'));
    const first = (l: string | undefined): string => /^(.*?[.!?])(\s|$)/.exec(l ?? '')?.[1] ?? '';
    return [first(lines[0]), first(lines[1])].filter(Boolean).join(' ');
  } catch {
    return '';
  }
}

interface GameView {
  id: string;
  title: string;
  blurb: string;
  active: boolean;
  playable: boolean;
  hasLog: boolean;
  counts: PoolCounts;
  lastDone?: string;
}

function renderGame(g: GameView): string {
  const badge = g.active ? '<span class="badge live">Being built now</span>' : '<span class="badge">Parked</span>';
  const done = `${g.counts.done} task${g.counts.done === 1 ? '' : 's'} built${g.lastDone ? ` · last one ${when(g.lastDone)}` : ''}`;
  const open = g.counts.building + g.counts.ready + g.counts.designing + g.counts.design;
  const play = g.playable ? `<a class="btn primary" href="${esc(g.id)}/">Play</a>` : '<span class="btn off">Not built yet</span>';
  const log = g.hasLog ? `<a class="btn" href="${esc(g.id)}/build-log/">Build log</a>` : '';
  return `<article class="card game${g.active ? ' active' : ''}">
  <div class="row"><h3>${esc(g.title)}</h3>${badge}</div>
  ${g.blurb ? `<p>${esc(g.blurb)}</p>` : ''}
  <div class="meta">${done}${g.active && open ? ` · ${open} open` : ''}</div>
  <div class="actions">${play}${log}</div>
</article>`;
}

const STATE_TEXT: Record<MachineView['state'], string> = { building: 'Building', designing: 'Designing', planning: 'Planning the next tasks', idle: 'Idle', paused: 'Paused' };

function renderMachine(m: MachineView, repo: string | undefined): string {
  let status = STATE_TEXT[m.state];
  if (m.task) {
    const id = repo ? `<a href="${esc(`${repo}/blob/main/${path.relative(REPO, m.task.file).split(path.sep).join('/')}`)}">${esc(m.task.id)}</a>` : esc(m.task.id);
    status += ` ${id} <span class="title">${esc(m.task.title)}</span>`;
  }
  const sinceAt = m.task?.since ?? m.planningSince;
  const since = sinceAt ? `<div class="since">since ${when(sinceAt)}</div>` : '';
  const roles = m.roles.map((r) => (r === 'po' ? 'PO' : r)).join(' · ');
  const work = [m.built ? `${m.built} built` : '', m.designed ? `${m.designed} designed` : ''].filter(Boolean).join(' · ');
  const last = m.lastActive ? `last push ${when(m.lastActive)}` : 'no pushes yet';
  return `<article class="card machine ${m.state}">
  <div class="row"><span class="dot"></span><h3>${esc(m.id)}</h3><span class="roles">${esc(roles)}</span></div>
  <div class="status">${status}</div>
  ${since}
  <div class="meta">${esc(m.label)}</div>
  <div class="meta">${esc(m.model)}${m.maxTaskSize ? ` · tasks up to ${esc(m.maxTaskSize)}` : ''}</div>
  <div class="meta">${work ? `${work} · ` : ''}${last}</div>
</article>`;
}

function renderPool(title: string, c: PoolCounts): string {
  const chip = (n: number, label: string, cls: string): string => `<span class="chip ${cls}"><b>${n}</b> ${label}</span>`;
  return `<div class="chips">${chip(c.building, 'being built', 'building')}${chip(c.ready, 'ready to build', 'ready')}${chip(c.designing, 'being designed', 'designing')}${chip(c.design, 'waiting for a design', 'design')}${chip(c.done, 'built', 'done')}${c.failed ? chip(c.failed, 'failed', 'failed') : ''}</div>
<p class="note">${esc(title)}'s tasks: the product owner writes them, an architect designs each one, and any machine that can take its size builds it.</p>`;
}

function renderPage(d: { games: GameView[]; machines: MachineView[]; active?: GameView; repo?: string; sha: string; generatedAt: string }): string {
  const busy = d.machines.filter((m) => m.state === 'building' || m.state === 'designing' || m.state === 'planning').length;
  const paused = d.machines.filter((m) => m.state === 'paused').length;
  const sha = d.repo ? `<a href="${esc(`${d.repo}/commit/${d.sha}`)}">${esc(d.sha.slice(0, 7))}</a>` : esc(d.sha.slice(0, 7));
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Scope Creep</title>
<meta name="description" content="Browser games built around the clock by a fleet of local LLM agents.">
<style>
  * { box-sizing: border-box; }
  body { margin: 0; background: ${C.ground}; color: ${C.ink}; font: 16px/1.45 ${FONT}; }
  main { max-width: 1040px; margin: 0 auto; padding: 40px 16px 56px; }
  a { color: ${C.blueDeep}; }
  h1 { font-size: 40px; margin: 0; letter-spacing: -0.5px; }
  h2 { font-size: 22px; margin: 40px 0 6px; }
  h3 { font-size: 19px; margin: 0; }
  header p { margin: 6px 0 0; color: ${C.muted}; }
  .lead { color: ${C.ink}; font-size: 18px; }
  .sub { font-size: 14px; }
  .section-note, .note { color: ${C.muted}; font-size: 14px; margin: 0 0 14px; }
  .note { margin-top: 12px; }
  .grid { display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); }
  .games { grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); }
  .card { background: ${C.card}; border-radius: 18px; padding: 16px 18px; box-shadow: 0 3px 0 ${C.cardDeep}, 0 8px 20px rgba(44, 58, 64, 0.08); min-width: 0; }
  .row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .game p { margin: 8px 0 6px; color: ${C.ink}; }
  .game.active { box-shadow: 0 3px 0 ${C.greenDeep}, 0 8px 20px rgba(44, 58, 64, 0.1); }
  .badge { font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 999px; background: ${C.island}; color: ${C.muted}; }
  .badge.live { background: ${C.green}; color: #fff; }
  .meta { color: ${C.muted}; font-size: 14px; margin-top: 2px; overflow-wrap: anywhere; }
  .actions { display: flex; gap: 10px; margin-top: 14px; flex-wrap: wrap; }
  .btn { display: inline-block; padding: 10px 18px; min-height: 44px; border-radius: 999px; background: ${C.island}; color: ${C.ink}; text-decoration: none; font-weight: 700; }
  .btn.primary { background: ${C.ink}; color: #fff; }
  .btn.off { color: ${C.faint}; }
  .machine .dot { width: 12px; height: 12px; border-radius: 50%; background: ${C.faint}; flex: none; }
  .machine.building .dot { background: ${C.green}; box-shadow: 0 0 0 4px rgba(92, 184, 95, 0.2); }
  .machine.designing .dot { background: ${C.blue}; box-shadow: 0 0 0 4px rgba(60, 134, 214, 0.2); }
  .machine.planning .dot { background: ${C.teal}; box-shadow: 0 0 0 4px rgba(36, 169, 156, 0.2); }
  .machine.idle .dot { background: ${C.yellow}; }
  .machine.paused { opacity: 0.6; }
  .roles { margin-left: auto; font-size: 12px; font-weight: 700; color: ${C.muted}; text-transform: uppercase; letter-spacing: 0.4px; }
  .status { margin: 8px 0 6px; font-weight: 700; overflow-wrap: anywhere; }
  .status .title { font-weight: 400; }
  .since { color: ${C.muted}; font-size: 14px; margin: -4px 0 6px; }
  .chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .chip { background: ${C.card}; border-radius: 999px; padding: 6px 14px; font-size: 14px; color: ${C.muted}; box-shadow: 0 2px 0 ${C.cardDeep}; }
  .chip b { color: ${C.ink}; }
  .chip.building b { color: ${C.greenDeep}; }
  .chip.designing b { color: ${C.blueDeep}; }
  footer { margin-top: 44px; color: ${C.muted}; font-size: 13px; }
  @media (max-width: 480px) { main { padding-top: 28px; } h1 { font-size: 32px; } .grid, .games { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<main>
<header>
  <h1>Scope Creep</h1>
  <p class="lead">Browser games built around the clock by a fleet of local LLM agents.</p>
  <p class="sub">Updated ${when(d.generatedAt)}${d.repo ? ` · <a href="${esc(d.repo)}">source on GitHub</a>` : ''}</p>
</header>

<h2>Games</h2>
<p class="section-note">The fleet builds one game at a time; the others stay playable.</p>
<div class="grid games">
${d.games.map(renderGame).join('\n')}
</div>

<h2>Fleet</h2>
<p class="section-note">${d.machines.length} machines · ${busy} working · ${paused} paused. Each runs its own model and takes the work it can handle.</p>
<div class="grid">
${d.machines.map((m) => renderMachine(m, d.repo)).join('\n')}
</div>
${d.active ? `\n<h2>Task pool · ${esc(d.active.title)}</h2>\n${renderPool(d.active.title, d.active.counts)}` : ''}

<footer>Built from ${sha}. Machine states come from the task files and git history, so they are as fresh as the last deploy.</footer>
</main>
<script>
  // Times as "12 min ago" by the viewer's clock, so they stay right between deploys.
  const ago = (iso) => {
    const s = (Date.now() - Date.parse(iso)) / 1000;
    if (!Number.isFinite(s)) return '';
    if (s < 90) return 'just now';
    if (s < 3600) return Math.round(s / 60) + ' min ago';
    if (s < 36 * 3600) return Math.round(s / 3600) + ' h ago';
    return Math.round(s / 86400) + ' days ago';
  };
  for (const t of document.querySelectorAll('time[datetime]')) {
    const text = ago(t.dateTime);
    if (text) { t.title = t.textContent; t.textContent = text; }
  }
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
      blurb: blurb(path.join(projectDir(id), 'game')),
      active: id === activeId,
      playable: html !== '',
      hasLog: fs.existsSync(path.join(site, id, 'build-log', 'index.html')),
      counts: poolCounts(tasks),
      lastDone: lastFinished(tasks),
    };
  });
  games.sort((a, b) => Number(b.active) - Number(a.active));

  const activeTasks = projectTasks(projectDir(activeId));
  const machines = sortMachines(Object.entries(fleet.machines).map(([id, m]) => machineView(id, m, activeTasks, lastPush(id))));
  const sha = git(['rev-parse', 'HEAD']).trim();
  const generatedAt = new Date().toISOString();

  fs.writeFileSync(path.join(site, 'index.html'), renderPage({ games, machines, active: games.find((g) => g.active), repo: repoUrl(), sha, generatedAt }));
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
