/* ==========================================================================
   Bix Innovations — site interactions (no dependencies)
   ========================================================================== */
(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  /* ---------- Footer year ---------- */
  $$('[data-year]').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Mobile menu ---------- */
  const toggle = $('.nav-toggle');
  const menu = $('#menu');

  const setMenu = (open) => {
    root.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.inert = !open;
  };

  if (toggle && menu) {
    toggle.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
    $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && root.classList.contains('menu-open')) setMenu(false);
    });
    window.matchMedia('(min-width: 901px)').addEventListener('change', (e) => {
      if (e.matches) setMenu(false);
    });
  }

  /* ---------- Reveal on scroll ---------- */
  const revealIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        revealIO.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
  );
  $$('.reveal').forEach((el) => revealIO.observe(el));

  /* ---------- Active nav link ---------- */
  const navLinks = $$('.nav-links a[href^="#"]');
  const spyIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = '#' + entry.target.id;
        navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === id));
      });
    },
    { rootMargin: '-45% 0px -50% 0px' }
  );
  $$('main > section[id]').forEach((s) => spyIO.observe(s));

  /* ---------- Cursor spotlight on service cards ---------- */
  $$('[data-spotlight]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  /* ---------- Rotating hero word ---------- */
  const rotator = $('[data-rotate]');
  if (rotator && !reduceMotion) {
    const words = rotator.dataset.rotate.split('|');
    let index = 0;
    setInterval(() => {
      rotator.classList.add('is-out');
      setTimeout(() => {
        index = (index + 1) % words.length;
        rotator.textContent = words[index];
        rotator.classList.remove('is-out');
        rotator.classList.add('is-in');
        void rotator.offsetWidth; // commit the start position before animating in
        rotator.classList.remove('is-in');
      }, 450);
    }, 2800);
  }

  /* ---------- Terminal typing ---------- */
  const term = $('[data-terminal]');
  if (term && !reduceMotion) {
    const lines = $$('.t-line', term);
    const typed = lines.map((line) => {
      const el = $('.t-type', line);
      return el ? el.textContent : null;
    });

    lines.forEach((line) => {
      line.classList.add('is-hidden');
      const el = $('.t-type', line);
      if (el) el.textContent = '';
      const status = $('.t-status', line);
      if (status) status.dataset.final = status.textContent;
    });

    (async () => {
      await wait(1400);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        line.classList.remove('is-hidden');
        const typeEl = $('.t-type', line);
        const status = $('.t-status', line);

        if (typeEl) {
          for (const ch of typed[i]) {
            typeEl.textContent += ch;
            await wait(30 + Math.random() * 45);
          }
          await wait(420);
        } else if (status) {
          line.classList.add('pending');
          status.textContent = '···';
          await wait(380 + Math.random() * 380);
          status.textContent = status.dataset.final;
          line.classList.remove('pending');
          await wait(140);
        } else {
          await wait(260);
        }
      }
    })();
  }

  /* ---------- Interactive dot field behind the hero ---------- */
  const canvas = $('.hero-canvas');
  if (canvas && canvas.getContext) initField(canvas);

  function initField(cv) {
    const ctx = cv.getContext('2d');
    const host = cv.parentElement;
    const GAP = 28;
    const start = performance.now();
    const pointer = { x: 0, y: 0, tx: 0, ty: 0, inside: false };
    let w = 0;
    let h = 0;
    let dots = [];
    let raf = 0;
    let visible = true;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = host.clientWidth;
      h = host.clientHeight;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      dots = [];
      const cols = Math.floor(w / GAP) + 2;
      const rows = Math.floor(h / GAP) + 2;
      const ox = (w - (cols - 1) * GAP) / 2;
      const oy = (h - (rows - 1) * GAP) / 2;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) dots.push(ox + c * GAP, oy + r * GAP);
      }
      if (!pointer.x) {
        pointer.x = pointer.tx = w * 0.68;
        pointer.y = pointer.ty = h * 0.4;
      }
    }

    function draw(now) {
      const t = (now - start) / 1000;

      // When the cursor isn't over the hero, the light wanders on its own.
      if (!pointer.inside) {
        pointer.tx = w * (0.66 + 0.2 * Math.sin(t * 0.31));
        pointer.ty = h * (0.42 + 0.2 * Math.sin(t * 0.47 + 1.3));
      }
      pointer.x += (pointer.tx - pointer.x) * 0.07;
      pointer.y += (pointer.ty - pointer.y) * 0.07;

      const R = clamp(w * 0.2, 150, 300);
      const R2 = R * R;
      const hot = [];

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255,255,255,0.075)';
      ctx.beginPath();
      for (let i = 0; i < dots.length; i += 2) {
        const x = dots[i];
        const y = dots[i + 1];
        const dx = x - pointer.x;
        const dy = y - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < R2) {
          hot.push(x, y, dx, dy, d2);
        } else {
          ctx.rect(x - 0.6, y - 0.6, 1.2, 1.2);
        }
      }
      ctx.fill();

      for (let i = 0; i < hot.length; i += 5) {
        const d = Math.sqrt(hot[i + 4]);
        const k = 1 - d / R;
        const e = k * k * (3 - 2 * k);
        const push = e * 14;
        const x = hot[i] + (d ? hot[i + 2] / d : 0) * push;
        const y = hot[i + 1] + (d ? hot[i + 3] / d : 0) * push;
        const mix = clamp(x / w, 0, 1);
        const r = Math.round(109 + 67 * mix);
        const g = Math.round(124 + 9 * mix);
        ctx.fillStyle = `rgba(${r},${g},255,${0.12 + e * 0.85})`;
        ctx.beginPath();
        ctx.arc(x, y, 0.8 + e * 1.9, 0, Math.PI * 2);
        ctx.fill();
      }

      if (visible && !reduceMotion) raf = requestAnimationFrame(draw);
    }

    window.addEventListener(
      'pointermove',
      (e) => {
        if (e.pointerType !== 'mouse') return;
        const r = host.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        pointer.inside = x >= 0 && y >= 0 && x <= r.width && y <= r.height;
        if (pointer.inside) {
          pointer.tx = x;
          pointer.ty = y;
        }
      },
      { passive: true }
    );
    document.addEventListener('mouseleave', () => {
      pointer.inside = false;
    });

    new ResizeObserver(() => {
      resize();
      if (reduceMotion) draw(performance.now());
    }).observe(host);

    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible && !reduceMotion) raf = requestAnimationFrame(draw);
    }).observe(host);
  }

  /* ---------- Scroll-linked effects ---------- */
  const nav = $('#nav');
  const bar = $('.progress span');
  const statement = $('[data-words]');
  const words = statement && !reduceMotion ? splitWords(statement) : [];
  const processEl = $('.process');
  const steps = $$('.step');
  const cards = $$('.work-card');
  const stickyMQ = window.matchMedia('(min-width: 1025px) and (min-height: 760px)');

  function splitWords(el) {
    const out = [];
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(part));
              return;
            }
            const span = document.createElement('span');
            span.className = 'word';
            span.textContent = part;
            out.push(span);
            frag.appendChild(span);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          walk(child);
        }
      });
    };
    walk(el);
    el.classList.add('is-split');
    return out;
  }

  function onScroll() {
    const y = window.scrollY;
    const vh = window.innerHeight;

    nav.classList.toggle('scrolled', y > 20);

    const max = root.scrollHeight - vh;
    if (bar) bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

    // About statement lights up word by word
    if (words.length) {
      const r = statement.getBoundingClientRect();
      const p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.3), 0, 1);
      const lit = Math.round(p * words.length);
      words.forEach((word, i) => word.classList.toggle('on', i < lit));
    }

    // Process timeline fills as you scroll past it
    if (processEl) {
      const r = processEl.getBoundingClientRect();
      const p = clamp((vh * 0.8 - r.top) / Math.max(r.height, vh * 0.5), 0, 1);
      processEl.style.setProperty('--p', p.toFixed(3));
      const vertical = steps.length > 1 && steps[1].offsetTop > steps[0].offsetTop;
      steps.forEach((step, i) => {
        const at = vertical ? step.offsetTop / r.height : i / Math.max(steps.length - 1, 1);
        step.classList.toggle('on', p > 0 && p >= at - 0.001);
      });
    }

    // Stacked project cards: dim + shrink the one being covered
    cards.forEach((card, i) => {
      const next = cards[i + 1];
      let cover = 0;
      if (next && stickyMQ.matches) {
        const top = card.getBoundingClientRect().top;
        const bottom = top + card.offsetHeight;
        cover = clamp((bottom - next.getBoundingClientRect().top) / card.offsetHeight, 0, 1);
      }
      card.style.setProperty('--cover', cover.toFixed(3));
    });
  }

  let ticking = false;
  const requestTick = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      onScroll();
    });
  };
  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick);
  onScroll();

  /* ---------- Animated counters ---------- */
  const countIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        countIO.unobserve(entry.target);
        const el = entry.target;
        const target = parseFloat(el.dataset.count);
        const t0 = performance.now();
        const dur = 1400;
        const tick = (now) => {
          const t = clamp((now - t0) / dur, 0, 1);
          el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
          if (t < 1) requestAnimationFrame(tick);
        };
        el.textContent = '0';
        requestAnimationFrame(tick);
      });
    },
    { threshold: 0.6 }
  );
  if (!reduceMotion) $$('[data-count]').forEach((el) => countIO.observe(el));

  /* ---------- Pause SVG (SMIL) animations for reduced motion ---------- */
  if (reduceMotion) {
    $$('svg').forEach((svg) => svg.pauseAnimations && svg.pauseAnimations());
  }

  /* ---------- Contact form ----------
     Opens the visitor's email app with the enquiry pre-filled.
     To store submissions instead, replace the mailto block with e.g.:
       fetch('https://formspree.io/f/your-id', { method: 'POST', body: new FormData(form),
             headers: { Accept: 'application/json' } })                                  */
  const form = $('#contact-form');
  if (form) {
    const note = $('.form-note', form);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = String(data.get('name') || '').trim();
      const body = [
        `Name: ${name}`,
        `Email: ${data.get('email')}`,
        `Company: ${data.get('company') || '—'}`,
        `Interested in: ${data.getAll('services').join(', ') || '—'}`,
        `Stage: ${data.get('stage') || '—'}`,
        '',
        String(data.get('message') || '').trim(),
      ].join('\n');
      const subject = `New project enquiry — ${name}`;
      window.location.href = `mailto:${form.dataset.mailto}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      note.textContent = 'Thanks! Your email app should open with the message ready to send.';
      note.classList.add('ok');
    });
  }
})();
