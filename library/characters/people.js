/* Antares explainer — character rig.
   window.PEOPLE.draw(id, pose, opts) → SVG <g> string.
   Feet on y = 0, figure ≈ 400 px tall, drawn facing right (facing: 1); facing: -1 mirrors.
   ids:   hero, dana, t1, t2, t3
   poses: stand, point, talk, hold, handover, nod, walk1…walk4, sitBack (hero) — or a pose object (see POSES).
   opts:  { x, y, facing, scale, nod (0…1 extra head tilt), eyes:'open'|'closed', doc:true|false }
   Style notes: STYLE.md. Flat fills, no outlines, no gradients. */
(function () {
  const R = Math.PI / 180, f = n => Math.round(n * 10) / 10;
  let CLIP = 0;   // unique clipPath ids across every figure on a page
  const V = (x, y) => ({ x, y }), add = (a, b) => V(a.x + b.x, a.y + b.y), mul = (a, k) => V(a.x * k, a.y * k);
  const sub = (a, b) => V(a.x - b.x, a.y - b.y), len = a => Math.hypot(a.x, a.y), nrm = a => mul(a, 1 / (len(a) || 1));
  const dir = deg => V(Math.sin(deg * R), Math.cos(deg * R));            // 0 = straight down, + = forward (right)

  /* smooth closed/open curve through points (Catmull-Rom → cubic Bézier) */
  function cr(pts, closed = true) {
    pts = pts.map(p => Array.isArray(p) ? V(p[0], p[1]) : p);
    const n = pts.length, g = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    let d = `M${f(pts[0].x)},${f(pts[0].y)}`;
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
      d += `C${f(p1.x + (p2.x - p0.x) / 6)},${f(p1.y + (p2.y - p0.y) / 6)} ${f(p2.x - (p3.x - p1.x) / 6)},${f(p2.y - (p3.y - p1.y) / 6)} ${f(p2.x)},${f(p2.y)}`;
    }
    return d + (closed ? 'Z' : '');
  }
  const path = (d, c, extra = '') => `<path d="${d}" fill="${c}"${extra}/>`;
  const blob = (pts, c) => path(cr(pts), c);

  /* tapered limb: joints [a, b, c] (b = elbow/knee), profile [[u, back, front]…] with u 0…2 */
  function limbSamples(j, r = 11) {
    const [a, b, c] = j, ua = nrm(sub(a, b)), uc = nrm(sub(c, b));
    const rr = Math.min(r, len(sub(a, b)) * .4, len(sub(c, b)) * .4);
    const p1 = add(b, mul(ua, rr)), p2 = add(b, mul(uc, rr)), out = [];
    const seg = (p, q) => { const n = Math.max(2, Math.ceil(len(sub(q, p)) / 3)); for (let i = 0; i < n; i++) out.push(add(p, mul(sub(q, p), i / n))); };
    seg(a, p1);
    const mid = out.length;
    for (let i = 0; i < 8; i++) { const t = i / 8, s = 1 - t; out.push(V(s * s * p1.x + 2 * s * t * b.x + t * t * p2.x, s * s * p1.y + 2 * s * t * b.y + t * t * p2.y)); }
    const kIdx = mid + 4;
    seg(p2, c); out.push(c);
    // u along the limb: 0 at a, 1 at the bend, 2 at c
    const cum = [0]; for (let i = 1; i < out.length; i++) cum.push(cum[i - 1] + len(sub(out[i], out[i - 1])));
    const Lk = cum[kIdx], Lt = cum[cum.length - 1];
    return out.map((p, i) => ({ p, u: cum[i] <= Lk ? cum[i] / Lk : 1 + (cum[i] - Lk) / (Lt - Lk) }));
  }
  function prof(P, u) {
    if (u <= P[0][0]) return P[0];
    for (let i = 1; i < P.length; i++) if (u <= P[i][0]) { const a = P[i - 1], b = P[i], t = (u - a[0]) / (b[0] - a[0]); return [u, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
    return P[P.length - 1];
  }
  function limb(j, P, c, { u0 = 0, u1 = 2, capEnd = true, capStart = true, grow = 0, r } = {}) {
    const S = limbSamples(j, r).filter(s => s.u >= u0 - 1e-6 && s.u <= u1 + 1e-6);
    if (S.length < 2) return '';
    const L = [], Rt = [];
    S.forEach((s, i) => {
      const q = S[Math.min(i + 1, S.length - 1)].p, o = S[Math.max(i - 1, 0)].p, t = nrm(sub(q, o)), n = V(-t.y, t.x);
      const [, wb, wf] = prof(P, s.u);
      // n points to the limb's "back" when it hangs down while facing right
      L.push(add(s.p, mul(n, wb + grow))); Rt.push(add(s.p, mul(n, -(wf + grow))));
      s.t = t; s.n = n; s.w = (wb + wf) / 2 + grow;
    });
    const cap = (s, sign) => { const pts = []; for (let k = 1; k < 8; k++) { const th = k / 8 * Math.PI; pts.push(add(add(s.p, mul(s.n, Math.cos(th) * s.w * (sign > 0 ? 1 : -1))), mul(s.t, sign * Math.sin(th) * s.w * .85))); } return pts; };
    const e = S[S.length - 1], s0 = S[0];
    let pts = [...L];
    if (capEnd) pts.push(...cap(e, 1));
    pts.push(...Rt.reverse());
    if (capStart) pts.push(...cap(s0, -1).map(p => p));
    return path('M' + pts.map(p => `${f(p.x)},${f(p.y)}`).join('L') + 'Z', c);
  }

  /* local frame for hands/feet: x = front (thumb side), y = along the limb */
  const frame = (p, t) => `matrix(${f(t.y * 1e3) / 1e3},${f(-t.x * 1e3) / 1e3},${f(t.x * 1e3) / 1e3},${f(t.y * 1e3) / 1e3},${f(p.x)},${f(p.y)})`;
  const capsule = (a, b, r) => { const t = nrm(sub(b, a)), n = V(-t.y, t.x), pts = [];
    for (let k = 0; k <= 10; k++) { const th = k / 10 * Math.PI; pts.push(add(b, add(mul(n, r * Math.cos(th)), mul(t, r * Math.sin(th))))); }
    for (let k = 0; k <= 10; k++) { const th = k / 10 * Math.PI; pts.push(add(a, add(mul(n, -r * Math.cos(th)), mul(t, -r * Math.sin(th))))); }
    return 'M' + pts.map(p => `${f(p.x)},${f(p.y)}`).join('L') + 'Z'; };

  const HANDS = {
    none: '', pocket: '',
    relax: 'M-3.6,-5 C-4.8,-3 -5.6,-1.4 -5.8,1 C-7,7 -7.4,17 -5.6,24 C-4.2,29.5 1.4,31 4.2,27.4 C5.8,24.8 6.1,20 5.7,15.2 C8.4,13.4 10.2,9.8 9,6.6 C7.9,4.2 6.3,4.6 5.2,2.2 C4.6,0 3.9,-2.6 3.6,-5 Z',
    open: 'M-3.6,-5 C-4.8,-3 -5.6,-1.4 -5.8,1 C-6.8,8 -6.3,18 -4.4,25 C-3,30 3.2,30.4 4.9,26 C6,22 6.1,17.5 6,13.4 C9.6,10.6 13,7.4 12.6,4.4 C12,2.2 9,2.6 6.4,3.6 C5,1 4,-2.4 3.6,-5 Z',
    grip: 'M-3.6,-5 C-4.8,-3 -5.8,-1.4 -6,1 C-7.6,5 -7.6,13 -4.8,17.4 C-1.8,20.4 4,19.6 6.2,15.8 C9.2,13.4 9.8,9.2 8.2,6.6 C7.2,5 6.2,5 5.3,2.6 C4.6,0 3.9,-2.6 3.6,-5 Z',
    point: ['M-6,-3 C-7.6,5 -7.6,12.5 -5,16.4 C-2.6,19.2 1,19.4 3,18 L3,-3 Z', 'M0,-3 L5.8,-3 L6,15 L0,17 Z'],
  };
  const SHOES = {
    f: 'M-7,-3 C-9,4 -9,10 -7,12 L21,12 C24.6,12 25.6,9.4 23,7.4 C18,4 12,2 6,-3 Z',
    m: 'M-8.5,-3 C-10.5,4 -10.5,10 -8.5,13 L25,13 C28.4,13 29.4,10 27,8 C22,4.4 14,2.4 7,-3 Z',
  };

  /* ---------- bodies ---------- */
  const BODY = {
    f: {
      shN: V(-13, -316), shF: V(10, -318), hipN: V(-8, -208), hipF: V(8, -210), upper: 66, fore: 58, thigh: 100, shin: 95, hipC: V(0, -210),
      neck: [V(1, -330), V(3, -350)], neckR: 7.4, head: V(4, -372),
      arm: [[0, 8.6, 8.6], [.45, 7.2, 7.4], [1, 5.6, 5.6], [1.35, 5.9, 5.6], [2, 3.7, 3.7]],
      leg: [[0, 15, 15], [.45, 11.6, 12], [1, 7.8, 7.4], [1.3, 9.6, 7.2], [2, 4.3, 4.3]],
      pant: [[0, 16, 16], [1, 10.2, 9.4], [2, 9, 8.4]],
      torso: [[-3, -338], [-16, -336], [-24, -328], [-26, -312], [-22.5, -290], [-18, -266], [-20, -246], [-23, -230], [-22.5, -221], [0, -222.5], [20, -224], [18.5, -244], [14.5, -264], [16.5, -282], [23, -296], [21.5, -316], [15, -329.5], [7, -335.5]],
      pelvis: [[-13, -244], [11, -244], [16.5, -230], [19.5, -212], [12, -196], [-6, -193], [-19, -199], [-20, -224]],   // top sits inside the torso, so no trouser shows above the hem
    },
    m: {
      shN: V(-17, -320), shF: V(12, -322), hipN: V(-10, -210), hipF: V(9, -212), upper: 70, fore: 60, thigh: 102, shin: 97, hipC: V(0, -212),
      neck: [V(1, -332), V(3, -354)], neckR: 9, head: V(4, -376),
      arm: [[0, 10.4, 10.4], [.45, 8.8, 9], [1, 7, 7], [1.35, 7.2, 6.8], [2, 4.6, 4.6]],
      leg: [[0, 17, 17], [1, 9, 8.4], [1.3, 11, 8.4], [2, 5.4, 5.4]],
      pant: [[0, 18, 18], [1, 12, 11], [2, 10.4, 9.8]],
      torso: [[-4, -341], [-20, -340], [-31, -330], [-32, -308], [-27, -282], [-24.5, -258], [-25, -236], [-25, -219], [0, -218.5], [22, -219], [21, -240], [20, -262], [24, -288], [26.5, -308], [24, -327], [10, -339]],
      pelvis: [[-17, -242], [15, -242], [19.5, -228], [21.5, -212], [13, -196], [-6, -193], [-21, -199], [-22.5, -222]],
    },
  };

  /* ---------- heads ---------- */
  const HEAD = {
    f: 'M-9,16 C-18,10 -22,-4 -20,-14 C-17,-25 -5,-30 5,-29 C15,-28 21,-20 21,-10 C21,-6 22,-2 24,3.2 C24.6,5.2 23.2,7 21,7.6 C21.4,10 21,12 20,14 C19,20 16,24 11,25 C5,26 -2,23 -9,16 Z',
    m: 'M-9.5,17 C-19,10 -23,-4 -21,-14 C-18,-26 -5,-31 6,-30 C16,-29 22,-21 22,-11 C22,-6 23,-2 25.6,4 C26.2,6 24.6,7.6 22,8 C22.4,11 22,13 21,15 C20,22 16,26.2 9,26.8 C3,27.2 -3,24.4 -9.5,17 Z',
  };

  /* hair: back = behind the body, front = on the head. Coordinates relative to the head centre. */
  const HAIR = {
    heroLong: { coversEar: true,
      back: 'M2,-31 C-14,-32 -28,-21 -30,-2 C-32,26 -33,62 -37,98 C-37.6,103 -34,106 -29,104 C-24,107 -18,107 -13,104 C-8,106 -3,104 -1,99 C0,70 0.5,44 1.5,24 C3,10 9,-10 2,-31 Z',
      front: 'M22.5,-11 C21.5,-25 9,-34 -4,-33 C-18,-32 -27.5,-21 -28,-4 C-28.4,12 -27,26 -25,38 C-21,40 -17,38 -15,34 C-12,22 -8,14 -6,7 C-3.4,-3 3,-12 12,-16 C16.5,-17.6 20.5,-15 22.5,-11 Z',
      shine: 'M-19,-20 C-14,-26 -6,-29 2,-29',
    },
    danaBob: { coversEar: true,
      front: 'M24,-9 C23.5,-28 9,-37 -7,-35 C-24,-33 -33,-17 -32,2 C-31.6,16 -30,26 -27,32 C-30,35 -29,39 -25,38 C-17,40 -7,38.5 -1,33 C-4,24 -5.5,13 -4.2,3 C-2,-7 6,-14 16,-15.4 C20,-15.6 22.4,-13.4 23.5,-10 Z',
    },
    t1Short: {
      front: 'M22.8,-12 C23,-22 17,-31 5,-32.2 C-8,-33 -23.6,-23 -23,-8 C-22.8,0 -21,6 -18.6,9 L-14.6,8 C-15.4,2 -14.4,-5 -10,-10 C-3,-16 10,-17.6 16,-16.4 C19,-15.8 21.4,-14 22.8,-12 Z',
      beard: 'M-11.4,6 C-9.4,15 -3,22.4 4,25 C10,27.2 16.4,26 19.8,21.8 C20.6,19.8 20.6,17.6 20.2,16.4 C17,18.8 12.6,19.2 8.6,17.6 C3,14.8 -3,11 -7.6,5 Z',
    },
    t2Bun: {
      front: 'M22,-12 C20.5,-26 8,-34 -5,-33 C-18,-32 -26,-21 -25.6,-6 C-25.4,2 -23,8 -19.4,11 L-12.6,6 C-12.6,-2 -9,-10 -1,-14 C6,-17 15,-17 22,-12 Z',
      behind: [[-26, 4, 11.5]],
    },
    blondeWavy: { coversEar: true,
      back: 'M2,-31 C-14,-32 -28,-22 -31,-4 C-34,12 -30,22 -35,34 C-38,44 -32,53 -24,50 C-18,56 -10,54 -6,48 C-2,40 0,30 1,20 C4,6 10,-12 2,-31 Z',
      front: 'M23,-11 C22,-26 9,-34 -4,-33 C-18,-32 -28,-21 -29,-4 C-30,10 -26,20 -29,31 C-30,37 -24,40 -18,36 C-12,28 -9,17 -6,7 C-3,-3 3,-12 12,-16 C17,-17.6 21,-15 23,-11 Z',
      shine: 'M-20,-19 C-15,-26 -6,-29 3,-29',
    },
    t6Puff: {
      front: 'M22,-12 C20.5,-26 8,-34 -5,-33 C-18,-32 -26,-21 -25.6,-6 C-25.4,2 -23,8 -19.4,11 L-12.6,6 C-12.6,-2 -9,-10 -1,-14 C6,-17 15,-17 22,-12 Z',
      behind: [[-24, -24, 14], [-32, -13, 11], [-14, -33, 10], [-30, -28, 10]],
    },
    t3Curls: {
      curls: [[-19, -14, 9.5], [-12, -25, 10], [-1, -31, 10], [10, -30, 9], [18.5, -22, 7], [-23, -2, 8], [-18, 8, 6], [3, -24, 9], [-10, -14, 9]],
      cover: 'M21,-14 C18,-26 6,-33 -6,-32 C-18,-31 -25,-21 -24,-7 C-23.6,1 -21.6,7 -18.6,10 L-14.6,9 C-15.6,2 -14,-6 -9,-10.4 C-1,-15.4 11,-17 21,-14 Z',
    },
  };

  HAIR.t5Grey = { front: HAIR.t1Short.front, beard: HAIR.t1Short.beard };

  /* ---------- cast ---------- */
  const CAST = {   // sx = body width, lean/tiltAdd = posture. Saturated blue only on the heroes (Maya, Leo) and the product.
    hero: { name: 'Maya', role: 'BI analyst (hero)', body: 'f', scale: 1, sx: 1, skin: '#efc3a2', skinS: '#d9a283', lip: '#b26a55', hair: 'heroLong', hc: '#171717', hcS: '#3a3a3a',
      top: '#2563eb', topS: '#1d4ed8', sleeve: 2, bottom: 'pant', pant: '#404040', pantS: '#2e2e2e', shoe: '#171717' },
    dana: { name: 'Dana', role: 'Head of BI (boss)', body: 'f', scale: 1.06, sx: .94, lean: -1.5, skin: '#e2ab86', skinS: '#c98c69', lip: '#a65e49', hair: 'danaBob', hc: '#2563eb', hcS: '#2563eb',
      top: '#404040', topS: '#2c2c2c', sleeve: 2, outfit: 'blazer', bottom: 'pant', pant: '#171717', pantS: '#0b0b0b', shoe: '#171717' },
    t1: { name: 'Sam', role: 'Data engineer', body: 'm', scale: 1.04, sx: 1.14, lean: 3, tiltAdd: 3, skin: '#8b5536', skinS: '#6e4127', lip: '#4e2b1a', hair: 't1Short', hc: '#171717', hcS: '#171717',
      top: '#57534e', topS: '#44403c', sleeve: 2, outfit: 'sweater', bottom: 'pant', pant: '#a8a29e', pantS: '#8f8984', shoe: '#171717' },
    t2: { name: 'Ruth', role: 'Report owner', body: 'f', scale: .95, sx: 1.06, skin: '#f3cfb8', skinS: '#ddb197', lip: '#b8765f', hair: 't2Bun', hc: '#b9bcc4', hcS: '#898d97', brow: '#7d818b', glasses: true, desk: '#d6dde5', deskEdge: '#b3bdc9',
      top: '#7d6553', topS: '#664f40', sleeve: 2, outfit: 'cardigan', bottom: 'pant', pant: '#404040', pantS: '#2e2e2e', shoe: '#404040' },
    t3: { name: 'Leo', role: 'Power BI developer (video hero)', body: 'm', scale: 1.03, sx: 1, skin: '#c48a62', skinS: '#a8704c', lip: '#7d4a33', hair: 't3Curls', hc: '#2a2420', hcS: '#2a2420',
      top: '#2563eb', topS: '#1d4ed8', sleeve: 1.3, outfit: 'shirt', bottom: 'pant', pant: '#404040', pantS: '#2e2e2e', shoe: '#171717' },
    t4: { name: 'Emma', role: 'Finance partner', body: 'f', scale: .99, sx: .97, skin: '#f6d6c1', skinS: '#e3b79c', lip: '#bd6f5e', hair: 'blondeWavy', hc: '#e4c07a', hcS: '#c9a24f', brow: '#b08a3e',
      top: '#cdbca6', topS: '#b4a28b', sleeve: 2, bottom: 'pant', pant: '#57534e', pantS: '#44403c', shoe: '#171717' },
    t5: { name: 'Raj', role: 'IT manager', body: 'm', scale: 1.0, sx: 1.12, lean: 4, tiltAdd: 4, skin: '#c99268', skinS: '#ad774f', lip: '#7f4b33', hair: 't5Grey', hc: '#d0d0d0', hcS: '#9a9a9a', brow: '#8a8a8a',
      top: '#525252', topS: '#444444', sleeve: 2, outfit: 'sweater', bottom: 'pant', pant: '#d6cfc4', pantS: '#bdb3a5', shoe: '#171717' },
    t6: { name: 'Nia', role: 'Analyst', body: 'f', scale: .92, sx: .95, lean: 1, skin: '#6e4128', skinS: '#55301c', lip: '#24100a', hair: 't6Puff', hc: '#171717', hcS: '#171717',
      top: '#7c6f64', topS: '#665b52', sleeve: 1.3, bottom: 'pant', pant: '#262626', pantS: '#171717', shoe: '#404040' },
  };

  /* ---------- poses (degrees; arms/legs: a = from straight down, + forward; e/k = elbow/knee bend) ---------- */
  const POSES = {
    stand:    { lean: 0, tilt: 0, nA: { a: 6, e: 6, h: 'relax', ha: 4 }, fA: { a: 8, e: 5, h: 'relax', ha: 4 }, nL: { a: -3, k: 0, f: 0 }, fL: { a: 5, k: 7, f: 4 } },
    talk:     { lean: 5, tilt: 6, nA: { a: 14, e: 68, h: 'open', ha: -16 }, fA: { a: 16, e: 44, h: 'open', ha: -30 }, nL: { a: -2, k: 0 }, fL: { a: 6, k: 8, f: 3 } },
    hold:     { lean: 0, tilt: 6, nA: { a: -4, e: 100, h: 'grip', ha: -10 }, fA: { a: 6, e: 94, h: 'grip', ha: -10 }, nL: { a: -2, k: 0 }, fL: { a: 5, k: 6, f: 3 }, doc: 'hold' },
    handover: { lean: 3, tilt: 3, nA: { a: 26, e: 62, h: 'grip', ha: -6 }, fA: { a: 12, e: 16, h: 'relax' }, nL: { a: -6, k: 0 }, fL: { a: 10, k: 8, f: 4 }, doc: 'give' },
    present:  { lean: 0, tilt: -2, nA: { a: 6, e: 18, h: 'relax' }, fA: { a: 12, e: 118, h: 'open', ha: -42 }, nL: { a: -3, k: 0 }, fL: { a: 6, k: 6, f: 2 } },
    nod:      { lean: 1, tilt: 13, nA: { a: 6, e: 6, h: 'relax', ha: 4 }, fA: { a: -4, e: 8, h: 'relax', ha: 4 }, nL: { a: -3, k: 0 }, fL: { a: 5, k: 7, f: 4 } },
    walk1:    { lean: 3, tilt: 0, nA: { a: -18, e: 14, h: 'relax' }, fA: { a: 20, e: 24, h: 'relax' }, nL: { a: 18, k: 26, f: -8 }, fL: { a: -16, k: 14, f: 44 } },
    walk2:    { lean: 3, tilt: 1, nA: { a: -2, e: 14, h: 'relax' }, fA: { a: 4, e: 18, h: 'relax' }, nL: { a: 2, k: 0, f: 0 }, fL: { a: 0, k: 52, f: 34 } },
    walk3:    { lean: 3, tilt: 0, nA: { a: 20, e: 24, h: 'relax' }, fA: { a: -18, e: 14, h: 'relax' }, nL: { a: -16, k: 20, f: 44 }, fL: { a: 18, k: 26, f: -8 } },
    walk4:    { lean: 3, tilt: 1, nA: { a: 4, e: 18, h: 'relax' }, fA: { a: -2, e: 14, h: 'relax' }, nL: { a: 0, k: 52, f: 34 }, fL: { a: 2, k: 0, f: 0 } },
    // seated at a table, watching / talking (like the flipchart-meeting reference). Chair drawn in front, table behind (opts.table).
    sit:      { seat: true, lean: 6, tilt: -3, nA: { a: 16, e: 74, h: 'relax', ha: -4 }, fA: { a: 24, e: 66, h: 'relax' }, nL: { a: 86, k: 84, f: 0 }, fL: { a: 80, k: 86, f: 2 } },
    sitTalk:  { seat: true, lean: 4, tilt: -2, nA: { a: 22, e: 104, h: 'open', ha: -40 }, fA: { a: 24, e: 66, h: 'relax' }, nL: { a: 86, k: 84, f: 0 }, fL: { a: 80, k: 86, f: 2 } },
    sitNod:   { seat: true, lean: 8, tilt: 12, nA: { a: 16, e: 74, h: 'relax', ha: -4 }, fA: { a: 24, e: 66, h: 'relax' }, nL: { a: 86, k: 84, f: 0 }, fL: { a: 80, k: 86, f: 2 } },
  };

  /* ---------- everyone has their own way of doing each pose. Merged over POSES / FPOSES; opts.base draws the plain pose.
     seated arms: t:[x, up] puts the wrist on the table, x in front of the hips. h:'pocket' hides the hand in the pocket. */
  const POCKET = { a: -6, e: 26, h: 'pocket' }, REST = { a: 6, e: 6, h: 'relax', ha: 4 }, FREST = { a: 8, e: 5, h: 'relax', ha: 4 };
  const HIP = { a: -32, e: 92, h: 'grip', ha: 10 };
  const CROSS = { nL: { a: 95, k: 58, f: 24 }, fL: { a: 84, k: 84, f: 0 } }, TUCK = { nL: { a: 85, k: 108, f: 30 }, fL: { a: 81, k: 112, f: 32 } },
    FWD = { nL: { a: 77, k: 40, f: -4 }, fL: { a: 75, k: 46, f: -4 } }, ONE = { nL: { a: 79, k: 48, f: -2 }, fL: { a: 83, k: 112, f: 32 } };
  const VAR = {
    hero: {
      sit: { lean: 6, nA: { t: [66, 0] }, fA: { t: [96, 0] } },
      sitTalk: { lean: 5, nA: { a: 20, e: 84, h: 'open', ha: -16 }, fA: { t: [92, 0] } },
      front: { L: { a: 5, e: 6, ha: 4 }, R: { a: 5, e: 6, ha: 4 } },
    },
    dana: {
      handover: { lean: 0 }, stand: { nA: HIP }, talk: { lean: 2, tilt: 3 }, nod: { nA: HIP },
      present: { nA: HIP }, hold: { nA: { a: -8, e: 112, h: 'grip', ha: -12 }, fA: { a: 4, e: 102, h: 'grip', ha: -12 }, tilt: 10 },
      sit: { lean: -3, tilt: 2, ...CROSS, nA: { a: 14, e: 48, h: 'relax', ha: 8 }, fA: { t: [80, 0] } },
      sitTalk: { lean: -2, tilt: 2, ...CROSS, nA: { a: 8, e: 74, h: 'open', ha: -8 }, fA: { t: [78, 0] } },
      front: { L: { a: 46, e: -95, h: 'grip', ha: 16 } }, frontNod: { L: { a: 46, e: -95, h: 'grip', ha: 16 } },
      frontPresent: { L: { a: 46, e: -95, h: 'grip', ha: 16 } }, frontHold: { tilt: 3, one: true, L: { a: 46, e: -95, h: 'grip', ha: 16 }, R: { a: 12, e: -44, fl: .42, h: 'grip', ha: -146 } },
      frontTalk: { tilt: 3, L: { a: 46, e: -95, h: 'grip', ha: 16 }, R: { a: 12, e: 70, fl: .6, h: 'open', ha: -44 } },
    },
    t1: {
      stand: { nA: POCKET }, nod: { nA: POCKET }, present: { nA: POCKET },
      talk: { lean: 4, tilt: 4, nA: { a: 24, e: 62, h: 'open', ha: -20 }, fA: { a: 36, e: 60, h: 'open', ha: -24 } },
      hold: { nA: { a: 4, e: 84, h: 'grip', ha: -10 }, fA: { a: 14, e: 78, h: 'grip', ha: -10 } },
      sit: { lean: 13, tilt: -6, ...TUCK, nA: { t: [72, 0] }, fA: { t: [98, 0] } },
      sitTalk: { lean: 10, tilt: -4, ...TUCK, nA: { a: 28, e: 76, h: 'open', ha: -34 }, fA: { a: 40, e: 72, h: 'open', ha: -34 } },
      front: { L: { a: 15, e: -42, h: 'pocket' }, R: { a: 15, e: -42, h: 'pocket' }, legs: 5 }, frontNod: { L: { a: 15, e: -42, h: 'pocket' }, R: { a: 15, e: -42, h: 'pocket' }, legs: 5 },
      frontPresent: { L: { a: 15, e: -42, h: 'pocket' }, legs: 5 },
      frontTalk: { tilt: -3, legs: 5, L: { a: 24, e: 74, fl: .6, h: 'open', ha: -50 }, R: { a: 24, e: 74, fl: .6, h: 'open', ha: -50 } },
    },
    t2: {
      stand: { nA: { a: -8, e: 48, h: 'relax', ha: 2 }, fA: { a: -20, e: 48, h: 'relax', ha: 2 } }, nod: { nA: { a: -8, e: 48, h: 'relax', ha: 2 }, fA: { a: -20, e: 48, h: 'relax', ha: 2 } },
      talk: { lean: 3, tilt: 8, nA: { a: 2, e: 108, h: 'relax', ha: 30 }, fA: { a: 18, e: 60, h: 'open', ha: -20 } },
      present: { tilt: 3 }, hold: { nA: { a: 2, e: 106, h: 'grip', ha: -10 }, fA: { a: 12, e: 98, h: 'grip', ha: -10 }, tilt: 14 },
      handover: { nA: { a: 24, e: 60, h: 'grip', ha: -6 }, fA: { a: 32, e: 54, h: 'grip', ha: -6 } },
      sit: { lean: 2, tilt: 2, ...ONE, nA: { t: [62, 0] }, fA: { t: [72, 0] } },
      sitTalk: { lean: 4, tilt: 4, ...ONE, nA: { t: [64, 0] }, fA: { a: 26, e: 92, h: 'open', ha: -30 } },
      front: { L: { a: 8, e: -50, fl: .74, ha: 0 }, R: { a: 8, e: -50, fl: .74, ha: 0 } }, frontNod: { L: { a: 8, e: -50, fl: .74 }, R: { a: 8, e: -50, fl: .74 } },
      frontPresent: { L: { a: 6, e: 10 } }, frontHold: { tilt: 0, nod: .6, L: { a: 12, e: -70, fl: .5, h: 'grip', ha: -120 }, R: { a: 12, e: -70, fl: .5, h: 'grip', ha: -120 } },
      frontTalk: { tilt: 6, L: { a: 6, e: 8 }, R: { a: 12, e: 74, fl: .62, h: 'open', ha: -46 } },
    },
    t3: {
      talk: { lean: 3, tilt: 3, nA: { a: 20, e: 70, h: 'open', ha: -20 }, fA: FREST },
      hold: { nA: { a: 8, e: 86, h: 'grip', ha: -10 }, fA: { a: 16, e: 82, h: 'grip', ha: -10 }, tilt: 8 },
      sit: { lean: 17, tilt: -8, ...FWD, nA: { el: [50, 0], wa: 172, fl: 1.14, h: 'grip', ha: 4 }, fA: { t: [84, 0] } },
      sitTalk: { lean: 9, tilt: -4, ...FWD, nA: { a: 28, e: 74, h: 'open', ha: -24 }, fA: { t: [84, 0] } },
      front: { L: { a: 15, e: -42, h: 'pocket' } }, frontNod: { L: { a: 15, e: -42, h: 'pocket' } }, frontPresent: { L: { a: 15, e: -42, h: 'pocket' } }, frontHold: { tilt: 4, one: true, L: { a: 15, e: -42, h: 'pocket' }, R: { a: 12, e: -44, fl: .42, h: 'grip', ha: -146 } },
      frontTalk: { tilt: 4, L: { a: 15, e: -42, h: 'pocket' }, R: { a: 16, e: 78, fl: .62, h: 'open', ha: -46 } },
    },
    t4: {
      stand: { nA: { a: 2, e: 92, h: 'grip', ha: -4 }, fA: { a: -2, e: 14, h: 'relax' }, prop: 'mug' }, nod: { nA: { a: 2, e: 92, h: 'grip', ha: -4 }, prop: 'mug' },
      talk: { lean: 4, tilt: 5, nA: { a: 22, e: 88, h: 'open', ha: -34 }, fA: FREST },
      present: { tilt: -3, nA: { a: 8, e: 22, h: 'relax' } }, hold: { nA: { a: -8, e: 108, h: 'grip', ha: -10 }, fA: { a: 0, e: 104, h: 'grip', ha: -10 }, tilt: 5 },
      sit: { lean: 10, tilt: 8, ...CROSS, nA: { t: [82, 4], h: 'grip' }, fA: { t: [104, 0] }, prop: 'notes' },
      sitTalk: { lean: 4, tilt: 3, ...CROSS, nA: { a: -4, e: 112, h: 'relax', ha: 24 }, fA: { t: [92, 0] }, prop: 'notes' },
      front: { R: { a: 10, e: -150, fl: .66, h: 'grip', ha: -4 }, prop: 'mug' }, frontNod: { R: { a: 10, e: -150, fl: .66, h: 'grip', ha: -4 }, prop: 'mug' },
      frontPresent: { L: { a: 4, e: 8 } },
      frontTalk: { tilt: 5, L: { a: 5, e: 8 }, R: { a: 10, e: -118, fl: .74, h: 'relax', ha: 0 } },
    },
    t5: {
      stand: { nA: POCKET }, nod: { nA: POCKET },
      talk: { lean: 2, tilt: 4, nA: { a: 8, e: 66, h: 'open', ha: 0 }, fA: FREST },
      hold: { nA: { a: 20, e: 64, h: 'grip', ha: -10 }, fA: { a: 30, e: 58, h: 'grip', ha: -10 }, tilt: 10 },
      handover: { nA: { a: 22, e: 60, h: 'grip', ha: -6 }, fA: { a: 30, e: 54, h: 'grip', ha: -6 } },
      sit: { lean: -2, tilt: 3, ...FWD, nA: { a: 12, e: 46, h: 'relax', ha: 6 }, fA: { a: 2, e: 54, h: 'relax', ha: 6 } },
      sitTalk: { lean: -1, tilt: 3, ...FWD, nA: { a: 18, e: 78, h: 'open', ha: 2 }, fA: { t: [82, 0] } },
      front: { behind: true, L: { a: 12, e: -50, h: 'none' }, R: { a: 12, e: -50, h: 'none' }, legs: 5 }, frontNod: { behind: true, L: { a: 12, e: -50, h: 'none' }, R: { a: 12, e: -50, h: 'none' }, legs: 5 },
      frontPresent: { L: { a: 15, e: -42, h: 'pocket' } },
      frontTalk: { tilt: 3, legs: 5, L: { a: 8, e: 12 }, R: { a: 18, e: 56, fl: .7, h: 'open', ha: -34 } },
    },
    t6: {
      handover: { lean: 7, tilt: 0 }, stand: { nA: HIP, nL: { a: -6, k: 0, f: 0 }, fL: { a: 9, k: 6, f: 2 } }, nod: {},
      talk: { lean: 6, tilt: 2, nA: { a: 28, e: 84, h: 'open', ha: -24 }, fA: { a: 38, e: 64, h: 'open', ha: -24 } },
      present: { lean: 2, nA: { a: -6, e: 16, h: 'relax' } }, hold: { nA: { a: 6, e: 92, h: 'grip', ha: -10 }, fA: { a: 14, e: 88, h: 'grip', ha: -10 }, tilt: 9 },
      sit: { lean: 9, tilt: -2, ...TUCK, nA: { t: [74, 0], h: 'grip' }, fA: { t: [92, 0] }, prop: 'mug' },
      sitTalk: { lean: 7, tilt: 0, ...TUCK, nA: { a: 26, e: 100, h: 'open', ha: -30 }, fA: { a: 40, e: 82, h: 'open', ha: -30 } },
      front: { L: { a: 46, e: -95, h: 'grip', ha: 16 }, R: { a: 46, e: -95, h: 'grip', ha: 16 }, legs: 5 },
      frontTalk: { tilt: -4, legs: 5, L: { a: 20, e: 92, fl: .6, h: 'open', ha: -60 }, R: { a: 14, e: 64, fl: .6, h: 'open', ha: -40 } },
    },
  };
  Object.values(VAR).forEach(v => { v.sitNod = Object.assign({}, v.sit, { lean: (v.sit.lean || 0) + 3, tilt: 13 }); });
  const DESKV = { hero: 'type', dana: 'mouse', t1: 'type', t2: 'mug', t3: 'mouse', t4: 'write', t5: 'mug', t6: 'type' };
  // the walk differs in posture and arm swing
  const WALKV = { dana: { lean: 1, swing: .75 }, t1: { lean: 5, swing: .8 }, t2: { lean: 3, swing: .6 }, t4: { lean: 3, swing: .9 }, t5: { lean: 5, swing: .55 }, t6: { lean: 6, swing: 1.35 } };
  function posed(id, name, base, o) {
    if (o.base) return base;
    const w = WALKV[id];
    if (/^walk/.test(name) && w) { const sw = A => Object.assign({}, A, { a: A.a * w.swing }); return Object.assign({}, base, { lean: w.lean, nA: sw(base.nA), fA: sw(base.fA) }); }
    return Object.assign({}, base, (VAR[id] || {})[name]);
  }

  /* ---------- document / report ---------- */
  function doc(cx, cy, rot, w = 62, h = 80) {
    const x = -w / 2, y = -h / 2;
    let s = `<g transform="translate(${f(cx)},${f(cy)}) rotate(${f(rot)})">`;
    s += `<rect x="${x + 3}" y="${y + 3}" width="${w}" height="${h}" rx="3" fill="#bfd1f8"/>`;
    s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="#f3f6fd"/>`;
    s += `<rect x="${x + 7}" y="${y + 8}" width="${w * .45}" height="5" rx="2.5" fill="#2563eb"/>`;
    [0, 1, 2].forEach(i => s += `<rect x="${x + 7}" y="${y + 19 + i * 7}" width="${w - 14 - i * 9}" height="3" rx="1.5" fill="#dbe6fd"/>`);
    [[0, 14], [1, 22], [2, 10], [3, 18]].forEach(([i, bh]) => s += `<rect x="${x + 9 + i * 11}" y="${y + h - 10 - bh}" width="7" height="${bh}" rx="1" fill="${i === 1 ? '#2563eb' : '#93b4f5'}"/>`);
    return s + '</g>';
  }

  /* ---------- the figure ---------- */
  function figure(c, P, o) {
    const B = BODY[c.body], sx = c.sx || 1, HS = 1.22;
    P = Object.assign({}, P, { lean: (P.lean || 0) + (P.seat ? 0 : (c.lean || 0)) });
    const nod = (o.nod || 0) * 14, tilt = (P.tilt || 0) + (P.seat ? 0 : (c.tiltAdd || 0)) + nod, eyes = o.eyes || P.eyes || (nod > 8 ? 'closed' : 'open');
    // arms (upper-body local coords)
    const lean = P.lean || 0, rotL = (p, deg) => { const q = deg * R, d = sub(p, B.hipC); return V(B.hipC.x + d.x * Math.cos(q) - d.y * Math.sin(q), B.hipC.y + d.x * Math.sin(q) + d.y * Math.cos(q)); };
    const fk = (sh, A) => { const el = add(sh, mul(dir(A.a), B.upper)); return [sh, el, add(el, mul(dir(A.a + A.e), B.fore))]; };
    // one table height for everyone of a body type, whatever their pose
    const TY = P.seat ? Math.max(rotL(fk(B.shN, { a: 16, e: 74 })[2], 6).y, fk(B.shF, { a: 24, e: 66 })[2].y) + 6 : 0;
    const arm = (sh, A) => {
      if (A.el) { const e = rotL(V(B.hipC.x + A.el[0], TY - 5 - A.el[1]), -lean), d = dir(A.wa + lean); return { j: [sh, e, add(e, mul(d, B.fore * (A.fl || 1)))], hd: dir(A.wa + lean + (A.ha || 0)), h: A.h || 'relax' }; }
      if (A.t) {   // wrist on the table: two-bone reach, elbow low
        const T = rotL(V(B.hipC.x + A.t[0], TY - 6 - A.t[1]), -lean), d0 = sub(T, sh), d = Math.min(len(d0), B.upper + B.fore - 1), u = nrm(d0);
        const x = (B.upper * B.upper - B.fore * B.fore + d * d) / (2 * d), h = Math.sqrt(Math.max(0, B.upper * B.upper - x * x)), m = add(sh, mul(u, x));
        const e1 = add(m, mul(V(-u.y, u.x), h)), e2 = add(m, mul(V(u.y, -u.x), h)), el = e1.y > e2.y ? e1 : e2;
        return { j: [sh, el, add(sh, mul(u, d))], hd: dir(92 + lean), h: A.h || 'relax' };
      }
      return { j: fk(sh, A), hd: dir(A.a + A.e + (A.ha || 0)), h: A.h || 'relax' };
    };
    const leg = (hp, L) => { const kn = add(hp, mul(dir(L.a), B.thigh)), an = add(kn, mul(dir(L.a - L.k), B.shin)); return { j: [hp, kn, an], f: L.f || 0 }; };
    const nA = arm(B.shN, P.nA), fA = arm(B.shF, P.fA), nL = leg(B.hipN, P.nL), fL = leg(B.hipF, P.fL);
    // ground: lowest sole point → y = 0
    const sole = l => { const r = l.f * R, pts = [V(-8, 12.5), V(26, 12.5)]; return Math.max(...pts.map(p => l.j[2].y + p.x * Math.sin(r) + p.y * Math.cos(r))); };
    const dy = P.seat ? -sole(leg(B.hipN, { a: 86, k: 84, f: 0 })) : -Math.max(sole(nL), sole(fL));
    const U = s => `<g transform="rotate(${f(P.lean || 0)} ${B.hipC.x} ${B.hipC.y})">${s}</g>`;
    const hand = (A, col) => { const h = A.h === 'point' ? [...HANDS.point, capsule(V(1.8, 12), V(2.4, 31), 2.5), capsule(V(5, 4), V(6.6, 12.5), 2.7)] : [HANDS[A.h]]; return `<g transform="${frame(A.j[2], A.hd)} scale(1.12)" fill="${col}">${h.map(d => `<path d="${d}"/>`).join('')}</g>`; };
    const shoe = (L, col) => `<path d="${SHOES[c.body]}" fill="${col}" transform="translate(${f(L.j[2].x)},${f(L.j[2].y)}) rotate(${f(L.f)})"/>`;
    const armDraw = (A, far) => {
      const sk = far ? c.skinS : c.skin, cl = far ? c.topS : c.top;
      const hid = A.h === 'none' || A.h === 'pocket';
      let s = limb(A.j, B.arm, sk, { u1: hid ? 1.8 : 1.9 }) + (hid ? '' : hand(A, sk));
      s += limb(A.j, B.arm, cl, { u1: c.sleeve, grow: c.sleeve >= 2 ? 1.6 : 1.2, capEnd: false });
      if (c.sleeve < 2) s += limb(A.j, B.arm, far ? c.topS : c.topS, { u0: c.sleeve - .12, u1: c.sleeve, grow: 1.9, capEnd: false, capStart: false });   // rolled cuff
      else if (c.outfit === 'sweater' || c.outfit === 'cardigan') s += limb(A.j, B.arm, c.topS, { u0: 1.84, u1: 1.97, grow: 1.9, capEnd: false, capStart: false });
      if (A.h === 'pocket') s += pocket(A.j, far ? c.pantS : c.pant, far ? c.pant : c.pantS);
      return s;
    };
    const legDraw = (L, far) => {
      if (c.bottom === 'skirt') { const sk = far ? c.skinS : c.skin; return limb(L.j, B.leg, sk, { u1: 2.05 }) + shoe(L, c.shoe); }
      const pc = o.waistDebug ? '#ff00ff' : far ? c.pantS : c.pant;
      return limb(L.j, B.leg, far ? c.skinS : c.skin, { u0: 1.8 }) + shoe(L, c.shoe) + limb(L.j, B.pant, pc, { u1: 1.93, capEnd: false });
    };
    const H = B.head, hair = HAIR[c.hair];
    const hp = (d, col) => `<path d="${d}" fill="${col}" transform="translate(${H.x},${H.y})"/>`;
    const N = B.neck[1], big = g => `<g transform="translate(${N.x},${N.y}) scale(${f(HS / sx * 1e3) / 1e3},${HS}) translate(${-N.x},${-N.y})">${g}</g>`;

    let s = '';
    // 1 back hair
    if (hair.back) s += U(`<g transform="rotate(${f(tilt * .4)} ${B.neck[1].x} ${B.neck[1].y})">${big(hp(hair.back, c.hc))}</g>`);
    // 2 far arm
    s += U(armDraw(fA, true));
    // 3 legs
    s += legDraw(fL, true) + legDraw(nL, false);
    // 4 pelvis / skirt
    if (c.bottom === 'skirt') {
      s += blob([[-18, -262], [14, -262], [19, -232], [22, -180], [25, -124], [23.5, -118.5], [0, -118], [-23.5, -118.5], [-25, -124], [-23, -180], [-21, -232]], c.skirt);
      s += blob([[-6, -200], [-2, -160], [-4, -120], [-14, -119], [-12, -160]], c.skirtS);
    } else s += U(blob(B.pelvis, o.waistDebug ? '#ff00ff' : c.pant));   // leans with the torso, so the hem always covers its top
    // 5 neck, torso, outfit details
    let up = `<path d="${capsule(B.neck[0], B.neck[1], B.neckR)}" fill="${c.skinS}"/>`;
    up += blob(B.torso, c.top);
    up += outfit(c, B);
    // 6 head
    let hd = '';
    const at = g => `<g transform="translate(${H.x},${H.y})">${g}</g>`;
    if (c.hair === 't6Puff') hd += at(poly(curly(-23, -24, 17, 15, 0, 360, 9, 2.4), c.hc) + curlMarks(c, [[-34, -25], [-25, -33], [-21, -22]]));
    else if (c.hair === 't2Bun') hd += at(path('M-20,-6 C-28,-10 -38,-5 -38,5 C-38,14 -30,19 -22,15 C-15,11 -14,-2 -20,-6 Z', c.hc) + `<path d="M-33,6 C-32,-1 -25,-2 -22,2" fill="none" stroke="${c.hcS}" stroke-width="1.6" stroke-linecap="round"/>`);
    hd += hp(HEAD[c.body], c.skin);
    if (!hair.coversEar) {   // visible ear
      hd += `<ellipse cx="${H.x - 5}" cy="${H.y + 1.5}" rx="4" ry="6" fill="${c.skin}"/><path d="M${H.x - 6.5},${H.y - 1.5} q2.6,3 0.4,6" fill="none" stroke="${c.skinS}" stroke-width="1.5" stroke-linecap="round"/>`;
    }
    hd += face(c, H, eyes, o.expr);
    if (hair.beard) hd += hp(hair.beard, c.hc);
    if (c.glasses) hd += glasses(H);
    if (c.hair === 't3Curls') hd += at(poly(curly(-1, -13, 26.5, 23.5, -4, -200, 8, 2.4).concat([[-24.6, 1], [-22.6, 6.4], [-19.4, 10.6], [-15.4, 11.4], [-13, 8.6], [-12.4, 3], [-11.6, -2], [-9.4, -5.6], [-5.4, -6.4], [-2.6, -3], [-1, 1], [.4, -4], [2.4, -9], [6, -12.6], [12, -14.4], [18, -13.8], [23, -12.6]]), c.hc) + curlMarks(c, [[-19, -20], [-8, -27], [4, -27], [13, -21], [-3, -18], [-20, -6], [8, -17]]));
    if (hair.front) hd += hp(hair.front, c.hc);
    if (hair.shine) hd += `<path d="${hair.shine}" transform="translate(${H.x},${H.y})" fill="none" stroke="${c.hcS}" stroke-width="2" stroke-linecap="round"/>`;
    up += `<g class="hd" transform="rotate(${f(tilt)} ${B.neck[0].x} ${B.neck[0].y})">${big(hd)}</g>`;
    // 7 document between the hands
    const D = o.doc === false ? null : (P.doc || null);
    if (D === 'hold') { const m = mul(add(nA.j[2], fA.j[2]), .5); up += doc(m.x + 8, m.y - 22, -6); }
    if (D === 'give') { const w = nA.j[2], t = nA.hd; up += doc(w.x + t.x * 12 + 24, w.y + t.y * 12 - 22, -4); }
    if (P.prop === 'mug') { const w = nA.j[2], q = P.seat ? V(w.x + 30, w.y) : V(w.x + nA.hd.x * 13, w.y + nA.hd.y * 13); up += `<g transform="rotate(${f(-lean)} ${f(q.x)} ${f(q.y)})">${mug(q.x, P.seat ? q.y - 5 : q.y)}</g>`; }
    if (P.prop === 'notes') { const q = rotL(V(B.hipC.x + 96, TY), -lean); up += `<g transform="translate(${f(q.x)},${f(q.y)}) rotate(${f(-lean)})"><path d="M-34,0 L30,0 L40,-5 L-22,-5 Z" fill="#ffffff"/><path d="M-34,0 L30,0 L40,-5 L-22,-5 Z" fill="none" stroke="#c4c4c4" stroke-width="1"/><path d="M8,-8 L16,-26" stroke="#404040" stroke-width="2.6" stroke-linecap="round"/></g>`; }
    // 8 near arm, with a soft shade it casts on the torso so the elbow reads when the arm crosses the body
    const cid = 'pt' + (++CLIP);
    up += `<clipPath id="${cid}"><path d="${cr(B.torso)}"/></clipPath><g clip-path="url(#${cid})"><g transform="translate(-2.4,3.4)">${limb(nA.j, B.arm, c.topS, { u1: 1.9, grow: 1.2 })}</g></g>`;
    up += armDraw(nA, false);
    s += U(up);
    if (o.waistDebug) s += U(`<rect x="-400" y="${c.body === 'm' ? -221 : -226}" width="800" height="600" fill="#ffffff"/>` + (P.seat ? `<rect x="${c.body === 'm' ? 24 : 21}" y="-400" width="400" height="800" fill="#ffffff"/>` : ''));   // test only: hide everything below the hem (seated: and the lap in front of the belly)
    if (P.seat) {
      const hx = B.hipC.x, hy = B.hipC.y, ch = '#525252', base = '#a3a3a3';
      // the table top sits just under the resting forearms (rotated by the lean, so measure the near wrist)
      const ty = TY;
      window.PEOPLE.lastTableY = ty + dy;
      if (o.table) s = `<rect x="${hx + 10}" y="${f(ty)}" width="190" height="9" rx="3" fill="#d4d4d4"/><rect x="${hx + 182}" y="${f(ty + 9)}" width="8" height="${f(-dy - ty - 9)}" fill="#d4d4d4"/>` + s;
      // office chair: seat under the thighs, backrest over the lower back, column, base, castors
      s += `<rect x="${hx - 30}" y="${hy + 14}" width="80" height="13" rx="6.5" fill="${ch}"/>`;
      s += `<rect x="${hx - 44}" y="${hy - 84}" width="18" height="104" rx="9" fill="${ch}" transform="rotate(-6 ${hx - 35} ${hy + 20})"/>`;
      s += `<rect x="${hx + 2}" y="${hy + 27}" width="8" height="${f(-dy - hy - 50)}" fill="${base}"/>`;
      s += `<rect x="${hx - 34}" y="${f(-dy - 24)}" width="80" height="7" rx="3.5" fill="${base}"/>`;
      s += [-30, 6, 42].map(x => `<circle cx="${hx + x}" cy="${f(-dy - 8)}" r="7" fill="${base}"/>`).join('');
    }
    return `<g transform="translate(0,${f(dy)}) scale(${sx},1)">${s}</g>`;
  }

  function pocket(j, col, line) {
    const t = nrm(sub(j[2], j[1])), n = V(-t.y, t.x), o = add(j[2], mul(t, -7)), a = add(o, mul(n, 11)), b = add(o, mul(n, -11)), q = (p, k) => add(p, mul(t, k)), P = p => `${f(p.x)},${f(p.y)}`;
    return `<path d="M${P(a)} L${P(b)} L${P(q(b, 15))} L${P(q(a, 15))} Z" fill="${col}"/><path d="M${P(a)} L${P(b)}" stroke="${line}" stroke-width="2.4" stroke-linecap="round"/>`;
  }
  const mug = (x, y) => `<path d="M${f(x - 9)},${f(y - 11)} h18 v17 q0,5 -5,5 h-8 q-5,0 -5,-5 Z" fill="#8f8f8f"/><path d="M${f(x + 9)},${f(y - 6)} q9,0 9,6 q0,6 -9,6" fill="none" stroke="#8f8f8f" stroke-width="3"/><ellipse cx="${f(x)}" cy="${f(y - 11)}" rx="9" ry="2.6" fill="#404040"/>`;

  function outfit(c, B) {
    const m = c.body === 'm';
    if (c.outfit === 'blazer') return blob([[-3, -339], [8, -335.5], [10, -312], [6, -296]], '#ffffff')
      + path('M-3,-339 L6,-296 L2,-298 L-6,-334 Z', c.topS) + path('M8,-335.5 L11,-313 L6.5,-296 L9,-318 Z', c.topS)
      + `<circle cx="8.5" cy="-268" r="2.2" fill="#171717"/>`;
    if (c.outfit === 'cardigan') return blob([[3, -334], [10, -334.5], [18.4, -300], [14.5, -262], [18, -224.5], [12.5, -224], [10, -262], [11, -300]], '#ffffff');
    if (c.outfit === 'sweater') return path(m ? 'M-7,-343 C-1,-336 7,-336 12,-340 L13,-336 C6,-331 -2,-331 -8,-339 Z' : '', c.topS)
      + path(m ? 'M-24.8,-226 L21.4,-226 L22,-219 L0,-218.5 L-25,-219 Z' : 'M-22.6,-229 L19.6,-230 L20,-224 L0,-222.5 L-22.5,-221 Z', c.topS);
    if (c.outfit === 'shirt') return path('M-7,-343 L1,-331 L-3,-327 L-9,-337 Z', c.topS) + path('M12,-340 L5,-331 L10,-327 L15,-336 Z', c.topS)
      + path('M5,-331 L4,-224 L6,-224 L7,-331 Z', c.topS);
    // plain top: soft fold under the bust
    return m ? '' : path('M8,-284 C12,-286 16,-286 19,-292 C18,-286 15,-281 10,-280 Z', c.topS);
  }

  // expressions: happy (default) | neutral | concerned | surprised | thinking
  function face(c, H, eyes, expr = 'happy') {
    const x = H.x, y = H.y, ink = '#171717', s = c.skinS, bc = c.brow || (c.hair === 'danaBob' ? '#1e3a8a' : ink);
    const up = expr === 'surprised' ? 2.6 : 0, look = expr === 'thinking' ? -1.4 : 0;
    let o = '';
    if (eyes === 'closed') o += `<path d="M${x + 6.6},${y - 1} q2.6,2.2 5.2,0 M${x + 17},${y - 1.2} q1.8,1.8 3.6,0" fill="none" stroke="${ink}" stroke-width="1.6" stroke-linecap="round"/>`;
    else { const ry = expr === 'surprised' ? 3.2 : 2.6; o += `<ellipse cx="${x + 9.3}" cy="${y - 1.6 + look}" rx="1.9" ry="${ry}" fill="${ink}"/><ellipse cx="${x + 18.6}" cy="${y - 1.8 + look}" rx="1.5" ry="${ry - .2}" fill="${ink}"/>`; }
    const brow = { happy: `M${x + 5.6},${y - 7.6} q3.6,-2.4 7.4,-0.6 M${x + 16.6},${y - 8.2} q2.4,-1.4 4.4,0`,
      neutral: `M${x + 5.6},${y - 7.8} l7.4,-0.6 M${x + 16.6},${y - 8.4} l4.4,0`,
      concerned: `M${x + 5.6},${y - 7} q3.6,-0.6 7.4,-3 M${x + 16.4},${y - 10.4} q2.4,0.8 4.6,1.8`,
      surprised: `M${x + 5.6},${y - 7.6 - up} q3.6,-3 7.4,-1 M${x + 16.6},${y - 8.4 - up} q2.4,-1.8 4.4,0`,
      thinking: `M${x + 5.6},${y - 9.6} q3.6,-2.6 7.4,-0.4 M${x + 16.6},${y - 8} l4.4,0.4` }[expr] || '';
    o += `<path d="${brow}" fill="none" stroke="${bc}" stroke-width="1.7" stroke-linecap="round"/>`;
    o += `<path d="M${x + 21.4},${y + 2.6} q1.4,1.4 0,2.4" fill="none" stroke="${s}" stroke-width="1.4" stroke-linecap="round"/>`;
    const mouth = { happy: `<path d="M${x + 13},${y + 12.6} q3.6,2.8 7,-0.4" fill="none" stroke="${c.lip}" stroke-width="1.7" stroke-linecap="round"/>`,
      neutral: `<path d="M${x + 14},${y + 13.6} l5.4,-0.3" fill="none" stroke="${c.lip}" stroke-width="1.7" stroke-linecap="round"/>`,
      concerned: `<path d="M${x + 12.4},${y + 14.6} q3.2,-2.2 6,0.2" fill="none" stroke="${c.lip}" stroke-width="1.7" stroke-linecap="round"/>`,
      surprised: `<ellipse cx="${x + 15.8}" cy="${y + 14}" rx="2.3" ry="3.1" fill="${c.lip}"/>`,
      thinking: `<path d="M${x + 14.6},${y + 14.2} l5,-1.4" fill="none" stroke="${c.lip}" stroke-width="1.7" stroke-linecap="round"/>` }[expr] || '';
    return o + mouth;
  }
  function glasses(H) {
    const x = H.x, y = H.y;
    return `<g fill="none" stroke="#404040" stroke-width="1.6" stroke-linejoin="round"><rect x="${x + 4}" y="${y - 6}" width="11" height="8.4" rx="3"/><path d="M${x + 17.2},${y - 5.4} h2.6 q1.2,3.7 0,7.4 h-2.6 z"/><path d="M${x + 15},${y - 3} h2.2 M${x + 4},${y - 3.4} L${x - 5},${y - 2.6}"/></g>`;
  }

  /* ---------- FRONT VIEW: standing and facing the viewer ---------- */
  const FB = {
    f: { sh: 23, shY: -316, hip: 10.5, hipY: -208, neckR: 7.5, neck: [-330, -350], head: -372,
      torso: [[0, -338], [10, -337], [20, -332.5], [28.5, -325], [32.6, -313], [30, -298], [25, -290], [19.5, -266], [21, -246], [22, -232], [21, -221]],
      pelvis: [[14, -240], [19, -228], [22.5, -206], [10, -196]] },
    m: { sh: 28, shY: -320, hip: 12, hipY: -210, neckR: 9, neck: [-332, -354], head: -376,
      torso: [[0, -342], [12, -341], [25, -337], [34.5, -329], [39.4, -316], [37, -300], [29, -284], [24.5, -262], [24.8, -240], [24, -219]],
      pelvis: [[17, -240], [22, -228], [24.5, -206], [11, -196]] },
  };
  const mirror = pts => { const r = pts.slice().reverse().map(([x, y]) => [-x, y]); return [...pts, ...(r[0][0] === -pts[pts.length - 1][0] && pts[pts.length - 1][0] === 0 ? r.slice(1) : r)].filter((p, i, a) => !(p[0] === 0 && i > 0 && a[i - 1][0] === 0 && a[i - 1][1] === p[1])); };
  const FACE = {
    f: 'M0,-28 C14,-28 22,-19 22,-5 C22,8 18,18 10,24 C6,27 -6,27 -10,24 C-18,18 -22,8 -22,-5 C-22,-19 -14,-28 0,-28 Z',
    m: 'M0,-30 C15,-30 23,-20 23,-6 C23,8 20,19 12,25 C7,28.4 -7,28.4 -12,25 C-20,19 -23,8 -23,-6 C-23,-20 -15,-30 0,-30 Z',
  };
  const SHORT_F = 'M0,-32.5 C-16,-32.5 -24.4,-22 -24.4,-8 C-24.4,-2 -23.6,2 -22.6,4 L-20.6,4 C-20.6,-6 -16,-14 -8,-17 C0,-19 8,-19 15,-16 C19,-13 20.6,-6 20.6,4 L22.6,4 C23.6,2 24.4,-2 24.4,-8 C24.4,-22 16,-32.5 0,-32.5 Z';
  const SLEEK_F = 'M0,-32 C-16,-32 -25,-21 -24,-6 C-24,0 -23,4 -22,6 L-20,4 C-20,-8 -12,-18 0,-19 C12,-18 20,-8 20,4 L22,6 C23,4 24,0 24,-6 C25,-21 16,-32 0,-32 Z';
  const HAIR_F = {
    heroLong: { back: 'M0,-33 C-22,-33 -31,-18 -31,2 C-31,30 -33,60 -35,92 C-24,96 24,96 35,92 C33,60 31,30 31,2 C31,-18 22,-33 0,-33 Z',
      front: 'M-6,-32.5 C-22,-31 -30,-18 -29,0 C-28,20 -27,40 -24,62 C-20,65 -15,65 -12,61 C-14,40 -18,20 -19,2 C-19,-10 -14,-18 -6,-22 C4,-17 14,-13 20,-6 C21,6 20,30 16,60 C19,64 24,64 27,60 C30,40 30,18 29,0 C28,-20 18,-33.5 -6,-32.5 Z',
      shine: 'M-20,-20 C-15,-26 -8,-29 -2,-29' },
    danaBob: { front: 'M0,-34 C-22,-34 -31,-20 -31,0 C-31,14 -30,24 -27,31 C-22,34 -17,33 -15,30 C-18,20 -20,8 -19,-4 C-14,-16 -4,-20 6,-20 C14,-18 19,-10 19,-4 C20,8 18,20 15,30 C17,33 22,34 27,31 C30,24 31,14 31,0 C31,-20 22,-34 0,-34 Z' },
    t1Short: { front: SHORT_F,
      beard: 'M-22,3 C-22,16 -14,26.5 -6,29.5 C-2,30.5 2,30.5 6,29.5 C14,26.5 22,16 22,3 L19.6,3 C18.6,12 14,18 8,19.4 C4,16.4 -4,16.4 -8,19.4 C-14,18 -18.6,12 -19.6,3 Z' },
    t2Bun: { behind: [[0, -36, 11]], front: SLEEK_F },
    t3Curls: { front: SHORT_F, curls: [[-22, -12, 8], [-19, -24, 9], [-9, -31, 10], [3, -33, 10], [14, -29, 9.5], [21, -19, 8.5], [23, -8, 6.5], [-24, -2, 6], [-4, -24, 8], [9, -23, 8]] },
    blondeWavy: { back: 'M0,-33 C-22,-33 -31,-18 -32,2 C-33,22 -36,34 -34,46 C-20,50 20,50 34,46 C36,34 33,22 32,2 C31,-18 22,-33 0,-33 Z',
      front: 'M4,-33 C-16,-33 -29,-20 -29,0 C-29,14 -24,22 -28,34 C-30,42 -22,47 -16,41 C-12,33 -18,22 -19,8 C-19,-6 -10,-18 4,-20 C14,-18 20,-10 20,0 C20,14 15,24 17,34 C19,44 28,45 29,36 C31,26 29,14 29,0 C29,-20 20,-33 4,-33 Z',
      shine: 'M-18,-21 C-12,-27 -4,-29 4,-29' },
    t6Puff: { behind: [[0, -40, 16], [-15, -35, 12], [15, -35, 12]], front: SLEEK_F },
  };
  HAIR_F.t5Grey = HAIR_F.t1Short;
  const FPOSES = {
    front:        { tilt: 0, L: { a: 5, e: 6, ha: 4 }, R: { a: 5, e: 6, ha: 4 }, legs: 3 },
    frontPresent: { tilt: -2, L: { a: 6, e: 10 }, R: { a: 14, e: 116, h: 'open', ha: -44 }, legs: 3 },
    frontTalk:    { tilt: 5, L: { a: 16, e: 64, fl: .55, h: 'open', ha: -54 }, R: { a: 16, e: 64, fl: .55, h: 'open', ha: -54 }, legs: 3 },
    frontHold:    { tilt: 6, L: { a: 8, e: -40, fl: .42, h: 'grip', ha: -150 }, R: { a: 8, e: -40, fl: .42, h: 'grip', ha: -150 }, legs: 3, doc: true },
    frontNod:     { tilt: 0, nod: 1, L: { a: 6, e: 10 }, R: { a: 6, e: 10 }, legs: 3 },
  };
  function figureFront(c, P, o) {
    const m = c.body === 'm', F = FB[c.body], B = BODY[c.body], hair = HAIR_F[c.hair] || {}, sx = c.sx || 1, HS = 1.22, expr = o.expr || 'happy';
    const bigF = g => `<g transform="translate(0,${F.neck[1]}) scale(${f(HS / sx * 1e3) / 1e3},${HS}) translate(0,${-F.neck[1]})">${g}</g>`;
    const dirS = (deg, sd) => V(sd * Math.sin(deg * R), Math.cos(deg * R));
    const arm = (sd, A) => { const sh = V(sd * F.sh, F.shY), el = add(sh, mul(dirS(A.a, sd), B.upper)), wr = add(el, mul(dirS(A.a + A.e, sd), B.fore * (A.fl || 1))); return { sd, j: [sh, el, wr], hd: dirS(A.a + A.e + (A.ha || 0), sd), h: A.h || 'relax' }; };
    const aL = arm(-1, P.L), aR = arm(1, P.R);
    const hand = (A, col) => {
      const t = A.hd, flip = (A.sd > 0) !== (A.h === 'open');            // thumb inward when hanging, upward for an open palm
      const vx = flip ? -t.y : t.y, vy = flip ? t.x : -t.x;
      const hs = A.h === 'point' ? [...HANDS.point, capsule(V(1.8, 12), V(2.4, 31), 2.5), capsule(V(5, 4), V(6.6, 12.5), 2.7)] : [HANDS[A.h]];
      return `<g transform="matrix(${f(vx * 1e3) / 1e3},${f(vy * 1e3) / 1e3},${f(t.x * 1e3) / 1e3},${f(t.y * 1e3) / 1e3},${f(A.j[2].x)},${f(A.j[2].y)}) scale(1.12)" fill="${col}">${hs.map(d => `<path d="${d}"/>`).join('')}</g>`;
    };
    const armDraw = A => {
      const hid = A.h === 'none' || A.h === 'pocket';
      let s = limb(A.j, B.arm, c.skin, { u1: hid ? 1.8 : 1.9 });
      s += limb(A.j, B.arm, c.top, { u1: c.sleeve, grow: c.sleeve >= 2 ? 1.6 : 1.2, capEnd: false });
      if (c.sleeve < 2) s += limb(A.j, B.arm, c.topS, { u0: c.sleeve - .12, u1: c.sleeve, grow: 1.9, capEnd: false, capStart: false });
      else if (c.outfit === 'sweater' || c.outfit === 'cardigan') s += limb(A.j, B.arm, c.topS, { u0: 1.84, u1: 1.97, grow: 1.9, capEnd: false, capStart: false });
      if (A.h === 'pocket') s += pocket(A.j, A.sd < 0 ? c.pant : c.pantS, A.sd < 0 ? c.pantS : c.pant);
      return hid ? s : s + hand(A, c.skin);
    };
    const spread = P.legs || 3;
    const leg = sd => { const hp = V(sd * F.hip, F.hipY), kn = add(hp, mul(dirS(spread, sd), B.thigh)), an = add(kn, mul(dirS(spread * .4, sd), B.shin)); return [hp, kn, an]; };
    const lL = leg(-1), lR = leg(1);
    const dy = -(lL[2].y + 12);
    const shoe = (j, sd) => `<path d="M-9,-3 C-12,3 -12,9 -8,11.5 C-2,13 8,13 12,11 C15,9 14,4 11,1 C8,-3 3,-5 -2,-5 Z" fill="${c.shoe}" transform="translate(${f(j[2].x)},${f(j[2].y)}) scale(${sd},1)"/>`;
    const legDraw = (j, sd) => limb(j, B.leg, c.skinS, { u0: 1.8 }) + shoe(j, sd) + limb(j, B.pant, o.waistDebug ? '#ff00ff' : sd < 0 ? c.pant : c.pantS, { u1: 1.93, capEnd: false });
    const HY = F.head + (P.nod || o.nod || 0) * 4, tilt = P.tilt || 0;
    const hp = (d, col) => `<path d="${d}" fill="${col}" transform="translate(0,${HY})"/>`;
    let s = '';
    if (hair.back) s += bigF(hp(hair.back, c.hc));
    if (P.behind) s += armDraw(aL) + armDraw(aR);
    s += legDraw(lL, -1) + legDraw(lR, 1);
    s += blob(mirror(F.pelvis), o.waistDebug ? '#ff00ff' : c.pant);
    s += `<path d="${capsule(V(0, F.neck[0]), V(0, F.neck[1]), F.neckR)}" fill="${c.skinS}"/>`;
    s += blob(mirror(F.torso), c.top);
    { const r = B.arm[0][1] + (c.sleeve >= 2 ? 1.6 : 1.2); [-1, 1].forEach(sd => s += `<circle cx="${f(sd * (F.sh - 3))}" cy="${F.shY + 5}" r="${f(r)}" fill="${c.top}"/>`); }   // smooth shoulder cap where the sleeve meets the torso
    s += outfitFront(c, m);
    let hd = '';
    const atF = g => `<g transform="translate(0,${HY})">${g}</g>`;
    if (c.hair === 't6Puff') hd += atF(poly(curly(0, -39, 21, 15.5, 0, 360, 10, 2.4), c.hc) + curlMarks(c, [[-13, -41], [-2, -48], [6, -40]]));
    const Y = HY, ew = m ? 23 : 22;
    hd += `<ellipse cx="${-ew}" cy="${Y + 1}" rx="4" ry="6" fill="${c.skin}"/><ellipse cx="${ew}" cy="${Y + 1}" rx="4" ry="6" fill="${c.skin}"/>`;
    hd += hp(FACE[c.body], c.skin);
    const ink = '#171717', bc = c.brow || (c.hair === 'danaBob' ? '#1e3a8a' : ink), eyes = P.eyes || o.eyes || 'open';
    const ery = expr === 'surprised' ? 3.2 : 2.6, ely = expr === 'thinking' ? -1.6 : 0;
    hd += eyes === 'closed' ? `<path d="M-11,${Y} q3,2.4 6,0 M5,${Y} q3,2.4 6,0" fill="none" stroke="${ink}" stroke-width="1.6" stroke-linecap="round"/>`
      : `<ellipse cx="${expr === 'thinking' ? -7 : -8}" cy="${Y - .5 + ely}" rx="1.9" ry="${ery}" fill="${ink}"/><ellipse cx="${expr === 'thinking' ? 9 : 8}" cy="${Y - .5 + ely}" rx="1.9" ry="${ery}" fill="${ink}"/>`;
    const fb = { happy: `M-12,${Y - 7} q4,-2.6 8,-.6 M4,${Y - 7.6} q4,-2 8,.6`, neutral: `M-12,${Y - 7.4} h8 M4,${Y - 7.4} h8`,
      concerned: `M-12,${Y - 6.6} q4,-.4 8,-3 M4,${Y - 9.6} q4,.4 8,3`, surprised: `M-12,${Y - 9.6} q4,-3 8,-.6 M4,${Y - 10.2} q4,-2.4 8,.6`,
      thinking: `M-12,${Y - 7.2} h8 M4,${Y - 10} q4,-2.4 8,.4` }[expr];
    hd += `<path d="${fb}" fill="none" stroke="${bc}" stroke-width="1.7" stroke-linecap="round"/>`;
    hd += `<path d="M-.5,${Y + 2} q2.6,4 -.4,6.4" fill="none" stroke="${c.skinS}" stroke-width="1.5" stroke-linecap="round"/>`;
    hd += { happy: `<path d="M-5,${Y + 13.4} q5,3.6 10,0" fill="none" stroke="${c.lip}" stroke-width="1.7" stroke-linecap="round"/>`,
      neutral: `<path d="M-4,${Y + 14.4} h8" fill="none" stroke="${c.lip}" stroke-width="1.7" stroke-linecap="round"/>`,
      concerned: `<path d="M-4.6,${Y + 15.6} q4.6,-3 9.2,0" fill="none" stroke="${c.lip}" stroke-width="1.7" stroke-linecap="round"/>`,
      surprised: `<ellipse cx="0" cy="${Y + 14.6}" rx="2.8" ry="3.6" fill="${c.lip}"/>`,
      thinking: `<path d="M-2,${Y + 14.8} l7,-1.6" fill="none" stroke="${c.lip}" stroke-width="1.7" stroke-linecap="round"/>` }[expr];
    if (hair.beard) hd += hp(hair.beard, c.hc);
    if (c.glasses) hd += `<g fill="none" stroke="#404040" stroke-width="1.6"><rect x="-15" y="${Y - 5.6}" width="12" height="9" rx="3.2"/><rect x="3" y="${Y - 5.6}" width="12" height="9" rx="3.2"/><path d="M-3,${Y - 2.4} h6 M-15,${Y - 2.6} h-6 M15,${Y - 2.6} h6"/></g>`;
    if (c.hair === 't3Curls') hd += atF(poly(curly(0, -13, 28, 24, 176, 364, 9, 2.4).concat([[26, -4], [24.6, 2], [22.4, 5], [20.8, 3], [20, -5], [17, -11.4], [11, -14.6], [4, -13.4], [-3, -15.4], [-10, -13.6], [-16.6, -11], [-20, -5], [-20.8, 3], [-22.4, 5], [-24.6, 2], [-26, -4]]), c.hc) + curlMarks(c, [[-20, -22], [-8, -30], [5, -29], [15, -20], [-4, -20], [-23, -10]]));
    if (hair.front && c.hair !== 't3Curls') hd += hp(hair.front, c.hc);
    if (hair.shine) hd += `<path d="${hair.shine}" transform="translate(0,${Y})" fill="none" stroke="${c.hcS}" stroke-width="2" stroke-linecap="round"/>`;
    const HD = `<g class="hd" transform="rotate(${tilt} 0 ${F.neck[0]})">${bigF(hd)}</g>`;
    if (P.doc) { const mm = P.one ? add(aR.j[2], V(-14, 2)) : mul(add(aL.j[2], aR.j[2]), .5); s += doc(mm.x, mm.y - 30, 0, 60, 76); }
    if (P.prop === 'mug') { const w = aR.j[2]; const h = add(w, mul(aR.hd, 20)); s += mug(h.x - 2, h.y - 3); }
    if (!P.behind) s += armDraw(aL) + armDraw(aR);
    s += HD;
    if (o.waistDebug) s += `<rect x="-400" y="${m ? -220 : -222}" width="800" height="600" fill="#ffffff"/>`;   // test only
    return `<g transform="translate(0,${f(dy)}) scale(${sx},1)">${s}</g>`;
  }
  function outfitFront(c, m) {
    const y0 = m ? -342 : -338;
    if (c.outfit === 'blazer') return path(`M-9,${y0} L9,${y0} L0,${y0 + 46} Z`, '#ffffff') + path(`M-9,${y0} L-13,${y0 + 4} L-2,${y0 + 46} L0,${y0 + 46} Z`, c.topS) + path(`M9,${y0} L13,${y0 + 4} L2,${y0 + 46} L0,${y0 + 46} Z`, c.topS) + `<circle cx="0" cy="${y0 + 70}" r="2.4" fill="#171717"/>`;
    if (c.outfit === 'cardigan') return path(`M-8,${y0 + 1} L8,${y0 + 1} C6,${y0 + 22} 5,${y0 + 40} 5,-224 L-5,-224 C-5,${y0 + 40} -6,${y0 + 22} -8,${y0 + 1} Z`, '#ffffff');
    if (c.outfit === 'sweater') return path(`M-11.4,${y0 + 2.2} C-6,${y0 + 8.4} 6,${y0 + 8.4} 11.4,${y0 + 2.2} C12.6,${y0 + 2.8} 13.2,${y0 + 3.6} 12.6,${y0 + 4.6} C6,${y0 + 13} -6,${y0 + 13} -12.6,${y0 + 4.6} C-13.2,${y0 + 3.6} -12.6,${y0 + 2.8} -11.4,${y0 + 2.2} Z`, c.topS) + path(`M-25,-228 L25,-228 L25,-219 L-25,-219 Z`, c.topS);
    if (c.outfit === 'shirt') return path(`M-11,${y0} L-1,${y0 + 12} L-6,${y0 + 17} L-13,${y0 + 6} Z`, c.topS) + path(`M11,${y0} L1,${y0 + 12} L6,${y0 + 17} L13,${y0 + 6} Z`, c.topS) + path(`M-1,${y0 + 12} L-1,-219 L1,-219 L1,${y0 + 12} Z`, c.topS);
    return '';
  }

  /* ---------- props shared by the desk views (neutral greys so no outfit blends into them) ---------- */
  const DESK = '#e5e5e5', DESK_EDGE = '#d4d4d4', CHAIR = '#a3a3a3';

  /* ---------- seen from above, typing at a desk (like ref1). opts.t = seconds, drives the typing ---------- */
  function deskTop(c, o) {
    const t = o.t || 0, hs = c.hair, m = c.body === 'm';
    let s = '';
    s += `<rect x="-200" y="-420" width="400" height="250" rx="6" fill="${c.desk || DESK}"/><rect x="-200" y="-178" width="400" height="8" rx="4" fill="${c.deskEdge || DESK_EDGE}"/>`;
    s += `<rect x="-30" y="-392" width="60" height="22" rx="4" fill="#a3a3a3"/><rect x="-120" y="-410" width="240" height="18" rx="6" fill="#404040"/>`;
    s += `<rect x="-104" y="-318" width="188" height="70" rx="8" fill="#a3a3a3"/>`;
    for (let r = 0; r < 4; r++) for (let k = 0; k < 12; k++) { if (r === 3 && k > 2 && k < 9) continue; s += `<rect x="${-98 + k * 15}" y="${-312 + r * 15.5}" width="12" height="12" rx="2.5" fill="#ffffff"/>`; }
    s += `<rect x="-53" y="-265.5" width="87" height="12" rx="2.5" fill="#ffffff"/>`;
    s += `<ellipse cx="122" cy="-282" rx="13" ry="19" fill="#ffffff"/><path d="M122,-300 v12" stroke="#a3a3a3" stroke-width="2"/>`;
    if (!o.base && (o.variant || c.deskV) === 'write') s += `<path d="M-8,-250 L118,-250 L118,-190 L-8,-190 Z" fill="#ffffff"/><path d="M6,-238 h66 M6,-226 h54 M6,-214 h60" stroke="#bdbdbd" stroke-width="3" stroke-linecap="round"/><path d="M80,-236 L92,-258" stroke="#404040" stroke-width="4" stroke-linecap="round"/>`;
    s += `<circle cx="-150" cy="-300" r="17" fill="#2563eb"/><circle cx="-150" cy="-300" r="11" fill="#404040"/><path d="M-133,-302 h9" stroke="#2563eb" stroke-width="6" stroke-linecap="round"/>`;
    // only the top of the chair back shows, just behind her shoulders
    s += `<path d="M-50,-128 C-30,-118 30,-118 50,-128 L52,-117 C30,-104 -30,-104 -52,-117 Z" fill="${CHAIR}"/>`;
    // arms to the keyboard
    const tap = side => Math.max(0, Math.sin(t * 14 + (side > 0 ? 0 : 1.9) + Math.sin(t * 5) * 2)) * 4;
    const P = BODY[c.body].arm;
    const arm = side => {
      const D = o.base ? 'type' : o.variant || c.deskV || 'type';
      let el = V(side * 60, -212), wr = V(side * 40, -262 + tap(side));
      if (side > 0 && D === 'mouse') { el = V(88, -206); wr = V(118, -256); }
      if (side > 0 && D === 'write') { el = V(86, -194); wr = V(84, -214 + tap(1) * .5); }
      if (side < 0 && D === 'write') { el = V(-60, -206); wr = V(-4, -222); }
      if (side < 0 && D === 'mug') { el = V(-92, -208); wr = V(-128, -262); }
      const sh = V(side * 46, -160), hd = nrm(sub(wr, el));
      let a = limb([sh, el, wr], P, c.skin, { u1: 1.9 });
      a += `<g transform="matrix(${f(hd.y * side)},${f(-hd.x * side)},${f(hd.x)},${f(hd.y)},${f(wr.x)},${f(wr.y)})" fill="${c.skin}"><path d="${HANDS.relax}"/></g>`;
      a += limb([sh, el, wr], P, c.top, { u1: c.sleeve, grow: 1.6, capEnd: false });
      if (c.sleeve < 2) a += limb([sh, el, wr], P, c.topS, { u0: c.sleeve - .12, u1: c.sleeve, grow: 1.9, capEnd: false, capStart: false });
      return a;
    };
    s += arm(-1) + arm(1);
    const k = m ? 1.08 : 1;
    s += blob([[-58, -150], [-48, -176], [-20, -184], [20, -184], [48, -176], [58, -150], [44, -132], [0, -126], [-44, -132]].map(([x, y]) => [x * k, y]), c.top);
    s += blob([[-50, -146], [-30, -138], [0, -134], [30, -138], [50, -146], [44, -132], [0, -126], [-44, -132]].map(([x, y]) => [x * k, y]), c.topS);
    // head from above. y grows toward the chair; the face points at the keyboard (up).
    const cy = -160, r = m ? 24 : 22.5;
    // long hair lies on the upper back, drawn whole (not cut by the torso)
    if (hs === 'heroLong') s += path(`M-21,${cy} C-22,${cy + 18} -19,${cy + 32} -13,${cy + 40} C-8,${cy + 44} -3,${cy + 42} 0,${cy + 44} C3,${cy + 42} 8,${cy + 44} 13,${cy + 40} C19,${cy + 32} 22,${cy + 18} 21,${cy} Z`, c.hc);
    if (hs === 'blondeWavy') s += path(`M-23,${cy} C-28,${cy + 14} -24,${cy + 22} -27,${cy + 30} C-20,${cy + 36} -12,${cy + 32} -6,${cy + 35} C0,${cy + 31} 6,${cy + 35} 12,${cy + 32} C18,${cy + 36} 27,${cy + 32} 26,${cy + 26} C24,${cy + 20} 28,${cy + 12} 23,${cy} Z`, c.hc);
    if (hs === 'danaBob') s += `<ellipse cx="0" cy="${cy + 4}" rx="${r + 7}" ry="${r + 7}" fill="${c.hc}"/>`;
    s += `<ellipse cx="${-r - .5}" cy="${cy - 2}" rx="4.4" ry="6.6" fill="${c.skinS}"/><ellipse cx="${r + .5}" cy="${cy - 2}" rx="4.4" ry="6.6" fill="${c.skinS}"/>`;
    s += `<ellipse cx="0" cy="${cy - 8}" rx="${r - 1}" ry="${r + 2}" fill="${c.skin}"/><ellipse cx="0" cy="${cy - r - 9}" rx="4.6" ry="5.4" fill="${c.skin}"/>`;
    if (hs === 't2Bun') s += `<circle cx="0" cy="${cy + r - 1}" r="11" fill="${c.hc}"/>`;
    if (hs === 't6Puff') s += poly(curly(0, cy + 16, 15, 14, 0, 360, 9, 2.4), c.hc);
    const fr = (hs === 't1Short' || hs === 't5Grey' || hs === 't3Curls') ? 7 : 4;     // short cuts show more forehead
    s += `<ellipse cx="0" cy="${cy - 8 + fr}" rx="${r + 1}" ry="${r + 2}" fill="${c.hc}"/>`;
    if (hs === 't3Curls') s += poly(curly(0, cy - 3, r + 4, r + 5, 0, 360, 11, 2.6), c.hc) + curlMarks(c, [[-14, cy - 14], [-2, cy - 18], [7, cy - 8], [-16, cy - 1], [-4, cy - 4], [8, cy + 5], [-9, cy + 10]]);
    if (hs !== 't3Curls') { const pc = c.hc === '#171717' ? '#404040' : c.hc === '#2563eb' ? '#1d4ed8' : c.hcS; s += `<path d="M-3,${cy + r - 4} C-5,${cy + 4} -5,${cy - 14} -2,${cy - r - 2}" fill="none" stroke="${pc}" stroke-width="2.2" stroke-linecap="round"/>` + `<path d="M-12,${cy - 6} C-10,${cy - 14} -6,${cy - 18} -3,${cy - 20} M7,${cy - 4} C9,${cy - 12} 10,${cy - 16} 12,${cy - 18}" fill="none" stroke="${pc}" stroke-width="1.8" stroke-linecap="round" opacity=".8"/>`; }
    return s;
  }

  /* ---------- BACK VIEWS ----------
     Two upper bodies, both with the hips at (0,0) and the crown at about y = -212:
       turnBody(c)  three-quarter from behind, turned to the right (ear, cheek and jaw visible; like ref2)
       backBody(c)  straight from behind
     Hair outlines are single organic shapes: no stacked circles. */
  const curlLine = c => c.hc === '#2a2420' ? '#4d4038' : c.hc === '#171717' ? '#3f3f3f' : c.hcS;
  // a soft curly outline: n rounded lobes of uneven size along an ellipse, from angle a0 to a1 (degrees, 0 = right, 90 = down)
  function curly(cx, cy, rx, ry, a0, a1, n, amp) {
    const out = [], N = n * 10;
    for (let i = 0; i <= N; i++) {
      const u = i / N * n, w = Math.pow(Math.abs(Math.sin(Math.PI * u)), .8) * amp * (1 + .22 * Math.sin(Math.floor(u) * 2.1)), a = (a0 + (a1 - a0) * i / N) * R;
      out.push([cx + Math.cos(a) * (rx - amp * .5 + w), cy + Math.sin(a) * (ry - amp * .5 + w)]);
    }
    return out;
  }
  const poly = (pts, c) => blob(pts, c);   // smooth, so the neat nape has no corners
  const curlMarks = (c, list) => `<g fill="none" stroke="${curlLine(c)}" stroke-width="1.6" stroke-linecap="round">${list.map(([x, y]) => `<path d="M${x},${y} q3.4,-4.6 7,-.6"/>`).join('')}</g>`;

  /* head, three-quarter from behind, facing right; centre (0,0) */
  function turnHead(c) {
    const hs = c.hair, sk = c.skin, sh = c.skinS, hc = c.hc, line = curlLine(c);
    const face = 'M4,-24 C17,-24 24.5,-16 25.4,-6 C25.8,-2 28.6,2.4 28.2,4.6 C27.8,6.4 26,6.6 25.6,7.6 C26,11 25.6,14 24.4,17.4 C22.4,22.6 16,25.4 9,23.6 C0,21.4 -8,15 -9,6 L-9,-14 Z';
    const ear = `<path d="M-1.5,-3.5 C1.5,-7 8,-5.6 8,.4 C8,5.6 4.6,9.6 1.4,9.4 C-1,9.2 -2,6 -2,3 Z" fill="${sk}"/><path d="M1.2,-1.6 C4,-3.4 5.8,-1 5,2 C4.6,3.8 3.4,5 2.6,5.8" fill="none" stroke="${sh}" stroke-width="1.5" stroke-linecap="round"/>`;
    // hairline over the ear, tucked behind it, forehead at the right
    const TUCK = 'C-3,3 -3.4,-4 1.6,-7.4 C5,-5.6 6.6,-3 8.4,-.6 C10,-4 9.6,-9 12.6,-12.4 C15.4,-14.8 18.6,-15.8 22,-16.4 Z';
    const top = 'M22,-16.4 C19.4,-29.4 6,-34 -7,-32 C-22,-29.6 -30.4,-16.4 -29.4,-1 ';
    const SHORT = top + 'C-28.6,10 -24,18.6 -17,23.6 C-12.6,26 -7,25.4 -4.4,20.6 C-2.8,16.4 -2.6,12 -2.2,8.4 ' + TUCK;
    const CROP = 'M22,-16.4 C19,-28 7,-32 -5,-30.6 C-18,-28.6 -26.4,-17 -25.8,-2 C-25.4,7 -22.4,14 -17.4,19 C-13.4,22.4 -8,22 -5,17.6 C-3.2,14 -2.8,11 -2.2,8.4 ' + TUCK;
    const SLEEK = top + 'C-28.8,9 -23,16.4 -14.6,17.6 C-8.6,18 -4.6,14 -2.6,8.6 ' + TUCK;
    const LONG = top + 'C-29,26 -33.4,56 -36.6,88 C-33,92 -30,90 -28,93 C-23,97 -19,93 -15,96.4 C-10,98 -5,94.6 -1,92 C2.4,66 2.6,40 1,24 C.2,17.6 -1,13 -2,8.6 ' + TUCK;
    const WAVE = top + 'C-28.8,9 -35.4,15 -35,24.6 C-34.8,31.6 -38.4,35 -36,42.4 C-32.6,48.6 -25.6,46 -21,49.6 C-15.6,52.8 -10.6,47.4 -5,49 C1.4,49.4 7.4,44.6 6,37 C4.8,31 1.6,28.6 1.6,21.6 C1.4,16 -.8,12.6 -2,8.6 ' + TUCK;
    // bob: cut to a soft point behind the ear, strands end in tips (one tone)
    const BOB = top + 'C-29.6,9 -32.4,18 -31.4,27 C-28.4,30 -25,28.6 -22.6,31.4 C-17.6,34.4 -14,30.4 -9.6,32.6 C-4.4,33 .6,29.4 3.4,24.6 C2,19 -.8,13.6 -2,8.6 ' + TUCK;
    let s = '';
    if (hs === 't2Bun') s += path('M-27,-2 C-37,-6 -45,2 -43.4,11 C-42,20 -31,22.6 -25,15.6 C-21,10.6 -21.4,1.6 -27,-2 Z', hc) + `<path d="M-39.4,7 C-37.4,.6 -31,-.4 -27.6,4" fill="none" stroke="${line}" stroke-width="1.8" stroke-linecap="round"/>`;
    if (hs === 't6Puff') s += poly(curly(-17, -34, 18, 16, 0, 360, 9, 2.4), hc) + curlMarks(c, [[-28, -35], [-18, -43], [-13, -32]]);
    s += path(face, sk);
    if (c.hair === 't1Short' || c.hair === 't5Grey') s += path('M7.4,5 C6.4,12 10,17.6 16,18.6 C19.6,18.8 22.4,17 25.2,15.4 C24.6,20.4 20.4,25.4 13,25 C4.4,24.4 -2,17 -2.6,8 L2,9 Z', hc);
    if (c.glasses) s += `<path d="M5,-2 L25,-5.6 M24.6,-8.4 C28,-8 28.6,-2 26,.6" fill="none" stroke="#404040" stroke-width="1.7" stroke-linecap="round"/>`;
    const d = { heroLong: LONG, blondeWavy: WAVE, danaBob: BOB, t2Bun: SLEEK, t6Puff: SLEEK, t1Short: CROP, t5Grey: CROP }[hs];
    if (d) s += path(d, hc);
    if (hs === 't3Curls') {   // one curly silhouette, neat at the nape and above the ear
      s += poly(curly(-4, -10, 28.6, 27, -18, -216, 8, 2.5).concat([[-24.6, 10], [-21, 15.6], [-16.4, 19], [-11.6, 20.4], [-7.6, 18.8], [-5, 14.4], [-3.4, 9], [-2.4, 2], [-.6, -4], [2, -7], [5, -5.6], [8.4, -1], [9.8, -6], [11.6, -10.4], [14.6, -13.2], [18.6, -14.4]]), hc);
      s += curlMarks(c, [[-18, -27], [-5, -31], [6, -25], [-24, -13], [-11, -17], [-21, 2], [-12, 6]]);
    }
    if (hs === 'heroLong') s += `<path d="M-14,-24 C-22,-12 -22,24 -26,70 M-8,10 C-8,34 -10,58 -12,80" fill="none" stroke="${c.hcS}" stroke-width="1.8" stroke-linecap="round"/>`;
    if (hs === 'blondeWavy') s += `<path d="M-14,-24 C-21,-12 -18,6 -24,18 C-27,26 -23,32 -26,38 M-9,12 C-8,22 -13,28 -10,38" fill="none" stroke="${c.hcS}" stroke-width="1.8" stroke-linecap="round"/>`;
    if (hs === 't2Bun') s += `<path d="M8,-24 C-6,-24 -18,-14 -24,0 M2,-14 C-8,-12 -16,-4 -22,6" fill="none" stroke="${line}" stroke-width="1.6" stroke-linecap="round"/>`;
    return s + ear;
  }

  /* upper body, three-quarter from behind, turned right. o.arms: 'keys' (both forearms forward) | 'lap' */
  function turnBody(c, o = {}) {
    const m = c.body === 'm', k = m ? 1.12 : 1, arms = o.arms || 'keys', long = c.sleeve >= 2;
    const X = pts => pts.map(([x, y]) => [x * k, y]);
    const A = BODY[c.body].arm.map(([u, a, b]) => [u, a * (u < .7 ? 1.42 : u < 1.2 ? 1.5 : 1.22), b * (u < .7 ? 1.42 : u < 1.2 ? 1.5 : 1.22)]);
    const handAt = (j, col, sc = 1.16, rot = 0) => { const t = nrm(sub(j[2], j[1])), q = rot * R, t2 = V(t.x * Math.cos(q) - t.y * Math.sin(q), t.x * Math.sin(q) + t.y * Math.cos(q)); return `<path d="${HANDS.relax}" fill="${col}" transform="${frame(j[2], t2)} scale(${sc})"/>`; };
    const armShape = (j, sk, cl, cuff) => { let s = limb(j, A, sk, { u1: 1.96, r: 16 }) + handAt(j, sk, 1.12, arms === 'keys' ? 8 : -38);
      s += limb(j, A, cl, { u1: long ? 1.9 : c.sleeve, grow: 1.2, capEnd: false, r: 16 });
      if (!long) s += limb(j, A, cuff, { u0: c.sleeve - .12, u1: c.sleeve, grow: 1.6, capEnd: false, capStart: false, r: 16 });
      return s; };
    const far = arms === 'keys' ? [V(6, -98), V(52 * k, -66), V(112, -70)] : [V(6, -98), V(44 * k, -52), V(64 * k, -18)];
    const near = arms === 'keys' ? [V(25 * k, -100), V(48 * k, -40), V(110, -56)] : [V(25 * k, -100), V(37 * k, -44), V(50 * k, -18)];
    let s = arms === 'keys' && o.both ? armShape(far, c.skinS, c.topS, c.topS) : '';   // one arm shows; o.both adds the far one
    // neck: behind the collar, in shadow under the hair and jaw
    const nr = m ? 11.4 : 9;
    s += path(`M${-nr - 2},-166 L${nr + 5},-160 C${nr + 4},-146 ${nr + 5},-138 ${nr + 11},-128 L${-nr - 12},-126 C${-nr - 4},-138 ${-nr - 2},-150 ${-nr - 2},-166 Z`, c.skinS);
    // back and shoulders: slope from the neck, rounded shoulder, ribs, waist
    s += blob(X([[-12, -137], [-25, -131], [-40, -122], [-48.5, -109], [-49, -92], [-44, -70], [-39.5, -46], [-38, -24], [-40, 0], [-40, 12], [0, 15], [37, 12], [36.5, 0], [34.5, -26], [36, -50], [40, -76], [42, -96], [38, -113], [27, -125], [15, -132], [2, -130]]), c.top);
    s += backOutfit(c, k);
    // near arm: starts inside the shoulder so there is no knob, only the crease of the sleeve
    s += armShape(near, c.skin, c.top, c.topS);
    s += `<path d="M${f(14 * k)},-96 C${f(13 * k)},-78 ${f(20 * k)},-58 ${f(31 * k)},-42" fill="none" stroke="${c.topS}" stroke-width="2.6" stroke-linecap="round"/>`;
    s += `<g transform="translate(4,-172) scale(1.12)">${turnHead(c)}</g>`;
    return s;
  }
  function backOutfit(c, k) {
    const l = (d, w = 2.4) => `<path d="${d}" fill="none" stroke="${c.topS}" stroke-width="${w}" stroke-linecap="round"/>`;
    if (c.outfit === 'shirt') return path(`M${-15 * k},-136 C-6,-128 8,-127 ${17 * k},-131 L${18 * k},-125 C8,-120 -7,-121 ${-16.5 * k},-130 Z`, c.topS) + l(`M${-40 * k},-108 C-20,-100 10,-99 ${24 * k},-104`, 1.8);
    if (c.outfit === 'blazer') return path(`M${-15 * k},-137 C-6,-130 8,-129 ${17 * k},-132 L${20 * k},-124 C8,-119 -8,-120 ${-19 * k},-130 Z`, c.topS) + l('M-5,-118 C-7,-80 -6,-40 -5,6', 1.8);
    if (c.outfit === 'sweater') return l(`M${-14 * k},-134 C-6,-128.5 8,-128 ${17 * k},-130.5`, 4.4);
    return l(`M${-13.5 * k},-135 C-6,-129.5 8,-129 ${16.5 * k},-131`, 2.6);
  }

  /* head straight from behind; centre (0,0) */
  function backHead(c) {
    const hs = c.hair, sk = c.skin, sh = c.skinS, hc = c.hc, line = curlLine(c);
    const skull = path('M0,-30 C15,-30 23.4,-20 23.4,-6 C23.4,8 18,20 9,24.4 C4,26 -4,26 -9,24.4 C-18,20 -23.4,8 -23.4,-6 C-23.4,-20 -15,-30 0,-30 Z', sk);
    const ears = [-1, 1].map(d => `<path d="M${d * 22},-5 C${d * 26},-7 ${d * 28.4},-3 ${d * 27.4},2 C${d * 26.4},6.4 ${d * 23.4},8.4 ${d * 21.6},7 Z" fill="${sk}"/>`).join('');
    // tapered nape instead of a straight helmet edge
    const SHORT = 'M0,-33 C17,-33 25.6,-22 25.4,-7 C25.2,0 23.6,5 22.4,8 C21.6,14 17,20.6 11,23 C6.6,24.8 3,22.6 0,22.6 C-3,22.6 -6.6,24.8 -11,23 C-17,20.6 -21.6,14 -22.4,8 C-23.6,5 -25.2,0 -25.4,-7 C-25.6,-22 -17,-33 0,-33 Z';
    const SLEEK = 'M0,-33 C17,-33 25.6,-22 25.4,-7 C25.2,3 20.4,13.6 12,18 C7,20 3.6,22 0,22 C-3.6,22 -7,20 -12,18 C-20.4,13.6 -25.2,3 -25.4,-7 C-25.6,-22 -17,-33 0,-33 Z';
    let s = '';
    if (hs === 't6Puff') s += poly(curly(0, -38, 19, 16, 0, 360, 9, 2.4), hc) + curlMarks(c, [[-12, -40], [-1, -47], [6, -38]]);
    s += ears + skull;
    if (hs === 't1Short' || hs === 't5Grey') s += path(SHORT, hc) + `<path d="M-13,13 C-9,17 -4,17.6 0,17.6 C4,17.6 9,17 13,13" fill="none" stroke="${line}" stroke-width="1.6" stroke-linecap="round"/>`;
    if (hs === 't2Bun' || hs === 't6Puff') s += path(SLEEK, hc) + `<path d="M-19,-16 C-15,-4 -9,4 -4,8 M19,-16 C15,-4 9,4 4,8" fill="none" stroke="${line}" stroke-width="1.6" stroke-linecap="round"/>`;
    if (hs === 't2Bun') s += path('M0,-2 C9,-3 14,4 13,11.6 C12,19 6,22.6 0,22.6 C-6,22.6 -12,19 -13,11.6 C-14,4 -9,-3 0,-2 Z', hc) + `<path d="M-9,11 C-8,4 0,1.6 5.6,5.4 C9.6,8.6 7,15.4 1,15.4 C-3,15.4 -4.4,11.4 -1.6,9.6" fill="none" stroke="${line}" stroke-width="1.8" stroke-linecap="round"/>`;
    if (hs === 't3Curls') { s += poly(curly(0, -9, 28, 27, 168, 372, 9, 2.5).concat([[25, 5], [23, 10], [19.4, 15.4], [14.4, 19.6], [8.6, 22], [3, 22.6], [-3, 22.6], [-8.6, 22], [-14.4, 19.6], [-19.4, 15.4], [-23, 10], [-25, 5]]), hc) + curlMarks(c, [[-17, -24], [-4, -29], [9, -23], [-21, -9], [-8, -13], [6, -9], [15, -4], [-14, 4], [0, 5]]); }
    if (hs === 'danaBob') s += path('M0,-35 C18,-35 29,-23 29,-6 C29,6 31,16 31.4,25 C28,29.4 24,27.4 21,30.4 C16,33.4 12,29.6 7.6,32 C3,34 -2,30.6 -6.4,32.4 C-11.4,34 -15,29.8 -19.6,31 C-24,31.4 -29,29.6 -31.4,25 C-31,16 -29,6 -29,-6 C-29,-23 -18,-35 0,-35 Z', hc);
    if (hs === 'heroLong') s += path('M0,-35 C17,-35 28,-24 28.4,-7 C28.6,16 31,52 33,88 C30,92.4 25,90 22,93 C16,96.6 12,92.6 7,95 C2,96.8 -3,93.6 -8,95.6 C-14,97 -18,92.6 -23,93.4 C-28,93.6 -31,91.6 -33,88 C-31,52 -28.6,16 -28.4,-7 C-28,-24 -17,-35 0,-35 Z', hc) + `<path d="M0,-28 C-1,-10 -1,0 -1,10 M-15,-20 C-19,4 -20,38 -22,74 M14,-16 C18,8 18,40 20,70" fill="none" stroke="${c.hcS}" stroke-width="1.8" stroke-linecap="round"/>`;
    if (hs === 'blondeWavy') s += path('M0,-35 C17,-35 28,-24 28.4,-7 C28.6,6 34,14 33,24 C32.4,31 36,36 33.6,43 C29,50 22,46 17,50 C11,53.6 6,48 0,50 C-6,52.6 -11,48 -17,50 C-23,51 -30,49 -33.6,43 C-36,36 -32.4,31 -33,24 C-34,14 -28.6,6 -28.4,-7 C-28,-24 -17,-35 0,-35 Z', hc) + `<path d="M0,-28 C-1,-12 -1,-4 -1,4 M-14,-18 C-19,0 -14,14 -20,26 C-23,33 -19,37 -21,42 M14,-16 C18,2 13,16 19,28 C22,34 18,38 20,42" fill="none" stroke="${c.hcS}" stroke-width="1.8" stroke-linecap="round"/>`;
    return s;
  }

  /* upper body straight from behind (arms come forward, so only upper arms and elbows show) */
  function backBody(c, o = {}) {
    const m = c.body === 'm', k = m ? 1.12 : 1, long = c.sleeve >= 2;
    const A = BODY[c.body].arm.map(([u, a, b]) => [u, a * 1.36, b * 1.36]);
    const X = pts => pts.map(([x, y]) => [x * k, y]);
    const arm = (sd, elX, elY, hx, hy) => { const j = [V(sd * 35 * k, -101), V(sd * elX * k, elY), V(sd * hx * k, hy)], cl = sd > 0 ? c.top : c.topS;
      let a = limb(j, A, c.skin, { u1: 1.9, r: 15 }); a += limb(j, A, cl, { u1: long ? 1.9 : c.sleeve, grow: 1.2, capEnd: !long, r: 15 }); return a; };
    let s = o.hip ? arm(-1, 70, -62, 34, -22) + arm(1, 56, -46, 30, -24) : arm(-1, 55, -42, 33, -14) + arm(1, 55, -42, 33, -14);
    const nr = m ? 11.4 : 9;
    s += path(`M${-nr},-168 L${nr},-168 C${nr},-148 ${nr + 1},-138 ${nr + 10},-128 L${-nr - 10},-128 C${-nr - 1},-138 ${-nr},-148 ${-nr},-168 Z`, c.skinS);
    const half = [[0, -131], [13, -135], [25, -130], [38, -121], [46.5, -108], [46, -92], [41, -70], [37.5, -46], [36, -24], [37.5, 0], [38, 10]];
    s += blob(X([...half, ...half.slice(1).reverse().map(([x, y]) => [-x, y])]), c.top);
    s += `<g transform="translate(0,2)">${backOutfitS(c, k)}</g>`;
    s += [-1, 1].map(d => `<path d="M${f(d * 37 * k)},-94 C${f(d * 36 * k)},-82 ${f(d * 37 * k)},-72 ${f(d * 39 * k)},-62" fill="none" stroke="${c.topS}" stroke-width="2.4" stroke-linecap="round"/>`).join('');
    s += `<g transform="translate(0,-172) scale(1.12)">${backHead(c)}</g>`;
    return s;
  }
  function backOutfitS(c, k) {
    const l = (d, w = 2.4) => `<path d="${d}" fill="none" stroke="${c.topS}" stroke-width="${w}" stroke-linecap="round"/>`;
    if (c.outfit === 'shirt' || c.outfit === 'blazer') return path(`M${-15 * k},-137 C-6,-130 6,-130 ${15 * k},-137 L${17 * k},-130 C6,-122 -6,-122 ${-17 * k},-130 Z`, c.topS) + (c.outfit === 'blazer' ? l('M0,-120 L0,4', 1.8) : l(`M${-36 * k},-106 C-16,-100 16,-100 ${36 * k},-106`, 1.8));
    return l(`M${-13 * k},-135.5 C-6,-130 6,-130 ${13 * k},-135.5`, c.outfit === 'sweater' ? 4.4 : 2.6);
  }

  /* ---------- sitting, seen from behind. Every character sits differently (c.sit); opts.variant overrides.
     feet: both feet flat, turned · step: one foot forward, one tucked under the chair · tuck: feet pulled back
     over: one knee crossed over the other · stretch: legs out in front, ankles crossed
     wide: straight on, feet apart · ankles: straight on, ankles crossed under the seat · lotus: cross-legged on the seat */
  const SIT = { hero: ['feet', 1], dana: ['over', -1], t1: ['wide', 1], t2: ['ankles', 1], t3: ['step', 1], t4: ['tuck', -1], t5: ['stretch', 1], t6: ['lotus', 1] };
  function sitBack(c, o, id) {
    const [v0, dir0] = SIT[id] || ['feet', 1], v = o.variant || v0, dr = o.variant ? 1 : dir0, m = c.body === 'm', k = m ? 1.1 : 1;
    const pc = c.pant, ps = c.pantS, sh = c.shoe, straight = ['wide', 'ankles', 'lotus'].includes(v);
    const T = [[0, 15.5 * k, 15.5 * k], [1, 11 * k, 11 * k], [2, 8, 8]], ch = '#929292', base = '#7a7a7a';
    const leg = (hp, kn, an, col) => limb([hp, kn, an], T, col, { capEnd: false, r: 13 });
    const shoe = (x, y, rot = 0, col = sh) => `<path d="M-9,-5 C-10.4,2 -10,8 -7.6,10 L20,10 C24,10 24.6,7 22,5 C17,2.4 12,1 7,-5 Z" fill="${col}" transform="translate(${x},${y}) rotate(${rot})"/>`;
    const ankle = (x, y) => `<rect x="${x - 5}" y="${y - 10}" width="10" height="12" rx="3" fill="${c.skinS}"/>`;
    const heel = (x, y, rot = 0) => `<path d="M-8,-7 C-9.6,2 -9,9 -5.4,10 L5.4,10 C9,9 9.6,2 8,-7 Z" fill="${sh}" transform="translate(${x},${y}) rotate(${rot})"/>`;
    const seatY = -122;
    const chairBase = `<rect x="-4.5" y="-106" width="9" height="78" rx="3" fill="${base}"/><path d="M-46,-27 C-24,-33 24,-33 46,-27 L47,-20 C24,-26 -24,-26 -47,-20 Z" fill="${base}"/>` + [-42, 0, 42].map(x => `<circle cx="${x}" cy="-9" r="8" fill="#737373"/>`).join('');
    const seat = `<rect x="-52" y="${seatY - 2}" width="104" height="19" rx="9.5" fill="${ch}"/>`;
    const backrest = `<rect x="-35" y="${seatY - 74}" width="70" height="62" rx="17" fill="${ch}"/><rect x="-6" y="${seatY - 16}" width="12" height="18" fill="${ch}"/>`;
    let under = '', over = '', body;
    if (straight) {
      body = `<g transform="translate(0,${seatY})">${backBody(c)}</g>`;
      if (v === 'wide') under = leg(V(-20, -116), V(-46, -102), V(-56, -18), ps) + leg(V(20, -116), V(46, -102), V(56, -18), pc) + heel(-58, -10, -8) + heel(58, -10, 8);
      if (v === 'ankles') under = leg(V(-18, -116), V(-26, -94), V(8, -20), ps) + heel(11, -11, -14) + leg(V(18, -116), V(26, -94), V(-8, -20), pc) + heel(-11, -11, 14);
      if (v === 'lotus') over = path('M-14,-136 C-34,-142 -62,-140 -72,-126 C-76,-114 -60,-104 -38,-103 L0,-103 L0,-136 Z', ps) + path('M14,-136 C34,-142 62,-140 72,-126 C76,-114 60,-104 38,-103 L0,-103 L0,-136 Z', pc);
    } else {
      body = `<g transform="translate(0,${seatY})">${turnBody(c, { arms: 'lap' })}</g>`;
      const farHip = V(-4, -130), nearHip = V(2, -124);
      if (v === 'feet') over = leg(farHip, V(62, -130), V(60, -24), ps) + ankle(60, -14) + shoe(60, -12) + leg(nearHip, V(50, -122), V(44, -22), pc) + ankle(44, -10) + shoe(44, -10);
      if (v === 'step') { under = leg(farHip, V(40, -112), V(8, -26), ps) + ankle(6, -18) + shoe(4, -14, 24); over = leg(nearHip, V(58, -124), V(66, -22), pc) + ankle(66, -10) + shoe(66, -10); }
      if (v === 'tuck') over = leg(farHip, V(62, -128), V(26, -26), ps) + ankle(20, -18) + shoe(18, -15, 22) + leg(nearHip, V(54, -122), V(8, -24), pc) + ankle(4, -16) + shoe(2, -12, 22);
      if (v === 'over') over = leg(farHip, V(52, -124), V(44, -22), ps) + ankle(44, -10) + shoe(44, -10) + leg(nearHip, V(66, -136), V(82, -62), pc) + ankle(84, -54) + shoe(85, -50, 34);
      if (v === 'stretch') over = leg(farHip, V(62, -130), V(98, -22), ps) + ankle(98, -14) + shoe(98, -10, -14) + leg(nearHip, V(56, -125), V(86, -16), pc) + ankle(86, -10) + shoe(87, -10, -6);
    }
    const s = chairBase + under + over + body + seat + backrest;
    return dr < 0 ? `<g transform="scale(-1,1)">${s}</g>` : s;
  }

  /* ---------- over the shoulder, cut above the waist: we stand behind them and see their screen.
     opts.screen = SVG in a 262×168 box. The shot is clipped to its 480×400 frame. ---------- */
  function keyboard(x, y, w, h) {
    let s = `<path d="M${x + 14},${y} L${x + w - 4},${y} Q${x + w + 2},${y} ${x + w},${y + 5} L${x + w - 10},${y + h - 4} Q${x + w - 12},${y + h} ${x + w - 18},${y + h} L${x + 3},${y + h} Q${x - 3},${y + h} ${x - 1},${y + h - 5} L${x + 8},${y + 4} Q${x + 10},${y} ${x + 14},${y} Z" fill="#a3a3a3"/>`;
    const rows = 4, cols = 11;
    for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) { const yy = y + h * (.12 + r * .2), sk = (1 - (yy - y) / h) * 10; s += `<rect x="${f(x + 5 + sk + q * (w - 22) / cols)}" y="${f(yy)}" width="${f((w - 22) / cols - 1.8)}" height="${f(h * .15)}" rx="1.4" fill="#ffffff"/>`; }
    return s;
  }
  function overShoulder(c, o) {
    let s = `<rect x="0" y="292" width="480" height="108" fill="${c.desk || DESK}"/><rect x="0" y="290" width="480" height="4" fill="${c.deskEdge || DESK_EDGE}"/>`;
    s += `<rect x="322" y="214" width="26" height="80" fill="#a3a3a3"/><path d="M276,304 C276,296 292,292 335,292 C378,292 394,296 394,304 Z" fill="#a3a3a3"/>`;
    s += `<rect x="188" y="18" width="282" height="200" rx="10" fill="#404040"/><rect x="198" y="28" width="262" height="168" rx="3" fill="#ffffff"/>`;
    s += `<g transform="translate(198,28) scale(1.0738,1.0566)">${o.screen || screenMock()}</g>`;
    s += `<path d="M418,330 h26 v24 q0,8 -8,8 h-10 q-8,0 -8,-8 Z" fill="#2563eb"/><path d="M444,336 q11,0 11,8 q0,8 -11,8" fill="none" stroke="#2563eb" stroke-width="4"/><ellipse cx="431" cy="330.5" rx="13" ry="4" fill="#404040"/>`;
    s += keyboard(214, 322, 184, 58);
    s += `<g transform="translate(112,446) scale(${f(1.5 * Math.sqrt(c.scale || 1) * 100) / 100})">${turnBody(c, { arms: 'keys' })}</g>`;
    return `<svg x="-240" y="-400" width="480" height="400" viewBox="0 0 480 400" overflow="hidden">${s}</svg>`;
  }
  function screenMock() {
    let s = `<rect width="244" height="18" fill="#2563eb"/><rect x="0" y="18" width="46" height="141" fill="#dbe6fd"/>`;
    [0, 1, 2, 3].forEach(i => s += `<rect x="8" y="${28 + i * 14}" width="30" height="5" rx="2.5" fill="#93b4f5"/>`);
    [0, 1, 2].forEach(i => s += `<rect x="${56 + i * 62}" y="28" width="54" height="34" rx="4" fill="#ffffff" stroke="#dbe6fd" stroke-width="2"/><rect x="${63 + i * 62}" y="36" width="26" height="5" rx="2.5" fill="#a3a3a3"/><rect x="${63 + i * 62}" y="47" width="36" height="8" rx="2" fill="${i === 0 ? '#2563eb' : '#404040'}"/>`);
    [[0, 70], [1, 46], [2, 88], [3, 58], [4, 34], [5, 76], [6, 52]].forEach(([i, h]) => s += `<rect x="${60 + i * 25}" y="${148 - h}" width="15" height="${h}" rx="2" fill="${i === 2 ? '#2563eb' : '#93b4f5'}"/>`);
    return s;
  }

  function draw(id, pose = 'stand', opts = {}) {
    const c = CAST[id]; if (!c) return '';
    const o = Object.assign({ x: 0, y: 0, facing: 1, scale: 1 }, opts);
    const sc = (o.scale || 1) * (pose === 'overShoulder' ? 1 : c.scale || 1);   // the over-the-shoulder desk keeps one size
    const c0 = DESKV[id] ? Object.assign({ deskV: DESKV[id] }, c) : c;
    const inner = FPOSES[pose] ? figureFront(c, posed(id, pose, FPOSES[pose], o), o) : pose === 'deskTop' ? deskTop(c0, o) : pose === 'sitBack' ? sitBack(c, o, id) : pose === 'overShoulder' ? overShoulder(c, o) : figure(c, typeof pose === 'object' ? pose : posed(id, POSES[pose] ? pose : 'stand', POSES[pose] || POSES.stand, o), o);
    let out = inner;
    return `<g transform="translate(${f(o.x)},${f(o.y)}) scale(${f(sc * o.facing * 1e3) / 1e3},${f(sc * 1e3) / 1e3})">${out}</g>`;
  }

  window.PEOPLE = { draw, back: id => CAST[id] ? backBody(CAST[id]) : '', over: (id, o) => CAST[id] ? turnBody(CAST[id], o) : '', keyboard, CAST, POSES, poses: [...Object.keys(POSES), ...Object.keys(FPOSES), 'sitBack', 'overShoulder', 'deskTop'] };
})();
