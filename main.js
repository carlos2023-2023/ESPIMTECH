/**
 * ============================================================
 *  C&A PARTNERS — main.js
 *  Autor      : Webflow CO.
 *  Versión    : 1.0.0
 *  Descripción: Lógica interactiva del sitio corporativo.
 *
 *  ÍNDICE
 *  ─────────────────────────────────────────────────────────────
 *  1.  Módulo: Navbar — comportamiento al hacer scroll
 *  2.  Módulo: Navbar — cierre en mobile al seleccionar un link
 *  3.  Módulo: Animaciones de entrada (IntersectionObserver)
 *  4.  Módulo: Contador animado de estadísticas (countUp)
 *  5.  Módulo: Formulario de contacto — validación y envío
 *  6.  Módulo: Año dinámico en el footer
 *  7.  Init — punto de entrada principal
 * ============================================================
 */

'use strict'; // Modo estricto: previene errores silenciosos en JS


/* ============================================================
   1. MÓDULO: NAVBAR — Comportamiento al hacer scroll
   ─────────────────────────────────────────────────────────────
   Agrega la clase `.scrolled` al elemento <nav> cuando el
   usuario ha bajado más de 60px. El CSS usa esa clase para
   comprimir el padding y agregar una sombra sutil.
   ============================================================ */

/**
 * Inicializa el comportamiento "shrink on scroll" del navbar.
 * Usa un `requestAnimationFrame` para optimizar el rendimiento
 * y evitar que el handler de scroll bloquee el hilo principal.
 */
function initNavbarScroll() {
  const navbar = document.getElementById('mainNav');
  if (!navbar) return; // Salida segura si el elemento no existe

  const SCROLL_THRESHOLD = 60; // Píxeles antes de activar el shrink
  let ticking = false;          // Bandera de rAF para throttling

  window.addEventListener('scroll', () => {
    if (!ticking) {
      // Esperar al próximo frame disponible antes de actualizar el DOM
      requestAnimationFrame(() => {
        const scrolled = window.scrollY > SCROLL_THRESHOLD;
        navbar.classList.toggle('scrolled', scrolled);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true }); // passive:true mejora el rendimiento en scroll
}


/* ============================================================
   2. MÓDULO: NAVBAR — Cierre automático en mobile
   ─────────────────────────────────────────────────────────────
   En pantallas pequeñas, Bootstrap colapsa el menú en un
   dropdown. Este módulo cierra ese dropdown al hacer clic
   en cualquier link interno, evitando que el usuario tenga
   que cerrarlo manualmente.
   ============================================================ */

/**
 * Cierra el menú mobile de Bootstrap al hacer clic en un link.
 * Detecta el collapse mediante la clase Bootstrap `.show`.
 */
function initMobileMenuClose() {
  const navMenu   = document.getElementById('navMenu');
  const navToggle = document.querySelector('[data-bs-toggle="collapse"]');

  if (!navMenu || !navToggle) return;

  // Escucha clicks en todos los links del menú
  navMenu.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      // Solo actúa si el menú está abierto (clase `.show` de Bootstrap)
      if (navMenu.classList.contains('show')) {
        navToggle.click(); // Simula clic en el toggler para cerrar
      }
    });
  });
}


/* ============================================================
   3. MÓDULO: ANIMACIONES DE ENTRADA
   ─────────────────────────────────────────────────────────────
   Usa la API IntersectionObserver para detectar cuándo un
   elemento con [data-animate] entra en el viewport.
   Al entrar, agrega la clase `.animated` y respeta el delay
   definido en el atributo [data-delay] (en milisegundos).

   Esta técnica es más eficiente que escuchar el evento `scroll`
   porque el browser gestiona la observación de forma nativa y
   fuera del hilo principal.
   ============================================================ */

/**
 * Observa todos los elementos con el atributo `data-animate`
 * y los revela con su animación cuando entran al viewport.
 */
function initScrollAnimations() {
  // Seleccionar todos los elementos animables
  const animatables = document.querySelectorAll('[data-animate]');
  if (!animatables.length) return;

  /**
   * Callback del observer: se ejecuta cuando un elemento
   * cruza el umbral de visibilidad definido en `options`.
   *
   * @param {IntersectionObserverEntry[]} entries - Elementos observados
   * @param {IntersectionObserver} observer - La instancia del observer
   */
  const onIntersect = (entries, observer) => {
    entries.forEach(entry => {
      // Solo actuar si el elemento está entrando al viewport
      if (!entry.isIntersecting) return;

      const el    = entry.target;
      const delay = parseInt(el.dataset.delay, 10) || 0; // delay en ms

      // Aplica la clase con el retardo especificado
      setTimeout(() => {
        el.classList.add('animated');
      }, delay);

      // Dejar de observar el elemento una vez que se animó
      // (evita re-animar al hacer scroll hacia arriba)
      observer.unobserve(el);
    });
  };

  // Configuración del observer
  const options = {
    threshold:  0.12,  // El elemento debe ser 12% visible para disparar
    rootMargin: '0px', // Sin margen adicional respecto al viewport
  };

  const observer = new IntersectionObserver(onIntersect, options);

  // Registrar cada elemento animable
  animatables.forEach(el => observer.observe(el));
}


/* ============================================================
   4. MÓDULO: CONTADOR ANIMADO (countUp)
   ─────────────────────────────────────────────────────────────
   Cada elemento `.stat-number` tiene un atributo `data-target`
   con el número final. Cuando ese elemento entra en el viewport,
   el contador anima desde 0 hasta `data-target` en `DURATION` ms.

   Algoritmo: usa `requestAnimationFrame` para actualizar el
   número en cada frame, calculando el progreso según el tiempo
   transcurrido (easing lineal simple).
   ============================================================ */

/**
 * Anima un contador desde 0 hasta `target` en `duration` ms.
 *
 * @param {HTMLElement} el       - El elemento que muestra el número
 * @param {number}      target   - Valor final del contador
 * @param {number}      duration - Duración de la animación (ms)
 */
function animateCounter(el, target, duration) {
  let startTime = null; // Marca de tiempo del primer frame

  /**
   * Función de frame: se llama en cada repintado del browser.
   * @param {DOMHighResTimeStamp} timestamp - Tiempo actual (ms)
   */
  const step = (timestamp) => {
    // Guardar el tiempo de inicio en el primer frame
    if (!startTime) startTime = timestamp;

    const elapsed  = timestamp - startTime; // Tiempo transcurrido
    const progress = Math.min(elapsed / duration, 1); // 0 → 1

    // Calcular el valor actual (interpolación lineal)
    const current = Math.floor(progress * target);
    el.textContent = current.toLocaleString('es-CO'); // Formato con puntos

    // Continuar si no hemos llegado al final
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      // Asegurar que el valor final sea exactamente `target`
      el.textContent = target.toLocaleString('es-CO');
    }
  };

  requestAnimationFrame(step);
}

/**
 * Inicializa los contadores: los observa y los anima al entrar
 * en el viewport. Cada contador solo se anima una vez.
 */
function initCounters() {
  const ANIMATION_DURATION = 1800; // ms — duración del conteo animado
  const counters = document.querySelectorAll('.stat-number[data-target]');
  if (!counters.length) return;

  const onIntersect = (entries, observer) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const el     = entry.target;
      const target = parseInt(el.dataset.target, 10);

      if (!isNaN(target)) {
        animateCounter(el, target, ANIMATION_DURATION);
      }

      observer.unobserve(el); // Animar solo una vez
    });
  };

  const observer = new IntersectionObserver(onIntersect, {
    threshold: 0.5, // El contador debe ser 50% visible para disparar
  });

  counters.forEach(el => observer.observe(el));
}


/* ============================================================
   5. MÓDULO: FORMULARIO DE CONTACTO
   ─────────────────────────────────────────────────────────────
   Maneja la validación nativa HTML5 + feedback visual y
   simula un envío asíncrono con estado de carga en el botón.

   Flujo:
   1. El usuario hace clic en "Enviar".
   2. Se valida el formulario con la API de Constraint Validation.
   3. Si hay errores → se muestran los mensajes `.invalid-feedback`.
   4. Si es válido → el botón muestra "Enviando…" y se deshabilita.
   5. Después de 1.5s (simula la llamada al backend) → éxito.
   6. Se muestra el mensaje verde `.form-success`.
   ============================================================ */

/**
 * Inicializa la validación y el manejo de envío del formulario.
 */
function initContactForm() {
  const form       = document.getElementById('contactForm');
  const submitBtn  = document.getElementById('submitBtn');
  const successMsg = document.getElementById('formSuccess');

  if (!form || !submitBtn || !successMsg) return;

  // Textos del botón en cada estado
  const BTN_DEFAULT  = '<span class="btn-text">Enviar solicitud</span><i class="bi bi-send ms-2 btn-icon"></i>';
  const BTN_LOADING  = '<span class="btn-text">Enviando…</span><i class="bi bi-arrow-repeat ms-2 spin"></i>';
  const BTN_SENT     = '<span class="btn-text">¡Enviado!</span><i class="bi bi-check2 ms-2"></i>';

  /**
   * Muestra u oculta los mensajes de error nativos de HTML5.
   * Bootstrap usa la clase `.was-validated` para estilizar los campos.
   */
  const showValidationErrors = () => {
    form.classList.add('was-validated'); // Bootstrap activa los estilos
  };

  /**
   * Simula el envío al servidor.
   * En producción, reemplazar con un `fetch` real a tu backend o API.
   *
   * @returns {Promise<boolean>} Siempre resuelve como `true` en demo
   */
  const fakeSubmit = () => {
    return new Promise(resolve => {
      setTimeout(() => resolve(true), 1500); // Simula 1.5s de red
    });
  };

  /**
   * Maneja el evento `submit` del formulario.
   * @param {SubmitEvent} e
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // Evitar el submit nativo del browser

    // ── Validación HTML5 ─────────────────────────────────────
    if (!form.checkValidity()) {
      showValidationErrors();
      // Hacer scroll hasta el primer campo inválido
      const firstInvalid = form.querySelector(':invalid');
      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstInvalid.focus();
      }
      return; // Detener si hay errores
    }

    // ── Estado "Enviando" ────────────────────────────────────
    submitBtn.innerHTML  = BTN_LOADING;
    submitBtn.disabled   = true;
    successMsg.classList.remove('show'); // Ocultar mensaje previo si existía

    try {
      // ── Envío (simulado) ─────────────────────────────────
      await fakeSubmit();

      // ── Estado "Enviado" ─────────────────────────────────
      submitBtn.innerHTML = BTN_SENT;

      // Mostrar mensaje de éxito con animación CSS
      successMsg.classList.add('show');
      successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      // Resetear el formulario tras 3 segundos
      setTimeout(() => {
        form.reset();
        form.classList.remove('was-validated');
        submitBtn.innerHTML = BTN_DEFAULT;
        submitBtn.disabled  = false;
        successMsg.classList.remove('show');
      }, 4000);

    } catch (error) {
      // ── Estado "Error" (red o servidor) ──────────────────
      console.error('[C&A Partners] Error en el envío del formulario:', error);

      submitBtn.innerHTML = BTN_DEFAULT;
      submitBtn.disabled  = false;

      // En producción: mostrar un mensaje de error al usuario
      alert('Ocurrió un error al enviar el formulario. Por favor intenta de nuevo.');
    }
  };

  form.addEventListener('submit', handleSubmit);
}


/* ============================================================
   6. MÓDULO: AÑO DINÁMICO EN EL FOOTER
   ─────────────────────────────────────────────────────────────
   Actualiza automáticamente el año del copyright sin necesidad
   de editar el HTML cada 1 de enero.
   ============================================================ */

/**
 * Inserta el año actual en el elemento `#currentYear` del footer.
 */
function initCurrentYear() {
  const yearEl = document.getElementById('currentYear');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}


/* ============================================================
   7. INIT — Punto de entrada principal
   ─────────────────────────────────────────────────────────────
   Espera a que el DOM esté completamente cargado (DOMContentLoaded)
   antes de inicializar todos los módulos.
   Esto garantiza que todos los elementos del HTML están disponibles.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Comportamiento del navbar al hacer scroll
  initNavbarScroll();

  // 2. Cierre automático del menú mobile
  initMobileMenuClose();

  // 3. Animaciones de entrada basadas en scroll
  initScrollAnimations();

  // 4. Contadores animados en la sección de estadísticas
  initCounters();

  // 5. Validación y manejo del formulario de contacto
  initContactForm();

  // 6. Año dinámico en el footer
  initCurrentYear();

  // Log de confirmación en desarrollo (remover en producción)
  console.log('%cC&A Partners JS cargado ✓', 'color:#C9A84C; font-weight:bold;');
});
