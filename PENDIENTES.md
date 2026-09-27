# Pendientes del sitio

Lo que falta para dejar el sitio listo para publicar. Lo ya resuelto está en el
historial de git; acá queda solo lo abierto.

## 1. Confirmar el número de WhatsApp

Está en `build.js` (constante `WHATSAPP`) con un `TODO`. Se usa en el footer y
en la página de contacto. En el mismo archivo están los mensajes que se
precargan al abrir WhatsApp o el correo (`MENSAJE_WHATSAPP`, `CUERPO_CONTACTO`,
`CUERPO_CV`), por si quieren ajustar el texto.

## 2. Dominio propio

El sitio está publicado en Vercel, en `https://vitadev-website.vercel.app`, y
esa es hoy la dirección de `canonical`, `og:url`, `sitemap.xml` y `robots.txt`
(constante `SITIO` en `build.js`). `vitadev.com.ar` ya está registrado por
otra persona. Si consiguen un dominio propio, se conecta en Vercel y se cambia
`SITIO`.

## 3. Imagen para compartir en redes

`og:image` usa por ahora el logo; lo ideal es una imagen propia de 1200x630
para que la miniatura se vea bien en WhatsApp, LinkedIn y Facebook.

## 4. Logos sin versión vectorial

`vitadev-logo.png` (431x355) y `samsa-logo.png` (356x347) son mapas de bits de
resolución baja, con fondo blanco opaco. Si aparece el original en `.svg` o
`.ai`, conviene reemplazarlos. El favicon (`favicon-32.png`) y el
`apple-touch-icon.png` se generaron a partir del PNG actual.

## 5. Proyectos: confirmar que son reales

`proyectos.html` presenta SAMSA, TurnoSalud, RecetaClara y MenteNOA como
sistemas ya implementados en instituciones del NOA. Si alguno es de ejemplo,
hay que aclararlo o sacarlo antes de publicar.

## 6. Opcionales

- Página 404.
- Datos estructurados de organización (JSON-LD).
- Evaluar sacar la tipografía Lora (solo la usa el footer) para ahorrar una
  descarga; implica un cambio visual.
