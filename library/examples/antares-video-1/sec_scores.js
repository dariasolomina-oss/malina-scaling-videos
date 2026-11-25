(function() {
  const { C, FOCUS, em, sg, ob, L2 } = S2;
  const T0 = 135.22, T1 = 173.42;
  const io = (x) => {
    x = Math.min(1, Math.max(0, x));
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  };
  const PG = { x: 24, y: 20, w: 1872, h: 1040 };
  const TIERS = [["Low", "#008138", "#e9fbf0"], ["Medium", "#a16207", "#fefbe8"], ["High", "#c2410c", "#fff5ed"], ["Very high", "#bf000f", "#fef2f2"], ["Extreme", "#7e22ce", "#f8f3ff"]];
  const chip = (ti, cls = "tch") => {
    const [l, c, b] = TIERS[ti];
    return `<span class="${cls}" style="color:${c};background:${b}">${l}</span>`;
  };
  const pill = (k) => k === "B" ? `<span class="scpl b">${icx("wall", 48, "#bf000f", 2.2)}&nbsp;Blocker</span>` : `<span class="scpl w">${icx("warn", 48, "#b75000", 2.2)}&nbsp;Warning</span>`;
  const ROWS = [["DAX rewrites", "W", 0.41], ["LOD expressions", "W", 0.64], ["Set actions", "B", 0.92]];
  const TGT = [["Power BI", powerbi(96), 1, 4], ["Databricks AI/BI", databricks(96), 0.78, 2], ["Sigma", sigma(96), 0.66, 2]];
  const COMP = [["FIXED", 2, `<span class="fx">{FIXED</span> [REGION], [ORDER_DATE] :
    SUM([UNITS])}`], ["Window", 2, "WINDOW_AVG(SUM([SALES]), -2, 0)"], ["Running", 1, "RUNNING_SUM(SUM([NET_SALES]))"], ["Percent", 0, "% of Total SUM([NET_SALES])"]];
  const chart = `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.4" stroke-linecap="round"><path d="M6 20V12M12 20V5M18 20v-9"/></svg>`;
  const GX = 438, GY = 560, GR = 284, RR = 342, LR = 404;
  const pt = (f, r) => [GX + r * Math.cos(Math.PI * (1 - f)), GY - r * Math.sin(Math.PI * (1 - f))];
  const arc = (f0, f1, r) => {
    const [x0, y0] = pt(f0, r), [x1, y1] = pt(f1, r);
    return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  };
  const gauge = (id) => `<svg class="scGa" id="${id}" viewBox="40 60 796 770" preserveAspectRatio="xMidYMid meet">
  ${TIERS.map((_, j) => `<path d="${arc(j / 5 + 8e-3, (j + 1) / 5 - 8e-3, GR)}" fill="none" stroke="#e8ecf3" stroke-width="72"/><path class="gf" d="${arc(j / 5 + 8e-3, (j + 1) / 5 - 8e-3, GR)}" fill="none" stroke="#2563eb" stroke-width="72" pathLength="1" stroke-dasharray="1 2" stroke-dashoffset="1"/>`).join("")}
  ${TIERS.map(([, c], j) => `<path class="gr" d="${arc(j / 5 + 8e-3, (j + 1) / 5 - 8e-3, GR)}" fill="none" stroke="${c}" stroke-width="72" opacity="0"/>`).join("")}
  <text class="gtl lo" x="${GX - GR}" y="${GY + 66}" text-anchor="middle">Low</text><text class="gtl hi" x="${GX + GR}" y="${GY + 66}" text-anchor="middle">Extreme</text>
  <text class="gtl mid" x="${GX}" y="${GY - GR - 62}" text-anchor="middle">High</text>
  <text class="gv" x="${GX}" y="${GY + 6}" text-anchor="middle">0</text>
  <text class="glb" x="${GX}" y="${GY + 224}" text-anchor="middle">${id === "scGa1" ? "Tableau complexity" : "Migration difficulty"}</text>
</svg>`;
  S2.screen += `
<div id="scx"><div id="scP"><div id="scI">
  <div id="scF"><i class="a"></i><i class="b"></i><i class="c"></i><i class="d"></i></div>
  <div id="scH"><div style="width:250px;color:#2563eb;display:flex">${LOGO.replace('height="31"', 'width="100%"')}</div><span class="sl">/</span><span class="mono">${C[FOCUS].name}</span></div>
  <div class="scT" id="scT1"><div class="top"><span class="ic" style="background:#eaf1fe">${chart}</span><span class="anyT">${icx("arrow", 58, "#a1a1a1", 2.4)}<i>${powerbi(64)}</i><i>${databricks(64)}</i><i>${sigma(64)}</i></span></div>
    <div class="num"><b>0</b>${chip(2)}</div><div class="lb">Tableau complexity</div></div>
  <div class="scT" id="scT2"><div class="top"><span class="ic" style="background:#fff5ed">${icx("warn", 64, "#c2410c", 2.2)}</span></div>
    <div class="num"><b>0</b>${chip(4)}</div><div class="lb"><span class="pb">Migration difficulty</span></div></div>
  <div id="scK"><div class="kh">${icx("warn", 58, "#c2410c", 2.2)}<span>Migration considerations</span><span class="kt">${powerbi(58)}</span></div></div>
  ${ROWS.map(([n, k], i) => `<div class="scR" id="scR${i}"><div class="hd"><span class="nm">${n}</span><span class="pw">${pill(k)}</span></div><div class="imp"><i></i></div></div>`).join("")}
  ${TGT.map(([n, lg, v, ti], i) => `<div class="scG" id="scG${i}"><div class="gl">${lg}</div><div class="gn">${n}</div><div class="gs"></div><div class="gm">Migration difficulty</div><div class="gb"><i></i></div><div>${chip(ti, "gch")}</div></div>`).join("")}
  ${gauge("scGa1")}${gauge("scGa2")}
  <div id="scTg"><span>Tableau complexity</span><span>Migration difficulty</span><i></i></div>
  <div id="scTab"><div class="tin">
    <div class="th"><b>Components</b><span>186</span><span class="csv">${icx("down", 44, "#525252", 2.2)}&nbsp;Export CSV</span></div>
    <div class="tc"><span>Type</span><span>Impact</span><span>Details</span></div>
    ${COMP.map(([ty, ti, d], i) => `<div class="tr${i === 0 ? " r0" : ""}"><span class="ty">${ty}</span><span>${chip(ti, "ich")}</span><span class="dt mono">${d}</span></div>`).join("")}
  </div></div>
</div></div>
<svg id="scCur" viewBox="0 0 26 30"><path d="M3 2v22l6-5.5 4 9 3.5-1.6-4-8.8H21z" fill="#0a0a0a" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>
<div id="scRip"></div></div>`;
  S2.css += `
#scx{position:absolute;left:0;top:0;width:1920px;height:1080px;transform-origin:0 0;display:none;z-index:5}
#scP{position:absolute;left:0;top:0;background:#fff;border:4px solid #e5e5e5;border-radius:44px;overflow:hidden}
#scI{position:absolute;left:0;top:0;width:1872px;height:1040px;transform-origin:0 0;background:#f7f8fa}
#scF{position:absolute;inset:0;background:#fff;z-index:9}#scF i{position:absolute;border-radius:40px;background:#f1f1f1}
#scF .a{left:10%;right:10%;top:9%;height:10%}#scF .b{left:10%;top:26%;width:38%;height:30%}#scF .c{left:52%;top:26%;width:38%;height:30%}#scF .d{left:10%;top:61%;width:80%;height:28%}
#scH{position:absolute;left:0;top:0;right:0;height:140px;background:#fff;border-bottom:4px solid #eee;display:flex;align-items:center;gap:30px;padding:0 48px}#scH .mono{font-size:56px;font-weight:500}#scH .sl{font-size:60px;color:#d4d4d4}
.scT{position:absolute;left:0;top:0;border:4px solid #e5e5e5;border-radius:40px;background:#fff;padding:44px 52px;display:flex;flex-direction:column;overflow:hidden}
.scT .top{display:flex;align-items:center;flex:none;overflow:hidden}
.scT .ic{display:inline-grid;place-items:center;width:120px;height:120px;border-radius:32px;flex:none}
.scT .anyT{display:inline-flex;align-items:center;gap:18px;margin-left:auto}.scT .anyT i{display:inline-grid;place-items:center;width:100px;height:100px;border-radius:26px;background:#f5f5f5}
.scT .num{flex:1;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:34px;min-height:0}
.scT .num b{font-weight:700;letter-spacing:-.05em;line-height:1;font-variant-numeric:tabular-nums}
.tch{font-size:60px;font-weight:700;padding:12px 34px;border-radius:999px;white-space:nowrap}
.scT .lb{font-weight:700;color:#404040;letter-spacing:-.02em;line-height:1.15;flex:none}.scT .pb{border-radius:12px;padding:0 6px;margin:0 -6px}
#scK{position:absolute;left:0;top:0;border:4px solid #fed7aa;border-radius:40px;background:#fff5ed;overflow:hidden}
#scK .kh{height:132px;display:flex;align-items:center;gap:22px;padding:0 44px;font-size:58px;font-weight:700;color:#c2410c;white-space:nowrap;letter-spacing:-.02em}#scK .kt{margin-left:auto;display:flex}
.scR{position:absolute;left:0;top:0;border:4px solid #fde3c8;border-radius:32px;background:#fff;overflow:hidden;padding:0 40px}
.scR .hd{height:196px;display:flex;align-items:center;gap:22px}.scR .nm{font-size:62px;font-weight:700;letter-spacing:-.025em;white-space:nowrap}
.scR .pw{margin-left:auto}.scpl{display:inline-flex;align-items:center;font-size:48px;font-weight:700;padding:12px 30px;border-radius:999px;white-space:nowrap}
.scpl.w{background:#fef3c7;color:#b75000}.scpl.b{background:#fef2f2;color:#bf000f}
.scR .imp{position:absolute;left:40px;right:40px;top:150px;height:22px;border-radius:11px;background:#eef2fb;overflow:hidden}.scR .imp i{display:block;height:100%;border-radius:11px;background:#2563eb;width:0}
.scG{position:absolute;left:0;top:0;border:4px solid #e5e5e5;border-radius:40px;background:#fff;padding:52px 50px;display:flex;flex-direction:column;overflow:hidden}
.scG .gl{display:flex;flex:none}.scG .gn{font-size:60px;font-weight:700;letter-spacing:-.025em;margin-top:26px;white-space:nowrap;flex:none}.scG .gs{flex:1}
.scG .gm{font-size:46px;font-weight:700;color:#737373;flex:none}.scG .gb{height:50px;border-radius:25px;background:#eef0f3;margin:24px 0 34px;overflow:hidden;flex:none}.scG .gb i{display:block;height:100%;border-radius:25px;background:#2563eb;width:0}
.gch{font-size:60px;font-weight:700;padding:12px 36px;border-radius:999px;white-space:nowrap;display:inline-block}
.scGa{position:absolute;left:0;top:0;opacity:0;overflow:visible;pointer-events:none}
.scGa .gtl{font-size:50px;font-weight:700;fill:#a1a1a1;letter-spacing:-.01em}
.scGa .glb{font-size:62px;font-weight:700;letter-spacing:-.02em;fill:#404040}
.scGa .gv{font-size:164px;font-weight:700;letter-spacing:-.05em;fill:#171717}
#scTg{position:absolute;left:0;top:0;display:flex;background:#f1f3f6;border-radius:999px;padding:10px;opacity:0;white-space:nowrap}
#scTg span{position:relative;z-index:1;height:104px;padding:0 46px;display:flex;align-items:center;font-size:54px;font-weight:700;color:#525252}
#scTg i{position:absolute;top:10px;height:104px;border-radius:999px;background:#fff;box-shadow:inset 0 0 0 4px #2563eb}
#scTab{position:absolute;left:0;top:0;border:4px solid #e5e5e5;border-radius:40px;background:#fff;overflow:hidden}
#scTab .tin{position:absolute;left:0;top:0;width:1784px}
#scTab .th{height:120px;display:flex;align-items:center;gap:24px;padding:0 44px;font-size:62px;letter-spacing:-.02em}#scTab .th span{font-size:50px;font-weight:700;color:#737373}
#scTab .csv{margin-left:auto;display:inline-flex;align-items:center;height:90px;padding:0 32px;border:4px solid #e5e5e5;border-radius:22px;font-size:42px!important;color:#404040!important}
#scTab .tc,#scTab .tr{display:grid;grid-template-columns:300px 250px 1fr;align-items:center;padding:0 44px;gap:0}
#scTab .tc{background:#fff;color:#a1a1a1;height:74px;font-size:38px;font-weight:700;color:#a1a1a1;letter-spacing:.06em;text-transform:uppercase;border-top:4px solid #f0f0f0;border-bottom:4px solid #f0f0f0}
#scTab .tr{height:132px;border-bottom:4px solid #f3f3f3}#scTab .tr.r0{height:236px}
#scTab .ty{font-size:56px;font-weight:700}.ich{font-size:44px;font-weight:700;padding:10px 28px;border-radius:999px;white-space:nowrap}
#scTab .dt{font-size:46px;line-height:1.5;white-space:pre;overflow:hidden;text-overflow:ellipsis;background:#f7f8fa;border-radius:20px;padding:14px 26px;color:#262626}
#scTab .dt .fx{border-radius:10px;padding:0 4px;margin:0 -4px}
#scCur{position:absolute;width:110px;height:128px;left:0;top:0;opacity:0;z-index:3}
#scRip{position:absolute;width:200px;height:200px;margin:-100px 0 0 -100px;border-radius:50%;border:10px solid #2563eb;opacity:0;z-index:2}
`;
  const box = (x, y, w, h, o = 1) => ({ x, y, w, h, o });
  const OFF = (y, h = 210) => box(1950, y, 904, h, 0);
  const GS = [box(40, 190, 576, 800), box(648, 190, 576, 800), box(1256, 190, 576, 800)];
  const GH = GS.map((b) => box(b.x, b.y + 80, b.w, b.h, 0));
  const ROWY = [310, 540, 770];
  const K0 = box(1950, 170, 952, 830, 0), TAB0 = box(904, 540, 904, 210, 0);
  const GMODE = (() => {
    try {
      return new URLSearchParams(location.search).get("scgauge") || "two";
    } catch (e) {
      return "two";
    }
  })();
  const LAYS = {
    two: { T1: box(40, 170, 876, 830), T2: box(956, 170, 876, 830), K: K0, R: ROWY.map((y) => OFF(y)), G: GH, S: 0, TAB: TAB0 },
    why: { T1: box(-860, 170, 820, 830, 0), T2: box(40, 170, 800, 830), K: box(880, 170, 952, 830), R: ROWY.map((y) => box(904, y, 904, 210)), G: GH, S: 0, TAB: TAB0 },
    targets: { T1: box(-860, 170, 820, 830, 0), T2: box(40, 190, 576, 800, 0), K: K0, R: ROWY.map((y) => OFF(y)), G: GS, S: 0, TAB: TAB0 },
    tier: GMODE === "toggle" ? { T1: box(40, 170, 1792, 830), T2: box(956, 170, 876, 830, 0), K: K0, R: ROWY.map((y) => OFF(y)), G: GH, S: 1, TAB: TAB0 } : { T1: box(40, 170, 876, 830), T2: box(956, 170, 876, 830), K: K0, R: ROWY.map((y) => OFF(y)), G: GH, S: 1, TAB: TAB0 },
    why2: { T1: box(-860, 170, 820, 830, 0), T2: box(40, 170, 800, 830), K: box(880, 170, 952, 830), R: [box(904, 770, 904, 210), box(904, 540, 904, 210), box(904, 310, 904, 210)], G: GH, S: 0, TAB: TAB0 },
    table: { T1: box(-860, 170, 820, 830, 0), T2: box(-900, 170, 800, 830, 0), K: box(880, 170, 952, 830, 0), R: [OFF(770), box(904, 540, 904, 210, 0), OFF(310)], G: GH, S: 0, TAB: box(40, 170, 1792, 830) }
  };
  const LK = [[0, "two"], [151, "why"], [156.45, "targets"], [160.4, "tier"], [164.35, "why"], [166.05, "why2"], [168.95, "table"]];
  const mixB = (a, b, e) => ({ x: L2(a.x, b.x, e), y: L2(a.y, b.y, e), w: L2(a.w, b.w, e), h: L2(a.h, b.h, e), o: L2(a.o, b.o, b.o > a.o ? sg(e, 0.6, 1) : b.o < a.o ? sg(e, 0, 0.45) : e) });
  function layAt(t) {
    let k = 0;
    for (let i = 0; i < LK.length; i++) if (LK[i][0] <= t) k = i;
    const A = LAYS[LK[k][1]];
    if (k === 0) return A;
    const P = LAYS[LK[k - 1][1]];
    const e = io(sg(t, LK[k][0], LK[k][0] + 0.95));
    const ei = (i) => io(sg(t, LK[k][0] + i * 0.06, LK[k][0] + i * 0.06 + 0.95));
    return { T1: mixB(P.T1, A.T1, e), T2: mixB(P.T2, A.T2, e), K: mixB(P.K, A.K, e), TAB: mixB(P.TAB, A.TAB, e), R: A.R.map((r, i) => mixB(P.R[i], r, ei(i))), G: A.G.map((g, i) => mixB(P.G[i], g, ei(i))), S: L2(P.S, A.S, A.S > P.S ? sg(e, 0.6, 1) : A.S < P.S ? sg(e, 0, 0.45) : e) };
  }
  const CK = [[0, 1, 960, 540, 0.9]];
  function camAt(t) {
    let k = 0;
    for (let i = 0; i < CK.length; i++) if (CK[i][0] <= t) k = i;
    const A = CK[k], P = CK[Math.max(0, k - 1)], e = io(sg(t, A[0], A[0] + A[4]));
    const z = L2(P[1], A[1], e);
    let fx = L2(P[2], A[2], e), fy = L2(P[3], A[3], e);
    const hx = 960 / z, hy = 540 / z;
    fx = Math.min(1920 - hx, Math.max(hx, fx));
    fy = Math.min(1080 - hy, Math.max(hy, fy));
    return { z, fx, fy };
  }
  const place = (el, b, o, dx = 0, dy = 0) => {
    el.style.opacity = o.toFixed(3);
    el.style.width = b.w.toFixed(1) + "px";
    el.style.height = b.h.toFixed(1) + "px";
    el.style.transform = `translate(${(b.x + dx).toFixed(1)}px,${(b.y + dy).toFixed(1)}px)`;
  };
  const ring = (el, on, base = "#e5e5e5") => {
    el.style.borderColor = on ? "#2563eb" : base;
    el.style.boxShadow = on ? "inset 0 0 0 4px #2563eb" : "none";
  };
  const prev = S2.frame;
  S2.frame = function(L, t, $) {
    prev(L, t, $);
    const sx = $("#scx"), wbk = $("#wbk");
    if (t < T0 || t > T1) {
      if (sx.style.display !== "none") sx.style.display = "none";
      if (wbk) wbk.style.display = "none";
      return;
    }
    if (wbk) wbk.style.display = "none";
    sx.style.display = "block";
    const W = (a, b, f = 0.4) => Math.min(sg(t, a, a + f), 1 - sg(t, b - f, b));
    $("#s2c").style.transform = "translate(0px,0px) scale(1)";
    ["#cur2", "#rip2"].forEach((id) => {
      const e = $(id);
      if (e) e.style.opacity = 0;
    });
    const ks = L._k2 || [];
    const hero = ks[FOCUS];
    if (hero) ks.forEach((el, i) => {
      if (i !== FOCUS) el.style.opacity = (+el.style.opacity * (1 - 0.8 * W(T0, 173.3, 0.5))).toFixed(3);
    });
    let cb = { x: 960, y: 540, w: 150, h: 104 };
    if (hero) {
      const m = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(hero.style.transform || "");
      if (m) cb = { x: +m[1], y: +m[2], w: parseFloat(hero.style.width) || 150, h: parseFloat(hero.style.height) || 104 };
    }
    const lift = ob(sg(t, T0, 135.6)) * (1 - em(sg(t, 135.6, 136.5)));
    const lc = 0.22 * lift;
    const cl = { x: cb.x - cb.w * lc / 2, y: cb.y - cb.h * lc / 2, w: cb.w * (1 + lc), h: cb.h * (1 + lc) };
    const open = io(sg(t, 135.55, 136.55)) * (1 - io(sg(t, 172.55, 173.35)));
    const pX = L2(cl.x, PG.x, open), pY = L2(cl.y, PG.y, open), pW = L2(cl.w, PG.w, open), pH = L2(cl.h, PG.h, open);
    const P = $("#scP");
    P.style.transform = `translate(${pX.toFixed(1)}px,${pY.toFixed(1)}px)`;
    P.style.width = pW.toFixed(1) + "px";
    P.style.height = pH.toFixed(1) + "px";
    P.style.borderRadius = L2(18, 44, open).toFixed(1) + "px";
    P.style.borderColor = open < 0.98 ? "#2563eb" : "#e5e5e5";
    P.style.borderWidth = L2(5, 4, open).toFixed(1) + "px";
    $("#scI").style.transform = `scale(${(pW / PG.w).toFixed(4)})`;
    const content = sg(open, 0.5, 0.95);
    $("#scF").style.opacity = (1 - sg(open, 0.15, 0.6)).toFixed(3);
    const cam = camAt(t);
    sx.style.transform = `translate(${(960 - cam.fx * cam.z).toFixed(1)}px,${(540 - cam.fy * cam.z).toFixed(1)}px) scale(${cam.z.toFixed(4)})`;
    const Ly = layAt(t);
    const GM = sg(t, 160.3, 160.45) * (1 - sg(t, 164.4, 164.65));
    const GD = sg(t, 160.45, 160.65) * (1 - sg(t, 164.2, 164.45));
    $("#scH").style.opacity = content.toFixed(3);
    const v1 = 75.7 * em(sg(t, 137.25, 138.45)), v2 = 100 * em(sg(t, 138.3, 139.5));
    [["#scT1", Ly.T1, v1.toFixed(1), 136.45, 138.5], ["#scT2", Ly.T2, v2.toFixed(1), 136.6, 139.6]].forEach(([id, b, txt, a, ca], k) => {
      const el = $(id), pe = em(sg(t, a, a + 0.5));
      let o = b.o * content * pe;
      if (k === 1) o *= 1 - 0.62 * W(140.6, 146.35, 0.35);
      if (k === 0) o *= 1 - 0.62 * W(146.45, 150.95, 0.35);
      place(el, b, o, 0, 50 * (1 - pe));
      ring(el, k === 0 && t > 140.55 && t < 146.35 || k === 1 && t > 146.45 && t < 156.4);
      const cpt = Math.min(1, Math.max(0, (780 - b.h) / 360));
      const top = el.querySelector(".top");
      top.style.height = (120 * (1 - cpt)).toFixed(1) + "px";
      top.style.opacity = ((1 - cpt) * (1 - GM)).toFixed(3);
      el.querySelector(".num").style.opacity = (1 - GM).toFixed(3);
      el.querySelector(".lb").style.opacity = (1 - GM).toFixed(3);
      const lb = el.querySelector(".lb");
      lb.style.fontSize = L2(62, 48, cpt).toFixed(1) + "px";
      const nb = el.querySelector(".num b");
      nb.textContent = txt;
      nb.style.fontSize = Math.max(60, Math.min(260, (b.w - 108) / 2.5)).toFixed(1) + "px";
      const ch = el.querySelector(".tch"), ce = ob(sg(t, ca, ca + 0.4));
      ch.style.opacity = ce > 0 ? 1 : 0;
      ch.style.transform = `scale(${ce.toFixed(3)})`;
    });
    $("#scT1 .anyT").style.opacity = em(sg(t, 145, 145.4)).toFixed(3);
    [...L.querySelectorAll("#scT1 .anyT i")].forEach((d, j) => {
      d.style.transform = `scale(${ob(sg(t, 145.05 + j * 0.14, 145.45 + j * 0.14)).toFixed(3)})`;
    });
    $("#scT2 .pb").style.background = `rgba(37,99,235,${(0.16 * W(150.2, 151.4, 0.25)).toFixed(3)})`;
    place($("#scK"), Ly.K, Ly.K.o * content);
    const ENTER = [153, 154.05, 155.45];
    Ly.R.forEach((b, i) => {
      const el = $("#scR" + i), ee = em(sg(t, ENTER[i], ENTER[i] + 0.45));
      const sideStep = i === 0 ? 70 * Math.sin(Math.PI * io(sg(t, 166.05, 167))) : 0;
      const swap = i === 0 ? Math.sin(Math.PI * io(sg(t, 166.05, 167))) : 0;
      place(el, b, b.o * content * ee * (1 - 0.8 * swap), 120 * (1 - ee) + sideStep, 0);
      el.style.zIndex = i === 0 ? 1 : 2;
      el.style.transform += ` scale(${(1 - 0.06 * swap).toFixed(4)})`;
      const imp = W(164.9, 169.4, 0.4), ge = em(sg(t, 165.2 + (2 - i) * 0.14, 165.9 + (2 - i) * 0.14));
      el.querySelector(".imp").style.opacity = imp.toFixed(3);
      el.querySelector(".imp i").style.width = (ROWS[i][2] * 100 * ge).toFixed(1) + "%";
      el.querySelector(".hd").style.paddingBottom = (36 * imp).toFixed(1) + "px";
      ring(el, t > 165.05 && t < 165.9 || i === 1 && t > 168.2 && t < 169.4, "#fde3c8");
    });
    const selS = t >= 158.25;
    Ly.G.forEach((b, i) => {
      const el = $("#scG" + i);
      place(el, b, b.o * content);
      el.querySelector(".gb i").style.width = (TGT[i][2] * 100 * em(sg(t, 156.9 + i * 0.22, 157.7 + i * 0.22))).toFixed(1) + "%";
      const ce = ob(sg(t, 157.5 + i * 0.22, 157.9 + i * 0.22));
      el.querySelector(".gch").style.transform = `scale(${ce.toFixed(3)})`;
      ring(el, i === 0 && !selS && t > 156.9 || i === 2 && selS);
      el.style.transform += ` scale(${(1 + 0.03 * Math.sin(Math.PI * sg(t, 158.25, 158.6)) * (i === 2 ? 1 : 0)).toFixed(4)})`;
    });
    const hp = t < 162.95 ? -9 : t < 163.6 ? L2(0, 4, io(sg(t, 163, 163.6))) : -9;
    const tog = GMODE === "toggle" ? io(sg(t, 163.2, 163.75)) : 0;
    const GV = [[75.7, 0.52, 2, 160.95], [100, 0.955, 4, 161.2]];
    [["#scGa1", Ly.T1, 0], ["#scGa2", Ly.T2, 1]].forEach(([id, b, k]) => {
      const g = $(id);
      const gb = GMODE === "toggle" ? { x: b.x, y: b.y + 150, w: b.w, h: b.h - 150 } : { x: b.x, y: b.y, w: b.w, h: b.h };
      g.setAttribute("width", gb.w.toFixed(1));
      g.setAttribute("height", gb.h.toFixed(1));
      g.style.transform = `translate(${gb.x.toFixed(1)}px,${gb.y.toFixed(1)}px)`;
      if (GMODE === "toggle" && k === 1) {
        g.style.opacity = 0;
        return;
      }
      g.style.opacity = (b.o * GD * content).toFixed(3);
      let [v, f, ti, a0] = GV[k];
      const sw = em(sg(t, a0, a0 + 1.1));
      if (GMODE === "toggle") {
        v = L2(75.7, 100, tog);
        f = L2(GV[0][1], GV[1][1], tog);
        ti = tog < 0.5 ? 2 : 4;
      }
      const tot = (ti + 1) * sw;
      [...g.querySelectorAll(".gf")].forEach((p, j) => {
        p.style.strokeDashoffset = (1 - Math.max(0, Math.min(1, tot - j))).toFixed(4);
      });
      g.querySelector(".gv").textContent = (GMODE === "toggle" ? v : v * sw).toFixed(1);
      const arrived = sw > 0.85;
      const curT = Math.min(ti, Math.max(0, Math.ceil(tot) - 1));
      const own = hp < -1 && arrived ? 1 : 0;
      [...g.querySelectorAll(".gr")].forEach((p, j) => {
        p.setAttribute("opacity", Math.max(hp > -1 ? Math.max(0, 1 - Math.abs(hp - j) * 0.9) : 0, j === ti ? hp < -1 ? sg(t, a0 + 0.95, a0 + 1.2) : 0 : 0).toFixed(3));
      });
      const run = hp > -1, lo = g.querySelector(".lo"), hi = g.querySelector(".hi"), mid = g.querySelector(".mid");
      lo.style.fill = run && hp < 1 ? TIERS[0][1] : "#a1a1a1";
      hi.style.fill = run && hp > 3 || own && ti === 4 ? TIERS[4][1] : "#a1a1a1";
      mid.style.opacity = ti === 2 ? (run ? 0.25 : sg(t, a0 + 0.95, a0 + 1.2)).toFixed(3) : 0;
      mid.style.fill = TIERS[2][1];
    });
    const tg = $("#scTg");
    if (GMODE === "toggle") {
      const b = Ly.T1;
      const tw = 1170, tx = b.x + (b.w - tw) / 2;
      tg.style.width = tw + "px";
      tg.style.transform = `translate(${tx.toFixed(1)}px,${(b.y + 40).toFixed(1)}px)`;
      tg.style.opacity = (b.o * GD * content).toFixed(3);
      const sp = tg.querySelectorAll("span");
      const i = tg.querySelector("i");
      const w0 = sp[0].offsetWidth, w1 = sp[1].offsetWidth;
      i.style.left = (10 + L2(0, w0, tog)).toFixed(1) + "px";
      i.style.width = L2(w0, w1, tog).toFixed(1) + "px";
      sp[0].style.color = tog < 0.5 ? "#171717" : "#737373";
      sp[1].style.color = tog >= 0.5 ? "#171717" : "#737373";
    } else tg.style.opacity = 0;
    const tb = $("#scTab");
    place(tb, Ly.TAB, Ly.TAB.o * content);
    const tin = tb.querySelector(".tin");
    tin.style.opacity = sg(Ly.TAB.w, 1200, 1750).toFixed(3);
    tin.style.transformOrigin = "0 0";
    tin.style.transform = `scale(${Math.min(1, Ly.TAB.w / 1792, Ly.TAB.h / 830).toFixed(4)})`;
    const r0 = tb.querySelector(".r0");
    r0.style.background = t > 169.7 && t < 172.6 ? "#f3f7ff" : "#fff";
    tb.querySelector(".fx").style.background = `rgba(252,187,0,${(0.45 * em(sg(t, 171.75, 172.1)) * (1 - sg(t, 172.5, 172.8))).toFixed(3)})`;
    const cur = $("#scCur"), rip = $("#scRip");
    cur.style.opacity = 0;
    rip.style.opacity = 0;
    cur.style.left = cur.style.top = rip.style.left = rip.style.top = "0px";
    rip.style.transform = "scale(0.2)";
    const base = sx.getBoundingClientRect(), s = base.width / 1920;
    for (const [tc, sel] of [[158.25, "#scG2 .gn"], [168.85, "#scR1 .nm"]]) {
      if (t > tc - 1 && t < tc + 0.7) {
        const r = $(sel).getBoundingClientRect();
        const x = (r.left - base.left + r.width * 0.55) / s, y = (r.top - base.top + r.height * 0.55) / s;
        const e = io(sg(t, tc - 1, tc - 0.12));
        cur.style.opacity = Math.min(sg(t, tc - 1, tc - 0.75), 1 - sg(t, tc + 0.4, tc + 0.7)).toFixed(3);
        cur.style.left = (x + 300 * (1 - e)).toFixed(1) + "px";
        cur.style.top = (y + 220 * (1 - e)).toFixed(1) + "px";
        const q = sg(t, tc, tc + 0.5);
        rip.style.left = x + 8 + "px";
        rip.style.top = y + 6 + "px";
        rip.style.opacity = t > tc ? ((1 - q) * 0.8).toFixed(3) : 0;
        rip.style.transform = `scale(${(0.2 + q).toFixed(3)})`;
        break;
      }
    }
  };
  S2.beats = S2.beats.filter((b) => b[0] < 135 || b[0] >= 173.4).concat([
    [136.2, "Card opens: workbook details"],
    [138.8, "Two score cards"],
    [143, "Tableau Complexity (any target)"],
    [148.4, "Migration difficulty"],
    [155.9, "Migration considerations to Power BI"],
    [158.6, "Targets: Power BI / Databricks / Sigma"],
    [163.3, "Tiers: low → extreme"],
    [166.6, "Reasons ranked by impact"],
    [170.5, "Components: the FIXED formula"]
  ]).sort((a, b) => a[0] - b[0]);
})();
