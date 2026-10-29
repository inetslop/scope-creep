/**
 * Builds the public build log page into the game's dist folder (run by the deploy workflow):
 *
 *   node site/build-log.ts game/dist
 *   SCOPE_CREEP_PROJECT=<id> node site/build-log.ts projects/<id>/game/dist   (any other project)
 *
 * Writes <dist>/build-log/index.html and adds a "Build log" link to <dist>/index.html that shows
 * on the menu and game-over screens. Everything here lives outside game/, and the data comes only
 * from runner-written records (finished task files, the runner's commit messages, git authors),
 * so the agents can't change the page or what it says.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { GAME_REL, ORIGINAL_PROJECT, PROJECT, TASKS_REL } from '../loop/paths.ts';
import { listTasks } from '../loop/tasks.ts';
import {
  collectFeatures,
  collectHandChanges,
  formatMinutes,
  GIT_LOG_FORMAT,
  itemIds,
  machineStats,
  parseGitLog,
  planShares,
  poCycles,
  taskCycles,
  totalAgentMinutes,
  type Feature,
  type HandChange,
  type MachineStats,
  type PoCycle,
} from './log-data.ts';

const REPO = path.resolve(import.meta.dirname, '..');

interface MachineInfo {
  label: string;
  model: string;
  paused?: boolean;
}

/** Bauhaus palette, same values as game/src/content/palette.ts. */
const C = {
  paper: '#f2ead8',
  paperLight: '#fbf7ee',
  paperDark: '#e2d6bc',
  ink: '#1d1d1b',
  inkSoft: '#55524a',
  gray: '#9a958a',
  red: '#d7362b',
  yellow: '#f2b822',
  blue: '#1f4e9c',
  green: '#2e7d55',
  orange: '#e2702a',
};
const MACHINE_COLORS = [C.red, C.blue, C.yellow, C.green, C.orange];
const FONT = 'Futura, "Century Gothic", "Avenir Next", "Trebuchet MS", "Segoe UI", Arial, sans-serif';

const git = (args: string[]): string => execFileSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

function repoUrl(): string | undefined {
  if (process.env.GITHUB_REPOSITORY) return `${process.env.GITHUB_SERVER_URL ?? 'https://github.com'}/${process.env.GITHUB_REPOSITORY}`;
  try {
    const origin = git(['remote', 'get-url', 'origin']).trim();
    const m = /github\.com[:/](.+?)(?:\.git)?$/.exec(origin);
    return m ? `https://github.com/${m[1]}` : undefined;
  } catch {
    return undefined;
  }
}

const esc = (s: string): string => s.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
/** Markdown `code` in (already escaped) summaries. */
const inlineCode = (html: string): string => html.replace(/`([^`]+)`/g, '<code>$1</code>');

/** Static UTC text; a small script on the page rewrites it in the viewer's time zone. */
function when(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const text = `${d.getUTCDate()} ${d.toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' })}, ${d.toISOString().slice(11, 16)} UTC`;
  return `<time datetime="${esc(d.toISOString())}">${esc(text)}</time>`;
}

function renderTotals(features: Feature[], hand: HandChange[], cycles: readonly PoCycle[]): string {
  const firstTry = features.length ? Math.round((100 * features.filter((f) => f.attempts === 1).length) / features.length) : 0;
  const tiles: [string, string][] = [
    [String(features.length), 'features built by agents'],
    [formatMinutes(totalAgentMinutes(features, cycles)), 'total agent time: building, designing, planning'],
    [`${firstTry}%`, 'shipped on the first attempt'],
    [String(hand.length), 'changes made by hand'],
  ];
  return tiles.map(([value, label]) => `<div class="tile"><b>${esc(value)}</b><span>${esc(label)}</span></div>`).join('');
}

function renderMachine(s: MachineStats, info: MachineInfo | undefined, color: string): string {
  const facts = [
    `<div><dt>features</dt><dd>${s.features}</dd></div>`,
    `<div><dt>agent time</dt><dd>${s.agentMin > 0 ? esc(formatMinutes(s.agentMin)) : '—'}</dd></div>`,
    `<div><dt>median build</dt><dd>${esc(formatMinutes(s.medianBuildMin))}</dd></div>`,
    `<div><dt>first try</dt><dd>${s.features ? `${Math.round(s.firstTry * 100)}%` : '—'}</dd></div>`,
  ].join('');
  return `<article class="machine card" style="--c:${color}">
  <h3><span class="dot"></span>${esc(s.id)}${info?.paused ? ' <span class="badge">paused</span>' : ''}</h3>
  <p class="spec">${esc(info?.label ?? 'retired machine')}${info ? `<br>${esc(info.model)}` : ''}</p>
  <dl class="facts">${facts}</dl>
</article>`;
}

/** Hidden until the page script finds the item missing from this browser's seen list. */
const NEW_FLAIR = '<span class="new">new</span>';

function renderFeature(f: Feature, colorOf: (m: string) => string, repo: string | undefined): string {
  const who = [`built by <b>${esc(f.builtBy)}</b>`, f.designedBy ? `designed by <b>${esc(f.designedBy)}</b>` : '', when(f.finishedAt)].filter(Boolean).join(' · ');
  const parts = ([['build', f.buildMin], ['design', f.designMin], ['planning', f.planMin]] as const)
    .filter(([, min]) => min !== undefined)
    .map(([name, min]) => `<span>${esc(`${name} ${formatMinutes(min)}`)}</span>`);
  const times = [
    `<div><dt>agent time</dt><dd>${esc(formatMinutes(f.agentMin))}</dd></div>`,
    `<div><dt>idea → live</dt><dd>${esc(formatMinutes(f.leadMin))}</dd></div>`,
    f.attempts > 1 ? `<div class="retry"><dt>attempts</dt><dd>${f.attempts}</dd></div>` : '',
    parts.length ? `<div class="split"><dd>${parts.join(' · ')}</dd></div>` : '',
  ].join('');
  const code = repo && f.commit ? `<a class="code" href="${esc(`${repo}/commit/${f.commit}`)}">code ↗</a>` : '';
  return `<li class="feature card" data-id="${esc(f.id)}" style="--c:${colorOf(f.builtBy)}">
  <span class="chip" aria-hidden="true"></span>
  <div class="main">
    <h3><span class="id">${esc(f.id)}</span> ${esc(f.title)} <span class="size" title="task size">${esc(f.size)}</span>${NEW_FLAIR}</h3>
    <p class="who">${who}</p>
    ${f.summary ? `<p class="summary">${inlineCode(esc(f.summary))}</p>` : ''}
  </div>
  <dl class="times">${times}</dl>
  ${code}
</li>`;
}

function renderHand(h: HandChange, id: string, repo: string | undefined): string {
  const by = `${esc(h.author)}${h.coAuthors.length ? ` with ${h.coAuthors.map(esc).join(', ')}` : ''}`;
  const link = repo ? `<a class="code" href="${esc(`${repo}/commit/${h.sha}`)}">code ↗</a>` : '';
  return `<li class="hand card" data-id="${esc(id)}">
  <span class="chip" aria-hidden="true"></span>
  <div class="main"><h3>${esc(h.subject)}${NEW_FLAIR}</h3><p class="who">by <b>${by}</b> · ${when(h.date)}</p></div>
  ${link}
</li>`;
}

const CSS = `
:root { color-scheme: light; }
* { box-sizing: border-box; }
html { background: ${C.paper}; }
body {
  margin: 0; color: ${C.ink}; font: 16px/1.45 ${FONT};
  background-color: ${C.paper};
  background-image: linear-gradient(${C.paperDark}66 1px, transparent 1px), linear-gradient(90deg, ${C.paperDark}66 1px, transparent 1px);
  background-size: 32px 32px;
}
a { color: inherit; }
.wrap { max-width: 1040px; margin: 0 auto; padding: 24px 16px 64px; }
.card { background: ${C.paperLight}; border: 2px solid ${C.ink}; box-shadow: 4px 4px 0 ${C.ink}2e; }
.back { display: inline-flex; align-items: center; min-height: 44px; padding: 0 16px; font-weight: 700; text-decoration: none; }
.back:hover, .code:hover { background: ${C.yellow}; }
header.top { position: relative; z-index: 0; padding: 40px 0 8px; }
header.top::before, header.top::after { content: ""; position: absolute; border: 3px solid ${C.ink}; z-index: -1; }
header.top::before { width: 84px; height: 84px; border-radius: 50%; background: ${C.red}; right: 4%; top: 18px; box-shadow: 4px 4px 0 ${C.ink}2e; }
header.top::after { width: 52px; height: 52px; background: ${C.yellow}; right: calc(4% + 96px); top: 70px; transform: rotate(12deg); box-shadow: 4px 4px 0 ${C.ink}2e; }
h1 { font-size: clamp(44px, 9vw, 84px); line-height: 1; margin: 20px 0 16px; letter-spacing: -0.02em; text-transform: uppercase; text-shadow: 4px 4px 0 ${C.red}; }
.lede { max-width: 640px; margin: 0; font-size: 18px; color: ${C.inkSoft}; }
.lede b { color: ${C.ink}; }
h2 { font-size: 26px; margin: 48px 0 16px; text-transform: uppercase; letter-spacing: 0.04em; display: flex; align-items: center; gap: 12px; }
h2::before { content: ""; width: 18px; height: 18px; background: ${C.blue}; border: 2px solid ${C.ink}; }
.totals { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-top: 32px; }
.tile { padding: 16px 18px; background: ${C.paperLight}; border: 2px solid ${C.ink}; box-shadow: 4px 4px 0 ${C.ink}2e; }
.tile b { display: block; font-size: 34px; line-height: 1.1; }
.tile span { color: ${C.inkSoft}; }
.machines { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
.machine { padding: 0 18px 16px; }
.machine::before { content: ""; display: block; height: 12px; margin: 0 -18px; background: var(--c); border-bottom: 2px solid ${C.ink}; }
.machine h3 { margin: 14px 0 4px; font-size: 24px; display: flex; align-items: center; gap: 10px; }
.dot { width: 18px; height: 18px; border-radius: 50%; background: var(--c); border: 2px solid ${C.ink}; flex: none; }
.new, .new-count { display: none; font-size: 11px; font-weight: 700; line-height: 18px; text-transform: uppercase; letter-spacing: 0.06em; padding: 0 7px; margin-left: 8px; vertical-align: 3px; color: ${C.paperLight}; background: ${C.red}; border: 2px solid ${C.ink}; }
.is-new .new { display: inline-block; }
.new-count { display: inline-block; font-size: 13px; line-height: 22px; vertical-align: 0; }
.new-count[hidden] { display: none; }
.badge { font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; padding: 2px 8px; border: 2px solid ${C.ink}; background: ${C.paper}; }
.spec { margin: 0 0 12px; color: ${C.inkSoft}; font-size: 14px; }
dl { margin: 0; }
dt { font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: ${C.inkSoft}; }
dd { margin: 0; font-weight: 700; }
.facts { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 16px; }
ol, ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 14px; }
.feature, .hand { position: relative; display: grid; grid-template-columns: 1fr auto auto; gap: 16px; align-items: center; padding: 14px 16px 14px 32px; }
.hand { grid-template-columns: 1fr auto; }
.chip { position: absolute; left: 0; top: 0; bottom: 0; width: 14px; background: var(--c, ${C.ink}); border-right: 2px solid ${C.ink}; }
.main { min-width: 0; overflow-wrap: anywhere; } /* a long word or path wraps instead of widening the card past a phone's screen */
.main h3 { margin: 0; font-size: 18px; line-height: 1.3; }
.id { font-size: 13px; color: ${C.inkSoft}; margin-right: 4px; }
.size { display: inline-block; font-size: 11px; line-height: 18px; min-width: 20px; text-align: center; border: 2px solid ${C.ink}; margin-left: 6px; vertical-align: 2px; }
.who { margin: 2px 0 0; font-size: 14px; color: ${C.inkSoft}; }
.who b { color: ${C.ink}; }
.summary { margin: 6px 0 0; font-size: 14px; color: ${C.inkSoft}; max-width: 62ch; }
code { font: 0.92em ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; background: ${C.paper}; padding: 0 3px; overflow-wrap: anywhere; }
.times { display: grid; width: 280px; grid-template-columns: 1fr 1fr; gap: 4px 18px; }
.times .retry dd { color: ${C.red}; }
.times:has(.retry) { grid-template-columns: 1fr 1fr 1fr; }
.times .split { grid-column: 1 / -1; }
.times .split dd { font-size: 13px; font-weight: 400; color: ${C.inkSoft}; }
.times .split span { white-space: nowrap; }
.code { display: inline-flex; align-items: center; min-height: 44px; padding: 0 12px; font-size: 14px; font-weight: 700; text-decoration: none; border: 2px solid ${C.ink}; white-space: nowrap; }
.empty { color: ${C.inkSoft}; }
footer { margin-top: 48px; font-size: 13px; color: ${C.inkSoft}; max-width: 720px; }
footer p { margin: 0 0 8px; }
@media (max-width: 720px) {
  header.top::before { width: 56px; height: 56px; right: 0; top: 8px; }
  header.top::after { width: 34px; height: 34px; right: 66px; top: 40px; }
  .totals { grid-template-columns: 1fr 1fr; gap: 12px; }
  .tile { padding: 12px 14px; }
  .tile b { font-size: 26px; }
  .feature, .hand { grid-template-columns: 1fr; gap: 10px; padding: 12px 12px 12px 24px; }
  .chip { width: 10px; }
  .feature .code, .hand .code { justify-self: start; }
  .times, .times:has(.retry) { width: auto; grid-template-columns: repeat(3, auto); justify-content: start; }
}
`;

/** Rewrites the static UTC times in the viewer's own time zone. */
const LOCAL_TIME_SCRIPT = `for (const t of document.querySelectorAll('time[datetime]')) {
  const d = new Date(t.dateTime);
  if (!isNaN(d)) t.textContent = d.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}`;

/** localStorage key (per browser, shared by the game page and the log; namespaced because Pages sites share an origin). */
const SEEN_KEY = `${PROJECT === ORIGINAL_PROJECT ? 'scope-creep' : `scope-creep:${PROJECT}`}:build-log:seen`;

/** Reads this browser's seen ids; null on a first visit or when storage is unavailable. */
const READ_SEEN = `const readSeen = () => {
  try {
    const list = JSON.parse(localStorage.getItem(${JSON.stringify(SEEN_KEY)}) ?? 'null');
    return Array.isArray(list) ? new Set(list) : null;
  } catch { return null; }
};
const saveSeen = (ids) => { try { localStorage.setItem(${JSON.stringify(SEEN_KEY)}, JSON.stringify(ids)); } catch {} };`;

/**
 * Flags items this browser hasn't seen as new, then remembers everything on the page as seen.
 * A first visit only records the baseline, so nothing is "new" until something ships after it.
 */
const SEEN_SCRIPT = `(() => {
  ${READ_SEEN}
  const items = [...document.querySelectorAll('[data-id]')];
  const seen = readSeen();
  if (seen) {
    for (const el of items) if (!seen.has(el.dataset.id)) el.classList.add('is-new');
    for (const counter of document.querySelectorAll('.new-count')) {
      const n = document.querySelectorAll('.' + counter.dataset.for + '.is-new').length;
      if (n) { counter.textContent = n + ' new'; counter.hidden = false; }
    }
  }
  saveSeen([...new Set([...(seen ?? []), ...items.map((el) => el.dataset.id)])]);
})();`;

function renderPage(data: {
  /** The game's name, from its <title>. */
  title: string;
  features: Feature[];
  hand: HandChange[];
  stats: MachineStats[];
  cycles: PoCycle[];
  machines: Record<string, MachineInfo>;
  repo?: string;
  sha: string;
  generatedAt: string;
}): string {
  const order = Object.keys(data.machines);
  const colorOf = (m: string): string => (order.includes(m) ? MACHINE_COLORS[order.indexOf(m) % MACHINE_COLORS.length]! : C.gray);
  const stats = data.stats.filter((s) => s.features > 0 || data.machines[s.id]);
  const handIds = itemIds([], data.hand);
  const sha = data.repo ? `<a href="${esc(`${data.repo}/commit/${data.sha}`)}">${esc(data.sha.slice(0, 7))}</a>` : esc(data.sha.slice(0, 7));
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="${C.paper}">
<title>Build log · ${esc(data.title)}</title>
<style>${CSS}</style>
</head>
<body>
<div class="wrap">
<a class="back card" href="../">← Play ${esc(data.title)}</a>
<header class="top">
  <h1>Build log</h1>
  <p class="lede">Every feature in <b>${esc(data.title)}</b>, which machine built it and how long it took. The game is planned, designed and written by local LLM agents; this page is generated on every deploy from the loop's own records, outside anything the agents can edit.</p>
</header>
<section class="totals" aria-label="Totals">${renderTotals(data.features, data.hand, data.cycles)}</section>

<h2>Machines</h2>
<section class="machines">${stats.map((s) => renderMachine(s, data.machines[s.id], colorOf(s.id))).join('\n')}</section>

<h2>Features <span class="new-count" data-for="feature" hidden></span></h2>
${data.features.length ? `<ol>${data.features.map((f) => renderFeature(f, colorOf, data.repo)).join('\n')}</ol>` : '<p class="empty">Nothing shipped yet.</p>'}

<h2>By hand <span class="new-count" data-for="hand" hidden></span></h2>
${data.hand.length ? `<ul>${data.hand.map((h, i) => renderHand(h, handIds[i]!, data.repo)).join('\n')}</ul>` : '<p class="empty">No hand-made changes.</p>'}

<footer>
  <p><b>agent time</b> is the time agents spent on a feature: <b>build</b>, the attempt that shipped, timed by the runner from claiming the task to merging it (writing the code, the checks and browser smoke test, fix rounds and the self-review); <b>design</b>, the architect's design pass; and <b>planning</b>, its share of the product owner's planning cycle that wrote it (the cycle's length split over the tasks it wrote; measured from cycle 40 on). A machine's agent time adds its builds, its designs and its planning cycles; the total also counts planning cycles that wrote no task. <b>idea → live</b> runs from the PO writing the task to the merge, including time spent waiting in a queue.</p>
  <p>Generated ${when(data.generatedAt)} from ${sha}.</p>
</footer>
</div>
<script>${LOCAL_TIME_SCRIPT}
${SEEN_SCRIPT}</script>
</body>
</html>
`;
}

/**
 * A paper-cut "Build log" button on the game page, visible on the menu and game-over screens only,
 * with a red counter for items this browser hasn't seen in the log yet.
 */
const gameLink = (ids: readonly string[]): string => `
<a id="sc-build-log" href="build-log/">Build log<span id="sc-build-log-new" hidden></span></a>
<style>
#sc-build-log { position: fixed; z-index: 10; top: max(12px, env(safe-area-inset-top)); left: max(12px, env(safe-area-inset-left));
  display: inline-flex; align-items: center; min-height: 44px; padding: 0 16px; font: 700 15px ${FONT}; color: ${C.ink};
  background: ${C.paperLight}; border: 2px solid ${C.ink}; box-shadow: 3px 3px 0 ${C.ink}2e; text-decoration: none; }
#sc-build-log:hover { background: ${C.yellow}; }
#sc-build-log[hidden] { display: none; }
#sc-build-log-new { position: absolute; top: -11px; right: -13px; min-width: 26px; height: 26px; padding: 0 6px; border-radius: 13px;
  font: 700 13px/22px ${FONT}; text-align: center; color: ${C.paperLight}; background: ${C.red}; border: 2px solid ${C.ink}; }
#sc-build-log-new[hidden] { display: none; }
</style>
<script>
(() => {
  const link = document.getElementById('sc-build-log');
  // Keep clicks on the link away from the game (the menu starts a run on any pointer release).
  for (const type of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend']) link.addEventListener(type, (e) => e.stopPropagation());
  ${READ_SEEN}
  const ids = ${JSON.stringify(ids).replace(/</g, '\\u003c')};
  const badge = document.getElementById('sc-build-log-new');
  const updateBadge = () => {
    const seen = readSeen();
    if (!seen) saveSeen(ids); // first visit: start counting from now
    const n = seen ? ids.filter((id) => !seen.has(id)).length : 0;
    badge.textContent = n > 99 ? '99+' : String(n);
    badge.hidden = n === 0;
    link.setAttribute('aria-label', n ? 'Build log, ' + n + ' new' : 'Build log');
  };
  updateBadge();
  window.addEventListener('pageshow', updateBadge); // coming back from the log via the back button
  const shownOn = new Set(['Menu', 'GameOver']);
  const update = () => {
    const scene = window.__SC__ && window.__SC__.scene;
    link.hidden = typeof scene === 'string' && !shownOn.has(scene) && scene !== 'none';
  };
  update();
  setInterval(update, 250);
})();
</script>
`;

function main(): void {
  const dist = process.argv[2];
  if (!dist || !fs.existsSync(path.join(dist, 'index.html'))) throw new Error('usage: node site/build-log.ts <built game dist folder>');

  const machines = (JSON.parse(fs.readFileSync(path.join(REPO, 'agents', 'machines.json'), 'utf8')) as { machines: Record<string, MachineInfo> }).machines;
  const { tasks } = listTasks(true);
  const commits = parseGitLog(git(['log', `--format=${GIT_LOG_FORMAT}`]));
  const gameCommits = parseGitLog(git(['log', `--format=${GIT_LOG_FORMAT}`, '--', GAME_REL]));
  const indexFile = path.join(dist, 'index.html');
  const index = fs.readFileSync(indexFile, 'utf8');
  const title = /<title>([^<]+)<\/title>/.exec(index)?.[1]?.trim() || PROJECT;

  const cycles = poCycles(commits);
  const written = taskCycles(git(['log', '--diff-filter=A', '--no-renames', '--format=%x1e%s', '--name-only', '--', TASKS_REL]));
  const features = collectFeatures(tasks, commits, gameCommits, planShares(cycles, written));
  const hand = collectHandChanges(gameCommits);
  const html = renderPage({
    title,
    features,
    hand,
    stats: machineStats(features, Object.keys(machines), cycles),
    cycles,
    machines,
    repo: repoUrl(),
    sha: git(['rev-parse', 'HEAD']).trim(),
    generatedAt: new Date().toISOString(),
  });

  fs.mkdirSync(path.join(dist, 'build-log'), { recursive: true });
  fs.writeFileSync(path.join(dist, 'build-log', 'index.html'), html);
  if (!index.includes('id="sc-build-log"')) {
    const link = gameLink(itemIds(features, hand));
    fs.writeFileSync(indexFile, index.includes('</body>') ? index.replace('</body>', `${link}</body>`) : index + link);
  }
  console.log(`build log: ${features.length} features, ${hand.length} hand changes -> ${path.join(dist, 'build-log', 'index.html')}`);
}

main();
