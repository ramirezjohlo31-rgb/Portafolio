/* =========================================================
   PORTAFOLIO — JavaScript
   1. Modo oscuro / claro
   2. Navegación suave + menú activo
   3. Menú móvil (hamburguesa)
   4. Navbar con sombra al hacer scroll
   5. Formulario de contacto con validación
   ========================================================= */

(() => {
  'use strict';

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  /* ---------------------------------------------------------
     1. MODO OSCURO / CLARO
  --------------------------------------------------------- */
  const root = document.documentElement;
  const themeToggle = $('#theme-toggle');
  const STORAGE_KEY = 'portfolio-theme';

  const getSystemTheme = () =>
    window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';

  const applyTheme = (theme) => {
    root.classList.toggle('light-theme', theme === 'light');
    root.classList.toggle('dark-theme', theme !== 'light');
    if (themeToggle) {
      themeToggle.setAttribute('aria-pressed', String(theme === 'light'));
    }
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (_) { /* almacenamiento no disponible */ }
  };

  // Preferencia guardada > preferencia del sistema
  let savedTheme = null;
  try {
    savedTheme = localStorage.getItem(STORAGE_KEY);
  } catch (_) { /* ignorar */ }
  applyTheme(savedTheme || getSystemTheme());

  themeToggle?.addEventListener('click', () => {
    applyTheme(root.classList.contains('light-theme') ? 'dark' : 'light');
  });

  // Si el usuario cambia el tema del sistema en caliente
  window
    .matchMedia('(prefers-color-scheme: light)')
    .addEventListener('change', (e) => {
      let stored = null;
      try { stored = localStorage.getItem(STORAGE_KEY); } catch (_) {}
      if (!stored) applyTheme(e.matches ? 'light' : 'dark');
    });

  /* ---------------------------------------------------------
     2. NAVEGACIÓN SUAVE + MENÚ ACTIVO
  --------------------------------------------------------- */
  const navLinks = $$('.nav__link');

  const setActiveLink = (id) => {
    navLinks.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
    });
  };

  // Scroll suave con offset para compensar la navbar fija
  const smoothScroll = (target) => {
    const navbarHeight = $('#navbar')?.offsetHeight || 0;
    const top = target.getBoundingClientRect().top + window.scrollY - navbarHeight + 1;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (!id || !id.startsWith('#')) return;
      const target = $(id);
      if (!target) return;

      e.preventDefault();
      smoothScroll(target);
      setActiveLink(id.slice(1));
      closeMenu(); // cierra el menú móvil
      history.replaceState(null, '', id);
    });
  });

  // Menú activo según la sección visible (IntersectionObserver)
  const sections = $$('main section[id]');
  if ('IntersectionObserver' in window && sections.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((en) => en.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveLink(visible.target.id);
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: [0, 0.25, 0.5, 1] }
    );
    sections.forEach((section) => observer.observe(section));
  }

  // Scroll general (navbar con sombra + sección activa de respaldo)
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      $('#navbar')?.classList.toggle('scrolled', window.scrollY > 20);
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------------------------------------------------
     3. MENÚ MÓVIL (HAMBURGUESA)
  --------------------------------------------------------- */
  const burger = $('#nav-burger');
  const menu = $('#nav-menu');

  const closeMenu = () => {
    menu?.classList.remove('open');
    burger?.classList.remove('open');
    burger?.setAttribute('aria-expanded', 'false');
    burger?.setAttribute('aria-label', 'Abrir menú de navegación');
  };

  const toggleMenu = () => {
    const isOpen = menu?.classList.toggle('open');
    burger?.classList.toggle('open', isOpen);
    burger?.setAttribute('aria-expanded', String(!!isOpen));
    burger?.setAttribute('aria-label', isOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación');
  };

  burger?.addEventListener('click', toggleMenu);

  // Cerrar al pulsar fuera del menú o con la tecla Escape
  document.addEventListener('click', (e) => {
    if (!menu?.classList.contains('open')) return;
    if (menu.contains(e.target) || burger?.contains(e.target)) return;
    closeMenu();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  /* ---------------------------------------------------------
     4. FORMULARIO DE CONTACTO CON VALIDACIÓN
  --------------------------------------------------------- */
  const form = $('#contact-form');
  const status = $('#form-status');
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const validators = {
    name: (v) => (v.trim().length >= 2 ? '' : 'Por favor escribe tu nombre (mínimo 2 caracteres).'),
    email: (v) => (EMAIL_RE.test(v.trim()) ? '' : 'Introduce un email válido, por ejemplo: jtafre701@gmail.com'),
    message: (v) => (v.trim().length >= 10 ? '' : 'El mensaje debe tener al menos 10 caracteres.'),
  };

  const showFieldError = (field, message) => {
    const input = form.elements[field];
    const errorEl = $(`#${field}-error`);
    if (errorEl) errorEl.textContent = message;
    input?.classList.toggle('invalid', Boolean(message));
    input?.setAttribute('aria-invalid', String(Boolean(message)));
    return !message;
  };

  const validateField = (field) => {
    const input = form.elements[field];
    if (!input || !validators[field]) return true;
    return showFieldError(field, validators[field](input.value));
  };

  if (form) {
    // Validación en tiempo real al salir del campo
    Object.keys(validators).forEach((field) => {
      const input = form.elements[field];
      input?.addEventListener('blur', () => validateField(field));
      input?.addEventListener('input', () => {
        if (input.classList.contains('invalid')) validateField(field);
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const results = Object.keys(validators).map((f) => validateField(f));
      const isValid = results.every(Boolean);

      if (!isValid) {
        status.textContent = 'Revisa los campos marcados antes de enviar.';
        status.className = 'form__status form__status--error';
        form.querySelector('.invalid')?.focus();
        return;
      }

      // Sin backend: simulamos el envío
      const button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      button.textContent = 'Enviando...';
      status.textContent = '';
      status.className = 'form__status';

      setTimeout(() => {
        form.reset();
        Object.keys(validators).forEach((f) => showFieldError(f, ''));
        status.textContent = '¡Mensaje enviado! Gracias por escribir, te responderé pronto. ✅';
        status.className = 'form__status form__status--success';
        button.disabled = false;
        button.textContent = 'Enviar mensaje';
      }, 900);
    });
  }

  /* ---------------------------------------------------------
     5. AÑO ACTUAL EN EL FOOTER
  --------------------------------------------------------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
