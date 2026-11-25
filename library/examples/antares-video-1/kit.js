(function() {
  const SK = ["#f1c9a5", "#8d5a3b", "#e0b48f", "#c68e6a", "#f3d5b5"];
  const P = {
    // id: [x, y(feet), top, hair, skin, hairStyle, trousers]
    hero: [2040, 1e3, "#2563eb", "#1c1917", SK[0], "longgirl", "#1e293b"],
    t1: [3560, 1e3, "#64748b", "#4a2f1d", SK[1], "pony", "#334155"],
    t2: [3680, 1e3, "#9db8f7", "#1c1917", SK[2], "short", "#1e293b"],
    t3: [3800, 1e3, "#404040", "#9ca3af", SK[4], "grey", "#262626"],
    dana: [3930, 1e3, "#262626", "#2563eb", SK[3], "bob", "#404040"]
  };
  const curls = (pts, r, h) => pts.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${h}"/>`).join("");
  const swirl = (pts, d) => pts.map(([x, y]) => `<path d="M${x} ${y} a7 7 0 1 1 9 6" stroke="${d}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`).join("");
  function hairOf(hs, h) {
    if (hs === "curly") {
      const d = "#b8862b", back = [], front = [];
      for (let y = -36; y <= 78; y += 22) {
        const w = 52 + Math.min(0, y - 50) * 0;
        for (const x of [-w, w]) back.push([x + (Math.abs(y) % 44 ? 4 : -2) * Math.sign(x), y]);
      }
      for (let a = 190; a <= 350; a += 16) {
        const r = a * Math.PI / 180;
        back.push([Math.cos(r) * 50, Math.sin(r) * 50 - 8]);
      }
      for (let a = 200; a <= 340; a += 28) {
        const r = a * Math.PI / 180;
        front.push([Math.cos(r) * 40, Math.sin(r) * 34 - 16]);
      }
      return [
        `<path d="M-52 -10 C-56 -58 -26 -68 0 -68 C26 -68 56 -58 52 -10 L56 84 Q0 96 -56 84Z" fill="${h}"/>` + curls(back, 19, h) + swirl([[-62, 10], [52, -8], [-58, 58], [50, 44], [-30, -62], [14, -66]], d),
        curls(front, 15, h) + swirl([[-30, -36], [4, -46], [26, -30]], d)
      ];
    }
    if (hs === "bob") return [
      `<path d="M-54 -4 C-58 -56 -26 -66 0 -66 C26 -66 58 -56 54 -4 L56 44 Q56 54 46 54 L-46 54 Q-56 54 -56 44Z" fill="${h}"/>`,
      `<path d="M-50 4 C-54 -46 -22 -62 2 -62 C30 -62 54 -46 50 4 L50 18 C44 -10 30 -24 10 -26 L-18 -26 C-34 -22 -46 -8 -50 18Z" fill="${h}"/>`
    ];
    if (hs === "longgirl") return [
      `<path d="M-50 -4 C-56 -52 -26 -64 0 -64 C28 -64 56 -52 50 -4 L60 96 Q62 112 44 112 L-44 112 Q-62 112 -60 96Z" fill="${h}"/>`,
      `<path d="M-49 2 C-54 -46 -22 -62 4 -60 C34 -58 54 -40 49 2 C40 -18 22 -30 -4 -30 C-20 -24 -34 -10 -49 2Z" fill="${h}"/><path d="M-49 2 C-50 30 -46 52 -40 66 L-46 66 C-54 46 -55 24 -49 2Z" fill="${h}"/>`
    ];
    if (hs === "pony") return [
      `<path d="M38 -36 C78 -30 84 30 66 78 C60 50 54 10 30 -10Z" fill="${h}"/>`,
      `<path d="M-48 0 C-52 -48 -20 -62 4 -60 C32 -58 52 -42 48 0 C38 -22 18 -34 -6 -32 C-22 -28 -38 -14 -48 0Z" fill="${h}"/>`
    ];
    if (hs === "bluebob") return [
      `<path d="M-54 -4 C-58 -56 -26 -66 0 -66 C26 -66 58 -56 54 -4 L56 44 Q56 54 46 54 L-46 54 Q-56 54 -56 44Z" fill="${h}"/>`,
      `<path d="M-50 4 C-54 -46 -22 -62 2 -62 C30 -62 54 -46 50 4 L50 18 C44 -10 30 -24 10 -26 L-18 -26 C-34 -22 -46 -8 -50 18Z" fill="${h}"/><path d="M16 -60 C36 -54 52 -36 52 4 L52 52 L42 52 L42 6 C40 -16 30 -30 12 -40Z" fill="#2563eb"/>`
    ];
    if (hs === "grey") return ["", `<path d="M-47 -2 C-50 -40 -24 -54 2 -54 C28 -54 50 -40 47 -2 C42 -20 30 -28 14 -30 C-4 -26 -30 -26 -47 -2Z" fill="${h}"/><rect x="-34" y="0" width="28" height="18" rx="7" fill="none" stroke="#262626" stroke-width="4"/><rect x="6" y="0" width="28" height="18" rx="7" fill="none" stroke="#262626" stroke-width="4"/><path d="M-6 8 H6" stroke="#262626" stroke-width="4"/>`];
    return ["", `<path d="M-48 -2 C-52 -44 -24 -60 4 -60 C30 -58 50 -44 48 -2 C44 -24 34 -34 18 -36 C26 -26 8 -30 -10 -32 C-28 -30 -42 -20 -48 -2Z" fill="${h}"/>`];
  }
  function personSVG(id) {
    const [x, y, top, hair, skin, hs, leg] = P[id];
    const [hb, hf] = hairOf(hs, hair);
    const face = `<circle cx="-46" cy="6" r="9" fill="${skin}"/><circle cx="46" cy="6" r="9" fill="${skin}"/><ellipse cx="0" cy="0" rx="45" ry="49" fill="${skin}"/>
    <ellipse cx="-16" cy="8" rx="4.5" ry="6" fill="#1c1917"/><ellipse cx="16" cy="8" rx="4.5" ry="6" fill="#1c1917"/>
    <circle cx="-27" cy="22" r="7" fill="#f87171" opacity=".22"/><circle cx="27" cy="22" r="7" fill="#f87171" opacity=".22"/>
    <path d="M-10 27 q10 8 20 0" stroke="#1c1917" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
    const arm = (cls, sx) => `<g class="${cls}" transform="translate(${sx} -292)"><rect x="-12" y="-4" width="24" height="122" rx="12" fill="${top}"/><circle cx="0" cy="124" r="13" fill="${skin}"/></g>`;
    return `<g class="kpp" id="kp-${id}" transform="translate(${x} ${y})">
    <g class="kp-body">
      <g class="kp-hb" transform="translate(0 -360)">${hb}</g>
      <path d="M-34 -176 L-30 -14 H-6 L-2 -150 H2 L6 -14 H30 L34 -176Z" fill="${leg}"/>
      <ellipse cx="-19" cy="-8" rx="21" ry="9" fill="#1c1917"/><ellipse cx="19" cy="-8" rx="21" ry="9" fill="#1c1917"/>
      <rect x="-10" y="-322" width="20" height="26" fill="${skin}"/>
      <path d="M-28 -304 Q-48 -302 -50 -282 L-40 -172 Q-38 -164 -30 -164 H30 Q38 -164 40 -172 L50 -282 Q48 -302 28 -304 Q0 -290 -28 -304Z" fill="${top}"/>
      ${arm("kp-arm", -44)}${arm("kp-armR", 44)}
      <g class="kp-head" transform="translate(0 -360)">${face}${hf}</g>
    </g></g>`;
  }
  function fixHair(svg) {
    return svg;
  }
  const PV2 = {
    // id: [top, bottom, hair, skin, hair style, skirt, facing (+1 right, -1 left)]
    hero: ["#2563eb", "#1e293b", "#1c1917", "#f1c9a5", "straight", false, 1],
    t1: ["#1e3a8a", "#525252", "#2b1d14", "#8d5a3b", "bun", false, -1],
    t2: ["#93b4f5", "#1e293b", "#171717", "#e0b48f", "swoop", false, -1],
    t3: ["#525252", "#262626", "#b5b5b5", "#f3d5b5", "grey", false, -1],
    dana: ["#171717", "#1e3a8a", "#2563eb", "#c68e6a", "flow", true, -1]
  };
  const SH = "#0b1226";
  function hair2(st, h) {
    if (st === "straight") return [
      `<path d="M-32 -8 C-36 -50 -6 -54 6 -52 C30 -50 38 -32 33 -6 L36 98 Q0 110 -42 98Z" fill="${h}"/>`,
      `<path d="M-31 2 C-34 -42 -8 -52 8 -50 C28 -48 37 -32 32 -6 C24 -24 6 -32 -10 -26 C-16 -10 -20 12 -22 36 L-32 36Z" fill="${h}"/><path d="M-6 -46 C8 -44 22 -36 28 -22" stroke="#3f3f46" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".7"/>`
    ];
    if (st === "flow") return [
      `<path d="M-34 -6 C-40 -50 -10 -54 4 -52 C30 -50 42 -32 36 0 C40 40 52 76 36 100 C26 112 12 106 16 92 C20 72 12 54 4 44 L-16 44 C-26 66 -32 90 -48 96 C-54 72 -42 40 -34 -6Z" fill="${h}"/>`,
      `<path d="M-30 0 C-32 -42 -6 -50 8 -48 C30 -46 38 -28 33 4 C26 -16 10 -26 -8 -24 C-16 -8 -22 14 -26 30 L-31 30Z" fill="${h}"/><path d="M14 -42 C26 -34 31 -20 30 -4" stroke="#1d4ed8" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>`
    ];
    if (st === "bun") return ["", `<circle cx="-14" cy="-40" r="15" fill="${h}"/><path d="M-30 4 C-33 -38 -6 -44 4 -42 C26 -40 34 -24 30 0 C22 -18 8 -24 -8 -22 C-16 -16 -24 -4 -30 4Z" fill="${h}"/>`];
    if (st === "swoop") return ["", `<path d="M-30 2 C-34 -36 -4 -48 16 -42 C32 -36 34 -18 30 -4 C24 -18 14 -24 0 -22 C-8 -12 -20 -8 -30 2Z" fill="${h}"/>`];
    return ["", `<path d="M-30 -2 C-31 -34 -12 -40 2 -40 C22 -40 31 -28 30 -6 C24 -20 12 -26 -2 -26 C-14 -24 -24 -14 -30 -2Z" fill="${h}"/><g stroke="#262626" stroke-width="2.4" fill="none"><rect x="0" y="-2" width="13" height="10" rx="4"/><rect x="17" y="-2" width="11" height="10" rx="4"/><path d="M13 3 H17 M0 3 H-8"/></g>`];
  }
  function personSVG2(id) {
    const [x, y] = P[id], [top, bot, hair, skin, st, skirt, f] = PV2[id], [hb, hf] = hair2(st, hair), M = `transform="scale(${f} 1)"`;
    const legs = skirt ? `<path d="M-20 -118 L-26 -16 H-12 L-6 -118Z" fill="${skin}"/><path d="M4 -118 L12 -16 H26 L18 -118Z" fill="${skin}"/><path d="M-34 -192 H34 L42 -108 Q0 -98 -44 -108Z" fill="${bot}"/><path d="M-34 -192 H-16 Q-20 -150 -22 -104 Q-36 -104 -44 -108Z" fill="${SH}" opacity=".16"/>` : `<path d="M-30 -192 L-34 -16 H-14 L-2 -150 H4 L14 -16 H34 L30 -192Z" fill="${bot}"/><path d="M-30 -192 L-34 -16 H-14 L-8 -140 L-12 -192Z" fill="${SH}" opacity=".18"/>`;
    const shoes = `<path d="M-36 -18 H-12 Q-4 -16 -4 -6 Q-4 -2 -10 -2 H-34 Q-38 -2 -38 -8Z" fill="${SH}"/><path d="M12 -18 H34 Q46 -16 48 -6 Q48 -2 42 -2 H14 Q10 -2 10 -8Z" fill="${SH}"/>`;
    const torso = `<path d="M-24 -320 Q-46 -314 -46 -288 L-40 -198 Q-38 -188 -28 -188 H30 Q40 -188 42 -198 L46 -290 Q44 -316 22 -320 Q4 -308 -24 -320Z" fill="${top}"/>
    <path d="M-24 -320 Q-46 -314 -46 -288 L-40 -198 Q-38 -188 -28 -188 H-12 Q-22 -250 -10 -316Z" fill="${SH}" opacity=".16"/><path d="M-4 -318 L8 -298 L20 -318" fill="none" stroke="${SH}" stroke-opacity=".2" stroke-width="3" stroke-linejoin="round"/>`;
    const arm = (cls, sx, far) => `<g class="${cls}" transform="translate(${sx} -292)"><path d="M-11 -10 Q0 -16 11 -10 L9 60 H-9Z" fill="${top}"/>${far ? `<path d="M-11 -10 Q0 -16 11 -10 L9 60 H-9Z" fill="${SH}" opacity=".16"/>` : ""}
    <g class="kp-fore" transform="translate(0 56)"><path d="M-9 0 H9 L8 50 Q0 54 -8 50Z" fill="${top}"/>${far ? `<path d="M-9 0 H9 L8 50 Q0 54 -8 50Z" fill="${SH}" opacity=".16"/>` : ""}<rect x="-5.5" y="48" width="11" height="10" fill="${skin}"/><ellipse cx="0" cy="66" rx="8" ry="11" fill="${skin}"/><rect class="kp-fing" x="-3" y="70" width="6" height="18" rx="3" fill="${skin}" opacity="0"/></g></g>`;
    const face = `<ellipse cx="-24" cy="6" rx="5" ry="7.5" fill="${skin}"/><path d="M-28 -6 C-28 -30 -12 -34 2 -34 C22 -34 30 -20 29 0 C29 18 22 34 4 35 C-14 35 -28 22 -28 -6Z" fill="${skin}"/>
    <path d="M27 2 Q36 10 28 16 Z" fill="${skin}"/><path d="M27 2 Q36 10 28 16" stroke="${SH}" stroke-opacity=".18" stroke-width="2" fill="none"/>
    <ellipse cx="4" cy="4" rx="2.4" ry="3.4" fill="#1c1917"/><ellipse cx="19" cy="4" rx="2.2" ry="3.2" fill="#1c1917"/>
    <path d="M8 22 q6 4 12 -1" stroke="#1c1917" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="16" cy="15" r="4.5" fill="#f87171" opacity=".18"/>`;
    const [farArm, nearArm] = f > 0 ? [arm("kp-arm", -44, true), arm("kp-armR", 44, false)] : [arm("kp-armR", 44, true), arm("kp-arm", -44, false)];
    return `<g class="kpp" id="kp-${id}" data-f="${f}" transform="translate(${x} ${y})"><g class="kp-body">
    <g class="kp-hb" transform="translate(0 -360)"><g ${M}>${hb}</g></g>
    ${farArm}<g ${M}>${legs}${shoes}<path d="M-8 -334 H8 V-314 Q0 -308 -8 -314Z" fill="${skin}"/>${torso}</g>${nearArm}
    <g class="kp-head" transform="translate(0 -360)"><g ${M}>${face}${hf}</g></g></g></g>`;
  }
  const DESK_V1 = `<rect x="720" y="860" width="480" height="260" rx="120" fill="#2563eb"/><path d="M852 790 C846 690 900 672 960 672 C1020 672 1074 690 1068 790 L1084 960 Q1086 990 1056 990 L864 990 Q834 990 836 960Z" fill="#1c1917"/>`;
  const DESK_V2 = `<path d="M770 1130 C770 950 830 900 960 900 C1090 900 1150 950 1150 1130Z" fill="#2563eb"/><path d="M770 1130 C770 950 830 900 920 900 C880 950 870 1040 880 1130Z" fill="#0b1226" opacity=".14"/>
  <path d="M872 800 C866 712 908 700 960 700 C1012 700 1054 712 1048 800 L1062 1000 Q960 1024 858 1000Z" fill="#1c1917"/><path d="M960 704 C952 760 950 900 956 1012" stroke="#3f3f46" stroke-width="5" opacity=".6" fill="none"/>`;
  S2.PEOPLE = new URLSearchParams(location.search).get("people") || "v3";
  const V3 = { hero: "t3", dana: "dana", t1: "t1", t2: "t2", t3: null }, V3S = 1.08, V3F = { hero: 1, dana: -1, t1: -1, t2: -1, t3: -1 };
  function personSVG3(id) {
    const [x, y] = P[id];
    return (id === "hero" ? `<g id="kp-table" style="opacity:0"></g>` : "") + `<g class="kpp" id="kp-${id}" transform="translate(${x} ${y})"></g>`;
  }
  const SEATX = { t1: 3726, t2: 3852, t3: 3980 }, SEATY = { t1: 0, t2: -16, t3: -32 }, SEATS = { t1: 1, t2: 0.96, t3: 0.92 }, TEAM_SCALE = 1.08;
  function table3(L) {
    const g = L.querySelector("#kp-table");
    if (!g || g._done) return;
    PEOPLE.draw("t1", "sit", { facing: -1, scale: 1 });
    const ty = 1e3 + PEOPLE.lastTableY * TEAM_SCALE;
    g.innerHTML = `<rect x="3542" y="${ty.toFixed(1)}" width="372" height="10" rx="3" fill="#d4d4d4"/><rect x="3554" y="${(ty + 10).toFixed(1)}" width="9" height="${(1e3 - ty - 10).toFixed(1)}" fill="#d4d4d4"/>`;
    g._done = 1;
  }
  const V3LEFT = [[187.5, 188.7], [256.6, 257.7]];
  function pose3(L, id, o) {
    const g = L.querySelector("#kp-" + id);
    if (!g || !window.PEOPLE) return;
    const [x, y] = P[id];
    if (id[0] === "t") {
      table3(L);
      const op = V3[id] ? (o.o ?? 1) * Math.max(0, Math.min(1, 1 - Math.abs(o.x || 0) / 300)) : 0;
      g.setAttribute("transform", `translate(${SEATX[id]} ${y + SEATY[id]})`);
      g.style.opacity = op;
      const tb = L.querySelector("#kp-table");
      if (tb && id === "t1") tb.style.opacity = op;
      if (!V3[id]) return;
      const nod2 = Math.abs(o.nod || 0) > 4, pose2 = Math.max(o.arm || 0, o.armR || 0) > 25 ? "sitTalk" : nod2 ? "sitNod" : "sit";
      if (g._k !== pose2) {
        g.innerHTML = PEOPLE.draw(V3[id], pose2, { facing: -1, scale: SEATS[id] * TEAM_SCALE / PEOPLE.CAST[V3[id]].scale });
        g._k = pose2;
      }
      return;
    }
    const X = x + (o.x || 0), Y = y + (o.y || 0);
    g.setAttribute("transform", `translate(${X.toFixed(1)} ${Y.toFixed(1)})`);
    g.style.opacity = V3[id] ? o.o ?? 1 : 0;
    if (!V3[id]) return;
    const T = S2._t || 0, walking = (o.y || 0) < -0.01, left = V3LEFT.some(([a, b]) => T >= a && T < b), st = { f: left ? -1 : 1 };
    const out = Math.max(o.arm || 0, o.armR || 0), nod = Math.min(1, Math.abs(o.nod || 0) / 8);
    let pose, facing = V3F[id];
    if (walking) {
      pose = "walk" + (1 + Math.floor(Math.abs(X) / 34) % 4);
      facing = st.f;
    } else if (id === "hero") {
      pose = out > 25 ? (S2._t || 0) > 290 ? "handover" : "frontPresent" : "front";
      if (out > 25 && (S2._t || 0) > 290) facing = 1;
    } else pose = out > 25 ? "talk" : "stand";
    const key = pose + facing + (nod > 0.5 ? "n" : "");
    if (g._k !== key) {
      g.innerHTML = PEOPLE.draw(V3[id], pose, { facing, scale: V3S, nod: nod > 0.5 && pose.startsWith("front") ? 1 : 0, eyes: "open", doc: false });
      g._k = key;
    }
  }
  const room = `<div id="kb-room" style="position:absolute;left:0;top:0;width:1px;height:1px;pointer-events:none">
  <svg width="6000" height="1400" viewBox="0 0 6000 1400" style="position:absolute;left:0;top:0;overflow:visible">
    <rect id="kb-rw" x="1960" y="-400" width="2440" height="1800" fill="#fafafa"/>
    <rect id="kb-rf" x="1960" y="1000" width="2440" height="400" fill="#f0f0f0"/><rect id="kb-rl" x="1960" y="996" width="2440" height="8" fill="#e5e5e5"/><rect id="kb-rc" x="1957" y="-400" width="6" height="1400" fill="#e5e5e5"/>
    <rect x="2150" y="110" width="1300" height="660" rx="18" fill="#fff" stroke="#d4d4d4" stroke-width="12"/>
    <rect x="2200" y="776" width="1200" height="22" rx="11" fill="#d4d4d4"/><rect x="2780" y="798" width="40" height="202" fill="#d4d4d4"/>
  </svg>
  <div id="kb-board" style="position:absolute;left:2156px;top:116px;width:1288px;height:648px;overflow:hidden"></div>
  <div id="kb-cal" style="position:absolute;left:3560px;top:150px;width:300px;background:#fff;border:6px solid #e5e5e5;border-radius:20px;overflow:hidden;opacity:0">
    <div style="background:#2563eb;color:#fff;font-size:34px;font-weight:700;padding:10px 20px">This week</div>
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;padding:16px;font-size:30px;font-weight:700;text-align:center;color:#525252">${["M", "T", "W", "T", "F"].map((d, k) => `<span id="kb-d${k}" style="padding:8px 0;border-radius:50%">${d}</span>`).join("")}</div></div>
  <svg id="kb-people" width="6000" height="1400" viewBox="0 0 6000 1400" style="position:absolute;left:0;top:0;overflow:visible">${(S2.PEOPLE === "v3" ? ["hero", "t3", "t2", "t1", "dana"] : Object.keys(P)).map(S2.PEOPLE === "v3" ? personSVG3 : S2.PEOPLE === "v2" ? personSVG2 : personSVG).join("")}</svg>
</div>`;
  S2.world += room;
  S2.css += `.kpp{opacity:0}`;
  S2.pose = function(L, id, o = {}) {
    if (S2.PEOPLE === "v3") return pose3(L, id, o);
    const g = L.querySelector("#kp-" + id);
    if (!g) return;
    const [x, y] = P[id];
    g.setAttribute("transform", `translate(${(x + (o.x || 0)).toFixed(1)} ${(y + (o.y || 0)).toFixed(1)})`);
    g.style.opacity = o.o ?? 1;
    const aL = Math.min(85, o.arm || 0), aR = Math.min(85, o.armR || 0);
    g.querySelector(".kp-arm").setAttribute("transform", `translate(-44 -292) rotate(${aL.toFixed(1)})`);
    g.querySelector(".kp-armR").setAttribute("transform", `translate(44 -292) rotate(${(-aR).toFixed(1)})`);
    const fz = +(g.dataset.f || 1);
    [[".kp-arm", aL], [".kp-armR", aR]].forEach(([c, a]) => {
      const fo = g.querySelector(c + " .kp-fore");
      if (fo) {
        const bend = a < 35 ? 22 * (1 - a / 35) : 0;
        fo.setAttribute("transform", `translate(0 56) rotate(${(-fz * bend * (c === ".kp-armR" ? -1 : 1) * -1).toFixed(1)})`);
      }
    });
    const fL = g.querySelector(".kp-arm .kp-fing"), fR = g.querySelector(".kp-armR .kp-fing");
    if (fL) fL.setAttribute("opacity", Math.max(0, Math.min(1, (aL - 35) / 20)).toFixed(2));
    if (fR) fR.setAttribute("opacity", Math.max(0, Math.min(1, (aR - 35) / 20)).toFixed(2));
    const ht = `translate(${(o.look || 0).toFixed(1)} ${(-360 + (o.nod || 0)).toFixed(1)})`;
    g.querySelector(".kp-head").setAttribute("transform", ht);
    g.querySelector(".kp-hb").setAttribute("transform", ht);
  };
  S2.shots = [];
  S2.shot = (t0, t1, s) => S2.shots.push([t0, t1, s]);
  S2.SHOT = { board: { fx: 2900, fy: 560, z: 0.95 }, boardTight: { fx: 2800, fy: 440, z: 1.55 }, team: { fx: 3300, fy: 640, z: 1.2 } };
  S2.camAt = function(t, base) {
    for (const [a, b, s] of S2.shots) {
      if (t >= a - 1e-3 && t <= b) {
        const e = S2.em(S2.sg(t, a, a + 0.9)) * (1 - S2.em(S2.sg(t, b - 0.9, b)));
        const dip = Math.sin(Math.PI * Math.min(1, Math.max(0, S2.sg(t, a, a + 0.9)))) * 0.12 * (1 - S2.sg(t, a + 0.9, a + 1));
        return { z: S2.L2(base.z, s.z, e) * (1 - dip), fx: S2.L2(base.fx, s.fx, e), fy: S2.L2(base.fy, s.fy, e) };
      }
    }
    return base;
  };
  S2.safe = function(L) {
    const c = S2.cam;
    if (!c) return;
    const r = L.querySelector("#kb-room");
    if (!r) return;
    const u = Math.max(0, Math.min(1, (c.fx - 1250) / 650)), e = u * u * (3 - 2 * u), x0 = 1960 - 520 * e;
    const edge = c.fx + 960 / c.z + 220, kdw = 1 - Math.max(0, Math.min(1, (c.fx - 1250) / 450)), x = x0 + Math.max(0, edge - x0) * kdw * kdw * (3 - 2 * kdw);
    if (r._x === x) return;
    r._x = x;
    ["#kb-rw", "#kb-rf", "#kb-rl"].forEach((q) => {
      const n = L.querySelector(q);
      n.setAttribute("x", x.toFixed(1));
      n.setAttribute("width", (4400 - x).toFixed(1));
    });
    L.querySelector("#kb-rc").setAttribute("x", (x - 3).toFixed(1));
  };
  const SCRIB_SEL = ".ov-st,.ov-rst,.dkb-ar i,.enX i";
  S2.css += `.scrib{background:none!important;transform:none!important;height:var(--sh)!important;margin-top:calc(var(--sh) / -2)!important;overflow:visible;z-index:6}
.scrib svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}`;
  S2.world += `<svg width="0" height="0" style="position:absolute"><defs><filter id="graphite" x="-20%" y="-120%" width="140%" height="340%" filterUnits="objectBoundingBox" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="0.055" numOctaves="2" seed="7" result="wob"/><feDisplacementMap in="SourceGraphic" in2="wob" scale="3.2" result="rough"/>
  <feTurbulence type="fractalNoise" baseFrequency="0.62 0.5" numOctaves="3" seed="3" result="grain"/><feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3.4 2.35" result="holes"/>
  <feComposite in="rough" in2="holes" operator="in"/></filter></defs></svg>`;
  const rnd = (n) => {
    const v = Math.sin(n * 127.1 + 11.7) * 43758.5453;
    return v - Math.floor(v);
  };
  function passes(W, H, kind, seed) {
    const out = [], c = H / 2, j = (k, a) => (rnd(seed + k) - 0.5) * 2 * a;
    if (kind === "line") {
      out.push(`M${2 + j(1, 3)} ${c + j(2, 2)} C${W * 0.3} ${c - 3 + j(3, 3)} ${W * 0.66} ${c + 3 + j(4, 3)} ${W - 4 + j(5, 4)} ${c - 2 + j(6, 2)}`);
      out.push(`M${W - 10 + j(7, 6)} ${c + 5 + j(8, 2)} C${W * 0.68} ${c + 2 + j(9, 3)} ${W * 0.34} ${c + 7 + j(10, 3)} ${8 + j(11, 8)} ${c + 3 + j(12, 2)}`);
    } else if (kind === "word") {
      out.push(`M${-8 + j(1, 4)} ${c + 3 + j(2, 3)} C${W * 0.3} ${c - 4 + j(3, 4)} ${W * 0.66} ${c + 5 + j(4, 4)} ${W + 6 + j(5, 5)} ${c - 5 + j(6, 3)}`);
      out.push(`M${W + 2 + j(7, 4)} ${c + 5 + j(8, 3)} C${W * 0.68} ${c + j(9, 4)} ${W * 0.34} ${c + 9 + j(10, 4)} ${-4 + j(11, 5)} ${c + 4 + j(12, 3)}`);
      out.push(`M${-2 + j(13, 4)} ${c - 6 + j(14, 3)} C${W * 0.3} ${c + 6 + j(15, 4)} ${W * 0.7} ${c - 4 + j(16, 4)} ${W + 8 + j(17, 5)} ${c + 3 + j(18, 3)}`);
    } else {
      const amp = H * 0.4, n = Math.max(9, Math.round(W / 13));
      let d = `M${2} ${c + amp * 0.6}`;
      for (let i = 1; i <= n; i++) {
        const x = W * (i / n) + (i % 2 ? 9 : -9) + j(i, 3), y = c + (i % 2 ? -amp : amp) * (0.72 + rnd(seed + i) * 0.36);
        d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
      }
      out.push(d);
      out.push(`M${W + 6 + j(50, 4)} ${c - 5 + j(51, 3)} C${W * 0.66} ${c + j(52, 4)} ${W * 0.3} ${c - 3 + j(53, 4)} ${-8 + j(54, 4)} ${c + 4 + j(55, 3)}`);
      out.push(`M${-6 + j(60, 4)} ${c + 8 + j(61, 3)} C${W * 0.3} ${c + 2 + j(62, 4)} ${W * 0.7} ${c + 7 + j(63, 4)} ${W + 8 + j(64, 4)} ${c + 1 + j(65, 3)}`);
    }
    return out;
  }
  S2.scrib = function(L) {
    [...L.querySelectorAll(SCRIB_SEL)].forEach((el, idx) => {
      if (!el._sv) {
        if (!el._h) {
          el._h = parseFloat(getComputedStyle(el).height) || 12;
          const row = el.classList.contains("ov-rst");
          el._kind = row ? "line" : el.parentElement.classList.contains("enX") ? "word" : "zig";
          el.style.setProperty("--sh", (row ? 30 : Math.round(Math.max(44, Math.min(110, (el.parentElement.offsetHeight || 60) * 0.62)))) + "px");
          el.classList.add("scrib");
        }
        const W = el.offsetWidth, H = el.offsetHeight;
        if (!W || !H) {
          el.style.transform = "none";
          return;
        }
        const sw = el._kind === "line" ? 5 : el._kind === "word" ? 6 : Math.max(4.5, Math.min(7, H * 0.075));
        el.innerHTML = `<svg viewBox="0 0 ${W} ${H}"><g filter="url(#graphite)">${passes(W, H, el._kind, idx + 3).map((d, k) => `<path d="${d}" fill="none" stroke="#2b2b2f" stroke-width="${(sw * (k ? 1 : 0.92)).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round" opacity="${k ? 0.86 : 0.8}"/>`).join("")}</g></svg>`;
        el._sv = [...el.querySelectorAll("g[filter] path")];
        el._len = el._sv.map((p2) => p2.getTotalLength());
        el._last = null;
        el._sv.forEach((p2, k) => {
          p2.style.strokeDasharray = `${el._len[k]} ${el._len[k] + 40}`;
        });
      }
      const m = /scaleX\(([-\d.e]+)\)/.exec(el.style.transform);
      if (m) el._p = +m[1];
      const p = Math.max(0, Math.min(1, el._p ?? 0));
      el.style.transform = "none";
      if (p === el._last) return;
      el._last = p;
      const split = el._kind === "line" ? [0, 0.54, 1] : el._kind === "word" ? [0, 0.36, 0.68, 1] : [0, 0.62, 0.82, 1];
      el._sv.forEach((path, k) => {
        const q = Math.max(0, Math.min(1, (p - split[k]) / (split[k + 1] - split[k]))), e = q < 0.5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2;
        path.style.visibility = e > 2e-3 ? "visible" : "hidden";
        path.style.strokeDashoffset = (el._len[k] * (1 - e)).toFixed(1);
      });
    });
  };
  const prev = S2.frame;
  S2.frame = function(L, t, $) {
    S2._t = t;
    prev(L, t, $);
    if (!S2._desk) {
      const pe = L.querySelector("#person");
      if (pe) {
        pe.innerHTML = S2.PEOPLE === "v3" && window.PEOPLE ? `${PEOPLE.keyboard(690, 772, 232, 82)}<g transform="translate(446 957) scale(2.5)">${PEOPLE.over("t3")}</g>` : S2.PEOPLE === "v2" ? DESK_V2 : DESK_V1;
        S2._desk = 1;
      }
    }
    ["hero", "t1", "t2", "t3", "dana", "table"].forEach((id) => {
      const g = L.querySelector("#kp-" + id);
      if (g) g.style.opacity = 0;
    });
    const c = L.querySelector("#kb-cal");
    if (c) c.style.opacity = 0;
  };
})();
