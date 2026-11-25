(function() {
  const SW = 1920, SH = 1080;
  const MON = { x: 560, y: 150, w: 800, h: 450 };
  const K = MON.w / SW;
  const lerp2 = (a, b, e) => a + (b - a) * e;
  const pileCards = () => {
    let h = "";
    for (let i = 0; i < 91; i++) {
      const r = R(i * 3 + 1), q = R(i * 5 + 2);
      h += `<div class="pc" style="transform:translate(${(r - 0.5) * 22}px,${(q - 0.5) * 18}px) rotate(${(r + q - 1) * 4}deg)">${WB(150, 104)}</div>`;
    }
    return h;
  };
  const POPS = [
    // [t, kind, x, y, rot]
    [13.2, "formula", 220, 160, -3],
    [14.4, "owner", 1180, 120, 2],
    [15.3, "err", 760, 720, -2],
    [16, "formula", 1300, 520, 3],
    [16.6, "warn", 140, 640, -4],
    [17.2, "dash", 820, 240, 1],
    [17.7, "owner", 380, 420, 3],
    [18.2, "err", 1260, 860, -3],
    [18.6, "formula", 540, 600, 2],
    [19, "warn", 1460, 300, -2],
    [19.4, "err", 120, 140, 4],
    [19.7, "dash", 1e3, 560, -3],
    [20, "owner", 1520, 620, 2],
    [20.25, "formula", 300, 840, -2],
    [20.5, "err", 860, 90, 3],
    [20.75, "warn", 640, 360, -4],
    [21, "err", 1180, 400, 2],
    [21.2, "formula", 60, 420, 3],
    [21.4, "owner", 980, 820, -2],
    [21.6, "err", 420, 120, -3]
  ];
  const popHTML = (k) => ({
    formula: `<div class="win"><div class="wt">Calculated field</div><div class="mono" style="font-size:30px;line-height:1.5;padding:22px 28px">{FIXED [Region] : SUM([Sales])}<br>WINDOW_AVG(SUM([Units]),-2,0)<br><span style="color:#a1a1a1">IF [Param 5] = 'ALL'…</span></div></div>`,
    owner: `<div class="win" style="display:flex;align-items:center;gap:26px;padding:26px 30px">${icx("user", 96, "#a1a1a1", 1.6)}<div><div class="mono" style="font-size:30px">owner: k.larsen</div><div style="margin-top:10px;font-size:30px;font-weight:700;color:#bf000f">left the company</div></div></div>`,
    err: `<div class="win" style="border-color:#bf000f;display:flex;align-items:center;gap:22px;padding:24px 30px;background:#fef2f2">${icx("x", 70, "#bf000f", 2.6)}<div style="font-size:34px;font-weight:700;color:#bf000f">Data source not found</div></div>`,
    warn: `<div class="win" style="border-color:#fcbb00;display:flex;align-items:center;gap:22px;padding:24px 30px;background:#fffbeb">${icx("warn", 70, "#b75000", 2.2)}<div style="font-size:34px;font-weight:700;color:#b75000">214 calculated fields</div></div>`,
    dash: `<div class="win"><div class="wt">Dashboard 7 of 23</div><div style="display:grid;grid-template-columns:repeat(3,120px);gap:14px;padding:22px 28px">${[...Array(6)].map(() => '<div style="height:80px;border-radius:10px;background:#f1f1f1"></div>').join("")}</div></div>`
  })[k];
  const XL_ROWS = [["Pipeline_by_region", "m.chen", "yes?", "~3 wks?", "2?"], ["Executive_weekly", "?", "ask Dana", "?", "?"], ["Regional_KPIs_old", "left 2023", "no?", "?", "?"], ["Store_traffic_pilot", "?", "?", "~1 wk?", "?"], ["Budget_vs_actual_2021", "?", "?", "?", "?"], ["… 407 more", "", "", "", ""]];
  const excelHTML = () => `<div class="xl">
  <div class="xl-top"><span class="xl-ic">X</span><b>migration_scope_v3.xlsx</b><span style="margin-left:auto;opacity:.8">Saved 3 weeks ago</span></div>
  <div class="xl-fx"><span>E2</span><i>fx</i><span id="xlfx">~3 wks?</span></div>
  <div class="xl-grid"><div class="xh"></div>${["A", "B", "C", "D", "E"].map((c) => `<div class="xh">${c}</div>`).join("")}
   <div class="xr">1</div>${["Workbook", "Owner", "Used?", "Effort", "People"].map((c) => `<div class="xc xb">${c}</div>`).join("")}
   ${XL_ROWS.map((r, i) => `<div class="xr">${i + 2}</div>${r.map((v, j) => `<div class="xc ${v.includes("?") ? "xq" : ""}" data-r="${i}" data-c="${j}" data-v="${v}"><span>${v}</span></div>`).join("")}`).join("")}</div></div>`;
  const MOCKS = () => MOCK.map((m) => `<img src="${m}" style="position:absolute;inset:0;width:100%;height:100%;opacity:0">`).join("");
  const envWall = () => {
    let h = "";
    for (let i = 0; i < 45; i++) {
      const r = R(i);
      const cls = r < 0.33 ? "u" : r > 0.93 ? "b" : r > 0.62 ? "w" : "";
      h += `<div class="ec" data-k="${cls}">${WB(176, 122)}</div>`;
    }
    return h;
  };
  const HTML = `<div id="st" style="position:absolute;inset:0;overflow:hidden;background:#fff">
 <div id="world" style="position:absolute;left:0;top:0;width:1920px;height:1080px;transform-origin:0 0">
   <svg id="desk" width="1920" height="1080" viewBox="0 0 1920 1080" style="position:absolute;inset:0;overflow:visible">
     <rect x="-1400" y="760" width="4720" height="900" fill="#f5f5f5"/><rect x="-1400" y="756" width="4720" height="8" fill="#e5e5e5"/>
     <rect x="530" y="120" width="860" height="510" rx="30" fill="#171717"/>
     <rect x="900" y="630" width="120" height="110" fill="#d4d4d4"/><rect x="800" y="736" width="320" height="22" rx="11" fill="#d4d4d4"/>
     <rect x="1250" y="690" width="150" height="70" rx="12" fill="#e5e5e5"/>
     <g id="person"><rect x="720" y="860" width="480" height="260" rx="120" fill="#2563eb"/><path d="M850 790 C846 690 900 672 960 672 C1020 672 1074 690 1070 790 L1080 990 L840 990Z" fill="#e2b75a"/><circle cx="860" cy="700" r="40" fill="#e2b75a"/><circle cx="902" cy="700" r="40" fill="#e2b75a"/><circle cx="947" cy="700" r="40" fill="#e2b75a"/><circle cx="997" cy="700" r="40" fill="#e2b75a"/><circle cx="1042" cy="700" r="40" fill="#e2b75a"/><circle cx="1084" cy="700" r="40" fill="#e2b75a"/><circle cx="842" cy="744" r="40" fill="#e2b75a"/><circle cx="884" cy="744" r="40" fill="#e2b75a"/><circle cx="929" cy="744" r="40" fill="#e2b75a"/><circle cx="979" cy="744" r="40" fill="#e2b75a"/><circle cx="1024" cy="744" r="40" fill="#e2b75a"/><circle cx="1066" cy="744" r="40" fill="#e2b75a"/><circle cx="860" cy="788" r="40" fill="#e2b75a"/><circle cx="902" cy="788" r="40" fill="#e2b75a"/><circle cx="947" cy="788" r="40" fill="#e2b75a"/><circle cx="997" cy="788" r="40" fill="#e2b75a"/><circle cx="1042" cy="788" r="40" fill="#e2b75a"/><circle cx="1084" cy="788" r="40" fill="#e2b75a"/><circle cx="842" cy="832" r="40" fill="#e2b75a"/><circle cx="884" cy="832" r="40" fill="#e2b75a"/><circle cx="929" cy="832" r="40" fill="#e2b75a"/><circle cx="979" cy="832" r="40" fill="#e2b75a"/><circle cx="1024" cy="832" r="40" fill="#e2b75a"/><circle cx="1066" cy="832" r="40" fill="#e2b75a"/><circle cx="860" cy="876" r="40" fill="#e2b75a"/><circle cx="902" cy="876" r="40" fill="#e2b75a"/><circle cx="947" cy="876" r="40" fill="#e2b75a"/><circle cx="997" cy="876" r="40" fill="#e2b75a"/><circle cx="1042" cy="876" r="40" fill="#e2b75a"/><circle cx="1084" cy="876" r="40" fill="#e2b75a"/><circle cx="842" cy="920" r="40" fill="#e2b75a"/><circle cx="884" cy="920" r="40" fill="#e2b75a"/><circle cx="929" cy="920" r="40" fill="#e2b75a"/><circle cx="979" cy="920" r="40" fill="#e2b75a"/><circle cx="1024" cy="920" r="40" fill="#e2b75a"/><circle cx="1066" cy="920" r="40" fill="#e2b75a"/><circle cx="860" cy="964" r="40" fill="#e2b75a"/><circle cx="902" cy="964" r="40" fill="#e2b75a"/><circle cx="947" cy="964" r="40" fill="#e2b75a"/><circle cx="997" cy="964" r="40" fill="#e2b75a"/><circle cx="1042" cy="964" r="40" fill="#e2b75a"/><circle cx="1084" cy="964" r="40" fill="#e2b75a"/><circle cx="858" cy="762" r="40" fill="#e2b75a"/><circle cx="867" cy="734" r="40" fill="#e2b75a"/><circle cx="883" cy="710" r="40" fill="#e2b75a"/><circle cx="905" cy="692" r="40" fill="#e2b75a"/><circle cx="931" cy="680" r="40" fill="#e2b75a"/><circle cx="960" cy="676" r="40" fill="#e2b75a"/><circle cx="989" cy="680" r="40" fill="#e2b75a"/><circle cx="1015" cy="692" r="40" fill="#e2b75a"/><circle cx="1037" cy="710" r="40" fill="#e2b75a"/><circle cx="1053" cy="734" r="40" fill="#e2b75a"/><circle cx="1062" cy="762" r="40" fill="#e2b75a"/><path d="M880 740 a16 16 0 1 1 20 13" stroke="#b8862b" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M990 712 a16 16 0 1 1 20 13" stroke="#b8862b" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M1040 800 a16 16 0 1 1 20 13" stroke="#b8862b" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M900 860 a16 16 0 1 1 20 13" stroke="#b8862b" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M970 900 a16 16 0 1 1 20 13" stroke="#b8862b" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M1050 940 a16 16 0 1 1 20 13" stroke="#b8862b" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M860 950 a16 16 0 1 1 20 13" stroke="#b8862b" stroke-width="6" fill="none" stroke-linecap="round"/></g>
   </svg>
   <div id="screen" style="position:absolute;left:${MON.x}px;top:${MON.y}px;width:${SW}px;height:${SH}px;transform-origin:0 0;transform:scale(${K});overflow:hidden;background:#fff">
     <div id="chat" style="position:absolute;inset:0;background:#fff">
       <div id="n1" class="nt"><div class="card" style="padding:56px 64px;display:flex;gap:46px;align-items:flex-start;border-radius:44px">
         <img src="${CHAT_ICON}" style="width:170px;height:170px;display:block;flex:none">
         <div style="flex:1"><div style="display:flex;align-items:baseline;gap:24px"><span style="font-size:44px;font-weight:700;color:#737373">New message</span><span style="font-size:44px;color:#a1a1a1">#bi-migration</span><span style="margin-left:auto;font-size:40px;color:#a1a1a1">now</span></div>
         <div style="font-size:60px;font-weight:700;margin-top:18px">Dana Reyes</div>
         <div style="font-size:84px;font-weight:700;letter-spacing:-.035em;line-height:1.12;margin-top:10px">Our Tableau licence is running out. We need to migrate to a different tool.</div></div></div></div>
       <div id="n2" class="nt"><div class="card" style="padding:56px 64px;display:flex;gap:46px;align-items:flex-start;border-radius:44px">
         <img src="${CHAT_ICON}" style="width:170px;height:170px;display:block;flex:none">
         <div style="flex:1"><div style="display:flex;align-items:baseline;gap:24px"><span style="font-size:44px;font-weight:700;color:#737373">New message</span><span style="font-size:44px;color:#a1a1a1">#bi-migration</span><span style="margin-left:auto;font-size:40px;color:#a1a1a1">now</span></div>
         <div style="font-size:60px;font-weight:700;margin-top:18px">Dana Reyes</div>
         <div style="font-size:84px;font-weight:700;letter-spacing:-.035em;line-height:1.12;margin-top:10px"><span class="hl" id="hl1">How much time</span> would the migration take, and <span class="hl" id="hl2">how many people</span> do you need?</div></div></div></div>
     </div>
     <div id="pile" style="position:absolute;inset:0;opacity:0;display:grid;grid-template-columns:repeat(13,150px);gap:24px 22px;padding:12px 0 0 0;justify-content:center;align-content:center">${pileCards()}</div>
     <div id="pops" style="position:absolute;inset:0">${POPS.map((p, i) => `<div class="pop2" data-i="${i}" style="left:${p[2]}px;top:${p[3]}px">${popHTML(p[1])}</div>`).join("")}</div>
     <div id="tint" style="position:absolute;inset:0;background:#bf000f;opacity:0;pointer-events:none"></div>
     <svg id="scur" style="position:absolute;width:110px;height:128px;left:0;top:0;opacity:0;z-index:6" viewBox="0 0 26 30"><path d="M3 2v22l6-5.5 4 9 3.5-1.6-4-8.8H21z" fill="#0a0a0a" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>
     <div id="xlw" style="position:absolute;inset:0;opacity:0">${excelHTML()}</div>
     <div id="ripple" style="position:absolute;left:960px;top:540px;width:600px;height:600px;margin:-300px 0 0 -300px;border-radius:50%;border:8px solid #2563eb;opacity:0"></div>
     <div id="splash" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:30px;opacity:0"><div style="width:1000px;color:#2563eb">${LOGO.replace('height="31"', 'width="100%"')}</div><div style="font-size:150px;font-weight:700;letter-spacing:-.045em">Analyzer</div></div>
     <div id="mock" style="position:absolute;inset:0;opacity:0;background:#f7f8fa">${MOCKS()}</div>
     <div id="env" style="position:absolute;inset:0;opacity:0">
       <div id="ewall" style="position:absolute;left:0;top:0;width:1920px;height:1080px">${envWall()}</div>
       <div id="scan" style="position:absolute;top:0;bottom:0;width:16px;background:#2563eb;opacity:0"></div>
       <div id="fly" style="position:absolute;inset:0;pointer-events:none"></div>
       <div id="rep" class="card" style="position:absolute;left:873px;top:45px;width:983px;height:688px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between;padding:52px 56px 56px;opacity:0;border-radius:40px;z-index:2">
         <div style="display:flex;align-items:baseline;gap:22px"><div style="width:220px;color:#2563eb">${LOGO.replace('height="31"', 'width="100%"')}</div><span style="font-size:42px;color:#737373">readiness report</span></div>
         <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:44px">
           <div class="rk" id="rk1"><b data-n="412">0</b><span>workbooks</span></div><div class="rk" id="rk2"><b data-n="1174">0</b><span>dashboards</span></div></div>
         <div class="rr" id="rr1"><span><i style="background:#2563eb"></i>In use</span><div class="trk"><div class="fl" style="background:#2563eb" data-w="67"></div></div><b>275</b></div>
         <div class="rr" id="rr2"><span><i style="background:#a1a1a1"></i>Unused</span><div class="trk"><div class="fl" style="background:#a1a1a1" data-w="33"></div></div><b>137</b></div>
         <div class="rr" id="rr3"><span><i style="background:#bf000f"></i>Hard to move</span><div class="trk"><div class="fl" style="background:#bf000f" data-w="6"></div></div><b>23</b></div>
       </div>
       <div id="exl2" style="position:absolute;left:873px;top:763px;width:983px;opacity:0;z-index:1" class="xl small">
         <div class="xl-grid" style="grid-template-columns:50px repeat(3,1fr)"><div class="xh"></div>${["A", "B", "C"].map((c) => `<div class="xh">${c}</div>`).join("")}<div class="xr">1</div><div class="xc xb">Workbooks</div><div class="xc xb">Unused</div><div class="xc xb">Blocked</div><div class="xr">2</div>${["412", "137", "23"].map((v, j) => `<div class="xc xq" id="ev${j}" data-v="${v}"><span>?</span></div>`).join("")}</div></div>
     </div>
     ${window.S2 ? S2.screen : ""}
   </div>
   ${window.S2 ? S2.world : ""}
 </div>
</div>`;
  const CSS = `
.nt{position:absolute;left:140px;top:300px;width:1640px;opacity:0;transform-origin:50% 0}
.nt .card{background:#fff;border:4px solid #e5e5e5}

.cm{position:absolute;left:70px;right:70px;display:flex;gap:40px;align-items:flex-start;opacity:0}
.cm .av{width:170px;height:170px;border-radius:36px;background:#2563eb;color:#fff;font-size:60px;font-weight:700;display:grid;place-items:center;flex:none}
.cm .cn{font-size:58px;font-weight:700}.cm .cn span{font-weight:400;color:#a1a1a1;font-size:40px;margin-left:16px}
.cm .ct{font-size:90px;font-weight:700;letter-spacing:-.035em;line-height:1.12;margin-top:10px}
.cm .dots{display:flex;gap:16px;background:#f5f5f5;border-radius:40px;padding:44px 50px}.cm .dots i{width:30px;height:30px;border-radius:50%;background:#a1a1a1;display:block}

.tag{position:absolute;transform:translateX(-50%);display:flex;align-items:center;gap:6px;background:#fff;border:4px solid #e5e5e5;border-radius:999px;padding:16px 40px;font-size:60px;font-weight:700;letter-spacing:-.02em;white-space:nowrap;opacity:0}
.win{background:#fff;border:4px solid #e5e5e5;border-radius:26px;overflow:hidden}
.win .wt{background:#f5f5f5;font-size:28px;font-weight:700;color:#525252;padding:14px 28px}
.pop2{position:absolute;opacity:0}
.xl{position:absolute;left:150px;top:110px;width:1620px;background:#fff;border:4px solid #d4d4d4;border-radius:24px;overflow:hidden;font-family:'Helvetica Neue',Arial,sans-serif}
.xl.small{position:absolute;border-radius:18px}
.xl-top{height:96px;background:#1d6f42;color:#fff;display:flex;align-items:center;gap:22px;padding:0 34px;font-size:38px}
.xl-ic{width:58px;height:58px;border-radius:10px;background:#fff;color:#1d6f42;font-weight:800;display:grid;place-items:center;font-size:38px}
.xl-fx{height:76px;border-bottom:3px solid #e5e5e5;display:flex;align-items:center;gap:26px;padding:0 24px;font-size:34px;color:#404040}
.xl-fx i{font-style:italic;color:#737373;border-left:3px solid #e5e5e5;border-right:3px solid #e5e5e5;padding:0 18px}
.xl-grid{display:grid;grid-template-columns:80px 1.6fr 1fr 1fr 1fr .8fr}
.xh{height:56px;background:#f3f3f3;border-right:2px solid #e1e1e1;border-bottom:2px solid #e1e1e1;display:grid;place-items:center;font-size:28px;color:#737373}
.xr{background:#f3f3f3;border-right:2px solid #e1e1e1;border-bottom:2px solid #e1e1e1;display:grid;place-items:center;font-size:28px;color:#737373}
.xc{height:104px;border-right:2px solid #ececec;border-bottom:2px solid #ececec;display:flex;align-items:center;padding:0 22px;font-size:40px;color:#171717;white-space:nowrap;overflow:hidden}
.xc.xb{font-weight:700;background:#fafafa}
.xc.xq span{color:#a1a1a1;font-weight:700}
.xc.sel{outline:6px solid #1d6f42;outline-offset:-6px}
.xc.num span{color:#2563eb!important;font-weight:700}
#ewall .ec{position:absolute;left:0;top:0;transform-origin:0 0}.ec{transition:none}.ec.u .wb{border-style:dashed;border-color:#d4d4d4}.ec.u .wb .p,.ec.u .wb .bar{background:#fafafa}
.ec.b .wb{border-color:#bf000f}.ec.w .wb{border-color:#fcbb00}
.ec .dt{position:absolute;right:10px;top:10px;width:26px;height:26px;border-radius:50%}
.rr{display:grid;grid-template-columns:330px 1fr 130px;align-items:center;gap:24px;margin-top:40px;font-size:40px;font-weight:700;opacity:0}
.rr span{display:flex;align-items:center;gap:16px}.rr span i{width:22px;height:22px;border-radius:50%;display:block}
.rr .trk{height:40px;border-radius:20px;background:#f5f5f5;overflow:hidden}.rr .fl{height:100%;border-radius:20px;width:0}
.rr b{text-align:right;font-size:56px;letter-spacing:-.04em}
.fly{position:absolute;width:90px;height:62px;border-radius:12px;border:4px solid #2563eb;background:#fff}
.rk{background:#f5f5f5;border-radius:26px;padding:26px 30px}.rk b{display:block;font-size:110px;letter-spacing:-.05em;line-height:1}.rk span{font-size:36px;color:#525252}
.rb{display:grid;grid-template-columns:170px 1fr;align-items:center;gap:20px;margin-top:40px;font-size:38px;font-weight:700}
.rb i{display:inline-block;height:44px;border-radius:22px;width:0;margin-right:6px}
.rb{grid-template-columns:170px auto}.rb>i{grid-column:2}
` + (window.S2 ? S2.css : "");
  function frame(L, t) {
    const $ = (s) => L.querySelector(s);
    const zIn = SW / MON.w;
    const keys = [[0, zIn], [9.55, zIn], [10.55, 1.18], [11.7, 1.24], [12.75, zIn], [28.4, zIn], [29.7, 1.18], [37, 1.3], [38.4, zIn], ...window.S2 && S2.keys || [[60, zIn]]];
    let z = zIn;
    for (let i = 0; i < keys.length - 1; i++) {
      const [a, za] = keys[i], [b, zb] = keys[i + 1];
      if (t >= a && t <= b) {
        z = lerp2(za, zb, zb > za * 1.5 || za > zb * 1.5 ? emph((t - a) / (b - a)) : (t - a) / (b - a));
        break;
      }
    }
    const sc = { x: MON.x + MON.w / 2, y: MON.y + MON.h / 2 };
    const deskF = { x: 960, y: 470 };
    const f = clamp((z - 1.18) / (zIn - 1.18));
    const fx = lerp2(deskF.x, sc.x, f), fy = lerp2(deskF.y, sc.y, f);
    let shake = 0;
    if (t > 17 && t < 22.6) shake = Math.sin(t * 53) * Math.min(1, (t - 17) / 4) * 7;
    let cam = { z, fx, fy };
    if (window.S2 && S2.camAt) cam = S2.camAt(t, cam);
    if (window.S2) S2.cam = cam;
    $("#world").style.transform = `translate(${(960 - cam.fx * cam.z + shake).toFixed(2)}px,${(540 - cam.fy * cam.z).toFixed(2)}px) scale(${cam.z.toFixed(4)})`;
    $("#person").setAttribute("transform", t > 27 && t < 31 ? `translate(0 ${(-14 * Math.sin(clamp((t - 29.6) / 0.8) * Math.PI)).toFixed(1)})` : "");
    const chatO = 1 - seg(t, 11.3, 11.9);
    $("#chat").style.opacity = chatO.toFixed(3);
    const n1 = $("#n1"), n2 = $("#n2");
    const d1 = emph(clamp((t - 0.75) / 0.45)), d2 = emph(clamp((t - 3.85) / 0.45)), back = emph(clamp((t - 3.85) / 0.5));
    n1.style.zIndex = 1;
    n2.style.zIndex = 2;
    n1.style.opacity = clamp((t - 0.75) / 0.18).toFixed(3);
    n1.style.transform = `translateY(${(-380 * (1 - d1) + 64 * back).toFixed(1)}px) scale(${(1 - 0.06 * back).toFixed(4)})`;
    n1.querySelector(".card").firstElementChild.style.opacity = (1 - back).toFixed(3);
    n1.querySelector(".card").lastElementChild.style.opacity = (1 - back).toFixed(3);
    n1.querySelector(".card").style.background = back > 0 ? `rgb(${Math.round(255 - 10 * back)},${Math.round(255 - 10 * back)},${Math.round(255 - 10 * back)})` : "#fff";
    n2.style.opacity = clamp((t - 3.85) / 0.18).toFixed(3);
    n2.style.transform = `translateY(${(-380 * (1 - d2) - 40 * back).toFixed(1)}px)`;
    const nshake = (a) => t > a + 0.42 && t < a + 0.7 ? Math.sin((t - a - 0.42) * 60) * 6 * (1 - (t - a - 0.42) / 0.28) : 0;
    n1.querySelector(".card").style.transform = `translateX(${nshake(0.75).toFixed(1)}px)`;
    n2.querySelector(".card").style.transform = `translateX(${nshake(3.85).toFixed(1)}px)`;
    [["#hl1", 6.3], ["#hl2", 8.3]].forEach(([id, a]) => {
      const el = $(id), q = emph(clamp((t - a) / 0.35));
      el.style.backgroundSize = `${(q * 100).toFixed(1)}% 100%`;
      el.style.color = q > 0.5 ? "#fff" : "#171717";
    });
    const pO = Math.min(seg(t, 11.3, 11.9), 1 - seg(t, 22.6, 23));
    $("#pile").style.opacity = pO;
    const pcs = L._pcs2 || (L._pcs2 = [...L.querySelectorAll("#pile .pc")]);
    const IDX = [46, 33, 59, 20, 72, 40, 61, 27, 52, 15, 66, 37, 8, 80, 24, 55, 70, 3];
    const hopT = t - 13, hop = hopT < 0 ? -1 : Math.floor(Math.pow(hopT, 1.25) / 0.95);
    pcs.forEach((p, k2) => {
      const at = IDX.indexOf(k2);
      p.classList.toggle("seen", at >= 0 && at < hop);
      p.classList.toggle("on", at >= 0 && at === hop && t < 22.6);
    });
    const cur = $("#scur");
    if (t > 12.8 && t < 22.6 && hop >= 0 && hop < IDX.length) {
      const el = pcs[IDX[Math.min(hop, IDX.length - 1)]];
      const r = el.getBoundingClientRect(), sr = $("#screen").getBoundingClientRect();
      const s = sr.width / SW;
      cur.style.opacity = 1;
      cur.style.left = (r.left - sr.left) / s + 90 + "px";
      cur.style.top = (r.top - sr.top) / s + 60 + "px";
    } else cur.style.opacity = 0;
    const pops = L._pops2 || (L._pops2 = [...L.querySelectorAll(".pop2")]);
    pops.forEach((p, i) => {
      const a = POPS[i][0];
      const e = clamp((t - a) / 0.32);
      const out = emph(seg(t, 22.6, 23.3));
      const rot = POPS[i][4];
      p.style.opacity = (e > 0 ? 1 : 0) * (1 - out);
      p.style.transform = `translate(${lerp2(0, 960 - POPS[i][2] - 200, out).toFixed(1)}px,${lerp2(0, 540 - POPS[i][3] - 80, out).toFixed(1)}px) rotate(${rot}deg) scale(${((0.5 + 0.5 * outBack(e)) * (1 - 0.7 * out)).toFixed(3)})`;
    });
    $("#tint").style.opacity = (0.14 * seg(t, 17, 21.8) * (1 - seg(t, 22.6, 23))).toFixed(3);
    const xO = Math.min(seg(t, 22.75, 23.1), 1 - seg(t, 26, 26.6));
    $("#xlw").style.opacity = xO;
    $("#xlw").style.transform = `scale(${(0.85 + 0.15 * emph(seg(t, 22.75, 23.3))).toFixed(3)})`;
    const cells = L._xc || (L._xc = [...L.querySelectorAll("#xlw .xc[data-r]")]);
    cells.forEach((c) => {
      const r = +c.dataset.r, j = +c.dataset.c;
      const at = 23.1 + (r * 5 + j) * 0.045;
      c.querySelector("span").style.opacity = t > at ? 1 : 0;
      c.classList.toggle("sel", r === 0 && j === 3 && t > 24.3);
    });
    const xb = emph(seg(t, 25.85, 26.6));
    if (t > 25.85) {
      $("#xlw").style.filter = `blur(${(18 * xb).toFixed(1)}px)`;
      $("#xlw").style.transform = `scale(${(1 - 0.05 * xb).toFixed(4)})`;
    } else $("#xlw").style.filter = "";
    const rp = $("#ripple"), re = emph(seg(t, 26.05, 27.5));
    rp.style.opacity = (t > 26.05 ? 0.85 * (1 - re) : 0).toFixed(3);
    rp.style.transform = `scale(${(0.15 + 2.8 * re).toFixed(3)})`;
    const spO = Math.min(seg(t, 26.3, 26.95), 1 - seg(t, 30.3, 30.7));
    $("#splash").style.opacity = spO.toFixed(3);
    $("#splash").style.transform = `scale(${(0.96 + 0.04 * emph(seg(t, 26.45, 27.3))).toFixed(4)})`;
    const mk = $("#mock");
    mk.style.opacity = Math.min(seg(t, 30.4, 30.8), 1 - seg(t, 38.4, 38.8));
    mk.style.filter = `blur(${(26 * (1 - emph(seg(t, 30.8, 32.6)))).toFixed(1)}px)`;
    const ims = L._ims || (L._ims = [...mk.querySelectorAll("img")]);
    const SEQ = [0, 3, 5, 6, 7], per = 1.35, tt = Math.max(0, t - 30.8), k = Math.min(SEQ.length - 1, Math.floor(tt / per)), pp = clamp((tt - k * per) / 0.45);
    ims.forEach((m, j) => {
      const si = SEQ.indexOf(j);
      m.style.opacity = si === k ? emph(pp).toFixed(3) : si === k - 1 ? 1 : 0;
      m.style.zIndex = si === k ? 2 : 1;
      m.style.transform = "none";
    });
    const env = $("#env");
    env.style.opacity = seg(t, 38.2, 38.7);
    const ew = $("#ewall");
    ew.style.transform = "";
    const ecs = L._ec || (L._ec = [...L.querySelectorAll(".ec")]);
    if (!L._ek) {
      const ord = ecs.map((_, i) => i).sort((a, b) => R(a) - R(b));
      L._ek = ecs.map(() => "i");
      ord.slice(0, 15).forEach((i) => L._ek[i] = "u");
      ord.slice(-3).forEach((i) => L._ek[i] = "b");
    }
    const WS = 0.749, posA = (i) => ({ x: 48 + i % 9 * 206, y: 179 + Math.floor(i / 9) * 150, s: 1 }), posB = (i) => {
      const cA = i % 9, rA = Math.floor(i / 9), j = cA < 5 ? rA * 5 + cA : 25 + (cA - 5) * 5 + rA;
      return { x: 64 + j % 5 * 206 * WS, y: 45 + Math.floor(j / 5) * 150 * WS, s: WS };
    };
    const sq = seg(t, 42.7, 44.35), scanX = lerp2(-30, 1960, 0.75 * sq + 0.25 * sq * sq * (3 - 2 * sq));
    ecs.forEach((c, i) => {
      const col = i % 9, row = Math.floor(i / 9);
      const a = 38.5 + (col + row) * 0.05;
      const e = clamp((t - a) / 0.4);
      c.style.opacity = e;
      const A = posA(i), B = posB(i), m = emph(seg(t, 44.4 + Math.max(0, i % 9 - 4) * 0.06, 45.3 + Math.max(0, i % 9 - 4) * 0.06)), k2 = 0.6 + 0.4 * outBack(e);
      const sc2 = lerp2(A.s, B.s, m) * k2 * (1 - (i % 9 < 5 ? 0 : 0.35) * Math.sin(Math.PI * m)), mid = lerp2(A.s, B.s, m), x = lerp2(A.x, B.x, m) + 88 * (mid - sc2), y = lerp2(A.y, B.y, m) + 61 * (mid - sc2);
      c.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(${sc2.toFixed(4)})`;
      const kd = L._ek[i], pq = clamp((scanX - A.x) / 176), scanned = pq >= 1, isU = kd === "u" && t > 52.6, isB = kd === "b" && t > 53.7, inUse = kd !== "u" && t > 52.3;
      const w = c.querySelector(".wb");
      w.style.borderColor = isB ? "#bf000f" : isU ? "#a3a3a3" : scanned ? "#2563eb" : "";
      w.style.borderStyle = "solid";
      w.style.background = isB ? "rgba(191,0,15,.08)" : isU ? "rgba(163,163,163,.14)" : inUse ? "rgba(37,99,235,.09)" : "";
      w.style.opacity = isU ? 0.85 : 1;
      let sv = w._sv;
      if (!sv) {
        sv = w._sv = document.createElement("div");
        sv.style.cssText = "position:absolute;border:5px solid #2563eb;pointer-events:none;box-sizing:border-box";
        c.appendChild(sv);
        const cs = getComputedStyle(w), bw = parseFloat(cs.borderTopWidth) || 0;
        sv.style.left = sv.style.top = "0";
        sv.style.width = w.offsetWidth + "px";
        sv.style.height = w.offsetHeight + "px";
        sv.style.borderWidth = bw + "px";
        sv.style.borderRadius = cs.borderTopLeftRadius;
      }
      sv.style.display = pq > 0 && pq < 1 ? "block" : "none";
      sv.style.clipPath = `inset(0 ${((1 - pq) * 100).toFixed(2)}% 0 0)`;
      c.classList.toggle("u", false);
      c.classList.remove("b", "w");
      let d = w.querySelector(".dt");
      if (kd === "b") {
        if (!d) {
          d = document.createElement("div");
          d.className = "dt";
          d.style.background = "#bf000f";
          w.appendChild(d);
        }
        d.style.opacity = t > 53.7 ? 1 : 0;
        d.style.transform = `scale(${outBack(clamp((t - 53.7) / 0.3)).toFixed(3)})`;
      } else if (d) d.style.opacity = 0;
    });
    const scan = $("#scan");
    scan.style.opacity = t > 42.65 && t < 44.4 ? 1 : 0;
    scan.style.left = scanX.toFixed(1) + "px";
    const fl = $("#fly");
    if (t > 45 && t < 48.2) {
      if (!L._fly) {
        let h = "";
        for (let i = 0; i < 24; i++) h += '<div class="fly"></div>';
        fl.innerHTML = h;
        L._fly = [...fl.children];
      }
      L._fly.forEach((d, i) => {
        const j = i * 7 % 45;
        const x0 = 64 + (j % 5 * 206 + 88) * 0.749, y0 = 45 + (Math.floor(j / 5) * 150 + 61) * 0.749;
        const x1 = 1141, y1 = 291;
        const p = emph(clamp((t - 45.1 - i * 0.09) / 0.7));
        const x = lerp2(x0, x1, p), y = lerp2(y0, y1, p) - Math.sin(p * Math.PI) * 160;
        d.style.opacity = p > 0 && p < 1 ? 1 : 0;
        d.style.transform = `translate(${(x - 45).toFixed(1)}px,${(y - 31).toFixed(1)}px) scale(${(1 - 0.6 * p).toFixed(3)})`;
      });
    } else if (L._fly) {
      fl.innerHTML = "";
      L._fly = null;
    }
    const rep = $("#rep");
    const rIn = emph(seg(t, 44.8, 45.6));
    rep.style.opacity = rIn;
    rep.style.height = lerp2(990, 688, emph(seg(t, 55, 55.6))).toFixed(1) + "px";
    rep.style.transform = `translateX(${(120 * (1 - rIn)).toFixed(1)}px)`;
    L.querySelectorAll(".rk b").forEach((b, i) => {
      const n = +b.dataset.n;
      b.textContent = Math.round(n * emph(seg(t, 45.3 + i * 0.5, 47.6 + i * 0.4))).toLocaleString("en-US");
    });
    ["#rk1", "#rk2"].forEach((id) => {
      $(id).style.outline = t > 50.95 && t < 52.2 ? "8px solid #2563eb" : "none";
    });
    [["#rr1", 52.3], ["#rr2", 52.6], ["#rr3", 53.7]].forEach(([id, a]) => {
      const r = $(id), e = emph(seg(t, a, a + 0.5));
      r.style.opacity = 1;
      r.style.marginTop = "0px";
      [r.children[0], r.children[2]].forEach((ch) => {
        ch.style.opacity = e;
        ch.style.transform = `translateY(${(18 * (1 - e)).toFixed(1)}px)`;
      });
      const f2 = r.querySelector(".fl");
      f2.style.width = (+f2.dataset.w * emph(seg(t, a + 0.15, a + 0.95))).toFixed(1) + "%";
    });
    const x2 = $("#exl2");
    const xe = emph(seg(t, 55, 55.6));
    x2.style.opacity = xe;
    x2.style.transform = `translateY(${(-120 * (1 - xe)).toFixed(1)}px)`;
    [0, 1, 2].forEach((j) => {
      const c = $("#ev" + j);
      const done = t > 56.6 + j * 0.45;
      c.querySelector("span").textContent = done ? c.dataset.v : "?";
      c.classList.toggle("num", done);
      c.classList.toggle("xq", !done);
    });
    if (window.S2) S2.frame(L, t, $);
    if (window.S2 && S2.safe) S2.safe(L);
    if (window.S2 && S2.scrib) S2.scrib(L);
  }
  function floorFrame(L, t) {
    const cv = L.querySelector("#floor");
    if (t > 12.9) {
      return;
    }
    const g = cv.getContext("2d");
    g.clearRect(0, 0, 1920, 1080);
    const pull = emph(seg(t, 0.9, 3.4)), tilt = emph(seg(t, 1.6, 3.6)) * 62 * (1 - emph(seg(t, 10, 11.4))), drift = t * 0.55;
    const D = lerp2(1.6, 26, pull) * (t > 10 ? lerp2(1, 0.62, emph(seg(t, 10, 11.4))) : 1), f = 1500, cx = 960, cy = lerp2(540, 460, emph(seg(t, 1.6, 3.6)) * (1 - emph(seg(t, 10, 11.4))));
    const th = tilt * Math.PI / 180, ct = Math.cos(th), st2 = Math.sin(th);
    const proj = (x, y) => {
      const yy = y * ct, zz = y * st2, d = D + zz;
      return d <= 0.2 ? null : [cx + f * x / d, cy + f * yy / d];
    };
    const W = 1, H = 0.7, GX = 1.25, GY = 0.95, N = 26;
    const dim = 1 - 0.5 * seg(t, 3.7, 4.2) * (1 - seg(t, 9.2, 9.6));
    let heroQ = null;
    for (let r = N; r >= -N; r--) for (let c = -N; c <= N; c++) {
      const x0 = c * GX - W / 2, y0 = r * GY - H / 2 - (tilt > 1 ? drift % GY : 0);
      const p = [proj(x0, y0), proj(x0 + W, y0), proj(x0 + W, y0 + H), proj(x0, y0 + H)];
      if (p.some((q) => !q)) continue;
      if (p.every((q) => q[0] < -50 || q[0] > 1970) || p.every((q) => q[1] < -50 || q[1] > 1130)) continue;
      const hero = r === 0 && c === 0;
      if (hero) heroQ = p;
      const wv = Math.exp(-Math.pow(r * 0.35 - c * 0.15 - (t - 2.2) * 5.5, 2) / 2.2) * seg(t, 2, 2.6);
      g.globalAlpha = hero ? 1 : dim * seg(t, 0.6, 1.2);
      g.beginPath();
      g.moveTo(p[0][0], p[0][1]);
      for (let k = 1; k < 4; k++) g.lineTo(p[k][0], p[k][1]);
      g.closePath();
      g.fillStyle = hero ? "#ffffff" : wv > 0.08 ? `rgba(37,99,235,${(0.12 + 0.5 * wv).toFixed(3)})` : "#f1f1f1";
      g.fill();
      if (hero) {
        g.lineWidth = Math.max(2, 10 / D * 1.6);
        g.strokeStyle = "#e5e5e5";
        g.stroke();
      }
    }
    g.globalAlpha = 1;
    const hd = L.querySelector("#hero");
    if (heroQ) {
      const x = heroQ[0][0], y = heroQ[0][1], w = heroQ[1][0] - heroQ[0][0], h = heroQ[3][1] - heroQ[0][1];
      hd.style.left = x + "px";
      hd.style.top = y + "px";
      hd.style.width = w + "px";
      hd.style.height = Math.max(1, h) + "px";
      hd.style.fontSize = w * 0.1 + "px";
      const intro = emph(seg(t, 0, 0.7));
      hd.style.opacity = (intro * (1 - seg(t, 2, 2.6))).toFixed(3);
      hd.style.transform = `scale(${(0.94 + 0.06 * intro).toFixed(4)})`;
      if (!L._tl) {
        L.querySelector("#tlogo").innerHTML = tableau(100).replace('width="100" height="100"', 'width="100%" height="100%" style="display:block;width:100%;height:auto"');
        L._tl = 1;
      }
      L.querySelector("#ring").style.strokeDashoffset = (0.75 * emph(seg(t, 0.2, 2))).toFixed(3);
      L.querySelector("#days").textContent = Math.round(lerp2(90, 30, emph(seg(t, 0.2, 2))));
    } else hd.style.opacity = 0;
  }
  const st = document.createElement("style");
  st.textContent = CSS;
  document.head.appendChild(st);
  for (let i = S.length - 1; i >= 0; i--) if (S[i][0] < 59.7 || window.S2) S.splice(i, 1);
  built[0] = built[1] = null;
  S.unshift([0, "Story: first minute", HTML, false, { fam: "story", anim: (L, lt, t) => frame(L, t) }]);
  window.BEATS = [
    [0.6, "Tableau card · renewal countdown"],
    [2.8, "Pull back: the Tableau estate"],
    [5.2, "New message"],
    [8.8, "Two questions lit"],
    [10.9, "Reveal: the BI person"],
    [12.3, "Push into the screen"],
    [14.6, "Click: windows start piling"],
    [18.4, "Overwhelming"],
    [21.5, "Scary"],
    [24.6, "Weeks later: Excel"],
    [26.6, "Ripple"],
    [27.6, "Antares Analyzer"],
    [29.9, "Back on the desk"],
    [31.4, "Blurred → product"],
    [34.5, "Product playing"],
    [39.2, "Whole environment"],
    [43.6, "Scan"],
    [46.8, "Turns into a report"],
    [51.2, "What you have"],
    [52.6, "What people use"],
    [54, "What will be hard"],
    [57.8, "Evidence fills the sheet"],
    ...window.S2 && S2.beats || S.filter((s) => s[0] >= 59.7).map((s) => [s[0] + 1, s[1]])
  ];
})();
