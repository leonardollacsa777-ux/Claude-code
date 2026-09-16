/**
 * Escena 14 — Consecuencias.
 * La corona real domina el mapa y las fichas de cada consecuencia giran
 * a su alrededor.
 */

import { Group } from 'three';
import { gsap } from 'gsap';
import { crearCorona } from '../mundo/corona.js';
import { crearLetrero } from '../mundo/letrero.js';
import { LUGARES } from '../data/lugares.js';
import { alturaEn } from '../mundo/relieve.js';

// Frases cortas: aquí sólo hacen de rótulo. Lo largo va en el panel de texto.
const FICHAS = [
  'Mueren los conquistadores',
  'Autoridad de la Corona',
  'Virreinato del Perú',
  'Nuevas encomiendas',
  'Fin de la conquista',
];

export default {
  id: 14,
  crear(mundo, R) {
    const grupo = new Group();
    grupo.name = 'escena-14';

    const L = LUGARES.centro;
    const suelo = alturaEn(L.x, L.z);
    const centroY = suelo + 120;

    const corona = crearCorona({ radio: 22 });
    corona.position.set(L.x, centroY, L.z);
    grupo.add(corona);
    mundo.registrar('coronaFinal', corona);

    // Las fichas giran alrededor de la corona.
    const pivote = new Group();
    pivote.position.set(L.x, centroY + 8, L.z);
    grupo.add(pivote);

    const fichas = [];
    for (let i = 0; i < FICHAS.length; i++) {
      const ang = (i / FICHAS.length) * Math.PI * 2;
      const f = crearLetrero(FICHAS[i], {
        alto: 6.4, color: '#F2E3BC', fondo: 'rgba(12,18,28,0.9)',
        fuente: '"EB Garamond", Georgia, serif', peso: 500,
      });
      // El anillo va por DEBAJO de la corona: así ninguna ficha la tapa.
      const radio = 47;
      const altura = -32 + (i % 2) * 9;
      f.position.set(Math.cos(ang) * radio, altura, Math.sin(ang) * radio);
      f.userData.angulo = ang;
      f.userData.radio = radio;
      f.userData.baseY = f.position.y;
      pivote.add(f);
      fichas.push(f);
      R.letreros.push(f);
    }

    let tl = null;

    return {
      grupo,
      activar({ efectos }) {
        efectos.clima(null);
        if (tl) tl.kill();
        tl = gsap.timeline();
        for (let i = 0; i < fichas.length; i++) {
          const f = fichas[i];
          gsap.killTweensOf(f.scale);
          f.scale.set(0.01, 0.01, 0.01);
          tl.to(f.scale, { x: 1, y: 1, z: 1, duration: 0.6, ease: 'back.out(1.7)' }, 0.5 + i * 0.28);
        }
      },
      desactivar() { if (tl) { tl.kill(); tl = null; } },
      animar(t, dt, activa) {
        corona.userData.animar(t * 0.7);
        if (!activa) return;
        pivote.rotation.y = t * 0.075;
        for (const f of fichas) {
          f.position.y = f.userData.baseY + Math.sin(t * 0.5 + f.userData.angulo) * 2.4;
        }
      },
    };
  },
};
