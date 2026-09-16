/**
 * Escena 10 — Rebelión de Gonzalo Pizarro: Iñaquito (18 de enero de 1546).
 * Las montañas nevadas de Quito, los encomenderos contra el estandarte
 * del virrey.
 */

import { Group } from 'three';
import { crearEjercito } from '../mundo/soldados.js';
import { crearBandera } from '../mundo/banderas.js';
import { crearLetrero } from '../mundo/letrero.js';
import { crearParticulas } from '../mundo/particulas.js';
import { LUGARES } from '../data/lugares.js';
import { alturaEn } from '../mundo/relieve.js';
import { PALETA } from '../mundo/paleta.js';

export default {
  id: 10,
  crear(mundo, R) {
    const grupo = new Group();
    grupo.name = 'escena-10';

    const L = LUGARES.quito;
    const suelo = alturaEn(L.x, L.z);

    // Gonzalo Pizarro y sus encomenderos.
    const gonzalistas = crearEjercito({
      centro: [L.x - 2, L.z + 15],
      rumbo: Math.PI,
      cantidad: 92, ancho: 26, fondo: 10,
      color: PALETA.rojoOscuro, arma: 'arcabuz', sembrado: 101,
    });
    // La gente del virrey Blasco Núñez Vela.
    const virreinales = crearEjercito({
      centro: [L.x + 2, L.z - 14],
      rumbo: 0,
      cantidad: 58, ancho: 19, fondo: 8,
      color: '#6E5A2A', arma: 'pica', sembrado: 102,
    });
    grupo.add(gonzalistas, virreinales);

    const estandarteVirrey = crearBandera({
      posicion: [L.x + 1, L.z - 18], color: PALETA.dorado, colorFranja: PALETA.rojoOscuro,
      alto: 12, ancho: 5, altoPano: 3.2, giro: 0.1,
    });
    const estandarteGonzalo = crearBandera({
      posicion: [L.x - 10, L.z + 17], color: PALETA.rojoOscuro, colorFranja: '#E8D9B5',
      alto: 11, ancho: 4.6, altoPano: 3, giro: 3.2,
    });
    grupo.add(estandarteVirrey, estandarteGonzalo);

    const fecha = crearLetrero('18 de enero de 1546 · Iñaquito', {
      alto: 2.8, color: '#F2E3BC',
    });
    fecha.position.set(L.x, suelo + 14, L.z);
    grupo.add(fecha);
    R.letreros.push(fecha);

    const polvo = crearParticulas('polvo', {
      origen: [L.x, suelo + 1, L.z], sembrado: 103, cantidad: 90,
    });
    grupo.add(polvo.puntos);

    return {
      grupo,
      activar({ efectos }) {
        // Quito esta a casi 3000 m: neblina de montaña.
        efectos.clima(null);
      },
      desactivar() {},
      animar(t, dt, activa) {
        if (!activa) return;
        const empuje = 6.5 + Math.sin(t * 0.6) * 2.2;
        gonzalistas.userData.colocar(empuje, t);
        virreinales.userData.colocar(empuje * 0.7, t * 1.1);
        polvo.animar(dt);
        polvo.ajustarNiebla(mundo.escena.fog);
      },
    };
  },
};
