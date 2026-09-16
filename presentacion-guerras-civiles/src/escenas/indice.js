/**
 * escenas/indice.js — Arma las 15 escenas del mundo.
 *
 * Todas se construyen UNA sola vez, al arrancar, y viven a la vez dentro
 * del mismo mundo 3D (por eso la cámara puede volar entre ellas sin cortes).
 * Lo único que se enciende y se apaga es la animación: sólo la escena actual
 * (y la de destino, mientras se vuela) mueve sus partículas y sus ejércitos.
 */

import e01 from './e01.js';
import e02 from './e02.js';
import e03 from './e03.js';
import e04 from './e04.js';
import e05 from './e05.js';
import e06 from './e06.js';
import e07 from './e07.js';
import e08 from './e08.js';
import e09 from './e09.js';
import e10 from './e10.js';
import e11 from './e11.js';
import e12 from './e12.js';
import e13 from './e13.js';
import e14 from './e14.js';
import e15 from './e15.js';

export const DEFINICIONES = [e01, e02, e03, e04, e05, e06, e07, e08, e09, e10, e11, e12, e13, e14, e15];

/**
 * @param mundo     el mundo 3D
 * @param recursos  { efectos, camara, letreros }
 */
export function crearEscenarios(mundo, recursos) {
  const escenarios = [];

  for (const def of DEFINICIONES) {
    const esc = def.crear(mundo, recursos);
    esc.grupo.name = esc.grupo.name || `escena-${def.id}`;
    mundo.decorado.add(esc.grupo);
    escenarios.push({
      id: def.id,
      grupo: esc.grupo,
      activar: esc.activar || (() => {}),
      desactivar: esc.desactivar || (() => {}),
      animar: esc.animar || (() => {}),
    });
  }

  if (escenarios.length !== 15) {
    console.warn(`[escenas] Se esperaban 15 escenas y hay ${escenarios.length}.`);
  }

  return escenarios;
}

export default crearEscenarios;
