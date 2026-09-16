/**
 * Escena 11 — La Gasca, "el Pacificador" (1547-1548).
 * Dos marcadores: Huarina, junto al Titicaca, donde gana Gonzalo; y
 * Jaquijahuana, donde sus soldados se pasan al bando del rey.
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

const COLOR_GONZALO = PALETA.rojoOscuro;
const COLOR_REY = '#C9A227';

export default {
  id: 11,
  crear(mundo, R) {
    const grupo = new Group();
    grupo.name = 'escena-11';

    // --- Huarina, a orillas del Titicaca (20 de octubre de 1547) ---
    const H = LUGARES.huarina;
    const sueloH = alturaEn(H.x, H.z);

    const huarinistas = crearEjercito({
      centro: [H.x, H.z], rumbo: 2.2, cantidad: 40, ancho: 15, fondo: 7,
      color: COLOR_GONZALO, arma: 'arcabuz', sembrado: 111,
    });
    grupo.add(huarinistas);

    const rotuloH = crearLetrero('HUARINA · 1547', {
      alto: 4.4, color: '#F2C0B0', fondo: 'rgba(12,18,28,0.88)',
    });
    rotuloH.position.set(H.x, sueloH + 16, H.z);
    grupo.add(rotuloH);
    R.letreros.push(rotuloH);

    grupo.add(crearBandera({
      posicion: [H.x - 7, H.z + 3], color: COLOR_GONZALO, colorFranja: '#E8D9B5',
      alto: 9, ancho: 3.8, altoPano: 2.5, giro: 2.0,
    }));

    // --- Jaquijahuana, cerca del Cusco (9 de abril de 1548) ---
    const J = LUGARES.jaquijahuana;
    const sueloJ = alturaEn(J.x, J.z);

    // Este es el ejercito que cambia de bando: la clave de la escena.
    const desertores = crearEjercito({
      centro: [J.x - 1, J.z + 13], rumbo: Math.PI, cantidad: 96, ancho: 27, fondo: 10,
      color: COLOR_GONZALO, arma: 'pica', sembrado: 112,
    });
    const realistas = crearEjercito({
      centro: [J.x + 1, J.z - 14], rumbo: 0, cantidad: 86, ancho: 25, fondo: 9,
      color: COLOR_REY, arma: 'arcabuz', sembrado: 113,
    });
    grupo.add(desertores, realistas);

    grupo.add(crearBandera({
      posicion: [J.x + 10, J.z - 17], color: COLOR_REY, colorFranja: PALETA.rojoOscuro,
      alto: 11, ancho: 4.6, altoPano: 3, giro: 0.15,
    }));

    const rotuloJ = crearLetrero('JAQUIJAHUANA · 1548', {
      alto: 3.4, color: '#FFE9A8', fondo: 'rgba(12,18,28,0.9)',
    });
    rotuloJ.position.set(J.x, sueloJ + 15, J.z);
    grupo.add(rotuloJ);
    R.letreros.push(rotuloJ);

    const aviso = crearLetrero('Sus soldados se pasan al bando del rey', {
      alto: 2.2, color: '#F2E3BC', fondo: 'rgba(12,18,28,0.82)',
      fuente: '"EB Garamond", Georgia, serif', peso: 500,
    });
    aviso.position.set(J.x, sueloJ + 11, J.z + 2);
    grupo.add(aviso);
    R.letreros.push(aviso);

    const polvo = crearParticulas('polvo', {
      origen: [J.x, sueloJ + 1, J.z], sembrado: 114, cantidad: 90,
    });
    grupo.add(polvo.puntos);

    let tl = null;

    return {
      grupo,
      activar({ efectos }) {
        efectos.clima(null);
        if (tl) tl.kill();
        // Se van pasando al rey poco a poco, no de golpe.
        desertores.userData.tenir(0, COLOR_REY);
        const estado = { f: 0 };
        tl = gsap.to(estado, {
          f: 0.78,
          duration: 5.5,
          delay: 1.6,
          ease: 'power1.inOut',
          onUpdate: () => desertores.userData.tenir(estado.f, COLOR_REY),
        });
      },
      desactivar() {
        if (tl) { tl.kill(); tl = null; }
        desertores.userData.tenir(0, COLOR_REY);
      },
      animar(t, dt, activa) {
        if (!activa) return;
        huarinistas.userData.colocar(Math.sin(t * 0.3) * 1.2, t * 0.7);
        const empuje = 6 + Math.sin(t * 0.5) * 1.8;
        desertores.userData.colocar(empuje, t);
        realistas.userData.colocar(empuje * 0.8, t * 1.05);
        polvo.animar(dt);
        polvo.ajustarNiebla(mundo.escena.fog);
      },
    };
  },
};
