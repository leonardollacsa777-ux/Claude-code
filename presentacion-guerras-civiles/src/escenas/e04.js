/**
 * Escena 4 — Los nueve personajes principales.
 * Carrusel de retratos en marcos dorados, en semicirculo sobre el mapa.
 */

import { Group } from 'three';
import { crearRetrato, PERSONAJES } from '../mundo/retratos.js';
import { LUGARES } from '../data/lugares.js';
import { alturaEn } from '../mundo/relieve.js';

export default {
  id: 4,
  crear(mundo) {
    const grupo = new Group();
    grupo.name = 'escena-4';

    const L = LUGARES.centro;
    const suelo = alturaEn(L.x, L.z);

    // El carrusel gira entero: por eso los retratos cuelgan de un pivote.
    const pivote = new Group();
    // Desplazado al este: así el carrusel queda a la derecha del panel de texto.
    pivote.position.set(L.x + 24, suelo + 56, L.z);
    grupo.add(pivote);

    const radio = 31;
    const arco = Math.PI * 0.72;
    const retratos = [];

    for (let i = 0; i < PERSONAJES.length; i++) {
      const t = PERSONAJES.length === 1 ? 0.5 : i / (PERSONAJES.length - 1);
      const ang = -arco / 2 + t * arco;

      const marco = crearRetrato(PERSONAJES[i], i, { alto: 11 });
      marco.position.set(Math.sin(ang) * radio, 0, Math.cos(ang) * radio);
      // Mira hacia afuera del semicirculo, que es donde esta la camara.
      marco.rotation.y = ang;
      marco.userData.angulo = ang;
      marco.userData.fase = i * 0.7;
      pivote.add(marco);
      retratos.push(marco);
    }

    mundo.registrar('retratos', pivote);

    return {
      grupo,
      activar({ efectos }) {
        efectos.clima(null);
        // La transición 3 -> 4 los hace crecer desde cero; si se llega por
        // otro camino hay que asegurarse de que estén a tamaño normal.
        pivote.scale.setScalar(1);
      },
      desactivar() {},
      animar(t, dt, activa) {
        if (!activa) return;
        // Giro lento de vaiven: se ven todos sin marear.
        pivote.rotation.y = Math.sin(t * 0.085) * 0.22;
        for (const m of retratos) {
          m.position.y = Math.sin(t * 0.55 + m.userData.fase) * 0.65;
          m.rotation.z = Math.sin(t * 0.4 + m.userData.fase) * 0.012;
        }
      },
    };
  },
};
