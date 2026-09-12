# Frontend VitaDev

Sitio institucional de VitaDev. HTML, CSS y JavaScript sin frameworks.

## Importante: no editar `dist/`

Todo lo que hay en `dist/` **es generado**. El build borra esa carpeta completa
y la vuelve a crear en cada corrida, así que cualquier cambio hecho ahí se
pierde. Por eso `dist/` no se versiona: el repositorio guarda una sola copia de
cada cosa.

Lo que se edita está siempre en `src/`.

## Estructura

```
src/
  partials/
    head.html          metadatos, fuentes y link al CSS
    header.html        barra superior y menú
    footer.html        pie de página y <script>
    breadcrumb.html    la miga de pan de las subpáginas
    cta.html           la banda de "Hablemos de tu proyecto"
  pages/
    index.html         metadatos + contenido propio de cada página
    ...                (uno por página, 8 en total)
  assets/
    styles.css         todo el CSS del sitio
    app.js             menú móvil
  img/
    vitadev-logo.png
    samsa-logo.png

build.js               arma dist/ a partir de src/
construir.cmd          doble clic: construye una vez
desarrollar.cmd        doble clic: reconstruye al guardar
dist/                  sitio publicable (generado, no versionado)
```

Cada parte del sitio está escrita **una sola vez**. El header vive únicamente
en `src/partials/header.html`, y el build lo inserta en las 8 páginas. Lo mismo
con el `<main>`, la miga de pan y la banda de CTA: las páginas solo declaran su
texto, no repiten el armado.

## Construir

No necesita `npm install`: usa solo Node, sin dependencias.

**Mientras trabajás** (recomendado): doble clic en `desarrollar.cmd`, o

```bash
node build.js --watch
```

Queda escuchando `src/`. Guardás `header.html` y las 8 páginas se regeneran
solas, sin correr nada a mano. Dejá la ventana abierta mientras editás, y
cerrala al terminar: si queda un watch viejo corriendo, sigue reescribiendo
`dist/` por atrás.

**Una sola vez** (antes de publicar): doble clic en `construir.cmd`, o

```bash
node build.js
```

## Ver el sitio

Construí primero, y después abrí `dist/index.html` en el navegador. Si preferís
por HTTP:

```bash
npx serve dist -l 4173
```

## Publicar

Lo que se publica es el contenido de `dist/`, no la raíz del repositorio.
Construís y subís esa carpeta al hosting.

Como `dist/` no está versionada, si en algún momento usan GitHub Pages hay que
generar el sitio en un workflow de GitHub Actions en vez de servir el repo tal
cual.

## Cómo agregar una página

1. Creá `src/pages/mi-pagina.html` con este encabezado:

   ```html
   <!--
   title: Mi página — VitaDev
   description: Descripción para Google y para las redes.
   activo: proyectos.html
   breadcrumb: Mi página
   cta_titulo: ¿Charlamos?
   cta_texto: Una línea invitando a escribirnos.
   -->
   ```

   | Campo | Qué hace |
   |---|---|
   | `title` | obligatorio. Va al `<title>` y a las etiquetas sociales. |
   | `description` | obligatorio. Idem, para Google y las redes. |
   | `activo` | el `href` del ítem del menú que se marca como actual. Vacío si la página no está en el menú. Si el `href` no existe en `header.html`, el build falla avisando. |
   | `breadcrumb` | el texto después de "Inicio /". Vacío y no se dibuja la miga de pan. |
   | `cta_titulo` y `cta_texto` | la banda de cierre. Los dos o ninguno; si va uno solo, el build falla. |

2. Debajo del encabezado va el contenido: solo las `<section>` propias de la
   página. El `<main>`, la miga de pan y la banda de CTA los pone el build.

3. Corré el build, o dejá el watch corriendo y se genera sola.

## Por qué hay un build

El header y el footer estaban copiados en los 8 archivos, unos 500 renglones
duplicados, y el CSS completo otras 8 veces. Cada cambio del menú costaba 8
ediciones, y alcanzaba con olvidar una para que las páginas quedaran
desincronizadas. Pasó de verdad: el número de WhatsApp del footer se actualizó
en una sola página y las otras siete quedaron con un placeholder.

HTML puro no tiene forma de incluir un archivo en otro. El build resuelve eso
sin agregar dependencias y sin cambiar la naturaleza del sitio: la salida sigue
siendo HTML estático plano.
