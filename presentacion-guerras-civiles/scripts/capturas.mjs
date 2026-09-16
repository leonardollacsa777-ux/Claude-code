/**
 * capturas.mjs — Revision automatica de la presentacion.
 *
 * Abre la presentacion en un navegador de verdad, recorre las 15 escenas
 * y guarda una captura de cada una en 1920x1080 y en 1366x768 (proyector).
 * Tambien recoge los errores de consola, para no descubrirlos el dia de la
 * exposicion.
 *
 * Es una herramienta opcional de desarrollo. Necesita Playwright:
 *     npm install -D playwright
 *     npx playwright install chromium
 * y luego:
 *     npm run capturas                  (usa http://localhost:5173)
 *     npm run capturas -- --url=...     (otra direccion)
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);

const URL_BASE = args.url || 'http://localhost:5173';
const SALIDA = args.salida || 'capturas';
const ESCENAS = args.escenas ? String(args.escenas).split(',').map(Number) : null;
const EJECUTABLE = args.chromium || process.env.CHROMIUM_PATH || undefined;

const PANTALLAS = [
  { nombre: '1920x1080', width: 1920, height: 1080 },
  { nombre: '1366x768', width: 1366, height: 768 },
];

const { chromium } = await import('playwright');

const navegador = await chromium.launch({
  executablePath: EJECUTABLE,
  args: [
    '--no-sandbox',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--disable-dev-shm-usage',
  ],
});

const problemas = [];
const informe = [];

for (const pantalla of PANTALLAS) {
  const carpeta = path.join(SALIDA, pantalla.nombre);
  await mkdir(carpeta, { recursive: true });

  const contexto = await navegador.newContext({
    viewport: { width: pantalla.width, height: pantalla.height },
    deviceScaleFactor: 1,
  });
  const pagina = await contexto.newPage();

  pagina.on('console', (m) => {
    if (m.type() === 'error') problemas.push(`[${pantalla.nombre}] consola: ${m.text()}`);
  });
  pagina.on('pageerror', (e) => problemas.push(`[${pantalla.nombre}] error: ${e.message}`));

  const lista = ESCENAS || Array.from({ length: 15 }, (_, i) => i + 1);

  for (const n of lista) {
    await pagina.goto(`${URL_BASE}/?escena=${n}&fps`, { waitUntil: 'load' });
    // Esperamos a que el mundo dibuje y el texto termine de aparecer.
    await pagina.waitForFunction(() => !!window.presentacion, null, { timeout: 20000 });
    await pagina.waitForTimeout(2600);

    const medidas = await pagina.evaluate(() => {
      const panel = document.querySelector('.panel');
      const barra = document.querySelector('#progreso');
      if (!panel) return { falta: true };
      const p = panel.getBoundingClientRect();
      const b = barra.getBoundingClientRect();
      const li = [...panel.querySelectorAll('.panel__puntos li')].map((e) => {
        const r = e.getBoundingClientRect();
        return { abajo: Math.round(r.bottom), texto: e.textContent.slice(0, 32) };
      });
      return {
        panel: { arriba: Math.round(p.top), abajo: Math.round(p.bottom), ancho: Math.round(p.width) },
        barraArriba: Math.round(b.top),
        desbordaAlto: p.bottom > window.innerHeight - 4 || p.top < 0,
        chocaConBarra: p.bottom > b.top + 2,
        recortado: panel.scrollHeight > panel.clientHeight + 2,
        ultimaVineta: li[li.length - 1] || null,
        fps: Number(document.getElementById('avisoFps')?.textContent?.split(' ')[0] || 0),
      };
    });

    if (medidas.falta) problemas.push(`[${pantalla.nombre}] escena ${n}: no se dibujo el panel de texto`);
    if (medidas.desbordaAlto) problemas.push(`[${pantalla.nombre}] escena ${n}: el panel se sale de la pantalla`);
    if (medidas.chocaConBarra) problemas.push(`[${pantalla.nombre}] escena ${n}: el panel choca con la barra de progreso`);
    if (medidas.recortado) problemas.push(`[${pantalla.nombre}] escena ${n}: el texto queda recortado dentro del panel`);

    informe.push({ pantalla: pantalla.nombre, escena: n, ...medidas });

    await pagina.screenshot({ path: path.join(carpeta, `escena-${String(n).padStart(2, '0')}.png`) });
  }

  await contexto.close();
}

await navegador.close();
await writeFile(path.join(SALIDA, 'informe.json'), JSON.stringify({ problemas, informe }, null, 2));

console.log(`\nCapturas guardadas en ${SALIDA}/`);
if (problemas.length) {
  console.log(`\n${problemas.length} PROBLEMA(S):`);
  for (const p of problemas) console.log('  - ' + p);
  process.exitCode = 1;
} else {
  console.log('\nSin problemas: el texto se lee y nada se superpone.');
}
