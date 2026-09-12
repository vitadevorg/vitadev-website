# Estado de la rama `fix/correcciones-base`

Correcciones sobre el sitio de VitaDev partiendo del commit inicial `90b02ef`.

## Hecho

### Unificación de CSS y JS (`7e8fc70`)

Los ~400 renglones de CSS estaban duplicados en los 8 archivos HTML. Entre las
7 subpáginas eran byte a byte idénticos; `index.html` solo se diferenciaba por
16 renglones (las reglas `pulse-dot`, que no usa).

- CSS movido a `assets/styles.css` (405 renglones, una sola copia).
- JS del menú móvil movido a `assets/app.js`, cargado con `defer`.
- El HTML pasó de **4.438 a 1.172 renglones**.

Cambiar un color de marca ahora es un archivo en vez de ocho.

### Encabezados de primer nivel (`7e8fc70`)

7 de las 8 páginas no tenían `<h1>`: arrancaban directo en `<h2>`. Solo
`index.html` tenía uno. Google y los lectores de pantalla toman el `h1` como
el título real de la página.

Se convirtió el encabezado principal de cada subpágina a `<h1>`. Para que el
diseño no cambiara, se midió en el navegador el tamaño renderizado previo y se
agregaron los selectores correspondientes:

| Contexto            | Páginas                                            | Tamaño |
|---------------------|----------------------------------------------------|--------|
| `.section-head h1`  | calidad, conocenos, elegirnos, proyectos, seguridad | 34px  |
| `.contact-info h1`  | contacto                                           | 32px   |
| `.careers h1`       | trabajo                                            | 24px   |

Verificado página por página después del cambio: los tamaños coinciden
exactamente con los originales, incluido el blanco del título de `seguridad`
sobre fondo oscuro.

### Metadatos (`7e8fc70`)

Ninguna página tenía favicon, Open Graph ni Twitter Card. Al compartir un link
por WhatsApp o LinkedIn salía sin miniatura ni descripción.

- `favicon`, `og:*` y `twitter:*` en las 8 páginas, reusando el `title` y
  `description` que ya existían.
- Agregado el `preconnect` faltante a `fonts.gstatic.com` con `crossorigin`
  (estaba solo el de `fonts.googleapis.com`).

### Enlaces y formulario (`7e8fc70`, `e2d533c`)

- El ícono de Instagram apuntaba a `href="#"`. Ahora va a
  `https://www.instagram.com/vitadev3/` con `target="_blank"` y
  `rel="noopener noreferrer"`.
- Agregado `name` a los tres campos del formulario de contacto (`nombre`,
  `email`, `mensaje`). Es requisito para que puedan enviarse.

## Falta

### 1. El formulario de contacto no envía nada (prioridad alta)

En `contacto.html`:

```html
<form onsubmit="event.preventDefault(); alert('¡Gracias! Te contactaremos a la brevedad.');">
```

No tiene `action`, ni `method`, ni un `fetch`. La persona escribe, le aparece
"Te contactaremos a la brevedad" y el mensaje se pierde. **No falla
visiblemente: finge que funcionó.** Es el problema más grave que queda.

Falta decidir el destino. Opciones:

- Un servicio tipo Formspree o Formsubmit (rápido, sin backend propio).
- Un endpoint propio, si va a haber backend.
- `mailto:` como puente, que abre el cliente de correo del visitante.

Los campos ya tienen `name`, así que una vez definido el destino el cambio es
mínimo.

### 2. LinkedIn sigue en `href="#"`

El ícono del footer, en las 8 páginas, sigue siendo un enlace muerto. Falta la
URL de la cuenta.

### 3. `canonical` y `og:url` absolutos

No se agregaron porque requieren el dominio real de producción, que todavía no
está definido. Por el mismo motivo `og:image` quedó con ruta relativa
(`./vitadev-logo.png`); la mayoría de los scrapers la resuelven, pero la
especificación pide URL absoluta.

### 4. Favicon pesado

Hoy el favicon es `vitadev-logo.png`: 431x355px y 60 KB para un ícono que se
muestra a 32px. Convendría generar un archivo dedicado y chico.

### 5. Logos sin versión vectorial

`vitadev-logo.png` (431x355) y `samsa-logo.png` (356x347) son mapas de bits de
resolución baja. Se ven bien en web al tamaño actual, pero se pixelan si se
agrandan y no sirven para impresión. Si aparece el original en `.svg` o `.ai`,
conviene reemplazarlos.
