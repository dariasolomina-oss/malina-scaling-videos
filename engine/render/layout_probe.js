// Layout probe: evaluated in the page after window.render(t). Finds text and shapes
// that collide, escape their card or leave the frame. Geometry only; a visual review
// still follows. See README.md "Layout check".
function probe(opts) {
  const W = innerWidth, H = innerHeight, MIN_OPACITY = 0.6, MAX = 40;
  const safe = opts && opts.safe;  // {top,right,bottom,left} margins in px, or null
  const issues = [];
  // Hit testing must follow paint order: animation layers often disable pointer events.
  const hitStyle = document.createElement('style');
  hitStyle.textContent = '*{pointer-events:auto!important}';
  document.head.appendChild(hitStyle);
  const R = r => [Math.round(r.left), Math.round(r.top), Math.round(r.right - r.left), Math.round(r.bottom - r.top)];
  const rect = r => ({left: r.left, top: r.top, right: r.right, bottom: r.bottom});
  const area = r => Math.max(0, r.right - r.left) * Math.max(0, r.bottom - r.top);
  const inter = (a, b) => ({left: Math.max(a.left, b.left), top: Math.max(a.top, b.top),
    right: Math.min(a.right, b.right), bottom: Math.min(a.bottom, b.bottom)});
  const overlap = (a, b) => { const i = inter(a, b); return (i.right - i.left > 3 && i.bottom - i.top > 3) ? area(i) : 0; };
  const inside = (a, b, tol = 2) => a.left >= b.left - tol && a.top >= b.top - tol && a.right <= b.right + tol && a.bottom <= b.bottom + tol;
  const parentOf = e => e.parentElement || (e.parentNode && e.parentNode.host) || null;
  const opacityCache = new Map();
  const opacity = el => {
    if (opacityCache.has(el)) return opacityCache.get(el);
    let o = 1;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') o = 0;
    else { o = parseFloat(cs.opacity); const p = parentOf(el); if (p && p.nodeType === 1) o *= opacity(p); }
    opacityCache.set(el, o);
    return o;
  };
  const isSvg = el => el instanceof SVGElement;
  const snippet = el => {
    const text = (el.textContent || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 60);
    if (text) return text;
    const cls = typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).join('.') : '';
    return 'shape ' + el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + cls;
  };
  const add = (type, severity, text, boxes) => { if (issues.length < MAX) issues.push({type, severity, text, boxes: boxes.map(R)}); };
  // Visible area of an element after clipping ancestors (overflow, svg viewport).
  const clipOf = el => {
    let c = {left: -1e9, top: -1e9, right: 1e9, bottom: 1e9};
    for (let p = parentOf(el); p && p.nodeType === 1 && p !== document.documentElement; p = parentOf(p)) {
      const cs = getComputedStyle(p);
      const clips = (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') && p !== document.body;
      if (clips || (p.tagName.toLowerCase() === 'svg' && cs.overflow !== 'visible')) c = inter(c, rect(p.getBoundingClientRect()));
    }
    return c;
  };
  const skip = new Set(['script', 'style', 'noscript', 'template', 'title', 'defs', 'clippath', 'mask', 'symbol', 'marker', 'pattern', 'lineargradient', 'radialgradient', 'filter']);
  const hidden = el => { for (let e = el; e && e.nodeType === 1; e = parentOf(e)) if (skip.has(e.tagName.toLowerCase())) return true; return false; };

  // 1. Text runs (line boxes of each visible text node).
  const texts = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const el = n.parentElement;
    if (!el || !n.nodeValue.trim() || hidden(el)) continue;
    const o = opacity(el);
    if (o < 0.1) continue;
    let rects;
    if (isSvg(el)) rects = [rect(el.getBoundingClientRect())];
    else { const range = document.createRange(); range.selectNodeContents(n); rects = [...range.getClientRects()].map(rect); }
    rects = rects.filter(r => r.right - r.left > 1 && r.bottom - r.top > 1);
    if (!rects.length) continue;
    const clip = clipOf(el);
    const shown = rects.map(r => inter(r, clip)).filter(r => r.right - r.left > 1 && r.bottom - r.top > 1);
    if (!shown.length) continue;  // fully masked: not visible at this moment
    if (rects.some(r => r.left < clip.left - 3 || r.right > clip.right + 3)) add('text_clipped', 'error', snippet(el), rects);
    else if (rects.some(r => !inside(r, clip, 3))) add('text_clipped_vertically', 'warning', snippet(el), rects);
    const visible = shown.filter(r => r.right > 0 && r.bottom > 0 && r.left < W && r.top < H);
    if (!visible.length) continue;  // off stage
    if (visible.some(r => r.left < -2 || r.top < -2 || r.right > W + 2 || r.bottom > H + 2)) add('text_off_frame', 'error', snippet(el), visible);
    else if (safe && visible.some(r => r.left < safe.left - 2 || r.top < safe.top - 2 || r.right > W - safe.right + 2 || r.bottom > H - safe.bottom + 2))
      add('text_outside_safe_zone', 'error', snippet(el), visible);
    const fs = parseFloat(getComputedStyle(el).fontSize) || 0;
    const scale = isSvg(el) ? 1 : (el.getBoundingClientRect().height / Math.max(1, el.offsetHeight || el.getBoundingClientRect().height));
    if (o >= MIN_OPACITY && Math.min(...visible.map(r => r.bottom - r.top)) < Math.max(14, Math.min(W, H) * 0.016) && fs * scale < Math.min(W, H) * 0.018)
      add('text_too_small', 'warning', snippet(el), visible);
    texts.push({el, rects: visible, opacity: o});
  }
  // 2. Shapes: cards, badges, images, graphics.
  const boxes = [];
  const all = document.body.querySelectorAll('*');
  for (const el of all) {
    const tag = el.tagName.toLowerCase();
    if (hidden(el)) continue;
    if (isSvg(el) && tag !== 'svg') continue;
    if (tag === 'svg' && el.ownerSVGElement) continue;
    const o = opacity(el);
    if (o < MIN_OPACITY) continue;
    const cs = getComputedStyle(el);
    const media = ['img', 'svg', 'canvas', 'video'].includes(tag);
    const painted = (cs.backgroundColor && !/rgba\(.*,\s*0\)$|transparent/.test(cs.backgroundColor)) || cs.backgroundImage !== 'none' ||
      ['Top', 'Right', 'Bottom', 'Left'].some(s => parseFloat(cs['border' + s + 'Width']) > 0 && cs['border' + s + 'Style'] !== 'none') || cs.boxShadow !== 'none';
    if (!media && !painted) continue;
    const r = rect(el.getBoundingClientRect());
    if (r.right - r.left < 12 || r.bottom - r.top < 12 || area(r) > W * H * 0.6) continue;
    const vis = inter(r, clipOf(el));
    if (vis.right - vis.left < 4 || vis.bottom - vis.top < 4) continue;
    const hasText = texts.some(t => el.contains(t.el));
    boxes.push({el, r, vis, hasText, media});
  }
  const related = (a, b) => a.contains(b) || b.contains(a);
  // Shape leaves the frame or escapes the painted card it belongs to.
  for (const b of boxes) {
    if (b.vis.left < -2 || b.vis.top < -2 || b.vis.right > W + 2 || b.vis.bottom > H + 2) {
      if (b.vis.right > 0 && b.vis.bottom > 0 && b.vis.left < W && b.vis.top < H)
        add('shape_cut_by_frame', b.hasText ? 'error' : 'warning', snippet(b.el), [b.vis]);
    }
    for (let p = parentOf(b.el); p && p.nodeType === 1; p = parentOf(p)) {
      const card = boxes.find(x => x.el === p);
      if (!card) continue;
      if (!inside(b.vis, card.vis, 2) && overlap(b.vis, card.vis) > 0)
        add('escapes_container', b.hasText ? 'error' : 'warning', snippet(b.el), [b.vis, card.vis]);
      break;  // nearest painted ancestor only
    }
  }
  // Shapes that partly cover each other (one not inside the other).
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], b = boxes[j];
    if (related(a.el, b.el)) continue;
    const ov = overlap(a.vis, b.vis);
    if (!ov || inside(a.vis, b.vis, 2) || inside(b.vis, a.vis, 2)) continue;
    if (ov < 0.02 * Math.min(area(a.vis), area(b.vis))) continue;
    add('shapes_overlap', 'warning', snippet(a.el) + ' / ' + snippet(b.el), [a.vis, b.vis]);
  }
  // Text that collides with other text: compare ink boxes (line boxes minus leading).
  const ink = r => { const h = r.bottom - r.top, pad = h * 0.22; return {left: r.left + 1, right: r.right - 1, top: r.top + pad, bottom: r.bottom - pad}; };
  for (let i = 0; i < texts.length; i++) {
    const t = texts[i];
    if (t.opacity < MIN_OPACITY) continue;
    for (let j = i + 1; j < texts.length; j++) {
      const u = texts[j];
      if (u.opacity < MIN_OPACITY || u.el === t.el) continue;
      let hit = false;
      for (const a of t.rects) { for (const b of u.rects) {
        const A = ink(a), B = ink(b), ov = overlap(A, B);
        if (ov > 0.08 * Math.min(area(A), area(B))) { add('text_overlap', 'error', snippet(t.el) + ' / ' + snippet(u.el), [a, b]); hit = true; break; }
      } if (hit) break; }
    }
  }
  // Text covered by another painted element drawn on top of it.
  const paintedCache = new Map();
  const painted = el => {
    if (paintedCache.has(el)) return paintedCache.get(el);
    let v = false;
    const tag = el.tagName.toLowerCase();
    if (el.id === '__layout_marks' || opacity(el) < MIN_OPACITY) v = false;
    else if (el instanceof SVGElement && tag !== 'svg') {
      const cs = getComputedStyle(el);
      v = !['g', 'defs', 'clippath', 'mask', 'symbol', 'use', 'text', 'tspan', 'foreignobject'].includes(tag) &&
        ((cs.fill && cs.fill !== 'none' && !/rgba\(.*,\s*0\)$/.test(cs.fill)) || (cs.stroke && cs.stroke !== 'none' && parseFloat(cs.strokeWidth) > 1.5));
    } else if (['img', 'canvas', 'video'].includes(tag)) v = true;
    else {
      const cs = getComputedStyle(el);
      v = (cs.backgroundColor && !/rgba\(.*,\s*0\)$|transparent/.test(cs.backgroundColor)) || cs.backgroundImage !== 'none';
    }
    paintedCache.set(el, v);
    return v;
  };
  for (const t of texts) {
    if (t.opacity < MIN_OPACITY) continue;
    let covered = 0, total = 0, cover = null;
    for (const r of t.rects) {
      const A = ink(r);
      for (let gx = 1; gx <= 5; gx++) for (let gy = 1; gy <= 3; gy++) {
        const x = A.left + (A.right - A.left) * gx / 6, y = A.top + (A.bottom - A.top) * gy / 4;
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        total++;
        for (const hit of document.elementsFromPoint(x, y)) {
          if (hit === t.el || t.el.contains(hit) || hit.contains(t.el)) break;
          if (painted(hit)) { covered++; cover = hit; break; }
        }
      }
    }
    if (total && covered / total > 0.2) add('text_covered', 'error', snippet(t.el) + ' / ' + snippet(cover), [...t.rects, rect(cover.getBoundingClientRect())]);
  }
  hitStyle.remove();
  return {viewport: [W, H], issues};
}
// Draws numbered boxes over the reported issues (red: error, amber: warning).
function markIssues(issues) {
  const layer = document.createElement('div');
  layer.id = '__layout_marks';
  layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483647';
  issues.forEach((issue, i) => {
    const color = issue.severity === 'error' ? '#ff1744' : '#ff9100';
    issue.boxes.forEach(([x, y, w, h], k) => {
      const box = document.createElement('div');
      box.style.cssText = `position:absolute;left:${x - 3}px;top:${y - 3}px;width:${w + 6}px;height:${h + 6}px;` +
        `border:4px ${k ? 'dashed' : 'solid'} ${color};box-sizing:border-box`;
      if (!k) {
        const tag = document.createElement('div');
        tag.textContent = String(i + 1);
        tag.style.cssText = `position:absolute;left:-4px;top:-34px;min-width:30px;padding:2px 8px;background:${color};` +
          'color:#fff;font:700 22px/26px sans-serif;text-align:center;border-radius:4px';
        if (y < 40) tag.style.top = '0px';
        box.appendChild(tag);
      }
      layer.appendChild(box);
    });
  });
  document.body.appendChild(layer);
}
module.exports = {probe, markIssues};
