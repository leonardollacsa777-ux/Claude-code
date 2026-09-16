/**
 * Escena 3 — El origen del conflicto.
 * Una linea luminosa parte el mapa en Nueva Castilla (Pizarro, al norte) y
 * Nueva Toledo (Almagro, al sur). El Cusco brilla en medio, con dos banderas
 * que se lo disputan.
 */

import {
  Group, Mesh, BoxGeometry, MeshBasicMaterial, Color, AdditiveBlending,
  CylinderGeometry,
} from 'three';
import { crearBandera } from '../mundo/banderas.js';
import { crearLetrero } from '../mundo/letrero.js';
import { LUGARES, proyectar, LIMITES } from '../data/lugares.js';
import { alturaEn } from '../mundo/relieve.js';
import { PALETA } from '../mundo/paleta.js';

export default {
  id: 3,
  crear(mundo, R) {
    const grupo = new Group();
    grupo.name = 'escena-3';

    // La frontera que se discutia caia justo por encima del Cusco: por eso
    // los dos creian que la ciudad era suya.
    const frontera = proyectar(-14.0, -74).z;

    const linea = new Mesh(
      new BoxGeometry(LIMITES.maxX - LIMITES.minX, 0.7, 1.5),
      new MeshBasicMaterial({
        color: new Color(PALETA.doradoClaro),
        transparent: true,
        opacity: 0.85,
        blending: AdditiveBlending,
        depthWrite: false,
      })
    );
    linea.position.set((LIMITES.maxX + LIMITES.minX) / 2, 34, frontera);
    linea.renderOrder = 6;
    grupo.add(linea);

    // Cortina de luz que baja de la linea hasta el suelo.
    const cortina = new Mesh(
      new BoxGeometry(LIMITES.maxX - LIMITES.minX, 34, 0.6),
      new MeshBasicMaterial({
        color: new Color(PALETA.dorado),
        transparent: true,
        opacity: 0.16,
        blending: AdditiveBlending,
        depthWrite: false,
      })
    );
    cortina.position.set((LIMITES.maxX + LIMITES.minX) / 2, 17, frontera);
    cortina.renderOrder = 5;
    grupo.add(cortina);

    // Rotulos de las dos gobernaciones.
    const rotulos = [];
    const norte = crearLetrero('NUEVA CASTILLA · Pizarro', { alto: 11, color: '#F2E3BC' });
    norte.position.set(-40, 62, frontera - 95);
    grupo.add(norte);
    rotulos.push(norte);

    const sur = crearLetrero('NUEVA TOLEDO · Almagro', { alto: 11, color: '#CFE0EE' });
    sur.position.set(52, 62, frontera + 85);
    grupo.add(sur);
    rotulos.push(sur);

    // El Cusco, en disputa.
    const C = LUGARES.cusco;
    const sueloCusco = alturaEn(C.x, C.z);

    const haz = new Mesh(
      new CylinderGeometry(2.6, 5.2, 40, 16, 1, true),
      new MeshBasicMaterial({
        color: new Color(PALETA.doradoClaro),
        transparent: true,
        opacity: 0.2,
        blending: AdditiveBlending,
        depthWrite: false,
        side: 2,
      })
    );
    haz.position.set(C.x, sueloCusco + 20, C.z);
    haz.renderOrder = 6;
    grupo.add(haz);

    const rotuloCusco = crearLetrero('EL CUSCO', {
      alto: 7, color: '#FFE9A8', fondo: 'rgba(12,18,28,0.88)',
    });
    rotuloCusco.position.set(C.x, sueloCusco + 46, C.z);
    grupo.add(rotuloCusco);
    rotulos.push(rotuloCusco);

    // Las dos banderas que se lo disputan.
    const banderaP = crearBandera({
      posicion: [C.x - 7, C.z + 3], color: PALETA.rojoOscuro,
      colorFranja: '#E8D9B5', alto: 14, ancho: 6, altoPano: 4, giro: 0.3,
    });
    const banderaA = crearBandera({
      posicion: [C.x + 7, C.z - 2], color: '#2F4A6B',
      colorFranja: '#E8D9B5', alto: 14, ancho: 6, altoPano: 4, giro: -0.4,
    });
    grupo.add(banderaP, banderaA);

    R.letreros.push(...rotulos);

    return {
      grupo,
      activar({ efectos }) { efectos.clima(null); },
      desactivar() {},
      animar(t, dt, activa) {
        if (!activa) return;
        const pulso = 0.6 + Math.abs(Math.sin(t * 0.9)) * 0.4;
        linea.material.opacity = 0.5 + pulso * 0.42;
        haz.material.opacity = 0.12 + pulso * 0.14;
      },
    };
  },
};
