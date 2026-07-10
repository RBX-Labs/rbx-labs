const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.nav');
const reveals = document.querySelectorAll('.reveal');
const heroVisual = document.getElementById('heroVisual');

if (navToggle && nav) {
  navToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.14,
});

reveals.forEach((section) => observer.observe(section));

if (heroVisual) {
  let rafId = null;
  const tiltBounds = { x: 9, y: 6 };

  const handleMove = (event) => {
    const rect = heroVisual.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) - 0.5;
    const py = ((event.clientY - rect.top) / rect.height) - 0.5;

    if (rafId) {
      cancelAnimationFrame(rafId);
    }

    rafId = requestAnimationFrame(() => {
      heroVisual.querySelector('.dashboard-glow')?.style.setProperty(
        'transform',
        `perspective(1200px) rotateY(${px * tiltBounds.x}deg) rotateX(${-py * tiltBounds.y}deg) translateY(-4px)`,
      );
    });
  };

  const resetMove = () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    heroVisual.querySelector('.dashboard-glow')?.style.setProperty('transform', '');
  };

  heroVisual.addEventListener('mousemove', handleMove);
  heroVisual.addEventListener('mouseleave', resetMove);
}
