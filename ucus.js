// BASKA ISTANBUL YOK · ust halka ucus motoru. Saf WebGL2; harita karosu, uydu, pin yok.
// Zemin dokuma kumas, iz dogal boyali iplik, sehir kutu, rota halka. Disariya: window.UCUS, olay 'ucus-durum'.
(() => {
  'use strict';
  const tuval = document.getElementById('ucus3d');
  if (!tuval) return;
  const gl = tuval.getContext('webgl2', { antialias: true });
  const hareket = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const yay = (ad, detay) => tuval.dispatchEvent(new CustomEvent('ucus-durum', { detail: { ad, ...detay } }));
  if (!gl) { yay('yok'); return; }

  // ---------- matematik ----------
  const v = { e: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], c: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], k: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
    n: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }, x: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    d: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], l: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t] };
  const M = {
    carp(a, b) { const o = new Float32Array(16); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; o[i * 4 + j] = s; } return o; },
    persp(f, en, y, u) { const t = 1 / Math.tan(f / 2), n = 1 / (y - u); return new Float32Array([t / en, 0, 0, 0, 0, t, 0, 0, 0, 0, (u + y) * n, -1, 0, 0, 2 * u * y * n, 0]); },
    bak(g, h, up) { const z = v.n(v.c(g, h)), x = v.n(v.x(up, z)), y = v.x(z, x); return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -v.d(x, g), -v.d(y, g), -v.d(z, g), 1]); },
    model(p, ileri, yukari, s) { const z = v.n(ileri), x = v.n(v.x(yukari, z)), y = v.x(z, x); return new Float32Array([...v.k(x, s), 0, ...v.k(y, s), 0, ...v.k(z, s), 0, ...p, 1]); },
  };
  let tohum = 1903; const rnd = () => ((tohum = (tohum * 1664525 + 1013904223) >>> 0) / 4294967296);
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

  // ---------- dogal boya iplikleri (Pantone kodu yerine gercek boya kaynagi) ----------
  const BOYA = {
    kok: { ad: 'Kök boya', bitki: 'Rubia tinctorum kökü', tonlar: ['#8e1f22', '#a8322c', '#b9473a', '#7a1c1f', '#c4583f', '#9b2a27'] },
    civit: { ad: 'Çivit', bitki: 'Indigofera yaprağı', tonlar: ['#1f2f5c', '#2b3f78', '#3a5291', '#18264a', '#4a63a3', '#26386a'] },
    cehri: { ad: 'Cehri', bitki: 'Rhamnus meyvesi', tonlar: ['#c8921d', '#d9a62e', '#e6bb4c', '#b5801a', '#efcb6a', '#cf9a26'] },
  };

  // ---------- sahne: temsili yonler, gercek olcek degil ----------
  const BLOK = [
    { ad: 'A', x: -3, z: 1.5, h: 26 }, { ad: 'B', x: 0, z: -2, h: 29 }, { ad: 'C', x: 3, z: 1.5, h: 27.5 }];
  const HEDEF = [
    { id: 'watergarden', blok: 0, ad: 'Watergarden', alt: 'çarşı, moda, terzi', boya: 'kok', yer: [-62, 0, -44],
      yol: [[-3, 27, 1.5], [-10, 30, -6], [-24, 24, -18], [-40, 16, -30], [-54, 8, -40], [-62, 3, -44]] },
    { id: 'finanskent', blok: 1, ad: 'Finanskent', alt: 'iş, fırsat, elektronik', boya: 'civit', yer: [-86, 0, 30],
      yol: [[0, 30, -2], [-8, 34, 4], [-26, 30, 14], [-48, 24, 22], [-70, 18, 28], [-86, 12, 30]] },
    { id: 'maltepe', blok: 2, ad: 'Maltepe sahil', alt: 'miting ve konser alanı, sanat', boya: 'cehri', yer: [26, 0, 150],
      yol: [[3, 28, 1.5], [8, 30, 18], [14, 26, 48], [20, 20, 84], [24, 12, 118], [26, 4, 146]] },
  ];
  const kutular = [];
  const kutu = (x, y, z, g, h, d, renk, tur = 0) => kutular.push([x, y, z, g, h, d, ...renk, tur]);
  for (let i = -14; i <= 14; i++) for (let j = -14; j <= 14; j++) {       // Atasehir dokusu
    const cx = i * 4.2, cz = j * 4.2, r = Math.hypot(cx, cz);
    if (r < 9 || rnd() < 0.18) continue;
    const h = (1 + Math.pow(rnd(), 2.4) * 10) * Math.max(0.25, 1 - r / 70);
    kutu(cx + (rnd() - 0.5), 0, cz + (rnd() - 0.5), 2.2 + rnd() * 1.2, h, 2.2 + rnd() * 1.2, rnd() < 0.5 ? [0.13, 0.15, 0.2] : [0.17, 0.16, 0.18], 1);
  }
  BLOK.forEach((b) => kutu(b.x, 0, b.z, 2.2, b.h, 2.2, [0.86, 0.7, 0.42], 1));
  // Watergarden: alcak genis yapi + su havuzlari
  kutu(-62, 0, -44, 16, 3.2, 10, [0.2, 0.2, 0.24], 1); kutu(-62, 0.02, -34, 18, 0.12, 6, [0.1, 0.3, 0.45], 2);
  // Finanskent: sik kuleler
  for (let k = 0; k < 9; k++) kutu(-92 + (k % 3) * 6, 0, 24 + Math.floor(k / 3) * 6, 3.4, 16 + rnd() * 22, 3.4, [0.2, 0.25, 0.36], 1);
  // Maltepe: acik alan, sahne, deniz
  kutu(26, 0, 150, 36, 0.15, 22, [0.16, 0.15, 0.12]); kutu(26, 0, 162, 14, 2.6, 2.4, [0.3, 0.27, 0.2], 1);
  kutu(0, -0.2, 260, 600, 0.2, 200, [0.05, 0.12, 0.2], 2);                // Marmara
  kutu(0, -0.06, 0, 700, 0.06, 700, [0.09, 0.08, 0.075], 3);              // dokuma zemin

  // ---------- geometri ----------
  const KUP = new Float32Array([-.5,0,.5,0,0,1,.5,0,.5,0,0,1,.5,1,.5,0,0,1,-.5,0,.5,0,0,1,.5,1,.5,0,0,1,-.5,1,.5,0,0,1,.5,0,-.5,0,0,-1,-.5,0,-.5,0,0,-1,-.5,1,-.5,0,0,-1,.5,0,-.5,0,0,-1,-.5,1,-.5,0,0,-1,.5,1,-.5,0,0,-1,-.5,0,-.5,-1,0,0,-.5,0,.5,-1,0,0,-.5,1,.5,-1,0,0,-.5,0,-.5,-1,0,0,-.5,1,.5,-1,0,0,-.5,1,-.5,-1,0,0,.5,0,.5,1,0,0,.5,0,-.5,1,0,0,.5,1,-.5,1,0,0,.5,0,.5,1,0,0,.5,1,-.5,1,0,0,.5,1,.5,1,0,0,-.5,1,.5,0,1,0,.5,1,.5,0,1,0,.5,1,-.5,0,1,0,-.5,1,.5,0,1,0,.5,1,-.5,0,1,0,-.5,1,-.5,0,1,0,-.5,0,-.5,0,-1,0,.5,0,-.5,0,-1,0,.5,0,.5,0,-1,0,-.5,0,-.5,0,-1,0,.5,0,.5,0,-1,0,-.5,0,.5,0,-1,0]);
  function halkaGeo(R = 1, r = 0.08, a = 40, b = 8) { const o = []; const p = (i, j) => { const u = i / a * 6.2832, w = j / b * 6.2832; return [Math.cos(u) * (R + r * Math.cos(w)), Math.sin(u) * (R + r * Math.cos(w)), r * Math.sin(w), Math.cos(u) * Math.cos(w), Math.sin(u) * Math.cos(w), Math.sin(w)]; };
    for (let i = 0; i < a; i++) for (let j = 0; j < b; j++) { const A = p(i, j), B = p(i + 1, j), C = p(i + 1, j + 1), D = p(i, j + 1); o.push(...A, ...B, ...C, ...A, ...C, ...D); } return new Float32Array(o); }
  // ucan: govde + kanat zari (wingsuit), +z ileri
  const UCAN = new Float32Array([
    0, 0, 1.1, 0, 1, 0, -1.3, 0, -0.4, 0, 1, 0, 1.3, 0, -0.4, 0, 1, 0,        // kanat zari ust
    0, 0, 1.1, 0, -1, 0, 1.3, 0, -0.4, 0, -1, 0, -1.3, 0, -0.4, 0, -1, 0,
    0, 0.12, 1.2, 0, 1, 0, -0.18, 0.12, -0.9, 0, 1, 0, 0.18, 0.12, -0.9, 0, 1, 0, // govde
    0, 0.12, 1.2, 0, 1, 0, 0, 0.28, 0.95, 0, 1, 0, -0.1, 0.12, 0.8, 0, 1, 0,
    0, 0.12, 1.2, 0, 1, 0, 0.1, 0.12, 0.8, 0, 1, 0, 0, 0.28, 0.95, 0, 1, 0]);

  // ---------- golgelendiriciler ----------
  const derle = (t, k) => { const s = gl.createShader(t); gl.shaderSource(s, k); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const program = (vs, fs) => { const p = gl.createProgram(); gl.attachShader(p, derle(gl.VERTEX_SHADER, vs)); gl.attachShader(p, derle(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); return p; };
  const SIS = `vec3 sis(vec3 c, vec3 w){ float f = 1.0 - exp(-pow(length(w - u_kam) / 210.0, 2.0)); return mix(c, vec3(0.03, 0.035, 0.05), f); }`;
  const P_KUTU = program(`#version 300 es
    layout(location=0) in vec3 p; layout(location=1) in vec3 n; layout(location=2) in vec3 o; layout(location=3) in vec3 s; layout(location=4) in vec3 c; layout(location=5) in float tur;
    uniform mat4 u_vp; out vec3 v_n, v_c, v_w; out float v_t;
    void main(){ vec3 w = o + p * s; v_n = n; v_c = c; v_w = w; v_t = tur; gl_Position = u_vp * vec4(w, 1.0); }`,
  `#version 300 es
    precision highp float; in vec3 v_n, v_c, v_w; in float v_t; out vec4 renk; uniform vec3 u_kam; uniform float u_zaman; ${SIS}
    float h(vec2 q){ return fract(sin(dot(q, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec3 L = normalize(vec3(-0.35, 0.85, -0.4)); vec3 c = v_c * (0.38 + 0.62 * max(dot(v_n, L), 0.0));
      if (v_t > 2.5) {                                  // dokuma zemin: dimi (twill) atki ve cozgu
        vec2 q = v_w.xz * 1.6; vec2 g = fract(q); vec2 id = floor(q);
        float atki = mod(id.x + id.y, 4.0) < 2.0 ? 1.0 : 0.0;
        float lif = 0.5 + 0.5 * sin((atki > 0.5 ? g.x : g.y) * 18.0);
        c = mix(vec3(0.07, 0.065, 0.06), vec3(0.15, 0.13, 0.11), atki * 0.6 + lif * 0.25);
        c *= 0.85 + 0.3 * h(id);
      } else if (v_t > 1.5) {                           // su
        float d = sin(v_w.x * 0.6 + u_zaman * 1.3) * sin(v_w.z * 0.5 - u_zaman);
        c = v_c + vec3(0.05, 0.09, 0.12) * d + vec3(0.12, 0.1, 0.06) * pow(max(d, 0.0), 6.0);
      } else if (v_t > 0.5 && abs(v_n.y) < 0.5) {       // pencere
        vec2 uv = vec2(dot(v_w.xz, abs(v_n.zx)), v_w.y) * vec2(2.6, 3.0); vec2 g = fract(uv);
        float pen = step(0.2, g.x) * step(g.x, 0.8) * step(0.25, g.y) * step(g.y, 0.75);
        c += pen * step(0.6, h(floor(uv) + floor(v_w.xz))) * vec3(1.0, 0.8, 0.5) * 0.45;
      }
      renk = vec4(sis(c, v_w), 1.0);
    }`);
  const P_NESNE = program(`#version 300 es
    layout(location=0) in vec3 p; layout(location=1) in vec3 n; uniform mat4 u_vp, u_m; out vec3 v_n, v_w;
    void main(){ vec4 w = u_m * vec4(p, 1.0); v_w = w.xyz; v_n = normalize(mat3(u_m) * n); gl_Position = u_vp * w; }`,
  `#version 300 es
    precision highp float; in vec3 v_n, v_w; out vec4 renk; uniform vec3 u_renk, u_kam; uniform float u_parla; ${SIS}
    void main(){ float l = 0.45 + 0.55 * abs(dot(normalize(v_n), normalize(vec3(-0.35, 0.85, -0.4))));
      renk = vec4(sis(u_renk * l + u_renk * u_parla, v_w), 1.0); }`);
  const P_IPLIK = program(`#version 300 es
    layout(location=0) in vec3 p; layout(location=1) in vec3 c; uniform mat4 u_vp; out vec3 v_c, v_w;
    void main(){ v_c = c; v_w = p; gl_Position = u_vp * vec4(p, 1.0); }`,
  `#version 300 es
    precision highp float; in vec3 v_c, v_w; out vec4 renk; uniform vec3 u_kam; ${SIS}
    void main(){ renk = vec4(sis(v_c, v_w), 1.0); }`);
  const U = (p, ...ad) => Object.fromEntries(ad.map((a) => [a, gl.getUniformLocation(p, a)]));
  const UK = U(P_KUTU, 'u_vp', 'u_kam', 'u_zaman'), UN = U(P_NESNE, 'u_vp', 'u_m', 'u_renk', 'u_kam', 'u_parla'), UI = U(P_IPLIK, 'u_vp', 'u_kam');

  const vaoKutu = gl.createVertexArray(); gl.bindVertexArray(vaoKutu);
  const tampon = (veri, kullan = gl.STATIC_DRAW) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, veri, kullan); return b; };
  tampon(KUP); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
  tampon(new Float32Array(kutular.flat()));
  [[2, 3, 0], [3, 3, 12], [4, 3, 24], [5, 1, 36]].forEach(([l, b, o]) => { gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, b, gl.FLOAT, false, 40, o); gl.vertexAttribDivisor(l, 1); });
  const nesneVao = (veri) => { const a = gl.createVertexArray(); gl.bindVertexArray(a); tampon(veri); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12); return { a, n: veri.length / 6 }; };
  const HALKA = nesneVao(halkaGeo()), UCAK = nesneVao(UCAN);
  const vaoIplik = gl.createVertexArray(); gl.bindVertexArray(vaoIplik);
  const IPLIK_MAX = 6 * 2 * 2400, iplikVeri = new Float32Array(IPLIK_MAX * 6), iplikTampon = tampon(iplikVeri, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
  gl.enable(gl.DEPTH_TEST);

  // ---------- rota ----------
  function cr(p0, p1, p2, p3, t) { const t2 = t * t, t3 = t2 * t; return [0, 1, 2].map((i) => 0.5 * (2 * p1[i] + (-p0[i] + p2[i]) * t + (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * t2 + (-p0[i] + 3 * p1[i] - 3 * p2[i] + p3[i]) * t3)); }
  function egri(yol, u) { const n = yol.length - 1, f = Math.min(n - 1e-6, Math.max(0, u * n)), i = Math.floor(f); return cr(yol[Math.max(0, i - 1)], yol[i], yol[i + 1], yol[Math.min(n, i + 2)], f - i); }
  const rotaHalkalari = HEDEF.map((h) => [0.14, 0.28, 0.42, 0.56, 0.7, 0.84].map((u) => ({ u, p: egri(h.yol, u), t: v.n(v.c(egri(h.yol, u + 0.01), egri(h.yol, u))), gecti: false })));

  // ---------- durum ----------
  let kip = 'sec', hedef = null, u = 0, sapma = [0, 0], yonlendir = [0, 0], iz = [], zaman = 0, gecen = 0, dpr = 1;
  const kam = { p: [55, 48, 70], h: [0, 12, 0] };
  const boyutla = () => { dpr = Math.min(devicePixelRatio || 1, 2); tuval.width = Math.round(tuval.clientWidth * dpr); tuval.height = Math.round(tuval.clientHeight * dpr); };
  new ResizeObserver(boyutla).observe(tuval); boyutla();

  function ucusBasla(i) {
    hedef = HEDEF[i]; kip = 'uc'; u = 0; sapma = [0, 0]; iz = []; gecen = 0;
    rotaHalkalari[i].forEach((r) => { r.gecti = false; });
    const p0 = hedef.yol[0], t0 = v.n(v.c(hedef.yol[1], p0));          // kamera catida, karakterin arkasinda baslar
    kam.p = v.e(v.e(p0, v.k(t0, -6)), [0, 2.2, 0]); kam.h = v.e(p0, v.k(t0, 3));
    yay('basladi', { hedef: hedef.ad, blok: BLOK[hedef.blok].ad, boya: BOYA[hedef.boya] });
    // hareketi azalt: kendiliginden hareket (yorunge, nabiz) durur; kullanicinin baslattigi ucus oynar
  }
  function varis() { kip = 'vardi'; yay('vardi', { hedef: hedef.ad, id: hedef.id, halka: gecen, toplam: 6, boya: BOYA[hedef.boya] }); }
  function sifirla() { kip = 'sec'; hedef = null; iz = []; yay('sec', {}); }

  function ucanKonum() {
    const p = egri(hedef.yol, u), t = v.n(v.c(egri(hedef.yol, Math.min(1, u + 0.004)), p)), sag = v.n(v.x(t, [0, 1, 0])), ust = v.x(sag, t);
    return { p: v.e(v.e(p, v.k(sag, sapma[0])), v.k(ust, sapma[1])), t, sag, ust };
  }
  function iplikYaz() {   // 6 lifli bukum: her lif izin etrafinda sarmal
    const ton = BOYA[hedef.boya].tonlar.map(hex); let k = 0;
    for (let lif = 0; lif < 6; lif++) {
      const faz = lif / 6 * 6.2832;
      for (let i = 1; i < iz.length && k < IPLIK_MAX; i++) for (const j of [i - 1, i]) {
        const a = iz[j], aci = j * 0.55 + faz, r = 0.16 + 0.04 * Math.sin(j * 0.2 + lif);
        const q = v.e(a.p, v.e(v.k(a.sag, Math.cos(aci) * r), v.k(a.ust, Math.sin(aci) * r)));
        iplikVeri.set([...q, ...ton[lif]], k * 6); k++;
      }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, iplikTampon); gl.bufferSubData(gl.ARRAY_BUFFER, 0, iplikVeri, 0, k * 6); return k;
  }

  let once = performance.now();
  function kare(t) {
    const dt = Math.min(0.25, (t - once) / 1000); once = t; zaman += dt;   // yavas cihazda da ucus zamaninda biter
    let ucan = null;
    if (kip === 'uc') {
      const onceki = u;
      u = Math.min(1, u + dt * 0.055);
      for (let a = 0; a < 2; a++) sapma[a] = Math.max(-5, Math.min(5, sapma[a] + yonlendir[a] * dt * 7));
      ucan = ucanKonum();
      for (const r of rotaHalkalari[HEDEF.indexOf(hedef)]) if (r.gecti === false && onceki < r.u && u >= r.u) {   // halka hizasi gecildi
        r.gecti = Math.hypot(sapma[0], sapma[1]) < 2.2 ? true : null; if (r.gecti) { gecen++; yay('halka', { gecen }); }
      }
      if (!iz.length || v.d(v.c(ucan.p, iz[iz.length - 1].p), v.c(ucan.p, iz[iz.length - 1].p)) > 0.25) { iz.push(ucan); if (iz.length > 2400) iz.shift(); }
      const geri = v.e(v.e(ucan.p, v.k(ucan.t, -6)), [0, 2.2, 0]);
      kam.p = v.l(kam.p, geri, Math.min(1, dt * 8)); kam.h = v.l(kam.h, v.e(ucan.p, v.k(ucan.t, 3)), Math.min(1, dt * 10));
      if (u >= 1) varis();
    } else if (kip === 'vardi') {
      ucan = iz.length ? iz[iz.length - 1] : null;
      const a = (hareket ? zaman * 0.15 : 0) + 0.6, y = hedef.yer; kam.p = v.l(kam.p, [y[0] + Math.sin(a) * 30, 18, y[2] + Math.cos(a) * 30], dt * 1.5); kam.h = v.l(kam.h, [y[0], 4, y[2]], dt * 2);
    } else {
      const a = zaman * (hareket ? 0.05 : 0) + 0.8; kam.p = v.l(kam.p, [Math.sin(a) * 70, 46, Math.cos(a) * 70], dt * 1.2); kam.h = v.l(kam.h, [0, 14, 0], dt * 2);
    }
    gl.viewport(0, 0, tuval.width, tuval.height); gl.clearColor(0.03, 0.035, 0.05, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const vp = M.carp(M.persp(0.95, tuval.width / tuval.height, 0.1, 900), M.bak(kam.p, kam.h, [0, 1, 0]));
    gl.useProgram(P_KUTU); gl.bindVertexArray(vaoKutu); gl.uniformMatrix4fv(UK.u_vp, false, vp); gl.uniform3fv(UK.u_kam, kam.p); gl.uniform1f(UK.u_zaman, zaman);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 36, kutular.length);
    gl.useProgram(P_NESNE); gl.uniformMatrix4fv(UN.u_vp, false, vp); gl.uniform3fv(UN.u_kam, kam.p);
    HEDEF.forEach((h, i) => {                                    // halkalar: secimde soluk, ucusta parlak
      if (kip !== 'sec' && h !== hedef) return;
      for (const r of rotaHalkalari[i]) {
        const s = 2.4 + (hareket && kip === 'uc' && r.gecti === false ? 0.15 * Math.sin(zaman * 4) : 0);
        gl.bindVertexArray(HALKA.a); gl.uniformMatrix4fv(UN.u_m, false, M.model(r.p, r.t, [0, 1, 0], s));
        const renk = r.gecti === true ? [0.95, 0.8, 0.45] : r.gecti === null ? [0.35, 0.35, 0.4] : hex(BOYA[h.boya].tonlar[2]);
        gl.uniform3fv(UN.u_renk, renk); gl.uniform1f(UN.u_parla, kip === 'sec' ? 0.1 : 0.6); gl.drawArrays(gl.TRIANGLES, 0, HALKA.n);
      }
    });
    if (ucan) { gl.bindVertexArray(UCAK.a); gl.uniformMatrix4fv(UN.u_m, false, M.model(ucan.p, ucan.t, ucan.ust, 1.4)); gl.uniform3fv(UN.u_renk, hex(BOYA[hedef.boya].tonlar[4])); gl.uniform1f(UN.u_parla, 0.55); gl.drawArrays(gl.TRIANGLES, 0, UCAK.n); }
    if (iz.length > 1) { const k = iplikYaz(); gl.useProgram(P_IPLIK); gl.bindVertexArray(vaoIplik); gl.uniformMatrix4fv(UI.u_vp, false, vp); gl.uniform3fv(UI.u_kam, kam.p); gl.drawArrays(gl.LINES, 0, k); }
    requestAnimationFrame(kare);
  }
  requestAnimationFrame(kare);

  // ---------- yonlendirme: klavye, fare, dokunma ----------
  const tus = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [1, 1], ArrowDown: [1, -1], a: [0, -1], d: [0, 1], w: [1, 1], s: [1, -1] };
  addEventListener('keydown', (e) => { const t = tus[e.key]; if (t && kip === 'uc') { e.preventDefault(); yonlendir[t[0]] = t[1]; } });
  addEventListener('keyup', (e) => { const t = tus[e.key]; if (t) yonlendir[t[0]] = 0; });
  const isaretci = (e) => { if (kip !== 'uc' || !(e.buttons || e.pointerType === 'touch')) return; const r = tuval.getBoundingClientRect(); yonlendir = [((e.clientX - r.left) / r.width - 0.5) * 2.4, -((e.clientY - r.top) / r.height - 0.5) * 2.4]; };
  tuval.addEventListener('pointermove', isaretci); tuval.addEventListener('pointerdown', (e) => { tuval.setPointerCapture(e.pointerId); isaretci(e); });
  tuval.addEventListener('pointerup', () => { yonlendir = [0, 0]; });

  window.UCUS = Object.freeze({ HEDEF: HEDEF.map((h) => ({ id: h.id, ad: h.ad, alt: h.alt, blok: BLOK[h.blok].ad, boya: BOYA[h.boya] })), ucusBasla, sifirla, kutu: kutular.length, kip: () => kip });
  yay('hazir', { kutu: kutular.length });
})();
