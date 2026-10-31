/**
 * The front page's live game scenes (inlined into index.html by site/home.ts): each game drawn in
 * its own style on a canvas, playing by itself. Critter Clash's critters on mint ("critters"),
 * Chokepoint's towers along a winding road ("road"), Scope Creep's shapes on graph paper ("paper").
 * Plain browser JavaScript, no modules: it defines SceneKinds for site/home.client.js.
 *
 * A kind is { init(s), step(s, dt), draw(s, g) } over a state `s` with the canvas size in s.w/s.h
 * and the time in s.t. A new game gets a kind here and a line in SCENES (site/home.ts).
 */
// eslint-disable-next-line no-unused-vars
const SceneKinds = (() => {
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const INK = '#3b3355';

  function face(g, x, y, r, dx, dy, mood) {
    const l = Math.hypot(dx, dy) || 1;
    const lx = (dx / l) * r * 0.1, ly = (dy / l) * r * 0.1;
    for (const s of [-1, 1]) {
      const ex = x + s * r * 0.34, ey = y - r * 0.12;
      g.fillStyle = '#fff'; g.beginPath(); g.arc(ex, ey, r * 0.26, 0, 7); g.fill();
      g.fillStyle = INK; g.beginPath(); g.arc(ex + lx, ey + ly, r * 0.13, 0, 7); g.fill();
      if (mood === 'angry') {
        g.strokeStyle = INK; g.lineWidth = Math.max(1.4, r * 0.11); g.lineCap = 'round';
        g.beginPath(); g.moveTo(ex + s * r * 0.25, ey - r * 0.38); g.lineTo(ex - s * r * 0.18, ey - r * 0.26); g.stroke();
      }
    }
    if (mood === 'happy') { g.fillStyle = 'rgba(255,120,150,0.5)'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(x + s * r * 0.55, y + r * 0.2, r * 0.14, r * 0.09, 0, 0, 7); g.fill(); } }
  }
  function blob(g, x, y, r, color, t, seed) {
    const sq = Math.sin(t * 8 + seed) * 0.05;
    g.fillStyle = 'rgba(40,30,70,0.13)'; g.beginPath(); g.ellipse(x, y + r * 0.85, r * 0.9, r * 0.3, 0, 0, 7); g.fill();
    g.save(); g.translate(x, y); g.scale(1 + sq, 1 - sq);
    g.fillStyle = color; g.strokeStyle = INK; g.lineWidth = Math.max(2, r * 0.17);
    g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill(); g.stroke(); g.restore();
  }

  const KINDS = {
    critters: {
      init(s) {
        const n = Math.max(3, Math.round((s.w * s.h) / 60000));
        s.players = ['#4dabf7', '#ffd43b', '#e599f7', '#38d9a9'].slice(0, Math.min(4, n)).map((c) => ({ x: rnd(0.2, 0.8) * s.w, y: rnd(0.25, 0.75) * s.h, tx: 0, ty: 0, vx: 0, vy: 0, c, cd: rnd(0, 0.6), r: 15 }));
        s.dots = Array.from({ length: n * 4 }, () => KINDS.critters.spawn(s));
        s.bolts = []; s.pops = []; s.gems = [];
      },
      spawn(s) {
        const e = Math.floor(rnd(0, 4));
        const x = e === 0 ? -20 : e === 1 ? s.w + 20 : rnd(0, s.w), y = e === 2 ? -20 : e === 3 ? s.h + 20 : rnd(0, s.h);
        const big = Math.random() < 0.12;
        return { x, y, r: big ? 19 : 11, c: big ? '#a78bfa' : '#ff6b6b', sp: rnd(28, 46), seed: rnd(0, 9), hp: big ? 3 : 1 };
      },
      step(s, dt) {
        for (const p of s.players) {
          if (!p.tx || Math.hypot(p.tx - p.x, p.ty - p.y) < 20) { p.tx = rnd(0.15, 0.85) * s.w; p.ty = rnd(0.2, 0.8) * s.h; }
          const dx = p.tx - p.x, dy = p.ty - p.y, l = Math.hypot(dx, dy) || 1;
          p.vx += ((dx / l) * 60 - p.vx) * dt * 2; p.vy += ((dy / l) * 60 - p.vy) * dt * 2;
          p.x += p.vx * dt; p.y += p.vy * dt;
          p.cd -= dt;
          if (p.cd <= 0) {
            let best, bd = 240 * 240;
            for (const d of s.dots) { const q = (d.x - p.x) ** 2 + (d.y - p.y) ** 2; if (q < bd) { bd = q; best = d; } }
            if (best) { const a = Math.atan2(best.y - p.y, best.x - p.x); s.bolts.push({ x: p.x, y: p.y, vx: Math.cos(a) * 260, vy: Math.sin(a) * 260, life: 1.2, rot: 0 }); p.cd = 0.45; }
          }
        }
        for (const d of s.dots) {
          let best = s.players[0], bd = Infinity;
          for (const p of s.players) { const q = (p.x - d.x) ** 2 + (p.y - d.y) ** 2; if (q < bd) { bd = q; best = p; } }
          const a = Math.atan2(best.y - d.y, best.x - d.x) + Math.sin(d.seed + s.t) * 0.4;
          if (bd > (best.r + d.r + 6) ** 2) { d.x += Math.cos(a) * d.sp * dt; d.y += Math.sin(a) * d.sp * dt; }
          d.dx = Math.cos(a); d.dy = Math.sin(a);
        }
        for (const b of s.bolts) {
          b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; b.rot += dt * 9;
          for (let i = 0; i < s.dots.length; i++) {
            const d = s.dots[i];
            if ((d.x - b.x) ** 2 + (d.y - b.y) ** 2 < (d.r + 5) ** 2) {
              b.life = 0; d.hp--;
              if (d.hp <= 0) { s.pops.push({ x: d.x, y: d.y, t: 0, r: d.r }); s.gems.push({ x: d.x, y: d.y, t: 0 }); s.dots[i] = KINDS.critters.spawn(s); }
              break;
            }
          }
        }
        s.bolts = s.bolts.filter((b) => b.life > 0);
        s.pops = s.pops.filter((p) => (p.t += dt) < 0.5);
        s.gems = s.gems.filter((g) => (g.t += dt) < 2.5);
      },
      draw(s, g) {
        g.fillStyle = '#dff1e9'; g.fillRect(0, 0, s.w, s.h);
        g.fillStyle = '#c3e3d4';
        const off = (s.t * 6) % 36;
        for (let x = -off; x < s.w; x += 36) for (let y = -off; y < s.h; y += 36) { g.beginPath(); g.arc(x, y, 1.8, 0, 7); g.fill(); }
        for (const gm of s.gems) { g.save(); g.translate(gm.x, gm.y - Math.sin(gm.t * 6) * 2); g.rotate(Math.PI / 4); g.fillStyle = '#51cf66'; g.strokeStyle = INK; g.lineWidth = 2; g.fillRect(-4, -4, 8, 8); g.strokeRect(-4, -4, 8, 8); g.restore(); }
        for (const d of s.dots) { blob(g, d.x, d.y, d.r, d.c, s.t, d.seed); face(g, d.x, d.y, d.r, d.dx || 0, d.dy || 1, 'angry'); }
        for (const p of s.players) { blob(g, p.x, p.y, p.r, p.c, s.t, p.r); face(g, p.x, p.y, p.r, p.vx, p.vy, 'happy'); }
        for (const b of s.bolts) {
          g.save(); g.translate(b.x, b.y); g.rotate(b.rot); g.beginPath();
          for (let i = 0; i < 10; i++) { const r = i % 2 ? 2.4 : 6, a = (i / 10) * Math.PI * 2; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
          g.closePath(); g.fillStyle = '#ffd43b'; g.fill(); g.strokeStyle = INK; g.lineWidth = 1.5; g.stroke(); g.restore();
        }
        for (const p of s.pops) {
          g.globalAlpha = 1 - p.t / 0.5;
          for (let i = 0; i < 8; i++) { const a = (i / 8) * 7, d = p.r * 0.4 + p.t * 70; g.fillStyle = ['#ff6b6b', '#ffd43b', '#38d9a9', '#f783ac'][i % 4]; g.beginPath(); g.arc(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, 3, 0, 7); g.fill(); }
          g.globalAlpha = 1;
        }
      },
    },

    road: {
      init(s) {
        const m = Math.min(s.w, s.h) * 0.09;
        const x0 = m, x1 = s.w - m, y0 = m * 1.4, y1 = s.h - m * 1.4;
        const cols = Math.max(3, Math.round(s.w / 150));
        // Enter at the top left, snake down and up through `cols` columns, leave at the right.
        s.path = [[x0 - m, y0]];
        for (let i = 0; i < cols; i++) {
          const x = x0 + ((x1 - x0) * (i + 0.5)) / cols;
          const [from, to] = i % 2 ? [y1, y0] : [y0, y1];
          s.path.push([x, from], [x, to]);
        }
        s.path.push([x1 + m, s.path[s.path.length - 1][1]]);
        s.len = 0; s.segs = [];
        for (let i = 1; i < s.path.length; i++) { const [ax, ay] = s.path[i - 1], [bx, by] = s.path[i]; const l = Math.hypot(bx - ax, by - ay); s.segs.push({ ax, ay, bx, by, l, at: s.len }); s.len += l; }
        s.towers = [];
        // Towers stand between the road's columns.
        for (let i = 0; i < cols - 1; i++) { const x = x0 + ((x1 - x0) * (i + 1)) / cols; s.towers.push({ x, y: (y0 + y1) / 2 + (i % 2 ? -1 : 1) * (y1 - y0) * 0.18, c: pick(['#3c86d6', '#5cb85f', '#f3c33c', '#24a99c']), a: 0, cd: rnd(0, 1) }); }
        s.foes = []; s.shots = []; s.pops = []; s.next = 0;
        s.rw = Math.max(14, Math.min(s.w, s.h) * 0.08);
      },
      at(s, d) { for (const g of s.segs) if (d <= g.at + g.l) { const f = (d - g.at) / g.l; return [g.ax + (g.bx - g.ax) * f, g.ay + (g.by - g.ay) * f]; } const l = s.segs[s.segs.length - 1]; return [l.bx, l.by]; },
      step(s, dt) {
        s.next -= dt;
        if (s.next <= 0) { s.next = rnd(0.5, 1.1); s.foes.push({ d: 0, sp: rnd(40, 70), hp: 3, c: pick(['#e5534b', '#e5534b', '#f0883e', '#8b6cdb']), sq: Math.random() < 0.3 }); }
        for (const f of s.foes) { f.d += f.sp * dt; [f.x, f.y] = KINDS.road.at(s, f.d); }
        s.foes = s.foes.filter((f) => f.d < s.len && f.hp > 0);
        for (const t of s.towers) {
          let best, bd = 150 * 150;
          for (const f of s.foes) { const q = (f.x - t.x) ** 2 + (f.y - t.y) ** 2; if (q < bd) { bd = q; best = f; } }
          if (best) { const a = Math.atan2(best.y - t.y, best.x - t.x); t.a += (((a - t.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * Math.min(1, dt * 10); }
          t.cd -= dt;
          if (best && t.cd <= 0) { t.cd = 0.7; s.shots.push({ x: t.x, y: t.y, f: best, c: t.c }); }
        }
        for (const sh of s.shots) {
          const dx = sh.f.x - sh.x, dy = sh.f.y - sh.y, l = Math.hypot(dx, dy);
          if (l < 8) { sh.done = true; sh.f.hp--; if (sh.f.hp <= 0) s.pops.push({ x: sh.f.x, y: sh.f.y, t: 0, c: sh.f.c }); continue; }
          sh.x += (dx / l) * 320 * dt; sh.y += (dy / l) * 320 * dt;
        }
        s.shots = s.shots.filter((x) => !x.done && x.f.hp > 0);
        s.pops = s.pops.filter((p) => (p.t += dt) < 0.4);
      },
      draw(s, g) {
        g.fillStyle = '#d9e2e0'; g.fillRect(0, 0, s.w, s.h);
        const m = Math.min(s.w, s.h) * 0.05;
        g.fillStyle = 'rgba(44,58,64,0.12)'; rr(g, m, m + 6, s.w - m * 2, s.h - m * 2, 22); g.fill();
        g.fillStyle = '#edf2f1'; rr(g, m, m, s.w - m * 2, s.h - m * 2, 22); g.fill();
        g.fillStyle = '#c9d4d2';
        for (let x = m + 20; x < s.w - m; x += 32) for (let y = m + 20; y < s.h - m; y += 32) { g.beginPath(); g.arc(x, y, 1.4, 0, 7); g.fill(); }
        g.lineJoin = 'round'; g.lineCap = 'round';
        g.strokeStyle = 'rgba(44,58,64,0.10)'; g.lineWidth = s.rw + 6; g.beginPath(); s.path.forEach(([x, y], i) => (i ? g.lineTo(x, y + 4) : g.moveTo(x, y + 4))); g.stroke();
        g.strokeStyle = '#fff'; g.lineWidth = s.rw; g.beginPath(); s.path.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
        const [ex, ey] = s.path[s.path.length - 1];
        g.fillStyle = '#2c3a40'; rr(g, ex - 26, ey - 14, 28, 28, 6); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(ex - 12, ey, 6, 0, 7); g.stroke();
        for (const f of s.foes) { g.fillStyle = f.c; if (f.sq) { rr(g, f.x - 8, f.y - 8, 16, 16, 4); g.fill(); } else { g.beginPath(); g.arc(f.x, f.y, 8, 0, 7); g.fill(); } }
        for (const t of s.towers) {
          g.fillStyle = 'rgba(44,58,64,0.15)'; rr(g, t.x - 15, t.y - 12, 30, 30, 8); g.fill();
          g.fillStyle = '#fff'; rr(g, t.x - 15, t.y - 15, 30, 30, 8); g.fill();
          g.save(); g.translate(t.x, t.y); g.rotate(t.a); g.fillStyle = t.c; rr(g, 0, -4, 16, 8, 3); g.fill(); g.beginPath(); g.arc(0, 0, 8, 0, 7); g.fill(); g.restore();
        }
        for (const sh of s.shots) { g.fillStyle = sh.c; g.beginPath(); g.arc(sh.x, sh.y, 3.5, 0, 7); g.fill(); }
        for (const p of s.pops) { g.strokeStyle = p.c; g.globalAlpha = 1 - p.t / 0.4; g.lineWidth = 3; g.beginPath(); g.arc(p.x, p.y, 8 + p.t * 50, 0, 7); g.stroke(); g.globalAlpha = 1; }
      },
    },

    paper: {
      init(s) { s.shapes = Array.from({ length: Math.max(6, Math.round((s.w * s.h) / 22000)) }, () => KINDS.paper.spawn(s)); s.ink = []; s.bursts = []; s.cd = 0; s.px = s.w / 2; s.py = s.h / 2; },
      spawn(s) {
        const a = rnd(0, Math.PI * 2), d = Math.hypot(s.w, s.h) / 2 + 30;
        return { x: s.w / 2 + Math.cos(a) * d, y: s.h / 2 + Math.sin(a) * d, k: pick(['tri', 'tri', 'dia', 'sq']), sp: rnd(30, 55), rot: rnd(0, 6), vr: rnd(-1.5, 1.5) };
      },
      step(s, dt) {
        s.px = s.w / 2 + Math.cos(s.t * 0.7) * s.w * 0.16; s.py = s.h / 2 + Math.sin(s.t * 1.1) * s.h * 0.14;
        for (const sh of s.shapes) {
          const dx = s.px - sh.x, dy = s.py - sh.y, l = Math.hypot(dx, dy) || 1;
          sh.x += (dx / l) * sh.sp * dt; sh.y += (dy / l) * sh.sp * dt; sh.rot += sh.vr * dt;
          if (l < 18) Object.assign(sh, KINDS.paper.spawn(s));
        }
        s.cd -= dt;
        if (s.cd <= 0) {
          let best, bd = Infinity;
          for (const sh of s.shapes) { const q = (sh.x - s.px) ** 2 + (sh.y - s.py) ** 2; if (q < bd) { bd = q; best = sh; } }
          if (best) { const a = Math.atan2(best.y - s.py, best.x - s.px); s.ink.push({ x: s.px, y: s.py, vx: Math.cos(a) * 340, vy: Math.sin(a) * 340, life: 1 }); s.cd = 0.18; }
        }
        for (const b of s.ink) {
          b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
          for (const sh of s.shapes) if ((sh.x - b.x) ** 2 + (sh.y - b.y) ** 2 < 15 * 15) { b.life = 0; s.bursts.push({ x: sh.x, y: sh.y, t: 0, k: sh.k }); Object.assign(sh, KINDS.paper.spawn(s)); break; }
        }
        s.ink = s.ink.filter((b) => b.life > 0);
        s.bursts = s.bursts.filter((b) => (b.t += dt) < 0.5);
      },
      draw(s, g) {
        g.fillStyle = '#f1e9d8'; g.fillRect(0, 0, s.w, s.h);
        g.strokeStyle = '#e1d5bb'; g.lineWidth = 1;
        g.beginPath();
        for (let x = 0; x < s.w; x += 24) { g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, s.h); }
        for (let y = 0; y < s.h; y += 24) { g.moveTo(0, y + 0.5); g.lineTo(s.w, y + 0.5); }
        g.stroke();
        const COL = { tri: '#e03131', dia: '#1f1f1f', sq: '#f2c230' };
        for (const sh of s.shapes) {
          g.save(); g.translate(sh.x, sh.y); g.rotate(sh.rot); g.beginPath();
          if (sh.k === 'tri') { g.moveTo(0, -11); g.lineTo(10, 8); g.lineTo(-10, 8); }
          else if (sh.k === 'dia') { g.moveTo(0, -12); g.lineTo(9, 0); g.lineTo(0, 12); g.lineTo(-9, 0); }
          else { g.rect(-9, -9, 18, 18); }
          g.closePath(); g.fillStyle = COL[sh.k]; g.fill(); g.strokeStyle = '#1f1f1f'; g.lineWidth = 2.5; g.stroke(); g.restore();
        }
        for (const b of s.ink) { g.fillStyle = '#2f6fdd'; g.beginPath(); g.arc(b.x, b.y, 3.2, 0, 7); g.fill(); }
        for (const b of s.bursts) { g.strokeStyle = COL[b.k]; g.lineWidth = 3; g.globalAlpha = 1 - b.t / 0.5; for (let i = 0; i < 6; i++) { const a = (i / 6) * 7, d = 6 + b.t * 60; g.beginPath(); g.moveTo(b.x + Math.cos(a) * d * 0.5, b.y + Math.sin(a) * d * 0.5); g.lineTo(b.x + Math.cos(a) * d, b.y + Math.sin(a) * d); g.stroke(); } g.globalAlpha = 1; }
        g.fillStyle = 'rgba(0,0,0,0.12)'; g.beginPath(); g.arc(s.px + 3, s.py + 4, 13, 0, 7); g.fill();
        g.fillStyle = '#2f6fdd'; g.strokeStyle = '#1f1f1f'; g.lineWidth = 3; g.beginPath(); g.arc(s.px, s.py, 13, 0, 7); g.fill(); g.stroke();
      },
    }
  };
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  return { KINDS, rnd };
})();
