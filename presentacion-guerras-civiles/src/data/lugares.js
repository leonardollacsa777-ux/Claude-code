/**
 * lugares.js — Geografia real del escenario.
 *
 * Cada batalla ocurrio en un lugar que existe. Por eso NO inventamos posiciones:
 * tomamos la latitud y longitud verdaderas de cada sitio y las proyectamos al
 * mundo 3D. Asi, cuando la camara "vuela al norte hacia Quito", de verdad va
 * al norte, y la distancia Cusco-Lima se siente proporcional a la real.
 *
 * Sistema de coordenadas del mundo:
 *   +X = este     -X = oeste
 *   +Y = arriba (altura)
 *   -Z = norte    +Z = sur
 */

import { Vector3 } from 'three';

// Cuantas unidades del mundo mide un grado de latitud (~111 km).
export const ESCALA = 20;

// Centro de la proyeccion (un punto en la sierra central del Peru).
const LAT_CENTRO = -8.5;
const LON_CENTRO = -74.0;

// Un grado de longitud es mas corto que uno de latitud segun la latitud.
const FACTOR_LON = Math.cos((LAT_CENTRO * Math.PI) / 180); // ~0.989

/** Convierte latitud/longitud reales a coordenadas del mundo 3D (plano XZ). */
export function proyectar(lat, lon) {
  return {
    x: (lon - LON_CENTRO) * ESCALA * FACTOR_LON,
    z: -(lat - LAT_CENTRO) * ESCALA,
  };
}

/**
 * Los nueve lugares del recorrido, con sus coordenadas reales.
 * `altura` es la elevacion aproximada en metros (solo sirve para dar sabor
 * al relieve y al texto; el terreno 3D se genera aparte).
 */
export const LUGARES = {
  cusco: {
    nombre: 'Cusco',
    lat: -13.5167, lon: -71.9789,
    altura: 3399,
    etiqueta: 'CUSCO',
  },
  abancay: {
    nombre: 'Abancay',
    lat: -13.6339, lon: -72.8814,
    altura: 2377,
    etiqueta: 'ABANCAY',
  },
  salinas: {
    nombre: 'Las Salinas',
    lat: -13.6000, lon: -71.8700, // pampa de Cachipampa, cerca del Cusco
    altura: 3500,
    etiqueta: 'LAS SALINAS',
  },
  lima: {
    nombre: 'Lima',
    lat: -12.0464, lon: -77.0428,
    altura: 154,
    etiqueta: 'LIMA',
  },
  chupas: {
    nombre: 'Chupas',
    lat: -13.1631, lon: -74.2236, // pampa de Chupas, cerca de Huamanga
    altura: 3300,
    etiqueta: 'CHUPAS',
  },
  quito: {
    nombre: 'Quito',
    lat: -0.2201, lon: -78.5123, // Inaquito, al norte de la ciudad
    altura: 2850,
    etiqueta: 'QUITO',
  },
  huarina: {
    nombre: 'Huarina',
    lat: -16.2000, lon: -68.6333, // orilla del lago Titicaca
    altura: 3830,
    etiqueta: 'HUARINA',
  },
  jaquijahuana: {
    nombre: 'Jaquijahuana',
    lat: -13.4667, lon: -72.1500, // pampa de Anta, cerca del Cusco
    altura: 3400,
    etiqueta: 'JAQUIJAHUANA',
  },
  pucara: {
    nombre: 'Pucara',
    lat: -15.0433, lon: -70.3672,
    altura: 3900,
    etiqueta: 'PUCARA',
  },

  // Puntos de apoyo que no son batallas pero si estaciones del recorrido.
  chile: {
    nombre: 'Ruta de Chile',
    lat: -22.5, lon: -69.0, // desierto de Atacama: de donde vuelve Almagro
    altura: 2400,
    etiqueta: 'CHILE',
  },
  centro: {
    nombre: 'Centro del mapa',
    lat: -10.5, lon: -74.5,
    altura: 0,
    etiqueta: 'PERU',
  },
  titicaca: {
    nombre: 'Lago Titicaca',
    lat: -15.85, lon: -69.35,
    altura: 3812,
    etiqueta: 'TITICACA',
  },
};

// Precalculamos la posicion en el mundo de cada lugar.
for (const clave of Object.keys(LUGARES)) {
  const l = LUGARES[clave];
  const p = proyectar(l.lat, l.lon);
  l.x = p.x;
  l.z = p.z;
  l.clave = clave;
}

/**
 * Punto del mundo relativo a un lugar.
 * `punto('cusco', -18, 26, 30)` = 18 al oeste del Cusco, 26 de alto, 30 al sur.
 */
export function punto(clave, dx = 0, dy = 0, dz = 0) {
  const l = LUGARES[clave];
  if (!l) throw new Error(`Lugar desconocido: ${clave}`);
  return [l.x + dx, dy, l.z + dz];
}

/** Lo mismo pero como Vector3 de three.js. */
export function vector(clave, dx = 0, dy = 0, dz = 0) {
  const [x, y, z] = punto(clave, dx, dy, dz);
  return new Vector3(x, y, z);
}

/** Lista ordenada de norte a sur (util para dibujar la cordillera). */
export const LIMITES = {
  minX: -140,
  maxX: 150,
  minZ: -200,
  maxZ: 300,
};
