(() => {
  'use strict';

  /* ---------------------------------------------------------
     Datos de sabores
  --------------------------------------------------------- */
  const FLAVORS = [
    {
      key: 'fresa',
      name: 'Fresa',
      desc: 'Una oleada de fresas silvestres maduras con un toque efervescente. Dulce, intensa y adictiva.',
      tags: ['Sabor natural', 'Efecto inmediato', 'Edición neón'],
    },
    {
      key: 'maracuya',
      name: 'Maracuyá',
      desc: 'Explosión tropical de maracuyá con notas cítricas. Exótica, vibrante y llena de energía.',
      tags: ['Toque tropical', 'Alta rotación', 'Edición neón'],
    },
    {
      key: 'limon',
      name: 'Limón',
      desc: 'Frescura cítrica pura con un golpe de energía instantáneo. Ácida, limpia y revitalizante.',
      tags: ['Ultra fresco', 'Sin azúcar', 'Edición neón'],
    },
  ];

  /* ---------------------------------------------------------
     Motor de rotación: balanceo continuo (idle) + giro completo
     al cambiar de sabor. El giro se suma como un offset aditivo
     que siempre vuelve a 0 (360deg), así nunca hay salto visual.
  --------------------------------------------------------- */
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function createRotator(canEl, { swayAmplitude = 22, swaySpeed = 0.35, onFrame = null } = {}) {
    const s = {
      phase: Math.random() * Math.PI * 2,
      spinning: false,
      spinDir: 1,
      spinStart: 0,
      duration: 1200,
      swapped: false,
      onSwap: null,
    };

    function frame(dt, now) {
      const t = now / 1000;
      const sway = swayAmplitude * Math.sin(t * swaySpeed + s.phase);
      let spinOffset = 0;

      if (s.spinning) {
        const p = Math.min(1, (now - s.spinStart) / s.duration);
        const eased = easeInOutCubic(p);
        spinOffset = eased * 360 * s.spinDir;
        if (!s.swapped && p >= 0.5) {
          s.swapped = true;
          if (s.onSwap) s.onSwap();
        }
        if (p >= 1) s.spinning = false;
      }

      const angle = sway + spinOffset;
      canEl.style.transform = `rotateY(${angle}deg)`;
      if (onFrame) onFrame(angle);
    }

    function spin(directionSign, onSwap) {
      if (s.spinning) return false;
      s.spinning = true;
      s.swapped = false;
      s.spinDir = directionSign;
      s.onSwap = onSwap;
      s.spinStart = performance.now();
      return true;
    }

    return { frame, spin, state: s };
  }

  const rotators = [];
  let lastTime = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    for (const r of rotators) r.frame(dt, now);
    requestAnimationFrame(loop);
  }

  /* ---------------------------------------------------------
     Init: lata interactiva de sabores
  --------------------------------------------------------- */
  const flavorCan = document.getElementById('flavorCan');
  let flavorRotator = null;
  let currentIndex = 0;

  if (flavorCan) {
    flavorRotator = createRotator(flavorCan, { swayAmplitude: 24, swaySpeed: 0.32 });
    rotators.push(flavorRotator);

    const canLabelText = document.getElementById('canLabelText');
    const nameEl = document.getElementById('flavorName');
    const descEl = document.getElementById('flavorDesc');
    const tagsEl = document.getElementById('flavorTags');
    const indexEl = document.getElementById('flavorIndex');
    const dotsEl = document.querySelectorAll('#dots .dot');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const stageEl = document.querySelector('.stage-carousel');

    function applyFlavor(index) {
      currentIndex = index;
      const f = FLAVORS[index];
      document.body.dataset.flavor = f.key;
      canLabelText.textContent = f.name.toUpperCase();

      nameEl.textContent = f.name;
      descEl.textContent = f.desc;
      tagsEl.innerHTML = f.tags.map((t) => `<li>${t}</li>`).join('');
      indexEl.textContent = String(index + 1).padStart(2, '0') + ' / 03';

      [nameEl, descEl, tagsEl, indexEl].forEach((el) => {
        el.classList.remove('fade-swap');
        // eslint-disable-next-line no-unused-expressions
        void el.offsetWidth;
        el.classList.add('fade-swap');
      });

      dotsEl.forEach((d, i) => d.classList.toggle('is-active', i === index));
    }

    function goTo(dir) {
      const nextIndex = (currentIndex + dir + FLAVORS.length) % FLAVORS.length;
      flavorRotator.spin(dir, () => applyFlavor(nextIndex));
    }

    prevBtn.addEventListener('click', () => goTo(-1));
    nextBtn.addEventListener('click', () => goTo(1));

    dotsEl.forEach((dot) => {
      dot.addEventListener('click', () => {
        const target = Number(dot.dataset.index);
        if (target === currentIndex) return;
        const forwardDist = (target - currentIndex + FLAVORS.length) % FLAVORS.length;
        const dir = forwardDist === 1 ? 1 : -1;
        goTo(dir);
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') goTo(-1);
      if (e.key === 'ArrowRight') goTo(1);
    });

    let touchX = null;
    stageEl.addEventListener(
      'touchstart',
      (e) => {
        touchX = e.touches[0].clientX;
      },
      { passive: true }
    );
    stageEl.addEventListener(
      'touchend',
      (e) => {
        if (touchX === null) return;
        const dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 40) goTo(dx > 0 ? -1 : 1);
        touchX = null;
      },
      { passive: true }
    );
  }

  requestAnimationFrame(loop);

  /* ---------------------------------------------------------
     Partículas de fondo
  --------------------------------------------------------- */
  const particlesEl = document.getElementById('particles');
  if (particlesEl) {
    const count = window.innerWidth < 640 ? 16 : 30;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const size = 3 + Math.random() * 6;
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.left = Math.random() * 100 + '%';
      p.style.setProperty('--drift', Math.round((Math.random() - 0.5) * 80) + 'px');
      const duration = 9 + Math.random() * 12;
      p.style.animationDuration = duration + 's';
      p.style.animationDelay = -Math.random() * duration + 's';
      particlesEl.appendChild(p);
    }
  }

  /* ---------------------------------------------------------
     Menú móvil
  --------------------------------------------------------- */
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
    navLinks.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => {
        navLinks.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      })
    );
  }
})();
