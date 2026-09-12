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

const raiz = __dirname;
const dirPartials = path.join(raiz, 'src', 'partials');
const dirPaginas = path.join(raiz, 'src', 'pages');
const dirAssets = path.join(raiz, 'src', 'assets');
const dirImg = path.join(raiz, 'src', 'img');
const dirSalida = path.join(raiz, 'dist');

const leer = (...p) => fs.readFileSync(path.join(...p), 'utf8');

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
  const out = ['<main id="top">'];

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

  for (const archivo of paginas) {
    const { campos, contenido } = parsear(leer(dirPaginas, archivo));

    for (const requerido of ['title', 'description']) {
      if (!campos[requerido]) throw new Error(archivo + ': falta "' + requerido + '"');
    }

    const cabecera = head
      .split('{{title}}').join(campos.title)
      .split('{{description}}').join(campos.description);

    const pie = footer.split('{{whatsapp}}').join(WHATSAPP);

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
      pie,
      '</body>',
      '</html>',
      '',
    ].join('\n');

    fs.writeFileSync(path.join(dirSalida, archivo), salida, 'utf8');
    if (!silencioso) console.log('  dist/' + archivo.padEnd(16) + campos.title);
  }

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
