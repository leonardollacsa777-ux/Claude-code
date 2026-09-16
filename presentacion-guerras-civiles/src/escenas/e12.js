/**
 * Escena 12 — La rebelión de Hernández Girón (1553-1554).
 * El último estandarte rebelde, que termina cayendo en Pucará.
 */

import { Group } from 'three';
import { gsap } from 'gsap';
import { crearEjercito } from '../mundo/soldados.js';
import { crearBandera } from '../mundo/banderas.js';
import { crearLetrero } from '../mundo/letrero.js';
import { crearParticulas } from '../mundo/particulas.js';
import { LUGARES } from '../data/lugares.js';
import { alturaEn } from '../mundo/relieve.js';
import { PALETA } from '../mundo/paleta.js';

export default {
  id: 12,
  crear(mundo, R) {
    const grupo = new Group();
    grupo.name = 'escena-12';

    const L = LUGARES.pucara;
    const suelo = alturaEn(L.x, L.z);

    // El estandarte rebelde: el protagonista de la escena.
    const estandarte = crearBandera({
      posicion: [L.x, L.z + 1], color: '#7A5A22', colorFranja: '#2B1C10',
      alto: 15, ancho: 6.2, altoPano: 4.2, giro: -0.35,
    });
    grupo.add(estandarte);
    mundo.registrar('estandarteRebelde', estandarte);

    const rebeldes = crearEjercito({
      centro: [L.x - 3, L.z + 12], rumbo: Math.PI, cantidad: 46, ancho: 17, fondo: 7,
      color: '#7A5A22', arma: 'pica', sembrado: 121,
    });
    const realistas = crearEjercito({
      centro: [L.x + 3, L.z - 13], rumbo: 0, cantidad: 92, ancho: 27, fondo: 10,
      color: PALETA.dorado, arma: 'arcabuz', sembrado: 122,
    });
    grupo.add(rebeldes, realistas);

    grupo.add(crearBandera({
      posicion: [L.x + 11, L.z - 16], color: PALETA.dorado, colorFranja: PALETA.rojoOscuro,
      alto: 11, ancho: 4.6, altoPano: 3, giro: 0.2,
    }));

    const fecha = crearLetrero('8 de octubre de 1554 · Pucará', {
      alto: 2.8, color: '#F2E3BC',
    });
    fecha.position.set(L.x - 1, suelo + 19, L.z);
    grupo.add(fecha);
    R.letreros.push(fecha);

    const polvo = crearParticulas('polvo', {
      origen: [L.x, suelo + 1, L.z], sembrado: 123, cantidad: 90,
    });
    grupo.add(polvo.puntos);

    let tl = null;

    return {
      grupo,
      activar({ efectos }) {
        efectos.clima(null);
        if (tl) tl.kill();
        // La última sublevación: el estandarte se inclina y cae.
        estandarte.rotation.z = 0;
        estandarte.userData.uniformes.uFuerza.value = 1;
        tl = gsap.timeline({ delay: 4.5 });
        tl.to(estandarte.rotation, { z: -1.35, duration: 2.6, ease: 'power2.in' });
        tl.to(estandarte.userData.uniformes.uFuerza, { value: 0.18, duration: 2.2 }, 0.3);
      },
      desactivar() {
        if (tl) { tl.kill(); tl = null; }
        estandarte.rotation.z = 0;
        estandarte.userData.uniformes.uFuerza.value = 1;
      },
      animar(t, dt, activa) {
        if (!activa) return;
        const empuje = 5.5 + Math.sin(t * 0.45) * 1.6;
        rebeldes.userData.colocar(empuje * 0.7, t);
        realistas.userData.colocar(empuje, t * 1.08);
        polvo.animar(dt);
        polvo.ajustarNiebla(mundo.escena.fog);
      },
    };
  },
};
