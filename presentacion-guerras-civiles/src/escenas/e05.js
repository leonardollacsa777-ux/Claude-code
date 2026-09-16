/**
 * Escena 5 — Almagro vuelve de Chile (1537).
 * Una ruta punteada sube desde Chile hasta el Cusco, aparece la maqueta de
 * la ciudad y se planta la bandera almagrista.
 */

import { Group } from 'three';
import { gsap } from 'gsap';
import { crearRuta } from '../mundo/ruta.js';
import { crearCiudad } from '../mundo/ciudad.js';
import { crearBandera } from '../mundo/banderas.js';
import { crearEjercito } from '../mundo/soldados.js';
import { crearLetrero } from '../mundo/letrero.js';
import { crearParticulas } from '../mundo/particulas.js';
import { LUGARES } from '../data/lugares.js';
import { alturaEn } from '../mundo/relieve.js';

export default {
  id: 5,
  crear(mundo, R) {
    const grupo = new Group();
    grupo.name = 'escena-5';

    const C = LUGARES.cusco;
    const CH = LUGARES.chile;
    const suelo = alturaEn(C.x, C.z);

    // La ruta real del regreso: desde el desierto, por el altiplano,
    // hasta el Cusco.
    const ruta = crearRuta([
      [CH.x, CH.z],
      [LUGARES.huarina.x + 6, LUGARES.huarina.z + 22],
      [LUGARES.pucara.x + 2, LUGARES.pucara.z + 6],
      [C.x + 6, C.z + 16],
      [C.x, C.z + 3],
    ], { cantidad: 80, color: '#8FC8E8', tamano: 0.95, altura: 2.4 });
    grupo.add(ruta);

    const ciudad = crearCiudad({
      centro: [C.x, C.z], radio: 11, casas: 52, sembrado: 41, giro: 0.35,
    });
    grupo.add(ciudad);
    mundo.registrar('ciudadCusco', ciudad);

    // La bandera almagrista plantada en el Cusco.
    const bandera = crearBandera({
      posicion: [C.x + 5.5, C.z - 5], color: '#2F4A6B', colorFranja: '#E8D9B5',
      alto: 11, ancho: 4.6, altoPano: 3, giro: -0.5,
    });
    grupo.add(bandera);

    // La tropa de Almagro, llegando por el sur.
    const tropa = crearEjercito({
      centro: [C.x + 13, C.z + 19],
      rumbo: Math.PI * 0.78,
      cantidad: 54, ancho: 18, fondo: 8,
      color: '#3A5573', arma: 'pica', sembrado: 43,
    });
    grupo.add(tropa);

    const rotulo = crearLetrero('Abril de 1537 · Almagro ocupa el Cusco', {
      alto: 2.6, color: '#F2E3BC',
    });
    rotulo.position.set(C.x + 16, suelo + 21, C.z + 10);
    grupo.add(rotulo);
    R.letreros.push(rotulo);

    const polvo = crearParticulas('polvo', {
      origen: [C.x + 13, suelo + 0.6, C.z + 17], sembrado: 44, cantidad: 90,
    });
    grupo.add(polvo.puntos);

    let tl = null;

    return {
      grupo,
      activar({ efectos }) {
        efectos.clima(null);
        if (tl) tl.kill();
        // La ruta se dibuja sola al llegar a la escena.
        ruta.userData.setProgreso(0);
        const estado = { p: 0 };
        tl = gsap.to(estado, {
          p: 1, duration: 3.4, ease: 'power1.inOut',
          onUpdate: () => ruta.userData.setProgreso(estado.p),
        });
      },
      desactivar() {},
      animar(t, dt, activa) {
        if (!activa) return;
        ruta.userData.pintar(t);
        tropa.userData.colocar(Math.sin(t * 0.18) * 0.6, t * 0.5);
        polvo.animar(dt);
        polvo.ajustarNiebla(mundo.escena.fog);
      },
    };
  },
};
