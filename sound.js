/* =====================================================================
   EKO SOUND SYSTEM v1  (procedural WebAudio, zero audio files)
   - Engines per car (V12 / V8 / 4-cyl / electric / hover) with gears
   - Tyre screech, road + wind noise, horn (H), crashes, door thunk
   - Gunshots per weapon (Pistol / SMG / AK / Rifle / Silenced sniper),
     reload, punch, hurt, footsteps, landing, swimming splashes
   - City ambience, birds (day), crickets (night), distant sirens / horns,
     crowd murmur, panicked screams, wanted-level sirens
   - Muffled outside world when you are inside a building
   - Car radio (B): EKO FM Afro Vibes / Night Drive FM (synthesised)
   Keys: H horn, B radio, M mute
   Add this as the LAST <script> in the page (after the game script).
   ===================================================================== */
(function () {
  'use strict';
  var AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;

  var ctx = null, built = false, muted = false;
  try { muted = localStorage.getItem('ekoMute') === '1'; } catch (e) {}
  var rnd = Math.random;
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function say(m) { try { toast(m); } catch (e) {} }
  function mf(n) { return 440 * Math.pow(2, (n - 69) / 12); }

  /* ---------------- audio graph ---------------- */
  var master, comp, local, world, worldLP, revIn, slapIn, noiseW, noiseB;

  function build() {
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = muted ? 0 : .8;
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 18; comp.ratio.value = 5;
    comp.attack.value = .004; comp.release.value = .2;
    comp.connect(master); master.connect(ctx.destination);

    local = ctx.createGain(); local.connect(comp);              // your own sounds
    worldLP = ctx.createBiquadFilter(); worldLP.type = 'lowpass';
    worldLP.frequency.value = 20000; worldLP.Q.value = .5;
    world = ctx.createGain(); world.connect(worldLP); worldLP.connect(comp); // outside world

    var len = (ctx.sampleRate * 1.8) | 0, ir = ctx.createBuffer(2, len, ctx.sampleRate), c, i;
    for (c = 0; c < 2; c++) {
      var d = ir.getChannelData(c);
      for (i = 0; i < len; i++) d[i] = (rnd() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    var conv = ctx.createConvolver(); conv.buffer = ir;
    revIn = ctx.createGain();
    var revOut = ctx.createGain(); revOut.gain.value = .55;
    var revLP = ctx.createBiquadFilter(); revLP.type = 'lowpass'; revLP.frequency.value = 4200;
    revIn.connect(revLP); revLP.connect(conv); conv.connect(revOut); revOut.connect(local);

    slapIn = ctx.createGain();
    var dl = ctx.createDelay(1), fb = ctx.createGain(), sl = ctx.createBiquadFilter(), so = ctx.createGain();
    dl.delayTime.value = .19; fb.gain.value = .28; sl.type = 'lowpass'; sl.frequency.value = 2400; so.gain.value = .4;
    slapIn.connect(dl); dl.connect(sl); sl.connect(fb); fb.connect(dl); sl.connect(so); so.connect(local);

    var n = (ctx.sampleRate * 3) | 0;
    noiseW = ctx.createBuffer(1, n, ctx.sampleRate);
    var w = noiseW.getChannelData(0); for (i = 0; i < n; i++) w[i] = rnd() * 2 - 1;
    noiseB = ctx.createBuffer(1, n, ctx.sampleRate);
    var b = noiseB.getChannelData(0), last = 0;
    for (i = 0; i < n; i++) { last = (last + .02 * (rnd() * 2 - 1)) / 1.02; b[i] = last * 3.5; }

    buildEngine(); buildAmb();
    built = true;
  }

  /* ---------------- one-shot helpers ---------------- */
  function route(node, o) {
    var out = node;
    if (o && o.pan && ctx.createStereoPanner) {
      var sp = ctx.createStereoPanner(); sp.pan.value = clamp(o.pan, -1, 1); node.connect(sp); out = sp;
    }
    out.connect((o && o.bus) || local);
    if (o && o.wet) { var s = ctx.createGain(); s.gain.value = o.wet; out.connect(s); s.connect(revIn); }
    if (o && o.slap) { var s2 = ctx.createGain(); s2.gain.value = o.slap; out.connect(s2); s2.connect(slapIn); }
  }
  function tone(t, f0, f1, dur, type, vol, o) {
    var os = ctx.createOscillator(), g = ctx.createGain();
    os.type = type || 'sine';
    os.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) os.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + ((o && o.atk) || .003));
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    os.connect(g); route(g, o); os.start(t); os.stop(t + dur + .05);
  }
  function nz(t, dur, ft, f0, f1, q, vol, o) {
    var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseW; f.type = ft;
    f.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    f.Q.value = q || .7;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + ((o && o.atk) || .002));
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(f); f.connect(g); route(g, o); s.start(t, rnd() * 2, dur + .05);
  }
  function vox(t, f, dur, type, vol, cut, o) {
    var os = ctx.createOscillator(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    os.type = type; os.frequency.value = f;
    fl.type = 'lowpass'; fl.frequency.setValueAtTime(cut, t);
    fl.frequency.exponentialRampToValueAtTime(Math.max(80, cut * .25), t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .008);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    os.connect(fl); fl.connect(g); route(g, o); os.start(t); os.stop(t + dur + .05);
  }

  /* ---------------- listener direction for panning ---------------- */
  var _v = null;
  function pan3d(x, z) {
    try {
      if (!_v) _v = new THREE.Vector3();
      cam.getWorldDirection(_v);
      var l = Math.hypot(_v.x, _v.z) || 1, fx = _v.x / l, fz = _v.z / l;
      var rx = -fz, rz = fx, dx = x - p.x, dz = z - p.z, d = Math.hypot(dx, dz) || 1;
      return clamp((dx * rx + dz * rz) / d, -1, 1);
    } catch (e) { return 0; }
  }

  /* ---------------- player sound events ---------------- */
  function gunshot(kind) {
    var t = ctx.currentTime + .005, v = .9 + rnd() * .2;
    if (kind === 'Silenced sniper') {
      nz(t, .14, 'lowpass', 2200, 500, .6, .32, { wet: .12 });
      tone(t, 95 * v, 48, .12, 'sine', .3);
      nz(t + .02, .03, 'bandpass', 3800, 2000, 2, .12);
      nz(t + .55, .03, 'highpass', 2500, 2500, .8, .14);
      tone(t + .55, 1800, 900, .04, 'square', .04);
    } else if (kind === 'Pistol') {
      nz(t, .11, 'bandpass', 2300 * v, 900, .8, .8, { wet: .35, slap: .35 });
      tone(t, 190 * v, 58, .1, 'sine', .8);
      nz(t, .025, 'highpass', 3500, 3500, .7, .45);
    } else if (kind === 'SMG') {
      nz(t, .075, 'bandpass', 2900 * v, 1200, .9, .75, { wet: .25, slap: .22 });
      tone(t, 230 * v, 85, .07, 'triangle', .55);
      nz(t, .02, 'highpass', 4000, 4000, .7, .35);
    } else { // AK / Rifle
      nz(t, .2, 'lowpass', 5200 * v, 650, .7, 1, { wet: .5, slap: .4 });
      tone(t, 135 * v, 42, .18, 'sine', .95);
      nz(t, .02, 'highpass', 2800, 2800, .7, .5);
      tone(t + .004, 420 * v, 120, .05, 'sawtooth', .18);
    }
  }
  function magOut() { var t = ctx.currentTime + .01; nz(t, .05, 'bandpass', 1800, 1800, 3, .25); tone(t, 900, 600, .04, 'square', .04); }
  function magIn() {
    var t = ctx.currentTime + .01;
    nz(t, .08, 'bandpass', 1200, 1200, 2, .3); tone(t, 500, 300, .06, 'square', .05);
    nz(t + .16, .04, 'highpass', 2500, 2500, .8, .3); tone(t + .16, 700, 320, .05, 'square', .05);
  }
  function punchSnd() {
    var t = ctx.currentTime + .005;
    nz(t, .18, 'bandpass', 500, 2500, 1, .25);
    tone(t + .12, 110, 55, .14, 'sine', .6);
    nz(t + .12, .06, 'lowpass', 900, 300, .6, .35);
  }
  function hurtSnd(kind) {
    var t = ctx.currentTime + .005;
    if (kind === 'car') {
      tone(t, 90, 35, .35, 'sine', .9); nz(t, .25, 'lowpass', 1200, 300, .6, .6);
      tone(t + .01, 1800, 900, .15, 'square', .06);
    } else if (kind === 'fall') {
      tone(t, 70, 30, .3, 'sine', .8); nz(t, .12, 'lowpass', 900, 300, .6, .4);
    } else {
      tone(t, 120, 60, .12, 'sine', .6); nz(t, .06, 'lowpass', 1000, 400, .6, .3);
    }
    tone(t + .03, 170, 110, .18, 'triangle', .14);
  }
  function doorSnd() {
    var t = ctx.currentTime + .005;
    nz(t, .09, 'lowpass', 900, 300, .6, .5); tone(t, 95, 55, .12, 'sine', .6);
    nz(t + .06, .03, 'bandpass', 2500, 2500, 2, .12);
  }
  function crashSnd(i) {
    var t = ctx.currentTime + .005;
    nz(t, .5, 'lowpass', 2500, 300, .5, .9 * i, { wet: .3 });
    tone(t, 80, 30, .4, 'sine', .9 * i);
    tone(t + .01, 1400, 700, .3, 'square', .06 * i);
    tone(t + .02, 2300, 1100, .25, 'square', .04 * i);
    if (i > .6) for (var k = 0; k < 5; k++) nz(t + .05 + rnd() * .35, .05, 'highpass', 5000, 4000, 1, .12);
  }
  function stepSnd(sprint, inside, swim) {
    var t = ctx.currentTime + .003, v = .85 + rnd() * .3, vol = sprint ? .42 : .3;
    if (swim) { nz(t, .25, 'bandpass', 900, 400, .6, .2, { wet: .15 }); return; }
    if (inside) {
      nz(t, .05, 'highpass', 1800 * v, 1200, .8, vol * .55, { wet: .2 });
      tone(t, 140 * v, 70, .05, 'sine', vol * .6);
    } else {
      nz(t, .07, 'lowpass', 1500 * v, 500, .5, vol);
      tone(t, 95 * v, 48, .07, 'sine', vol * .8);
    }
  }
  function landSnd(f) {
    var t = ctx.currentTime + .003, k = clamp(f / 16, .2, 1);
    tone(t, 80, 28, .28, 'sine', k * .9); nz(t, .15, 'lowpass', 1200, 300, .5, k * .6);
  }
  function popSnd() { var t = ctx.currentTime + .01; nz(t, .05, 'bandpass', 300, 200, 2, .18); tone(t, 140, 60, .06, 'sine', .15); }

  /* ---------------- engine ---------------- */
  var PROF = {
    danfo:      { k: 'ice', cyl: 4,  idle: 680, red: 4600, gears: 4, lp: 850,  gain: 1,   grit: 1.4, horn: [330, 415] },
    g63b:       { k: 'ice', cyl: 8,  idle: 620, red: 5400, gears: 5, lp: 1000, gain: 1.1, grit: 1.2, horn: [392, 494] },
    g63a:       { k: 'ice', cyl: 8,  idle: 620, red: 5400, gears: 5, lp: 1000, gain: 1.1, grit: 1.2, horn: [392, 494] },
    cla:        { k: 'ice', cyl: 4,  idle: 800, red: 6600, gears: 6, lp: 1700, gain: .95, grit: .8,  turbo: 1, horn: [440, 554] },
    silver:     { k: 'ice', cyl: 8,  idle: 760, red: 7000, gears: 5, lp: 1900, gain: 1,   grit: 1,   horn: [440, 554] },
    countach:   { k: 'ice', cyl: 12, idle: 900, red: 8300, gears: 6, lp: 2800, gain: 1,   grit: .8,  horn: [466, 587] },
    centenario: { k: 'ice', cyl: 12, idle: 880, red: 8500, gears: 6, lp: 3000, gain: 1,   grit: .8,  horn: [466, 587] },
    ds:         { k: 'ev',    horn: [440, 554] },
    molnia:     { k: 'hover', horn: [494, 622] }
  };
  var INIT = ['danfo', 'g63b', 'countach', 'cla'];
  function profFor(c) {
    var t = c.snd;
    if (!t) { var i = cars.indexOf(c); t = INIT[i] || 'g63b'; c.snd = t; }
    return PROF[t] || PROF.g63b;
  }

  var E = null, hornOn = false;
  function src(buf) { var s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; return s; }

  function buildEngine() {
    var o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), o3 = ctx.createOscillator();
    o1.type = 'sawtooth'; o2.type = 'square'; o3.type = 'sawtooth';
    var g1 = ctx.createGain(), g2 = ctx.createGain(), g3 = ctx.createGain(), gn = ctx.createGain(), mix = ctx.createGain();
    g1.gain.value = .5; g2.gain.value = .32; g3.gain.value = .18; gn.gain.value = 0;
    var sh = ctx.createWaveShaper(), cur = new Float32Array(256);
    for (var i = 0; i < 256; i++) cur[i] = Math.tanh((i / 128 - 1) * 2.2);
    sh.curve = cur;
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 800; lp.Q.value = 2;
    var amp = ctx.createGain(); amp.gain.value = 0;
    var trem = ctx.createOscillator(), tg = ctx.createGain(); trem.frequency.value = 12; tg.gain.value = 0;
    trem.connect(tg); tg.connect(amp.gain);
    var ns = src(noiseW), nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 500; nf.Q.value = .8;
    ns.connect(nf); nf.connect(gn);
    o1.connect(g1); o2.connect(g2); o3.connect(g3);
    g1.connect(mix); g2.connect(mix); g3.connect(mix);
    mix.connect(sh); sh.connect(lp); gn.connect(lp); lp.connect(amp); amp.connect(local);

    var w1 = ctx.createOscillator(), w2 = ctx.createOscillator(), wg = ctx.createGain(), wg2 = ctx.createGain();
    w1.type = 'sine'; w2.type = 'triangle'; wg2.gain.value = .4; wg.gain.value = 0;
    w1.connect(wg); w2.connect(wg2); wg2.connect(wg); wg.connect(local);

    var rs = src(noiseB), rf = ctx.createBiquadFilter(), rg = ctx.createGain();
    rf.type = 'lowpass'; rf.frequency.value = 400; rg.gain.value = 0; rs.connect(rf); rf.connect(rg); rg.connect(local);
    var ws = src(noiseW), wf = ctx.createBiquadFilter(), wgn = ctx.createGain();
    wf.type = 'bandpass'; wf.frequency.value = 900; wf.Q.value = .6; wgn.gain.value = 0; ws.connect(wf); wf.connect(wgn); wgn.connect(local);
    var ss = src(noiseW), sf = ctx.createBiquadFilter(), sg = ctx.createGain();
    sf.type = 'bandpass'; sf.frequency.value = 1500; sf.Q.value = 4; sg.gain.value = 0; ss.connect(sf); sf.connect(sg); sg.connect(local);
    var h1 = ctx.createOscillator(), h2 = ctx.createOscillator(), hg = ctx.createGain(), hf = ctx.createBiquadFilter();
    h1.type = 'sawtooth'; h2.type = 'sawtooth'; hf.type = 'lowpass'; hf.frequency.value = 1800; hg.gain.value = 0;
    h1.connect(hf); h2.connect(hf); hf.connect(hg); hg.connect(local);

    [o1, o2, o3, trem, w1, w2, ns, rs, ws, ss, h1, h2].forEach(function (n) { n.start(); });
    E = { o1: o1, o2: o2, o3: o3, nf: nf, gn: gn, lp: lp, amp: amp, trem: trem, tg: tg, w1: w1, w2: w2, wg: wg,
      rf: rf, rg: rg, wf: wf, wgn: wgn, sf: sf, sg: sg, h1: h1, h2: h2, hg: hg,
      rpm: 0, gear: 0, on: false, startAt: 0, prevSp: 0 };
  }

  function startSeq(P) {
    var t = ctx.currentTime + .05;
    if (P.k === 'ice') {
      for (var i = 0; i < 5; i++) { nz(t + i * .09, .06, 'bandpass', 420, 300, 1, .25); tone(t + i * .09, 60, 45, .07, 'sawtooth', .08); }
      E.startAt = t + .5;
    } else {
      tone(t, 300, 900, .3, 'sine', .08); E.startAt = t + .15;
    }
  }

  function engineTick(dt, car) {
    var now = ctx.currentTime, P = profFor(car), sp = Math.abs(car.speed);
    var thr = (keys.KeyW || keys.KeyS) ? 1 : 0, T = .05;
    if (!E.on) {
      E.on = true; E.rpm = 200; E.gear = 0; E.prevSp = car.speed; startSeq(P);
      E.h1.frequency.value = P.horn ? P.horn[0] : 400; E.h2.frequency.value = P.horn ? P.horn[1] : 500;
    }
    var live = now >= E.startAt, vol = live ? 1 : 0;

    if (P.k === 'ice') {
      var n = P.gears, upS = 32 * (E.gear + 1) / n, rn = sp / upS;
      if (thr && rn > .93 && E.gear < n - 1) { E.gear++; E.rpm *= .68; if (P.cyl >= 8) popSnd(); }
      else if (rn < .45 && E.gear > 0) { E.gear--; E.rpm *= 1.15; }
      upS = 32 * (E.gear + 1) / n; rn = clamp(sp / upS, 0, 1);
      var tg = (thr && sp < 2.5) ? .5 : .15 + .85 * rn;
      var target = P.idle + (P.red - P.idle) * tg;
      E.rpm += (target - E.rpm) * Math.min(1, dt * (thr ? 7 : 4));
      E.rpm = clamp(E.rpm, P.idle * .9, P.red * 1.02);
      var fire = Math.max(40, E.rpm / 60 * P.cyl / 2), rr = E.rpm / P.red;
      E.o1.frequency.setTargetAtTime(fire, now, .03);
      E.o2.frequency.setTargetAtTime(fire * 1.004, now, .03);
      E.o3.frequency.setTargetAtTime(fire * 2, now, .03);
      E.lp.frequency.setTargetAtTime(P.lp * (.55 + .9 * thr) + E.rpm * .35, now, T);
      var lvl = (.075 + .11 * thr + .05 * rr) * P.gain * vol;
      E.amp.gain.setTargetAtTime(lvl, now, .06);
      E.tg.gain.setTargetAtTime(lvl * .35 * clamp(1 - E.rpm / (P.red * .5), 0, 1), now, .1);
      E.trem.frequency.setTargetAtTime(Math.max(3, E.rpm / 60), now, T);
      E.nf.frequency.setTargetAtTime(300 + E.rpm * .25, now, .1);
      E.gn.gain.setTargetAtTime((.35 + .65 * thr) * rr * .5 * P.grit * vol, now, .1);
      if (P.turbo) {
        E.w1.frequency.setTargetAtTime(2500 + rn * 3000, now, .1);
        E.wg.gain.setTargetAtTime(thr * rn * .012 * vol, now, .1);
      } else E.wg.gain.setTargetAtTime(0, now, .1);
    } else {
      var r2 = clamp(sp / 32, 0, 1), ev = P.k === 'ev';
      var f = (ev ? 260 : 180) + r2 * (ev ? 2400 : 1500);
      E.w1.frequency.setTargetAtTime(f, now, .05); E.w2.frequency.setTargetAtTime(f * 2.01, now, .05);
      E.wg.gain.setTargetAtTime((.04 + .06 * r2 + .03 * thr) * vol, now, .08);
      E.amp.gain.setTargetAtTime(0, now, .1); E.gn.gain.setTargetAtTime(0, now, .1);
      E.tg.gain.setTargetAtTime(0, now, .1);
    }

    // road, wind, skid
    var hov = P.k === 'hover', r = clamp(sp / 32, 0, 1);
    E.rg.gain.setTargetAtTime(r * (hov ? .02 : .09), now, .1);
    E.rf.frequency.setTargetAtTime(300 + sp * 20, now, .1);
    E.wgn.gain.setTargetAtTime(r * r * (hov ? .12 : .07) * (fpsView ? 1 : .7), now, .1);
    E.wf.frequency.setTargetAtTime(600 + sp * 40, now, .1);
    var steer = (keys.KeyA ? 1 : 0) - (keys.KeyD ? 1 : 0), sk = 0;
    if (hov) sk = 0;
    else if (keys.Space && sp > 5) sk = clamp(sp / 20, 0, 1) * .9;
    else if (steer && sp > 20) sk = clamp((sp - 20) / 12, 0, 1) * .35;
    E.sg.gain.setTargetAtTime(sk * .14, now, .04);
    E.sf.frequency.setTargetAtTime(1300 + sp * 25 + rnd() * 100, now, .05);
    E.hg.gain.setTargetAtTime(hornOn ? .09 : 0, now, .01);

    // crash: speed collapses / flips sign in one go
    var prev = E.prevSp, cur = car.speed;
    if (Math.abs(prev) > 6 && Math.sign(cur) !== Math.sign(prev) && Math.abs(cur - prev) > .8 * Math.abs(prev))
      crashSnd(clamp(Math.abs(prev) / 25, .35, 1));
    E.prevSp = cur;
  }

  function engineOff() {
    if (!E) return;
    var now = ctx.currentTime;
    E.on = false;
    [E.amp, E.wg, E.rg, E.wgn, E.sg, E.hg, E.gn].forEach(function (g) { g.gain.setTargetAtTime(0, now, .12); });
    E.tg.gain.setTargetAtTime(0, now, .12);
  }

  /* ---------------- ambience ---------------- */
  var A = null;
  function buildAmb() {
    var bs = src(noiseB), bf = ctx.createBiquadFilter(), bg = ctx.createGain();
    bf.type = 'lowpass'; bf.frequency.value = 320; bg.gain.value = 0; bs.connect(bf); bf.connect(bg); bg.connect(world);
    var ts = src(noiseW), tf = ctx.createBiquadFilter(), tg = ctx.createGain();
    tf.type = 'bandpass'; tf.frequency.value = 900; tf.Q.value = .5; tg.gain.value = 0; ts.connect(tf); tf.connect(tg); tg.connect(world);
    var tl = ctx.createOscillator(), tlg = ctx.createGain(); tl.frequency.value = .07; tlg.gain.value = .01; tl.connect(tlg); tlg.connect(tg.gain);

    var cs = ctx.createOscillator(), cg = ctx.createGain(), cl = ctx.createOscillator(), clg = ctx.createGain(), cl2 = ctx.createOscillator(), cl2g = ctx.createGain(), cv = ctx.createGain();
    cs.frequency.value = 4300; cg.gain.value = .5; cl.type = 'square'; cl.frequency.value = 22; clg.gain.value = .5;
    cl2.frequency.value = .35; cl2g.gain.value = .3; cv.gain.value = 0;
    cs.connect(cg); cl.connect(clg); clg.connect(cg.gain); cl2.connect(cl2g); cl2g.connect(cv.gain); cg.connect(cv); cv.connect(world);

    var ms = src(noiseW), m1 = ctx.createBiquadFilter(), m2 = ctx.createBiquadFilter(), mg = ctx.createGain();
    m1.type = 'bandpass'; m1.frequency.value = 550; m1.Q.value = 1.2; m2.type = 'bandpass'; m2.frequency.value = 1500; m2.Q.value = 2;
    mg.gain.value = 0;
    var a1 = ctx.createOscillator(), a2 = ctx.createOscillator(), a1g = ctx.createGain(), a2g = ctx.createGain(), mAm = ctx.createGain();
    a1.frequency.value = 3.1; a2.frequency.value = 5.3; a1g.gain.value = .3; a2g.gain.value = .2; mAm.gain.value = .5;
    a1.connect(a1g); a2.connect(a2g); a1g.connect(mAm.gain); a2g.connect(mAm.gain);
    ms.connect(m1); ms.connect(m2); m1.connect(mAm); m2.connect(mAm); mAm.connect(mg); mg.connect(world);

    var so = ctx.createOscillator(), sl = ctx.createOscillator(), slg = ctx.createGain(), sbp = ctx.createBiquadFilter(), sg = ctx.createGain(), spn = null;
    so.type = 'sawtooth'; so.frequency.value = 850; sl.frequency.value = .22; slg.gain.value = 280;
    sl.connect(slg); slg.connect(so.frequency);
    sbp.type = 'bandpass'; sbp.frequency.value = 1000; sbp.Q.value = 1.2; sg.gain.value = 0;
    so.connect(sbp); sbp.connect(sg);
    if (ctx.createStereoPanner) { spn = ctx.createStereoPanner(); sg.connect(spn); spn.connect(world); } else sg.connect(world);
    var rv = ctx.createGain(); rv.gain.value = .5; sg.connect(rv); rv.connect(revIn);

    [bs, ts, tl, cs, cl, cl2, ms, a1, a2, so, sl].forEach(function (n) { n.start(); });
    A = { bg: bg, bf: bf, tg: tg, cv: cv, mg: mg, sg: sg, spn: spn, so: so,
      nextBird: 0, nextSiren: performance.now() + 20000 + rnd() * 30000, sirenEnd: 0, nextHorn: performance.now() + 8000 + rnd() * 20000,
      nextScream: 0, nbT: 0, murmur: 0, sirenPan: 0 };
  }

  function chirp(pan) {
    var t = ctx.currentTime + .01, n = 2 + ((rnd() * 4) | 0), f = 2500 + rnd() * 2000, k;
    for (k = 0; k < n; k++) {
      var tt = t + k * .09, up = rnd() < .5;
      tone(tt, f * (up ? .8 : 1.2), f * (up ? 1.25 : .8), .07, 'sine', .035, { bus: world, pan: pan, wet: .2 });
      f *= .94 + rnd() * .12;
    }
  }
  function distHorn() {
    var t = ctx.currentTime + .01, pn = rnd() * 1.6 - .8, d = 360 + rnd() * 60;
    tone(t, d, d, .22, 'sawtooth', .02, { bus: world, pan: pn, wet: .4, atk: .01 });
    tone(t, d * 1.25, d * 1.25, .22, 'sawtooth', .02, { bus: world, pan: pn, wet: .4, atk: .01 });
    if (rnd() < .4) { tone(t + .3, d, d, .18, 'sawtooth', .02, { bus: world, pan: pn, wet: .4, atk: .01 }); }
  }
  function scream(npc, d) {
    var t = ctx.currentTime + .01, fem = npc.kind === 'fem' || npc.kind === 'wom' || npc.kind === 'sit';
    var f = fem ? 650 + rnd() * 450 : 280 + rnd() * 160, dur = .5 + rnd() * .4;
    var vol = .1 * Math.pow(clamp(1 - d / 60, 0, 1), 1.3), pn = pan3d(npc.x, npc.z);
    var os = ctx.createOscillator(), vib = ctx.createOscillator(), vg = ctx.createGain(), g = ctx.createGain();
    var f1 = ctx.createBiquadFilter(), f2 = ctx.createBiquadFilter(), m = ctx.createGain();
    os.type = 'sawtooth'; os.frequency.setValueAtTime(f * .8, t);
    os.frequency.linearRampToValueAtTime(f * 1.3, t + dur * .35); os.frequency.linearRampToValueAtTime(f * .9, t + dur);
    vib.frequency.value = 6; vg.gain.value = f * .03; vib.connect(vg); vg.connect(os.frequency);
    f1.type = 'bandpass'; f1.frequency.value = fem ? 900 : 700; f1.Q.value = 4;
    f2.type = 'bandpass'; f2.frequency.value = fem ? 2500 : 1800; f2.Q.value = 5;
    os.connect(f1); os.connect(f2); f1.connect(m); f2.connect(m); m.gain.value = .8; m.connect(g);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .05); g.gain.setValueAtTime(vol, t + dur * .7); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    route(g, { bus: world, pan: pn, wet: .35 });
    os.start(t); vib.start(t); os.stop(t + dur + .05); vib.stop(t + dur + .05);
  }

  function insideBld() {
    try {
      if (inCar || typeof CD === 'undefined' || !CD.bld) return false;
      for (var i = 0; i < CD.bld.length; i++) {
        var b = CD.bld[i];
        if (Math.abs(p.x - b.x) < b.w / 2 && Math.abs(p.z - b.z) < b.d / 2 && p.y >= b.y0 - .5 && p.y < b.y0 + b.h - .5) return true;
      }
    } catch (e) {}
    return false;
  }

  var ambT = 0, insNow = false;
  function ambTick(dt, act, ms) {
    var now = ctx.currentTime, lvl = act ? 1 : .3;
    ambT += dt;
    if (ambT < .2) return;
    ambT = 0;
    insNow = act ? insideBld() : false;
    worldLP.frequency.setTargetAtTime(insNow ? 700 : 20000, now, .25);
    var hr = (typeof gHr === 'number') ? gHr : (function () { var d = new Date(); return d.getHours() + d.getMinutes() / 60; })();
    var day = hr >= 6 && hr < 19, night = hr >= 19.5 || hr < 5.5;
    var inm = insNow ? .55 : 1;
    A.bg.gain.setTargetAtTime((day ? .11 : .07) * lvl * inm, now, .5);
    A.tg.gain.setTargetAtTime((day ? .03 : .015) * lvl * inm, now, .5);
    A.cv.gain.setTargetAtTime(night ? .014 * lvl * inm : 0, now, 1.5);

    var cnt = 0, panic = [], i, nl = (typeof NPCS !== 'undefined') ? NPCS : [];
    for (i = 0; i < nl.length; i++) {
      var n = nl[i]; if (!n || n.st === 3) continue;
      var d = Math.hypot(n.x - p.x, n.z - p.z);
      if (d < 28) cnt++;
      if (n.st === 2 && d < 60) panic.push({ n: n, d: d });
    }
    A.mg.gain.setTargetAtTime(clamp(cnt * .006, 0, .05) * lvl, now, .6);

    if (act) {
      if (day && ms > A.nextBird) { chirp(rnd() * 1.6 - .8); A.nextBird = ms + 2000 + rnd() * 5000; }
      if (ms > A.nextHorn) { distHorn(); A.nextHorn = ms + 12000 + rnd() * 30000; }
      if (panic.length && ms > A.nextScream) {
        var pk = panic[(rnd() * panic.length) | 0]; scream(pk.n, pk.d); A.nextScream = ms + 700 + rnd() * 900;
      }
    }
    // sirens: random distant ones + wanted level
    var heat = 0; try { heat = (window.GFX && GFX.heat) || 0; } catch (e) {}
    if (ms > A.nextSiren) { A.sirenEnd = ms + 8000 + rnd() * 3000; A.sirenPan = rnd() * 1.6 - .8; A.nextSiren = ms + 35000 + rnd() * 45000; }
    var sl = 0;
    if (act && ms < A.sirenEnd) sl = .012;
    if (act && heat > 0) { sl = Math.max(sl, .02 + .035 * (heat / 5)); A.sirenPan = Math.sin(ms / 2500) * .8; }
    A.sg.gain.setTargetAtTime(sl * inm, now, .8);
    if (A.spn) A.spn.pan.setTargetAtTime(A.sirenPan, now, .5);
    A.so.frequency.setTargetAtTime(heat > 0 ? 900 : 850, now, .5);
  }

  /* ---------------- radio ---------------- */
  var R = { st: 0, next: 0, step: 0, bus: null }, BASS = [45, 41, 48, 43];
  var CH = [[57, 60, 64, 67], [53, 57, 60, 64], [60, 64, 67, 71], [55, 59, 62, 67]], PENT = [69, 72, 74, 76, 79];
  function kick(t, o) { tone(t, 140, 42, .22, 'sine', .9, o); nz(t, .015, 'lowpass', 1800, 1800, .7, .25, o); }
  function snare(t, o) { nz(t, .16, 'bandpass', 1900, 1500, .9, .35, o); tone(t, 200, 140, .09, 'triangle', .25, o); }
  function clap(t, o) { for (var i = 0; i < 3; i++) nz(t + i * .011, .07, 'bandpass', 1400, 1400, 1.2, .22, o); }
  function hat(t, v, o, open) { nz(t, open ? .12 : .035, 'highpass', 7000, 7000, .7, v, o); }
  function conga(t, hi, o) { tone(t, hi ? 330 : 230, hi ? 260 : 170, .12, 'sine', .28, o); nz(t, .02, 'bandpass', 900, 900, 2, .1, o); }

  function seqAfro(t, s, o) {
    var sp = s % 16, bar = ((s / 16) | 0) % 4, ch = CH[bar];
    if (sp === 0 || sp === 7 || sp === 10) kick(t, o);
    if (sp === 4 || sp === 12) { snare(t, o); if (sp === 12) clap(t + .002, o); }
    hat(t, sp % 2 ? .03 : .055, o, sp === 14);
    if (sp === 3 || sp === 6 || sp === 11 || sp === 14) conga(t, sp === 3 || sp === 11, o);
    if (sp === 0 || sp === 3 || sp === 6 || sp === 10 || sp === 12) vox(t, mf(BASS[bar] + (sp === 6 || sp === 12 ? 12 : 0)), .28, 'sawtooth', .34, 500, o);
    if (sp === 0 || sp === 6 || sp === 10) ch.forEach(function (n, i) { vox(t + i * .006, mf(n + 12), .2, 'triangle', .07, 2400, o); });
    if (sp % 2 && rnd() < .3) vox(t, mf(PENT[(rnd() * 5) | 0]), .22, 'sine', .09, 3500, { bus: o.bus, wet: .25, slap: .3 });
  }
  function seqNight(t, s, o) {
    var sp = s % 16, bar = ((s / 16) | 0) % 4, ch = CH[bar];
    if (sp % 4 === 0) kick(t, o);
    if (sp === 4 || sp === 12) { snare(t, o); clap(t, o); }
    if (sp % 4 === 2) hat(t, .05, o, true); else if (sp % 2 === 0) hat(t, .02, o);
    if (sp % 2 === 0) vox(t, mf(BASS[bar]), .2, 'sawtooth', .3, 700, o);
    vox(t, mf(ch[sp % 4] + 12), .14, 'sawtooth', .06, 1800 + (s % 64) * 40, { bus: o.bus, slap: .35, wet: .15 });
    if (sp === 0) ch.forEach(function (n) { vox(t, mf(n), 1.6, 'sawtooth', .045, 900, o); });
  }
  function radioTick() {
    if (!R.st) return;
    if (!R.bus) {
      R.bus = ctx.createGain(); R.bus.gain.value = .6;
      var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 6500; R.bus.connect(lp); lp.connect(local);
    }
    var bpm = R.st === 1 ? 102 : 96, spb = 60 / bpm / 4, now = ctx.currentTime, o = { bus: R.bus };
    if (R.next < now) R.next = now + .05;
    while (R.next < now + .25) {
      if (R.st === 1) seqAfro(R.next, R.step, o); else seqNight(R.next, R.step, o);
      var sw = R.st === 1 ? .12 : 0;
      R.next += spb * (R.step % 2 ? 1 - sw : 1 + sw); R.step++;
    }
  }
  function cycleRadio() {
    R.st = (R.st + 1) % 3; R.next = 0; R.step = 0;
    nz(ctx.currentTime + .01, .22, 'bandpass', 3000, 3000, .4, .12);
    say(R.st === 0 ? 'RADIO OFF' : R.st === 1 ? 'RADIO: EKO FM - Afro Vibes' : 'RADIO: NIGHT DRIVE FM');
  }

  /* ---------------- main loop ---------------- */
  var lastT = 0, lastX = 0, lastZ = 0, stepAcc = 0, prevGround = true, fallV = 0, lastMag = 30, lastRl = false, wasActive = false;
  function tick(ts) {
    if (!ctx || ctx.state !== 'running' || !built) return;
    var dt = Math.min(.1, (ts - lastT) / 1000); lastT = ts; if (dt <= 0) return;
    var act = !!locked, car = inCar, now = ctx.currentTime;
    master.gain.setTargetAtTime(muted ? 0 : (act ? .8 : .4), now, .2);

    if (act && car) { engineTick(dt, car); radioTick(); }
    else { engineOff(); R.next = 0; }

    if (act && !car) {
      var hs = Math.hypot(p.x - lastX, p.z - lastZ) / dt;
      if (p.ground && hs > 1 && hs < 14 && !XS.lock) {
        stepAcc += hs * dt;
        var stride = XS.swim ? 2.2 : XS.sprint ? 2.6 : XS.crouch ? 1.6 : 2.1;
        if (stepAcc >= stride) { stepAcc = 0; stepSnd(XS.sprint, insNow, XS.swim); }
      }
      if (!p.ground) fallV = Math.min(fallV, p.vy || 0);
      if (!prevGround && p.ground) { if (-fallV > 4) landSnd(-fallV); fallV = 0; }
      prevGround = !!p.ground;
    } else { fallV = 0; prevGround = true; }
    lastX = p.x; lastZ = p.z;

    if (act) {
      if (ammo.mag < lastMag && lastMag - ammo.mag === 1) gunshot(role.gun);
      if (ammo.rl && !lastRl) magOut();
      if (!ammo.rl && lastRl) magIn();
    }
    lastMag = ammo.mag; lastRl = ammo.rl;

    ambTick(dt, act, performance.now());
  }
  function frame(ts) {
    requestAnimationFrame(frame);
    try { tick(ts); } catch (e) { console.warn('EKO sound error', e); }
  }

  /* ---------------- hooks into game functions ---------------- */
  function hook() {
    var o;
    if (typeof hurt === 'function') { o = hurt; window.hurt = function (n, kind) { var h0 = XS.hp; var r = o.apply(this, arguments); try { if (ctx && built && XS.hp < h0) hurtSnd(kind); } catch (e) {} return r; }; }
    if (typeof doPunch === 'function') { var op = doPunch; window.doPunch = function () { var o0 = XS.once; var r = op.apply(this, arguments); try { if (ctx && built && !o0 && XS.once) punchSnd(); } catch (e) {} return r; }; }
    if (typeof toggleCar === 'function') { var ot = toggleCar; window.toggleCar = function () { var b = inCar; var r = ot.apply(this, arguments); try { if (ctx && built && b !== inCar) doorSnd(); } catch (e) {} return r; }; }
    if (typeof swapCar === 'function') { var os = swapCar; window.swapCar = function (c, type) { var r = os.apply(this, arguments); try { c.snd = type; } catch (e) {} return r; }; }
  }

  /* ---------------- start-up ---------------- */
  function unlock() {
    try {
      if (!ctx) build();
      if (ctx.state !== 'running') ctx.resume();
    } catch (e) { console.warn('EKO sound unlock failed', e); }
  }
  ['pointerdown', 'mousedown', 'touchstart', 'keydown', 'click'].forEach(function (ev) { window.addEventListener(ev, unlock, { passive: true }); });
  document.addEventListener('visibilitychange', function () {
    if (!ctx) return;
    try { if (document.hidden) ctx.suspend(); else ctx.resume(); } catch (e) {}
  });
  window.addEventListener('keydown', function (e) {
    if (e.repeat) return;
    if (e.code === 'KeyH') hornOn = true;
    else if (e.code === 'KeyB' && ctx && built && locked && inCar) cycleRadio();
    else if (e.code === 'KeyM') {
      muted = !muted; try { localStorage.setItem('ekoMute', muted ? '1' : '0'); } catch (x) {}
      if (master) master.gain.setTargetAtTime(muted ? 0 : .8, ctx.currentTime, .05);
      say(muted ? 'SOUND OFF (M)' : 'SOUND ON (M)');
    }
  });
  window.addEventListener('keyup', function (e) { if (e.code === 'KeyH') hornOn = false; });

  var tries = 0, boot = setInterval(function () {
    tries++;
    try {
      void p; void keys; void cars; void ammo; void XS; void cam; void role; void locked; void inCar;
      clearInterval(boot); hook(); requestAnimationFrame(frame);
    } catch (e) { if (tries > 300) { clearInterval(boot); console.warn('EKO sound: game not found'); } }
  }, 300);

  window.EKO_SOUND = {
    gun: function (k) { unlock(); gunshot(k || 'Rifle'); }, step: function () { unlock(); stepSnd(false, false, false); },
    crash: function () { unlock(); crashSnd(1); }, scream: function () { unlock(); scream({ kind: 'fem', x: p.x + 5, z: p.z }, 10); },
    mute: function (m) { muted = !!m; }
  };
})();

