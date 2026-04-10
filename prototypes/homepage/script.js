// ── Chaos Icons Animation ────────────────────────
(function () {
  const chaosArea = document.getElementById('chaosArea');
  if (!chaosArea) return;

  const icons = Array.from(chaosArea.querySelectorAll('.chaos-icon'));
  const areaRect = () => chaosArea.getBoundingClientRect();

  let mouseX = -1000;
  let mouseY = -1000;

  chaosArea.addEventListener('mousemove', (e) => {
    const rect = areaRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });

  chaosArea.addEventListener('mouseleave', () => {
    mouseX = -1000;
    mouseY = -1000;
  });

  const ICON_SIZE = 44;
  const REPEL_RADIUS = 100;
  const REPEL_STRENGTH = 3;

  // Initialize icon positions and velocities
  const state = icons.map(() => {
    const rect = areaRect();
    const maxW = rect.width - ICON_SIZE;
    const maxH = rect.height - ICON_SIZE;
    return {
      x: Math.random() * maxW,
      y: Math.random() * maxH,
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 1.2,
      rotation: Math.random() * 20 - 10,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      scalePhase: Math.random() * Math.PI * 2,
    };
  });

  function animate() {
    const rect = areaRect();
    const maxW = rect.width - ICON_SIZE;
    const maxH = rect.height - ICON_SIZE;

    state.forEach((s, i) => {
      // Mouse repulsion
      const centerX = s.x + ICON_SIZE / 2;
      const centerY = s.y + ICON_SIZE / 2;
      const dx = centerX - mouseX;
      const dy = centerY - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < REPEL_RADIUS && dist > 0) {
        const force = (REPEL_RADIUS - dist) / REPEL_RADIUS * REPEL_STRENGTH;
        s.vx += (dx / dist) * force;
        s.vy += (dy / dist) * force;
      }

      // Damping
      s.vx *= 0.98;
      s.vy *= 0.98;

      // Ensure minimum speed
      const speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
      if (speed < 0.3) {
        s.vx += (Math.random() - 0.5) * 0.2;
        s.vy += (Math.random() - 0.5) * 0.2;
      }

      // Cap speed
      if (speed > 4) {
        s.vx = (s.vx / speed) * 4;
        s.vy = (s.vy / speed) * 4;
      }

      // Move
      s.x += s.vx;
      s.y += s.vy;

      // Bounce off walls
      if (s.x <= 0) { s.x = 0; s.vx = Math.abs(s.vx); }
      if (s.x >= maxW) { s.x = maxW; s.vx = -Math.abs(s.vx); }
      if (s.y <= 0) { s.y = 0; s.vy = Math.abs(s.vy); }
      if (s.y >= maxH) { s.y = maxH; s.vy = -Math.abs(s.vy); }

      // Rotation
      s.rotation += s.rotationSpeed;

      // Scale pulse
      s.scalePhase += 0.015;
      const scale = 1 + Math.sin(s.scalePhase) * 0.06;

      // Apply
      icons[i].style.transform = `translate(${s.x}px, ${s.y}px) rotate(${s.rotation}deg) scale(${scale})`;
    });

    requestAnimationFrame(animate);
  }

  animate();
})();

// ── Navbar scroll ────────────────────────────────
(function () {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });
})();

// ── Scroll fade-in ───────────────────────────────
(function () {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.15 }
  );

  document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));
})();

// ── Pricing toggle ──────────────────────────────
(function () {
  const toggle = document.getElementById('billingToggle');
  const priceEl = document.getElementById('proPrice');
  if (!toggle || !priceEl) return;

  let yearly = false;

  toggle.addEventListener('click', () => {
    yearly = !yearly;
    toggle.classList.toggle('active', yearly);
    priceEl.innerHTML = yearly
      ? '$6<span>/mo</span>'
      : '$8<span>/mo</span>';
  });
})();

// ── Footer year ─────────────────────────────────
(function () {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
})();
