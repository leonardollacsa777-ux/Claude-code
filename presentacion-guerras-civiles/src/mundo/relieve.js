/**
 * relieve.js — La forma del Peru.
 *
 * En vez de inventar montanas al azar, seguimos dos lineas reales:
 *   - la cordillera de los Andes (donde estan los picos)
 *   - la linea de la costa (donde empieza el mar)
 * Ambas se describen con puntos de latitud/longitud verdaderos y se
 * interpolan. Asi el mapa se reconoce como el Peru y las batallas caen
 * donde deben: el Cusco en la sierra, Lima en la costa, Quito al norte.
 */

import { proyectar } from '../data/lugares.js';
import { fbm, crestas } from './ruido.js';

// Latitud -> longitud del eje de la cordillera.
const CORDILLERA = [
  [  1.0, -78.0], [ -1.0, -78.5], [ -3.0, -78.6], [ -5.0, -78.3],
  [ -7.0, -77.8], [ -9.0, -77.0], [-11.0, -76.1], [-12.5, -75.0],
  [-13.5, -72.6], [-15.0, -71.3], [-16.5, -70.2], [-18.5, -69.4],
  [-21.0, -68.8], [-24.0, -68.5],
];

// Latitud -> longitud de la costa del Pacifico.
const COSTA = [
  [  1.0, -80.0], [ -1.0, -80.6], [ -3.0, -81.0], [ -5.0, -81.2],
  [ -7.0, -79.6], [ -9.0, -78.6], [-11.0, -77.8], [-12.5, -77.0],
  [-14.0, -76.1], [-16.0, -74.0], [-18.0, -70.9], [-21.0, -70.3],
  [-24.0, -70.4],
];

// Exageracion vertical: si usaramos la escala real, el Peru seria una hoja
// plana. Los mapas en relieve siempre exageran la altura para que se vea.
export const ALTURA_PICO = 17;
export const NIVEL_MAR = -2.2;
export const NIVEL_LAGO = 9.4;

function aMundo(lista) {
  return lista
    .map(([lat, lon]) => {
      const p = proyectar(lat, lon);
      return { x: p.x, z: p.z };
    })
    .sort((a, b) => a.z - b.z);
}

const EJE = aMundo(CORDILLERA);
const ORILLA = aMundo(COSTA);

/** Interpola la X de una linea norte-sur para una Z dada. */
function xEnZ(linea, z) {
  if (z <= linea[0].z) return linea[0].x;
  if (z >= linea[linea.length - 1].z) return linea[linea.length - 1].x;
  for (let i = 0; i < linea.length - 1; i++) {
    const a = linea[i];
    const b = linea[i + 1];
    if (z >= a.z && z <= b.z) {
      const t = (z - a.z) / (b.z - a.z);
      const s = t * t * (3 - 2 * t); // suavizado
      return a.x + (b.x - a.x) * s;
    }
  }
  return linea[linea.length - 1].x;
}

export const ejeCordillera = (z) => xEnZ(EJE, z);
export const lineaCosta = (z) => xEnZ(ORILLA, z);

// Lago Titicaca: elipse achatada en diagonal, con su nivel plano.
const LAGO = (() => {
  const c = proyectar(-15.70, -69.55);
  return { x: c.x, z: c.z, largo: 17, ancho: 6.8, giro: -Math.PI / 5 };
})();

export function enElLago(x, z) {
  const dx = x - LAGO.x;
  const dz = z - LAGO.z;
  const cos = Math.cos(LAGO.giro);
  const sin = Math.sin(LAGO.giro);
  const u = (dx * cos - dz * sin) / LAGO.largo;
  const v = (dx * sin + dz * cos) / LAGO.ancho;
  return u * u + v * v;
}

export const LAGO_INFO = LAGO;

/**
 * Altura del terreno en cualquier punto del mundo.
 * Es la funcion mas importante del mapa: la usan el terreno, la camara
 * (para no meterse dentro de un cerro) y los objetos que se posan al suelo.
 */
export function alturaEn(x, z) {
  const ejeX = ejeCordillera(z);
  const costaX = lineaCosta(z);

  const dEje = x - ejeX;      // negativo = al oeste de la cordillera
  const dCosta = x - costaX;  // negativo = mar adentro

  // Perfil de la cordillera: sube rapido desde la costa y baja despacio
  // hacia la selva, como pasa de verdad.
  const ancho = dEje < 0 ? 24 : 44;
  const t = dEje / ancho;
  let montana = ALTURA_PICO * Math.exp(-t * t);

  // Picos irregulares solo donde ya hay montana.
  const cr = crestas(x * 0.055 + 40, z * 0.055 + 12, 4);
  montana *= 0.55 + 0.72 * cr;

  // Ondulacion general del terreno.
  const suelo = (fbm(x * 0.028 + 5, z * 0.028 + 90, 4) - 0.5) * 3.4;

  // Llanura amazonica al este: baja y bastante plana.
  const selva = 1.4 + (fbm(x * 0.06, z * 0.06, 3) - 0.5) * 1.6;
  const mezclaSelva = suave01((dEje - 46) / 42);

  let h = montana + suelo * (1 - mezclaSelva * 0.6) + 1.2;
  h = h * (1 - mezclaSelva) + selva * mezclaSelva;

  // Costa: franja desertica baja antes del mar.
  const franja = suave01(dCosta / 14);
  h = NIVEL_MAR + (h - NIVEL_MAR) * franja;

  // Mar abierto.
  if (dCosta < 0) {
    const hondo = suave01(-dCosta / 26);
    h = NIVEL_MAR - hondo * 1.8;
  }

  // Lago Titicaca: se hunde el fondo para que quepa el agua.
  const lago = enElLago(x, z);
  if (lago < 1.35) {
    const dentro = suave01((1.35 - lago) / 0.6);
    const fondo = NIVEL_LAGO - 1.3 - fbm(x * 0.2, z * 0.2, 2) * 0.7;
    h = h * (1 - dentro) + fondo * dentro;
  }

  return h;
}

function suave01(t) {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
}

export { suave01 };
