/**
 * Escena 8 — Batalla de Chupas (16 de septiembre de 1542).
 * La corona real frente a la bandera almagrista, con lluvia y neblina.
 */

import { Group } from 'three';
import { crearCorona } from '../mundo/corona.js';
import { crearBandera } from '../mundo/banderas.js';
import { crearEjercito } from '../mundo/soldados.js';
import { crearLetrero } from '../mundo/letrero.js';
import { crearParticulas } from '../mundo/particulas.js';
import { LUGARES } from '../data/lugares.js';
import { alturaEn } from '../mundo/relieve.js';
import { PALETA } from '../mundo/paleta.js';

export default {
  id: 8,
  crear(mundo, R) {
    const grupo = new Group();
    grupo.name = 'escena-8';

    const L = LUGARES.chupas;
    const suelo = alturaEn(L.x, L.z);

    // La corona en el cielo: la camara la atravesara en la transicion 8 -> 9.
    const corona = crearCorona({ radio: 3.8 });
    corona.position.set(L.x, suelo + 20, L.z - 4);
    grupo.add(corona);
    mundo.registrar('coronaChupas', corona);

    // El ejercito del rey (Vaca de Castro) contra los almagristas.
    const realistas = crearEjercito({
      centro: [L.x - 2, L.z - 15],
      rumbo: 0,
      cantidad: 88, ancho: 25, fondo: 9,
      color: '#A98A3E', arma: 'arcabuz', sembrado: 81,
    });
    const almagristas = crearEjercito({
      centro: [L.x + 2, L.z + 15],
      rumbo: Math.PI,
      cantidad: 70, ancho: 22, fondo: 8,
      color: '#2F4A6B', arma: 'pica', sembrado: 82,
    });
    grupo.add(realistas, almagristas);

    const banderaReal = crearBandera({
      posicion: [L.x - 9, L.z - 17], color: PALETA.dorado, colorFranja: PALETA.rojoOscuro,
      alto: 10, ancho: 4.2, altoPano: 2.8, giro: 0.15,
    });
    const banderaAlm = crearBandera({
      posicion: [L.x + 9, L.z + 17], color: '#2F4A6B', colorFranja: '#E8D9B5',
      alto: 10, ancho: 4.2, altoPano: 2.8, giro: 3.3,
    });
    grupo.add(banderaReal, banderaAlm);

    const fecha = crearLetrero('16 de septiembre de 1542 · Chupas', {
      alto: 2.8, color: '#F2E3BC',
    });
    fecha.position.set(L.x, suelo + 13, L.z);
    grupo.add(fecha);
    R.letreros.push(fecha);

    const polvo = crearParticulas('polvo', {
      origen: [L.x, suelo + 1, L.z], sembrado: 83, cantidad: 80,
    });
    grupo.add(polvo.puntos);

    return {
      grupo,
      activar({ efectos }) {
        // Segun el guion, en Chupas llueve.
        efectos.clima('lluvia');
      },
      desactivar({ efectos } = {}) {
        efectos?.clima(null);
      },
      animar(t, dt, activa) {
        corona.userData.animar(t);
        if (!activa) return;
        corona.position.y = alturaEn(LUGARES.chupas.x, LUGARES.chupas.z) + 20
          + Math.sin(t * 0.45) * 0.9;
        const empuje = 7 + Math.sin(t * 0.5) * 2;
        realistas.userData.colocar(empuje, t);
        almagristas.userData.colocar(empuje * 0.85, t * 1.1);
        polvo.animar(dt);
        polvo.ajustarNiebla(mundo.escena.fog);
      },
    };
  },
};
