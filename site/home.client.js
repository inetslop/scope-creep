/**
 * The front page's behavior (inlined into index.html by site/home.ts, after site/scenes.js):
 * the hero that rotates through the games, the live scenes, Critter Clash's top players of the
 * day (fetched live from the leaderboard), and times shown as "12 min ago". The page's data comes
 * in the JSON block #page-data. Plain browser JavaScript, no modules.
 */
(() => {
  const DATA = JSON.parse(document.getElementById('page-data').textContent);
  const { KINDS, rnd } = SceneKinds; // eslint-disable-line no-undef
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // A phone can't hover: there, a tile's game plays whenever it is in view.
  const canHover = matchMedia('(hover: hover)').matches;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // ---------- times, as "12 min ago" by the viewer's clock, so they stay right between deploys ----------
  const ago = (iso) => {
    const s = (Date.now() - Date.parse(iso)) / 1000;
    if (!Number.isFinite(s)) return '';
    if (s < 90) return 'just now';
    if (s < 3600) return `${Math.round(s / 60)} min ago`;
    if (s < 36 * 3600) return `${Math.round(s / 3600)} h ago`;
    return `${Math.round(s / 86400)} days ago`;
  };
  const showTimes = (root = document) => {
    for (const t of root.querySelectorAll('time[datetime]')) {
      const text = ago(t.dateTime);
      if (text) { t.title = t.title || t.textContent; t.textContent = text; }
    }
  };
  showTimes();

  // ---------- the hero: every game in turn ----------
  const games = DATA.games;
  const ROTATE_MS = 8000;
  let current = 0;
  let shownAt = performance.now();
  let pausedAt = 0;
  function feature(i) {
    current = i;
    const g = games[i];
    document.querySelectorAll('.hero .layer').forEach((l) => l.classList.toggle('on', Number(l.dataset.game) === i));
    document.querySelectorAll('[data-pick]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.pick) === i)));
    $('#h-status').classList.toggle('parked', !g.active);
    $('#h-status-text').textContent = g.active ? 'Being built right now' : 'Playable · parked';
    $('#h-title').innerHTML = g.title.split(' ').map((word, w) => `<span class="clip">${[...word].map((ch, k) => `<span class="ch" style="animation-delay:${0.05 + (w * 6 + k) * 0.04}s">${esc(ch)}</span>`).join('')}</span>`).join(' ');
    $('#h-blurb').textContent = g.blurb;
    $('#h-chips').innerHTML = g.chips.map((c) => `<span>${c}</span>`).join('');
    showTimes($('#h-chips'));
    const playBtn = $('#h-play');
    if (g.playable) { playBtn.href = `${g.id}/`; playBtn.textContent = g.active ? 'Play now' : `Play ${g.title}`; playBtn.hidden = false; }
    else playBtn.hidden = true;
    const log = $('#h-log');
    log.hidden = !g.hasLog;
    log.href = `${g.id}/build-log/`;
    shownAt = performance.now();
  }
  document.querySelectorAll('[data-pick]').forEach((b) => b.addEventListener('click', () => feature(Number(b.dataset.pick))));
  const hero = $('.hero');
  let hovering = false;
  hero.addEventListener('pointerenter', () => { hovering = true; pausedAt = performance.now(); });
  hero.addEventListener('pointerleave', () => { hovering = false; shownAt += performance.now() - pausedAt; });
  function rotate(now) {
    if (games.length < 2 || hovering) return;
    const f = Math.min(1, (now - shownAt) / ROTATE_MS);
    document.querySelectorAll('[data-pick]').forEach((b) => (b.querySelector('.fill').style.width = Number(b.dataset.pick) === current ? `${f * 100}%` : '0'));
    if (f >= 1 && !reduced) feature((current + 1) % games.length);
  }

  // ---------- the scenes ----------
  const scenes = [];
  function setup(sc) {
    const box = sc.el.getBoundingClientRect();
    if (box.width < 2 || box.height < 2) return;
    const dpr = Math.min(2, devicePixelRatio || 1);
    const zoom = Number(sc.el.dataset.zoom) || 1;
    sc.el.width = Math.round(box.width * dpr);
    sc.el.height = Math.round(box.height * dpr);
    Object.assign(sc, { g: sc.el.getContext('2d'), zoom, dpr, w: box.width / zoom, h: box.height / zoom, t: rnd(0, 20) });
    KINDS[sc.kind].init(sc);
    // A few seconds in, so the first frame already shows a game going on.
    for (let i = 0; i < 90; i++) { sc.t += 1 / 30; KINDS[sc.kind].step(sc, 1 / 30); }
    sc.ready = true;
    render(sc);
  }
  function render(sc) {
    sc.g.setTransform(sc.dpr * sc.zoom, 0, 0, sc.dpr * sc.zoom, 0, 0);
    KINDS[sc.kind].draw(sc, sc.g);
  }
  for (const el of document.querySelectorAll('canvas[data-scene]')) {
    if (!KINDS[el.dataset.scene]) continue;
    scenes.push({ el, kind: el.dataset.scene, hero: el.dataset.hero, hoverOnly: canHover && el.dataset.hover === '1', visible: false, hovered: false });
  }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const sc = scenes.find((s) => s.el === e.target);
      if (!sc) continue;
      sc.visible = e.isIntersecting;
      if (sc.visible && !sc.ready) setup(sc);
    }
  });
  for (const sc of scenes) {
    io.observe(sc.el);
    if (sc.hoverOnly) {
      const host = sc.el.closest('a') || sc.el.parentElement;
      host.addEventListener('pointerenter', () => (sc.hovered = true));
      host.addEventListener('pointerleave', () => (sc.hovered = false));
      host.addEventListener('focus', () => (sc.hovered = true));
      host.addEventListener('blur', () => (sc.hovered = false));
    }
  }
  addEventListener('resize', () => {
    for (const sc of scenes) sc.ready = false;
    requestAnimationFrame(() => { for (const sc of scenes) if (sc.visible) setup(sc); });
  });
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!reduced) {
      for (const sc of scenes) {
        if (!sc.visible || !sc.ready) continue;
        if (sc.hoverOnly && !sc.hovered) continue;
        if (sc.hero !== undefined && Number(sc.hero) !== current) continue; // only the featured game runs
        sc.t += dt;
        KINDS[sc.kind].step(sc, dt);
        render(sc);
      }
    }
    rotate(now);
    requestAnimationFrame(frame);
  }
  feature(0);
  // Every scene shows a still of its game at once (they animate only while in view).
  for (const sc of scenes) if (!sc.ready) setup(sc);
  requestAnimationFrame(frame);

  // ---------- top players today, live from the leaderboard ----------
  const board = DATA.board;
  if (board) {
    fetch(`${board.url}/cc/board?b=today&limit=5`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((b) => {
        const list = $('#top-players');
        list.innerHTML = b.entries.length
          ? b.entries.map((e) => `<li><span class="r">${e.rank}</span><span class="n">${esc(e.name)}</span><span class="s">${Number(e.score).toLocaleString('en-US')}</span></li>`).join('')
          : '<li class="empty">No one yet today: be the first.</li>';
        $('#players').hidden = false;
        $('#rows').classList.add('two');
      })
      .catch(() => { /* No board this time: the row stays hidden. */ });
  }
})();
