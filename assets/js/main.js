/* ════════════════════════════════════════════════════
   harish-v3 · "signal over noise" runtime
   vanilla · canvas signal · lab interactions · no libraries
   ════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  try {
    console.log('%c signal over noise %c seed 42 · drag the lab sliders',
      'background:#FF5B26;color:#0F0D0A;font-weight:bold;padding:2px 8px',
      'color:#E8B44A');
  } catch (_) {}

  /* ── hero char split + entrance ── */
  const lines = $$('[data-split]');
  if (!reduced) {
    lines.forEach(el => {
      const txt = el.textContent;
      el.setAttribute('aria-label', txt);
      el.textContent = '';
      Array.from(txt).forEach(ch => {
        const s = document.createElement('span');
        s.className = 'ch';
        s.setAttribute('aria-hidden', 'true');
        s.textContent = ch === ' ' ? ' ' : ch;
        el.appendChild(s);
      });
    });
    const chars = $$('.hero-title .ch');
    chars.forEach(c => { c.style.transform = 'translateY(115%)'; });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      chars.forEach((c, i) => {
        c.style.transition = 'transform 0.9s cubic-bezier(0.19,1,0.22,1)';
        c.style.transitionDelay = (0.08 + i * 0.028) + 's';
        c.style.transform = 'translateY(0)';
      });
    }));
  }

  /* ── canvas signal field ── */
  const canvas = $('#signal');
  if (canvas && !reduced) {
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, running = true, t = 0;
    let mx = 0.5, my = 0.5, tmx = 0.5, tmy = 0.5;
    const DPR = Math.min(1.5, devicePixelRatio || 1);
    const N = 64;
    const parts = Array.from({ length: N }, () => ({
      x: Math.random(), y: Math.random(),
      s: 0.0004 + Math.random() * 0.0012,
      r: 0.8 + Math.random() * 1.8,
      o: 0.15 + Math.random() * 0.5
    }));

    const size = () => {
      const r = canvas.parentElement.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * DPR; canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    size();
    addEventListener('resize', size, { passive: true });
    addEventListener('pointermove', e => {
      const r = canvas.getBoundingClientRect();
      tmx = (e.clientX - r.left) / Math.max(1, r.width);
      tmy = (e.clientY - r.top) / Math.max(1, r.height);
    }, { passive: true });

    new IntersectionObserver(es => es.forEach(e => { running = e.isIntersecting; }), { threshold: 0 }).observe(canvas);

    const wave = (baseY, amp, freq, phase, color, width) => {
      ctx.beginPath();
      for (let x = 0; x <= W; x += 6) {
        const p = x / W;
        const env = Math.sin(p * Math.PI);
        const y = baseY
          + Math.sin(p * freq + t + phase) * amp * env
          + Math.sin(p * freq * 2.7 + t * 1.6 + phase) * amp * 0.35 * env
          + (tmy - 0.5) * 90 * env;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
    };

    const frame = () => {
      requestAnimationFrame(frame);
      if (!running) return;
      t += 0.016;
      mx += (tmx - mx) * 0.04; my += (tmy - my) * 0.04;
      ctx.clearRect(0, 0, W, H);
      const energy = 0.6 + Math.abs(mx - 0.5) * 1.6;
      wave(H * 0.34, 34 * energy, 5.2, 0, 'rgba(255,77,0,0.5)', 2);
      wave(H * 0.5, 46 * energy, 3.6, 1.8, 'rgba(34,51,232,0.32)', 1.6);
      wave(H * 0.66, 28 * energy, 7.1, 3.4, 'rgba(23,19,13,0.18)', 1.2);
      parts.forEach(p => {
        p.y -= p.s;
        if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
        const flick = 0.6 + 0.4 * Math.sin(t * 3 + p.x * 20);
        ctx.beginPath();
        ctx.arc(p.x * W + (mx - 0.5) * 40 * p.o, p.y * H, p.r, 0, 6.283);
        ctx.fillStyle = `rgba(255,77,0,${(p.o * flick * 0.75).toFixed(3)})`;
        ctx.fill();
      });
    };
    frame();
  }

  /* ── stagger cascades: children of marked groups reveal in sequence ── */
  $$('.hero-ticker, .ch-figs, .tags, .courses, .kit-grid, .finale-links, .triage-out, .finale-title').forEach(box => {
    Array.from(box.children).forEach((kid, i) => {
      kid.classList.add('reveal');
      kid.style.transitionDelay = (i * 80) + 'ms';
    });
  });

  /* ── showreel: plays once at 0.95x, chromeless, pauses off-screen ── */
  const hv = $('#heroVideo');
  if (hv && !reduced) {
    let hvStarted = false;
    const applyRate = () => { hv.playbackRate = 0.95; };
    const hvPlay = () => {
      if (hvStarted || hv.ended) return;
      applyRate();
      hvStarted = true;
      const p = hv.play();
      if (p) p.catch(() => { hvStarted = false; });
    };
    applyRate();
    hv.addEventListener('loadedmetadata', applyRate);
    hv.addEventListener('canplay', hvPlay);
    hv.addEventListener('play', applyRate);
    hv.addEventListener('playing', () => {
      applyRate();
      hv.classList.add('playing');
    });
    hv.addEventListener('contextmenu', e => e.preventDefault());
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(es => es.forEach(e => {
        if (hv.ended) return;
        if (e.isIntersecting) hvPlay();
        else hv.pause();
      }), { threshold: 0.15 }).observe(hv);
    }
  }

  /* ── reveals (once) ── */
  const els = $$('.reveal');
  if (reduced || !('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      setTimeout(() => e.target.classList.add('done'), 800);
      io.unobserve(e.target);
    }), { threshold: 0, rootMargin: '0px 0px 0px 0px' });
    els.forEach(el => io.observe(el));
  }

  /* ── counters (once) ── */
  const setFinal = el => {
    const raw = el.dataset.count;
    const dec = (raw.split('.')[1] || '').length;
    const out = dec ? parseFloat(raw).toFixed(dec)
      : Math.round(parseFloat(raw)).toLocaleString('en-IN');
    el.textContent = out + (el.dataset.suffix || '');
  };
  const counters = $$('[data-count]');
  if (reduced || !('IntersectionObserver' in window)) {
    counters.forEach(setFinal);
  } else {
    const cio = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      cio.unobserve(el);
      const target = parseFloat(el.dataset.count);
      const dec = (el.dataset.count.split('.')[1] || '').length;
      const suffix = el.dataset.suffix || '';
      const t0 = performance.now();
      const tick = now => {
        const p = Math.min(1, (now - t0) / 1200);
        const v = target * (1 - Math.pow(1 - p, 3));
        el.textContent = (dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-IN')) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }), { threshold: 0.5 });
    counters.forEach(el => cio.observe(el));
  }

  /* ── LAB 01 · churn triage ──
     anchored at measured 10% -> 94.8%: captured = 1-exp(-0.2956x) */
  const triageRange = $('#triageRange');
  if (triageRange) {
    const fill = $('#triageFill'), mark = $('#triageMark');
    const outX = $('#triageX'), outY = $('#triageY'), val = $('#triageVal');
    const render = () => {
      const x = parseInt(triageRange.value, 10);
      const caught = (1 - Math.exp(-0.2956 * x)) * 100;
      const xs = x + '%';
      const ys = caught.toFixed(1) + '%';
      if (fill) fill.style.width = (x / 15 * 100) + '%';
      if (mark) mark.style.left = '10%';
      if (outX) outX.textContent = xs;
      if (outY) outY.textContent = ys;
      if (val) val.textContent = xs;
    };
    triageRange.addEventListener('input', render, { passive: true });
    render();
  }

  /* ── LAB 02 · leakage switch ── */
  const leakSwitch = $('#leakSwitch');
  if (leakSwitch) {
    const label = $('#leakLabel'), row = $('#auditRow');
    const expiry = $('#auditExpiry'), status = $('#auditStatus');
    const verdict = $('.audit-verdict'), metric = $('#auditMetric'), sub = $('#auditSub');
    leakSwitch.addEventListener('click', () => {
      const on = leakSwitch.getAttribute('aria-checked') !== 'true';
      leakSwitch.setAttribute('aria-checked', String(on));
      if (label) label.textContent = on
        ? 'pipeline: AUDITED — cutoff 2017-03-31 enforced'
        : 'pipeline: LEAKY — future visible';
      if (expiry) expiry.textContent = on ? 'cut off 2017-03-31' : '2018-06-30';
      if (status) status.textContent = on ? 'lapsed ✓' : 'active ✗';
      if (row) { row.classList.toggle('good', on); row.classList.toggle('bad', !on); }
      if (verdict) { verdict.classList.toggle('good', on); verdict.classList.toggle('bad', !on); }
      if (metric) metric.textContent = on ? '0.956 PR AUC — earned.' : 'looks perfect. means nothing.';
      if (sub) sub.textContent = on
        ? 'audited features, honest metric — this number can be trusted'
        : 'scores from leaked features are fiction — the pipeline runs green and lies';
    });
    if (row) row.classList.add('bad');
    if (verdict) verdict.classList.add('bad');
  }

  /* ── LAB 03 · blend slider ── */
  const blendRange = $('#blendRange');
  if (blendRange) {
    const tech = $('#blendTech'), sent = $('#blendSent');
    const techV = $('#blendTechVal'), sentV = $('#blendSentVal');
    const val = $('#blendVal'), note = $('#blendNote');
    const render = () => {
      const w = parseInt(blendRange.value, 10);
      if (tech) tech.style.width = w + '%';
      if (sent) sent.style.width = (100 - w) + '%';
      if (techV) techV.textContent = w;
      if (sentV) sentV.textContent = 100 - w;
      if (val) val.textContent = w;
      if (note) note.textContent = w === 60
        ? 'shipped at 60/40 · declared, not tuned away'
        : w > 60 ? 'chart-heavy — blind to budgets, rates and tariffs'
        : 'news-heavy — vibes over price action';
    };
    blendRange.addEventListener('input', render, { passive: true });
    render();
  }

  /* ── manifesto word-fill: split once, light words with scroll ── */
  const maniEl = $('.manifesto-text');
  let maniWords = [];
  if (maniEl) {
    const KEY = { die: 'w-die', ship: 'w-ship', data: 'w-trust', trustworthy: 'w-trust' };
    const walk = node => {
      Array.from(node.childNodes).forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const s = document.createElement('span');
            s.className = 'w';
            const k = part.toLowerCase().replace(/[^a-z]/g, '');
            if (KEY[k]) s.classList.add(KEY[k]);
            s.textContent = part;
            frag.appendChild(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) { walk(n); }
      });
    };
    walk(maniEl);
    maniWords = Array.from(maniEl.querySelectorAll('.w'));
    maniEl._lit = -1;
  }

  /* ── scroll heaven: progress · hero drift · sticker float · morph drift · chapter settle ──
     one passive listener, one rAF, transform/opacity only */
  const navEl = $('.nav'), heroInner = $('.hero-inner'), progress = $('#scrollProgress');
  const progNav = () => {
    const y = scrollY || document.documentElement.scrollTop;
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    if (progress) progress.style.width = (y / max * 100).toFixed(2) + '%';
    if (navEl) navEl.classList.toggle('scrolled', y > 10);
  };
  addEventListener('scroll', () => {
    if (progNav._t) return;
    progNav._t = true;
    requestAnimationFrame(() => { progNav._t = false; progNav(); });
  }, { passive: true });

  if (!reduced) {
    const floaters = $$('.sticker, .morph svg');
    floaters.forEach((el, i) => {
      el.dataset.speed = el.classList.contains('sticker') ? (i % 2 ? '-0.05' : '0.05') : '0.04';
    });
    const chapters = $$('.chapter');
    let ticking = false;
    addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const y = scrollY || document.documentElement.scrollTop;
        const vh = innerHeight;
        if (heroInner && y < vh * 1.2) {
          /* fade only after the reader has moved on: full strength to 30% vh */
          const fp = Math.max(0, (y - vh * 0.3) / (vh * 0.6));
          heroInner.style.transform = `translateY(${(y * 0.12).toFixed(1)}px)`;
          heroInner.style.opacity = Math.max(0.25, 1 - fp * 0.75).toFixed(3);
        }
        if (canvas) canvas.style.transform = `translateY(${(y * 0.1).toFixed(1)}px)`;
        floaters.forEach(el => {
          const r = el.getBoundingClientRect();
          if (r.bottom < -200 || r.top > vh + 200) return;
          const off = (r.top + r.height / 2 - vh / 2) * parseFloat(el.dataset.speed);
          el.style.setProperty('--py', (off * (el.classList.contains('sticker') ? 1 : 0.5)).toFixed(1) + 'px');
        });
        chapters.forEach(ch => {
          if (!ch.classList.contains('in')) return;
          const r = ch.getBoundingClientRect();
          const cover = 84 - r.top;
          if (cover > 0 && r.bottom > 200) {
            const p = Math.min(1, cover / (vh * 0.7));
            ch.style.setProperty('--s', (1 - p * 0.045).toFixed(4));
          } else if (ch.style.getPropertyValue('--s')) {
            ch.style.setProperty('--s', '1');
          }
        });
        /* manifesto word-fill: light words as the statement crosses the viewport */
        if (maniEl && maniWords.length) {
          const r = maniEl.getBoundingClientRect();
          const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (vh * 0.7)));
          const lit = Math.round(p * maniWords.length);
          if (lit !== maniEl._lit) {
            const prev = Math.max(0, maniEl._lit);
            if (lit > prev) for (let k = prev; k < lit; k++) maniWords[k].classList.add('lit');
            else for (let k = lit; k < prev; k++) maniWords[k].classList.remove('lit');
            maniEl._lit = lit;
          }
        }
      });
    }, { passive: true });
  } else {
    $$('.morph svg').forEach(s => { if (s.pauseAnimations) s.pauseAnimations(); });
    maniWords.forEach(w => w.classList.add('lit'));
  }

  /* ── portrait lens: alternate shirt revealed in a cursor circle + gentle tilt ──
     fine pointers only · cursor itself stays native */
  const finePointer = matchMedia('(pointer: fine)').matches;
  if (finePointer && !reduced) {
    $$('.portrait.lens').forEach(fig => {
      const frame = $('.lens-frame', fig);
      if (!frame || !fig.dataset.lens) return;
      const ring = document.createElement('div');
      ring.className = 'lens-ring'; ring.setAttribute('aria-hidden', 'true');
      const top = document.createElement('div');
      top.className = 'lens-top'; top.setAttribute('aria-hidden', 'true');
      top.style.backgroundImage = `url("${fig.dataset.lens}")`;
      frame.append(ring, top);
      fig.addEventListener('pointerenter', () => fig.classList.add('on'), { passive: true });
      fig.addEventListener('pointerleave', () => {
        fig.classList.remove('on');
        fig.style.transform = '';
      }, { passive: true });
      fig.addEventListener('pointermove', e => {
        const r = frame.getBoundingClientRect();
        if (!r.width) return;
        const x = e.clientX - r.left, y = e.clientY - r.top;
        fig.style.setProperty('--mx', x.toFixed(1) + 'px');
        fig.style.setProperty('--my', y.toFixed(1) + 'px');
        if (!fig.classList.contains('done')) return;
        const nx = x / r.width - 0.5, ny = y / r.height - 0.5;
        fig.style.transform =
          `perspective(950px) rotateX(${(-ny * 7).toFixed(2)}deg) rotateY(${(nx * 9).toFixed(2)}deg)`;
      }, { passive: true });
    });
  }

  /* ── active nav ── */
  const map = {};
  $$('.nav-links a').forEach(a => { map[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    const sio = new IntersectionObserver(es => es.forEach(e => {
      const link = map[e.target.id];
      if (!link || !e.isIntersecting) return;
      Object.values(map).forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    }), { rootMargin: '-40% 0px -55% 0px' });
    ['work', 'lab', 'about'].forEach(id => {
      const s = document.getElementById(id);
      if (s) sio.observe(s);
    });
  }

  /* ══════════ WORK DECK · pinned scroll-scrubbed stage ══════════
     GSAP + ScrollTrigger only — native scroll, no smoothing library */
  if (!reduced && window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    const deckFmt = (n, dec, comma) => dec > 0
      ? n.toFixed(dec)
      : (comma ? Math.round(n).toLocaleString('en-IN') : String(Math.round(n)));

    function prepDraw(els) {
      els.forEach(el => { try {
        const L = el.getTotalLength();
        if (L > 0) { el._L = L; gsap.set(el, { strokeDasharray: L, strokeDashoffset: L }); }
      } catch (e) {} });
    }
    function tlDraw(tl, els, at, dur, stagger) {
      els.forEach((el, i) => {
        if (el._L == null) return;
        tl.fromTo(el, { strokeDashoffset: el._L }, { strokeDashoffset: 0,
          duration: dur, ease: 'power2.inOut', immediateRender: false }, at + i * (stagger || 0));
      });
    }

    const VIS = [
      { /* fig.1 — PR curves + deciles */
        init(p) {
          const el = p.el;
          p.axes = $$('.pr-ax', el); p.base = $('.pr-base', el); p.model = $('.pr-model', el);
          p.bars = $$('.dec-b', el); p.brk = $('.dec-brk', el); p.labs = $$('.pr-l', el);
          prepDraw([p.base, p.model, p.brk].filter(Boolean));
          gsap.set(p.axes, { autoAlpha: 0 }); gsap.set(p.labs, { autoAlpha: 0 });
          gsap.set(p.bars, { scaleY: 0, transformOrigin: '50% 100%' });
        },
        enter(p, tl, at) {
          tl.fromTo(p.axes, { autoAlpha: 0 }, { autoAlpha: 1, duration: .5, immediateRender: false }, at);
          tl.fromTo(p.labs, { autoAlpha: 0 }, { autoAlpha: 1, duration: .5, stagger: .06, immediateRender: false }, at + .15);
          tlDraw(tl, [p.base], at + .1, 1.1, 0);
          tlDraw(tl, [p.model], at + .35, 1.1, 0);
        },
        detail(p, tl, at) {
          tl.fromTo(p.bars, { scaleY: 0 }, { scaleY: 1, duration: .6, ease: 'power3.out', stagger: .05, immediateRender: false }, at);
          tlDraw(tl, [p.brk], at + .3, .35, 0);
        }
      },
      { /* fig.2 — radar */
        init(p) {
          const el = p.el;
          p.cirs = $$('.rd-c', el); p.cross = $$('.rd-x', el); p.sweep = $('.rd-sweep', el);
          p.blips = $$('.rd-blip', el); p.surge = $('.rd-surge', el); p.labs = $$('.rd-l', el);
          prepDraw(p.cirs);
          gsap.set([].concat(p.cross, p.sweep, p.labs), { autoAlpha: 0 });
          gsap.set(p.blips, { scale: 0, transformOrigin: '50% 50%' });
          gsap.set(p.surge, { autoAlpha: 0, scale: .4, transformOrigin: '50% 50%' });
          gsap.to(p.sweep, { rotation: 360, svgOrigin: '220 220', duration: 20, ease: 'none', repeat: -1 });
        },
        enter(p, tl, at) {
          tlDraw(tl, p.cirs, at, .9, .12);
          tl.fromTo(p.cross, { autoAlpha: 0 }, { autoAlpha: 1, duration: .5, immediateRender: false }, at + .15);
          tl.fromTo(p.sweep, { autoAlpha: 0 }, { autoAlpha: 1, duration: .6, immediateRender: false }, at + .25);
          tl.fromTo(p.labs, { autoAlpha: 0 }, { autoAlpha: 1, duration: .4, stagger: .08, immediateRender: false }, at + .3);
        },
        detail(p, tl, at) {
          tl.fromTo(p.blips, { scale: 0 }, { scale: 1, duration: .5, ease: 'back.out(2)', stagger: .09, immediateRender: false }, at);
          tl.fromTo(p.surge, { autoAlpha: .9, scale: .4 }, { autoAlpha: 0, scale: 3.2, duration: 1.1, ease: 'power2.out', immediateRender: false }, at + .2);
        }
      },
      { /* fig.3 — quant engine */
        init(p) {
          const el = p.el;
          p.price = $('.q-price', el); p.pts = $$('.q-pt', el);
          p.boxes = $$('.q-box', el); p.hub = $('.q-hub', el); p.arrs = $$('.q-arr', el);
          p.m1 = $('.q-m1', el); p.m2 = $('.q-m2', el); p.mls = $$('.q-ml', el); p.macro = $('.q-macro', el);
          prepDraw([p.price].concat(p.arrs));
          gsap.set(p.pts, { scale: 0, transformOrigin: '50% 50%' });
          gsap.set([].concat(p.boxes, p.hub ? [p.hub] : [], p.mls, p.macro ? [p.macro] : []), { autoAlpha: 0 });
          gsap.set([p.m1, p.m2], { scaleX: 0, transformOrigin: '0% 50%' });
        },
        enter(p, tl, at) {
          tlDraw(tl, [p.price], at, 1, 0);
          tl.fromTo(p.pts, { scale: 0 }, { scale: 1, duration: .35, ease: 'back.out(2)', stagger: .035, immediateRender: false }, at + .15);
          tl.fromTo([].concat(p.boxes, p.hub ? [p.hub] : []), { autoAlpha: 0 }, { autoAlpha: 1, duration: .45, stagger: .08, immediateRender: false }, at + .2);
          tlDraw(tl, p.arrs, at + .3, .45, .07);
        },
        detail(p, tl, at) {
          tl.fromTo(p.m1, { scaleX: 0 }, { scaleX: 1, duration: .8, ease: 'power3.inOut', immediateRender: false }, at);
          tl.fromTo(p.m2, { scaleX: 0 }, { scaleX: 1, duration: .6, ease: 'power3.inOut', immediateRender: false }, at + .18);
          tl.fromTo(p.mls, { autoAlpha: 0 }, { autoAlpha: 1, duration: .4, stagger: .08, immediateRender: false }, at + .2);
          tl.fromTo(p.macro, { autoAlpha: 0 }, { autoAlpha: 1, duration: .5, immediateRender: false }, at + .45);
        }
      },
      { /* fig.4 — campus system */
        init(p) {
          const el = p.el;
          p.links = $$('.c-link', el); p.mods = $$('.c-mod', el);
          p.hub = $('.c-hub', el); p.note = $('.c-note', el);
          const g = $('.c-dots', el);
          if (g && !g.children.length) {
            const cols = 12, rows = 8, x0 = 30, dx = (450 - 30) / (cols - 1), y0 = 48, dy = (322 - 48) / (rows - 1);
            let s = '';
            for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++)
              s += '<circle class="c-dot" cx="' + (x0 + c * dx).toFixed(1) + '" cy="' + (y0 + r * dy).toFixed(1) + '" r="1.7"/>';
            g.innerHTML = s;
          }
          p.dots = $$('.c-dot', el);
          prepDraw(p.links);
          gsap.set([].concat(p.mods, p.hub ? [p.hub] : [], p.note ? [p.note] : []), { autoAlpha: 0 });
          gsap.set(p.dots, { scale: 0, transformOrigin: '50% 50%' });
        },
        enter(p, tl, at) {
          tlDraw(tl, p.links, at, .6, .12);
          tl.fromTo([].concat(p.mods, p.hub ? [p.hub] : []), { autoAlpha: 0 }, { autoAlpha: 1, duration: .5, stagger: .12, immediateRender: false }, at + .15);
        },
        detail(p, tl, at) {
          tl.fromTo(p.dots, { scale: 0 }, { scale: 1, duration: .45, ease: 'power2.out', stagger: { each: .0035, from: 'random' }, immediateRender: false }, at);
          tl.fromTo(p.note, { autoAlpha: 0 }, { autoAlpha: 1, duration: .45, immediateRender: false }, at + .4);
        }
      }
    ];

    (function buildDeck() {
      const pin = $('.work-pin');
      if (!pin) return;
      const stage = $('.stage', pin);
      const projs = $$('.proj', stage);
      if (!projs.length) return;
      /* short viewports / phones: stacked editorial fallback, no pin */
      if (!matchMedia('(min-width: 901px) and (min-height: 640px)').matches) return;
      stage.classList.add('deck');

      /* Readable pacing: ENTER -> HOLD (read b1) -> SWAP -> HOLD (read complete)
         -> EXIT -> GAP (hard cut, stage breathes) -> next ENTER.
         Last slide ends on its HOLD with a tiny RELEASE so there is no dead scroll. */
      const ENTER = 0.85, HOLD_CTX = 1.35, SWAP = 0.65, HOLD_FULL = 1.7, EXIT = 0.45, GAP = 0.5, RELEASE = 0.35;
      const P = projs.map(el => ({
        el: el,
        kick: $('.pk-kick', el), lines: $$('.ln-i', el), lede: $('.pk-lede', el),
        b1: $('.pk-b1', el), b2: $('.pk-b2', el), mets: $$('.met', el),
        stack: $('.pk-stack', el), links: $('.ch-links', el)
      }));

      /* card 0 text paints complete by default (no skeleton);
         only its second story paragraph hides — but its figure now
         initialises hidden like the rest so it can animate on scroll */
      P.forEach((p, i) => { if (i === 0) return;
        gsap.set(p.lines, { yPercent: 112 });
        gsap.set([p.kick, p.lede, p.b1, p.b2, p.links], { autoAlpha: 0, y: 20 });
        gsap.set(p.mets, { autoAlpha: 0, y: 14 });
      });
      gsap.set(P[0].b2, { autoAlpha: 0, y: 12 });
      P.forEach((p, i) => { if (i > 0) gsap.set(p.el, { autoAlpha: 0, y: 44 }); });
      P.forEach((p, i) => { if (VIS[i]) VIS[i].init(p); });

      const tl = gsap.timeline();
      const starts = [];
      const swapStarts = [];
      const fullStarts = [];
      const ctxMids = [];
      const fullMids = [];

      function countIn(m, at) {
        const v = $('.met-v', m);
        if (!v || !v.dataset.to) return;
        const to = +v.dataset.to, dec = +(v.dataset.dec || 0), comma = ('comma' in v.dataset);
        const pre = v.dataset.pre || '', suf = v.dataset.suf || '';
        const o = { n: 0 };
        tl.fromTo(o, { n: 0 }, { n: to, duration: .7, ease: 'power2.out', immediateRender: false,
          onUpdate: () => { v.textContent = pre + deckFmt(o.n, dec, comma) + suf; } }, at);
      }
      function enter(i, at) {
        const p = P[i];
        if (i > 0) tl.fromTo(p.el, { autoAlpha: 0, y: 44 }, { autoAlpha: 1, y: 0, duration: ENTER * .75, ease: 'power3.out', immediateRender: false }, at);
        tl.fromTo(p.kick, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: .4, ease: 'power2.out', immediateRender: false }, at + .05);
        tl.fromTo(p.lines, { yPercent: 112 }, { yPercent: 0, duration: .65, ease: 'expo.out', stagger: .07, immediateRender: false }, at + .08);
        tl.fromTo(p.lede, { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: .45, ease: 'power2.out', immediateRender: false }, at + .18);
        tl.fromTo(p.b1, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: .45, ease: 'power2.out', immediateRender: false }, at + .26);
        p.mets.forEach((m, k) => {
          tl.fromTo(m, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: .35, ease: 'power2.out', immediateRender: false }, at + .3 + k * .07);
          countIn(m, at + .3 + k * .07);
        });
        tl.fromTo(p.links, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: .35, ease: 'power2.out', immediateRender: false }, at + .45);
        if (VIS[i]) VIS[i].enter(P[i], tl, at + .1);
      }
      function detail(i, at) {
        const p = P[i];
        tl.fromTo(p.b1, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -12, duration: .32, ease: 'power1.in', immediateRender: false }, at);
        tl.fromTo(p.b2, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: .45, ease: 'power2.out', immediateRender: false }, at + .2);
        if (VIS[i]) VIS[i].detail(P[i], tl, at + .3);
      }
      function exit(i, at) {
        tl.to(P[i].el, { autoAlpha: 0, y: -36, duration: EXIT, ease: 'power2.in' }, at);
      }

      // Card 0: text stays readable on b1 first; its figure draws in
      // during that hold (enter), then bars land with the text swap (detail).
      starts[0] = 0;
      const HOLD0_CTX = HOLD_CTX + 0.4;
      if (VIS[0]) VIS[0].enter(P[0], tl, 0.1);
      detail(0, HOLD0_CTX);
      swapStarts[0] = HOLD0_CTX;
      fullStarts[0] = HOLD0_CTX + SWAP;
      ctxMids[0] = HOLD0_CTX / 2;
      const full0End = fullStarts[0] + HOLD_FULL;
      fullMids[0] = (fullStarts[0] + full0End) / 2;
      let cursor = full0End;

      for (let i = 1; i < P.length; i++) {
        exit(i - 1, cursor);
        cursor += EXIT + GAP; // scroll cut: old card fully out before next enters
        starts[i] = cursor;
        enter(i, cursor);
        cursor += ENTER;
        const ctxStart = cursor;
        cursor += HOLD_CTX; // read b1 untouched
        ctxMids[i] = (ctxStart + cursor) / 2;
        swapStarts[i] = cursor;
        detail(i, cursor);
        cursor += SWAP;
        fullStarts[i] = cursor;
        const fEnd = cursor + HOLD_FULL; // read complete untouched
        fullMids[i] = (cursor + fEnd) / 2;
        cursor = fEnd;
      }
      tl.to({}, { duration: RELEASE }, cursor);
      cursor += RELEASE;
      const total = tl.duration();

      // Snap only to readable rests. Last rest IS the end, so no pull-back dead zone.
      const rawSnaps = [];
      for (let i = 0; i < P.length; i++) {
        rawSnaps.push(ctxMids[i] / total);
        if (i < P.length - 1) rawSnaps.push(fullMids[i] / total);
      }
      rawSnaps.push(1);
      const snapPoints = rawSnaps.map(v => Math.max(0, Math.min(1, v)));
      const hudI = $('.dh-i', pin), hudP = $('.dh-p', pin), segs = $$('.seg i', pin);
      const spans = starts.map((s, i) => ((starts[i + 1] != null) ? starts[i + 1] : total) - s);

      ScrollTrigger.create({
        animation: tl, trigger: pin, pin: true, start: 'top top',
        end: () => '+=' + Math.round(P.length * 1.8 * innerHeight),
        scrub: 1, anticipatePin: 1, invalidateOnRefresh: true, fastScrollEnd: false,
        snap: {
          snapTo: snapPoints,
          duration: { min: 0.3, max: 0.65 },
          delay: 0.35,
          ease: 'power2.inOut'
        },
        onUpdate(self) {
          const t = self.progress * total;
          let i = 0;
          for (let k = 0; k < starts.length; k++) if (t >= starts[k] - .01) i = k;
          if (hudI) hudI.textContent = String(i + 1).padStart(2, '0');
          if (hudP) {
            if (t < starts[i] + ENTER) hudP.textContent = 'context';
            else if (t < swapStarts[i]) hudP.textContent = 'context';
            else if (t < fullStarts[i]) hudP.textContent = 'analysis';
            else hudP.textContent = 'complete';
          }
          segs.forEach((s, k) => {
            const v = k < i ? 1 : (k > i ? 0 : Math.max(0, Math.min(1, (t - starts[k]) / spans[k])));
            s.style.transform = 'scaleX(' + v + ')';
          });
        }
      });
    })();

    window.addEventListener('load', () => ScrollTrigger.refresh());
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  } else if (reduced) {
    document.documentElement.classList.add('reduced');
  }
})();
