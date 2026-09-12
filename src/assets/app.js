/* VitaDev — menú móvil, compartido por todas las páginas */

document.addEventListener('DOMContentLoaded', function () {
  const toggle = document.querySelector('.menu-toggle');
  const navlinks = document.querySelector('.navlinks');

  if (!toggle || !navlinks) return;

  toggle.addEventListener('click', function () {
    const open = navlinks.classList.toggle('mobile-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  navlinks.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      navlinks.classList.remove('mobile-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
});
