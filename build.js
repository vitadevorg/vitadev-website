/*
 * build.js — genera el sitio publicable en dist/ a partir de src/
 *
 * Cada parte del sitio se escribe UNA sola vez en src/ y el build la
 * combina en las paginas finales. Antes el header y el footer estaban
 * copiados en los 8 HTML y cada cambio habia que hacerlo 8 veces.
 *
 * Uso:  node build.js            construye una vez
 *       node build.js --watch    queda escuchando y reconstruye al guardar
 *
 * Entrada:  src/partials/  src/pages/  src/assets/  src/img/
 * Salida:   dist/  (se regenera completa; no se versiona)
 *
 * No tiene dependencias: solo Node. La salida es HTML estatico plano.
 */

const fs = require('fs');
const path = require('path');

// TODO: confirmar el numero real.
const WHATSAPP = '5493863409588';
const EMAIL = 'vitadev.org@gmail.com';

// Mensajes que ya vienen escritos al abrir WhatsApp o el correo desde el
// sitio, para que la persona no arranque de cero. Se editan solo aca.
const MENSAJE_WHATSAPP =
  'Hola VitaDev, quiero hacer una consulta sobre un sistema para mi institución. Mi nombre es ';
const ASUNTO_CONTACTO = 'Consulta desde el sitio web';
const CUERPO_CONTACTO = [
  'Hola VitaDev,',
  '',
  'Quiero hacer una consulta sobre un sistema para mi institución.',
  '',
  'Nombre:',
  'Institución:',
  'Teléfono:',
  '',
  'Consulta:',
  '',
].join('\n');
const ASUNTO_CV = 'Quiero sumarme a VitaDev';
const CUERPO_CV = [
  'Hola VitaDev,',
  '',
  'Me interesa sumarme al equipo. Adjunto mi CV.',
  '',
  'Nombre:',
  'Perfil o rol:',
  'Portfolio o LinkedIn:',
  '',
].join('\n');

/* Arma un enlace mailto: con asunto y cuerpo. El & va como &amp; porque el
   enlace termina dentro de un href. */
const mailto = (asunto, cuerpo) =>
  'mailto:' + EMAIL +
  '?subject=' + encodeURIComponent(asunto) +
  '&amp;body=' + encodeURIComponent(cuerpo);

const WHATSAPP_URL = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(MENSAJE_WHATSAPP);
const MAILTO_CONTACTO = mailto(ASUNTO_CONTACTO, CUERPO_CONTACTO);
const MAILTO_CV = mailto(ASUNTO_CV, CUERPO_CV);

// Direccion publica del sitio, sin barra final. Se usa en canonical, og:url,
// og:image, sitemap.xml y robots.txt.
const SITIO = 'https://vitadev-website.vercel.app';

// Formulario de contacto: el codigo que da Formspree, lo que va despues de
// /f/ en https://formspree.io/f/xxxxxxxx. Vacio, el formulario no finge que
// envia: le avisa a la persona y le ofrece el email.
const FORMSPREE_ID = 'xnpnolwv';
const FORMSPREE_URL = FORMSPREE_ID ? 'https://formspree.io/f/' + FORMSPREE_ID : '';

const raiz = __dirname;
const dirPartials = path.join(raiz, 'src', 'partials');
const dirPaginas = path.join(raiz, 'src', 'pages');
const dirAssets = path.join(raiz, 'src', 'assets');
const dirImg = path.join(raiz, 'src', 'img');
const dirSalida = path.join(raiz, 'dist');

const leer = (...p) => fs.readFileSync(path.join(...p), 'utf8');

/* Escapa texto para meterlo en HTML, incluso dentro de un atributo
   (title y description van a content="..."). */
const escapar = (t) =>
  t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Separa el bloque de metadatos del contenido de la pagina. */
function parsear(texto) {
  const m = texto.match(/^<!--\r?\n([\s\S]*?)\r?\n-->\r?\n?/);
  if (!m) throw new Error('falta el bloque de metadatos');
  const campos = {};
  for (const linea of m[1].split(/\r?\n/)) {
    const i = linea.indexOf(':');
    if (i > 0) campos[linea.slice(0, i).trim()] = linea.slice(i + 1).trim();
  }
  return { campos, contenido: texto.slice(m[0].length).trimEnd() };
}

/* Marca como activo el enlace del nav cuyo href coincide con la pagina. */
function marcarActivo(html, href) {
  if (!href) return html;
  const busca = '<a href="' + href + '">';
  if (!html.includes(busca)) {
    throw new Error('activo: "' + href + '" no existe en header.html');
  }
  return html.replace(busca, '<a href="' + href + '" class="active">');
}

/* Vacia dist/ sin salirse de la carpeta del proyecto. */
function limpiarSalida() {
  if (path.dirname(dirSalida) !== raiz || path.basename(dirSalida) !== 'dist') {
    throw new Error('dirSalida inesperado, no se borra nada');
  }
  fs.rmSync(dirSalida, { recursive: true, force: true });
  fs.mkdirSync(dirSalida, { recursive: true });
}

/* Copia una carpeta de src/ dentro de dist/ con el mismo nombre. */
function copiar(origen, nombre) {
  if (!fs.existsSync(origen)) return 0;
  const destino = path.join(dirSalida, nombre);
  fs.cpSync(origen, destino, { recursive: true });
  return fs.readdirSync(origen).length;
}

/* Envuelve el contenido en <main>, con breadcrumb y cta-band si la pagina
   los declara. Antes cada pagina repetia esas lineas. */
function envolverMain(contenido, campos, breadcrumb, cta) {
  const out = ['<main id="contenido">'];

  if (campos.breadcrumb) {
    out.push(breadcrumb.split('{{breadcrumb}}').join(campos.breadcrumb));
  }

  out.push(contenido, '');

  if (campos.cta_titulo || campos.cta_texto) {
    if (!campos.cta_titulo || !campos.cta_texto) {
      throw new Error('cta_titulo y cta_texto van juntos');
    }
    out.push(
      cta
        .split('{{cta_titulo}}').join(campos.cta_titulo)
        .split('{{cta_texto}}').join(campos.cta_texto),
      ''
    );
  }

  out.push('</main>');
  return out;
}

/* Genera el sitio completo en dist/. */
function construir({ silencioso = false } = {}) {
  // se leen en cada corrida para que --watch tome los cambios
  const head = leer(dirPartials, 'head.html').trimEnd();
  const header = leer(dirPartials, 'header.html').trimEnd();
  const footer = leer(dirPartials, 'footer.html').trimEnd();
  const breadcrumb = leer(dirPartials, 'breadcrumb.html').trimEnd();
  const cta = leer(dirPartials, 'cta.html').trimEnd();

  const paginas = fs.readdirSync(dirPaginas).filter((f) => f.endsWith('.html')).sort();
  if (paginas.length === 0) throw new Error('no hay paginas en src/pages/');

  limpiarSalida();

  const urls = [];
  for (const archivo of paginas) {
    const { campos, contenido } = parsear(leer(dirPaginas, archivo));

    for (const requerido of ['title', 'description']) {
      if (!campos[requerido]) throw new Error(archivo + ': falta "' + requerido + '"');
    }

    // los metadatos son texto: un "&" o una comilla no deben romper el HTML.
    // activo queda sin tocar porque se compara contra el href del header.
    for (const clave of Object.keys(campos)) {
      if (clave !== 'activo') campos[clave] = escapar(campos[clave]);
    }

    // la home se publica como la raiz del dominio, no como /index.html
    const url = SITIO + '/' + (archivo === 'index.html' ? '' : archivo);
    urls.push(url);

    const cabecera = head
      .split('{{title}}').join(campos.title)
      .split('{{description}}').join(campos.description)
      .split('{{url}}').join(url);

    const salida = [
      '<!DOCTYPE html>',
      '<!-- ARCHIVO GENERADO por build.js. No editar: dist/ se borra en cada build.',
      '     El contenido de esta pagina esta en src/pages/' + archivo,
      '     El header y el footer, en src/partials/ -->',
      '<html lang="es">',
      '<head>',
      cabecera,
      '</head>',
      '<body>',
      marcarActivo(header, campos.activo),
      ...envolverMain(contenido, campos, breadcrumb, cta),
      footer,
      '</body>',
      '</html>',
      '',
    ]
      .join('\n')
      // valores globales: pueden aparecer en cualquier parcial o pagina
      .split('{{sitio}}').join(SITIO)
      .split('{{whatsapp_url}}').join(WHATSAPP_URL)
      .split('{{mailto_contacto}}').join(MAILTO_CONTACTO)
      .split('{{mailto_cv}}').join(MAILTO_CV)
      .split('{{email}}').join(EMAIL)
      .split('{{formspree_url}}').join(FORMSPREE_URL)
      .split('{{anio}}').join(String(new Date().getFullYear()));

    // un {{marcador}} que llega a dist/ es un error de tipeo o un campo faltante
    const sobrante = salida.match(/\{\{\w+\}\}/);
    if (sobrante) throw new Error(archivo + ': quedo sin reemplazar ' + sobrante[0]);

    fs.writeFileSync(path.join(dirSalida, archivo), salida, 'utf8');
    if (!silencioso) console.log('  dist/' + archivo.padEnd(16) + campos.title);
  }

  // sitemap y robots para que Google encuentre todas las paginas
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((u) => '  <url><loc>' + u + '</loc></url>'),
    '</urlset>',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(dirSalida, 'sitemap.xml'), sitemap, 'utf8');
  fs.writeFileSync(
    path.join(dirSalida, 'robots.txt'),
    'User-agent: *\nAllow: /\n\nSitemap: ' + SITIO + '/sitemap.xml\n',
    'utf8'
  );

  const nAssets = copiar(dirAssets, 'assets');
  const nImg = copiar(dirImg, 'img');

  return { paginas: paginas.length, assets: nAssets, img: nImg };
}

const hora = () => new Date().toLocaleTimeString('es-AR');

/* Una corrida, capturando errores para no matar el watch. */
function correr(silencioso) {
  try {
    const r = construir({ silencioso });
    const resumen = r.paginas + ' paginas, ' + r.assets + ' assets, ' + r.img + ' imagenes -> dist/';
    console.log((silencioso ? '[' + hora() + '] ' : '\n') + resumen);
    if (!FORMSPREE_ID) {
      console.log('AVISO: FORMSPREE_ID vacio en build.js, el formulario de contacto no envia.');
    }
    return true;
  } catch (e) {
    console.error('[' + hora() + '] ERROR: ' + e.message);
    return false;
  }
}

if (process.argv.includes('--watch')) {
  correr(true);
  console.log('\nEscuchando src/. Guarda un archivo y se reconstruye solo.');
  console.log('Ctrl+C para salir.\n');

  let pendiente = null;
  const alCambiar = (etiqueta) => (_evento, archivo) => {
    // se agrupan los eventos: un guardado dispara varios
    clearTimeout(pendiente);
    pendiente = setTimeout(() => {
      console.log('cambio en ' + etiqueta + '/' + (archivo || ''));
      correr(true);
    }, 120);
  };

  for (const [dir, etiqueta] of [
    [dirPartials, 'src/partials'],
    [dirPaginas, 'src/pages'],
    [dirAssets, 'src/assets'],
    [dirImg, 'src/img'],
  ]) {
    if (fs.existsSync(dir)) fs.watch(dir, alCambiar(etiqueta));
  }
} else {
  if (!correr(false)) process.exit(1);
}
