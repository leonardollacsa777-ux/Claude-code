/**
 * Escena 9 — Las Leyes Nuevas (1542).
 * El documento real, gigante, con su sello de lacre y fichas que resumen
 * cada punto.
 */

import { Group } from 'three';
import { crearDocumento } from '../mundo/documento.js';
import { crearLetrero } from '../mundo/letrero.js';
import { LUGARES } from '../data/lugares.js';
import { alturaEn } from '../mundo/relieve.js';

const FICHAS = [
  'Proteger a los indígenas',
  'Las encomiendas no se heredan',
  'Se crea el Virreinato del Perú',
  'Los encomenderos se rebelarán',
];

export default {
  id: 9,
  crear(mundo, R) {
    const grupo = new Group();
    grupo.name = 'escena-9';

    const L = LUGARES.chupas;
    const suelo = alturaEn(L.x, L.z);

    const documento = crearDocumento({ ancho: 21, alto: 28 });
    documento.position.set(L.x + 9, suelo + 41, L.z);
    documento.rotation.y = 0.16;
    documento.rotation.x = -0.06;
    grupo.add(documento);
    mundo.registrar('documento', documento);

    // Fichas a la derecha, una por cada punto del texto.
    const fichas = [];
    for (let i = 0; i < FICHAS.length; i++) {
      const f = crearLetrero(FICHAS[i], {
        alto: 1.5, color: '#F2E3BC', fondo: 'rgba(12,18,28,0.86)',
      });
      f.position.set(L.x + 26, suelo + 49 - i * 4.6, L.z + 2);
      f.userData.fase = i * 0.8;
      f.userData.baseY = f.position.y;
      grupo.add(f);
      fichas.push(f);
      R.letreros.push(f);
    }

    return {
      grupo,
      activar({ efectos }) {
        efectos.clima(null);
        // La transición 9 -> 10 encoge el sello al estallar.
        documento.userData.sello.scale.setScalar(1);
      },
      desactivar() {},
      animar(t, dt, activa) {
        if (!activa) return;
        documento.position.y = alturaEn(LUGARES.chupas.x, LUGARES.chupas.z) + 41
          + Math.sin(t * 0.4) * 0.55;
        documento.rotation.z = Math.sin(t * 0.3) * 0.012;
        for (const f of fichas) {
          f.position.y = f.userData.baseY + Math.sin(t * 0.6 + f.userData.fase) * 0.4;
        }
      },
    };
  },
};
