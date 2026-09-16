/**
 * Escena 6 — Batalla de Las Salinas (6 de abril de 1538).
 * Los dos ejercitos avanzan y chocan, con polvo y chispas.
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
  id: 6,
  crear(mundo, R) {
    const grupo = new Group();
    grupo.name = 'escena-6';

    const L = LUGARES.salinas;
    const suelo = alturaEn(L.x, L.z);

    // Hernando Pizarro llega desde el Cusco (norte); los almagristas
    // esperan en la pampa (sur).
    const pizarristas = crearEjercito({
      centro: [L.x - 1, L.z - 17],
      rumbo: 0,
      cantidad: 96, ancho: 26, fondo: 10,
      color: PALETA.rojoOscuro, arma: 'arcabuz', sembrado: 61,
    });
    const almagristas = crearEjercito({
      centro: [L.x + 1, L.z + 17],
      rumbo: Math.PI,
      cantidad: 82, ancho: 24, fondo: 9,
      color: '#2F4A6B', arma: 'pica', sembrado: 62,
    });
    grupo.add(pizarristas, almagristas);

    for (const [dx, dz, color, giro] of [
      [-13, -19, PALETA.rojoOscuro, 0.2],
      [12, -20, PALETA.rojoOscuro, -0.3],
      [-12, 19, '#2F4A6B', 2.9],
      [13, 18, '#2F4A6B', 3.4],
    ]) {
      grupo.add(crearBandera({
        posicion: [L.x + dx, L.z + dz], color, colorFranja: '#E8D9B5',
        alto: 8.5, ancho: 3.4, altoPano: 2.2, giro,
      }));
    }

    // El marcador con la fecha, flotando sobre el campo.
    const fecha = crearLetrero('6 de abril de 1538', {
      alto: 3.2, color: '#FFE9A8', fondo: 'rgba(12,18,28,0.88)',
    });
    fecha.position.set(L.x, suelo + 15, L.z);
    grupo.add(fecha);
    R.letreros.push(fecha);

    const polvo = crearParticulas('polvo', { origen: [L.x, suelo + 1, L.z], sembrado: 63 });
    const chispas = crearParticulas('chispas', { origen: [L.x, suelo + 1.6, L.z], sembrado: 64 });
    const humo = crearParticulas('humo', { origen: [L.x + 6, suelo + 2, L.z - 4], sembrado: 65, cantidad: 90 });
    grupo.add(polvo.puntos, chispas.puntos, humo.puntos);
    const sistemas = [polvo, chispas, humo];

    return {
      grupo,
      activar({ efectos }) { efectos.clima(null); },
      desactivar() {},
      animar(t, dt, activa) {
        if (!activa) return;
        // Los dos bandos empujan y ceden: el choque nunca se detiene.
        const empuje = 8.5 + Math.sin(t * 0.55) * 2.4;
        pizarristas.userData.colocar(empuje, t);
        almagristas.userData.colocar(empuje - Math.sin(t * 0.8) * 1.2, t * 1.05);
        for (const p of sistemas) {
          p.animar(dt);
          p.ajustarNiebla(mundo.escena.fog);
        }
      },
    };
  },
};
