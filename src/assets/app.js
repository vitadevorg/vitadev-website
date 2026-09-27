/* VitaDev — menú móvil, animaciones y formulario de contacto, compartido por todas las páginas */

document.addEventListener('DOMContentLoaded', function () {
  iniciarMenu();
  iniciarAnimaciones();
  iniciarSombraHeader();
  iniciarFormulario();
});

/* Bloques que aparecen al entrar en pantalla. Mantener igual a la lista
   de "ANIMACIONES AL DESPLAZARSE" en styles.css. */
const SELECTOR_REVEAL = [
  '.section-head', '.trust-item', '.card', '.explore-card', '.proj-card',
  '.about-col', '.why-item', '.sec-item', '.quality-statement', '.pillar',
  '.careers > div', '.careers-list > div', '.contact-info', '.contact-form', '.cta-band',
].join(',');

function iniciarAnimaciones() {
  const raiz = document.documentElement;
  if (!raiz.classList.contains('js-reveal')) return;
  raiz.dataset.revealListo = '1';

  const observador = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (entrada) {
      if (!entrada.isIntersecting) return;
      const el = entrada.target;
      // en una grilla, cada tarjeta sale un poco despues de la anterior
      const hermanos = Array.prototype.filter.call(el.parentElement.children, function (h) {
        return h.matches(SELECTOR_REVEAL);
      });
      el.style.animationDelay = Math.min(hermanos.indexOf(el), 5) * 90 + 'ms';
      el.classList.add('is-visible');
      observador.unobserve(el);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });

  document.querySelectorAll(SELECTOR_REVEAL).forEach(function (el) {
    observador.observe(el);
  });
}

/* El header toma sombra apenas la página deja de estar arriba de todo. */
function iniciarSombraHeader() {
  const header = document.querySelector('header');
  if (!header) return;
  const actualizar = function () {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  actualizar();
  window.addEventListener('scroll', actualizar, { passive: true });
}

function iniciarMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const navlinks = document.querySelector('.navlinks');

  if (!toggle || !navlinks) return;

  function setOpen(open) {
    navlinks.classList.toggle('mobile-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  }

  const isOpen = function () {
    return navlinks.classList.contains('mobile-open');
  };

  toggle.addEventListener('click', function () {
    setOpen(!isOpen());
  });

  navlinks.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      setOpen(false);
    });
  });

  // Escape cierra y devuelve el foco al botón
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) {
      setOpen(false);
      toggle.focus();
    }
  });

  // un toque fuera del menú lo cierra
  document.addEventListener('click', function (e) {
    if (isOpen() && !navlinks.contains(e.target) && !toggle.contains(e.target)) {
      setOpen(false);
    }
  });
}

/* Envía el formulario de contacto a Formspree sin salir de la página.
   El destino lo pone build.js en el action; si está vacío, avisa en vez de
   fingir que envió. */
function iniciarFormulario() {
  const form = document.querySelector('.contact-form');
  if (!form) return;

  const estado = form.querySelector('.form-status');
  const boton = form.querySelector('button[type="submit"]');
  const textoBoton = boton.textContent;
  const email = form.dataset.email;
  // mailto con asunto y cuerpo ya escritos; lo arma build.js
  const mailto = form.dataset.mailto || 'mailto:' + email;

  function mostrar(tipo, mensaje, conEmail) {
    estado.className = 'form-status form-status--' + tipo;
    estado.textContent = mensaje;
    if (conEmail) {
      const link = document.createElement('a');
      link.href = mailto;
      link.textContent = email;
      estado.append(' ', link, '.');
    }
    estado.hidden = false;
  }

  // la validación la hace validar(), con mensajes propios; sin JS queda la
  // del navegador
  form.noValidate = true;
  form.querySelectorAll('input, textarea').forEach(function (campo) {
    campo.addEventListener('input', function () {
      limpiarError(campo);
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!validar(form)) {
      mostrar('error', 'Revisá los datos ingresados: hay campos incompletos o con errores.');
      return;
    }

    const destino = form.getAttribute('action');
    if (!destino) {
      mostrar('error', 'El formulario todavía no está habilitado. Escribinos a', true);
      return;
    }

    boton.disabled = true;
    boton.textContent = 'Enviando…';
    estado.hidden = true;

    fetch(destino, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' },
    })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        form.reset();
        mostrar('ok', '¡Gracias! Recibimos tu mensaje y te respondemos a la brevedad.');
      })
      .catch(function () {
        mostrar('error', 'No pudimos enviar el mensaje. Probá de nuevo o escribinos a', true);
      })
      .finally(function () {
        boton.disabled = false;
        boton.textContent = textoBoton;
      });
  });
}

/* Errores de tipeo frecuentes en el dominio del email. Ninguno es un dominio
   real de correo, así que se frena el envío y se sugiere el correcto. */
const DOMINIOS_MAL_ESCRITOS = {
  'gmial.com': 'gmail.com', 'gmal.com': 'gmail.com', 'gmai.com': 'gmail.com',
  'gamil.com': 'gmail.com', 'gmaill.com': 'gmail.com', 'gnail.com': 'gmail.com',
  'gmail.co': 'gmail.com', 'gmail.con': 'gmail.com', 'gmail.cm': 'gmail.com',
  'gmail.om': 'gmail.com', 'gmail': 'gmail.com',
  'hotmial.com': 'hotmail.com', 'hotmal.com': 'hotmail.com', 'hotmai.com': 'hotmail.com',
  'hotmail.con': 'hotmail.com', 'hotmail.co': 'hotmail.com', 'hotmail': 'hotmail.com',
  'outlok.com': 'outlook.com', 'outlook.con': 'outlook.com', 'outlook': 'outlook.com',
  'yaho.com': 'yahoo.com', 'yahoo.con': 'yahoo.com', 'yahoo': 'yahoo.com',
};

/* Devuelve el mensaje de error del campo, o '' si está bien. */
function errorDeCampo(campo) {
  const valor = campo.value.trim();

  if (campo.name === 'nombre') {
    return valor ? '' : 'Escribí tu nombre.';
  }

  if (campo.name === 'mensaje') {
    return valor ? '' : 'Contanos brevemente qué necesitás.';
  }

  if (campo.name === 'email') {
    if (!valor) return 'Escribí tu email.';
    // algo@dominio.ext, sin espacios
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor)) {
      const sugerido = sugerirEmail(valor);
      return sugerido
        ? 'Revisá el email: ¿quisiste decir ' + sugerido + '?'
        : 'Revisá el email: tiene que tener el formato nombre@dominio.com.';
    }
    const sugerido = sugerirEmail(valor);
    if (sugerido) return 'Revisá el email: ¿quisiste decir ' + sugerido + '?';
  }

  return '';
}

function sugerirEmail(valor) {
  const i = valor.lastIndexOf('@');
  if (i < 1) return '';
  const dominio = valor.slice(i + 1).toLowerCase();
  const correcto = DOMINIOS_MAL_ESCRITOS[dominio];
  return correcto ? valor.slice(0, i) + '@' + correcto : '';
}

/* Marca cada campo con error y lleva el foco al primero. */
function validar(form) {
  let primero = null;
  form.querySelectorAll('.field input, .field textarea').forEach(function (campo) {
    const mensaje = errorDeCampo(campo);
    if (mensaje) {
      marcarError(campo, mensaje);
      if (!primero) primero = campo;
    } else {
      limpiarError(campo);
    }
  });
  if (primero) primero.focus();
  return !primero;
}

function marcarError(campo, mensaje) {
  let aviso = document.getElementById(campo.id + '-error');
  if (!aviso) {
    aviso = document.createElement('p');
    aviso.id = campo.id + '-error';
    aviso.className = 'field-error';
    campo.insertAdjacentElement('afterend', aviso);
  }
  aviso.textContent = mensaje;
  campo.setAttribute('aria-invalid', 'true');
  campo.setAttribute('aria-describedby', aviso.id);
}

function limpiarError(campo) {
  const aviso = document.getElementById(campo.id + '-error');
  if (aviso) aviso.remove();
  campo.removeAttribute('aria-invalid');
  campo.removeAttribute('aria-describedby');
}
