/**
 * Escena 1 — Portada: campo de batalla al atardecer.
 *
 * La cámara está al este y mira al oeste, contra el sol poniente: por eso
 * los soldados se ven como siluetas recortadas. Hay cuatro filas a distinta
 * profundidad (efecto parallax), estandartes, humo, polvo y brasas.
 */

import { Group } from 'three';
import { crearEjercito } from '../mundo/soldados.js';
import { crearBandera } from '../mundo/banderas.js';
import { crearParticulas } from '../mundo/particulas.js';
import { LUGARES } from '../data/lugares.js';
import { alturaEn } from '../mundo/relieve.js';

export default {
  id: 1,
  crear(mundo) {
    const grupo = new Group();
    grupo.name = 'escena-1';
    const L = LUGARES.salinas;

    // Con rumbo -90° la formación se abre a lo ancho de la vista y las
    // filas se escalonan hacia el oeste, alejándose de la cámara.
    const RUMBO = -Math.PI / 2;

    // Cuanto más lejos, más clara la silueta: así se nota la profundidad.
    const capas = [
      { dx: 17, dz: 2, n: 30, ancho: 24, color: '#0E0B08', escala: 1.2 , arma: 'pica' },
      { dx: 4, dz: -4, n: 42, ancho: 32, color: '#181310', escala: 1.05, arma: 'pica' },
      { dx: -10, dz: 3, n: 40, ancho: 40, color: '#271F18', escala: 0.95, arma: 'arcabuz' },
      { dx: -25, dz: -2, n: 34, ancho: 48, color: '#3A2F25', escala: 0.85, arma: 'pica' },
    ];

    const ejercitos = [];
    for (let i = 0; i < capas.length; i++) {
      const c = capas[i];
      const e = crearEjercito({
        centro: [L.x + c.dx, L.z + c.dz],
        rumbo: RUMBO,
        cantidad: c.n,
        ancho: c.ancho,
        fondo: 4,
        color: c.color,
        arma: c.arma,
        escala: c.escala,
        sembrado: 11 + i * 5,
      });
      grupo.add(e);
      ejercitos.push(e);
    }

    // Estandartes repartidos entre las filas.
    for (const [dx, dz, color, alto, giro] of [
      [12, 13, '#1A140D', 6.0, 0.4],
      [8, -14, '#1F170F', 6.8, -0.6],
      [-6, 9, '#2A2016', 5.6, 1.1],
      [-18, -11, '#33271A', 6.4, 0.2],
      [-2, 18, '#241B12', 5.2, -0.3],
    ]) {
      grupo.add(crearBandera({
        posicion: [L.x + dx, L.z + dz], color, alto, ancho: 2.6, altoPano: 1.7, giro,
      }));
    }

    const suelo = alturaEn(L.x, L.z);
    const humo = crearParticulas('humo', { origen: [L.x - 14, suelo + 3, L.z - 3], sembrado: 31 });
    const polvo = crearParticulas('polvo', { origen: [L.x - 2, suelo + 0.8, L.z + 1], sembrado: 32 });
    const brasas = crearParticulas('brasas', { origen: [L.x + 2, suelo + 3, L.z], sembrado: 33 });

    for (const p of [humo, polvo, brasas]) grupo.add(p.puntos);
    const sistemas = [humo, polvo, brasas];

    return {
      grupo,
      activar({ efectos }) {
        efectos.clima(null);
        efectos.mostrarNubes(false, 0.8);
      },
      desactivar() {},
      animar(t, dt, activa) {
        if (!activa) return;
        for (let i = 0; i < ejercitos.length; i++) {
          // El ejército está formado, no marcha: sólo un balanceo mínimo.
          ejercitos[i].userData.colocar(Math.sin(t * 0.18 + i) * 0.4, t * 0.3);
        }
        for (const p of sistemas) {
          p.animar(dt);
          p.ajustarNiebla(mundo.escena.fog);
        }
      },
    };
  },
};
