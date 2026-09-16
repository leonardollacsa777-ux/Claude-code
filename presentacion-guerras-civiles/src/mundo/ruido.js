/**
 * ruido.js — Ruido procedural (value noise + fbm).
 * Sirve para que las montanas no se vean geometricas y para pintar
 * la textura de pergamino. Todo generado por codigo: cero imagenes.
 */

// Generador pseudoaleatorio con semilla: el mapa sale IGUAL en toda computadora.
export function semilla(s) {
  let a = s >>> 0;
  return function () {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TAM = 256;
const tabla = new Float32Array(TAM * TAM);
{
  const rnd = semilla(20250916);
  for (let i = 0; i < tabla.length; i++) tabla[i] = rnd();
}

function valor(ix, iy) {
  return tabla[(iy & (TAM - 1)) * TAM + (ix & (TAM - 1))];
}

function suave(t) {
  return t * t * (3 - 2 * t);
}

/** Ruido de valor interpolado, devuelve 0..1 */
export function ruido2D(x, y) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = suave(x - ix);
  const fy = suave(y - iy);
  const a = valor(ix, iy);
  const b = valor(ix + 1, iy);
  const c = valor(ix, iy + 1);
  const d = valor(ix + 1, iy + 1);
  return a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy;
}

/** Varias octavas de ruido: da detalle de montana. Devuelve 0..1 */
export function fbm(x, y, octavas = 5, ganancia = 0.5, lacunaridad = 2.0) {
  let suma = 0;
  let amp = 1;
  let norm = 0;
  let fx = x;
  let fy = y;
  for (let i = 0; i < octavas; i++) {
    suma += ruido2D(fx, fy) * amp;
    norm += amp;
    amp *= ganancia;
    fx *= lacunaridad;
    fy *= lacunaridad;
  }
  return suma / norm;
}

/** Ruido "de cresta": genera filos afilados, ideal para picos nevados. */
export function crestas(x, y, octavas = 4) {
  let suma = 0;
  let amp = 1;
  let norm = 0;
  let fx = x;
  let fy = y;
  for (let i = 0; i < octavas; i++) {
    const n = 1 - Math.abs(ruido2D(fx, fy) * 2 - 1);
    suma += n * n * amp;
    norm += amp;
    amp *= 0.5;
    fx *= 2.0;
    fy *= 2.0;
  }
  return suma / norm;
}
