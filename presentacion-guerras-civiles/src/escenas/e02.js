/**
 * Escena 2 — El pergamino que explica que fueron las guerras civiles.
 * Sale del humo de la portada y en la transicion siguiente se aplana
 * hasta convertirse en el mapa.
 */

import { Group } from 'three';
import { gsap } from 'gsap';
import { crearPergamino } from '../mundo/pergamino.js';
import { LUGARES } from '../data/lugares.js';
import { alturaEn } from '../mundo/relieve.js';

export default {
  id: 2,
  crear(mundo) {
    const grupo = new Group();
    grupo.name = 'escena-2';
    const L = LUGARES.centro;
    const suelo = alturaEn(L.x, L.z);

    const pergamino = crearPergamino({ ancho: 32, alto: 20 });
    pergamino.position.set(L.x, suelo + 27, L.z);
    // Ligeramente inclinado hacia la camara, como un papel sobre una mesa.
    pergamino.rotation.x = -0.34;
    grupo.add(pergamino);

    // Empieza enrollado; se abre al llegar.
    pergamino.userData.uniformes.uEnrollado.value = 1;
    pergamino.userData.ajustarPalos();

    mundo.registrar('pergamino', pergamino);

    let tl = null;

    return {
      grupo,
      activar({ efectos }) {
        efectos.clima(null);

        // Dejamos el pergamino como debe estar, venga de donde venga la cámara.
        // Hace falta porque al ir HACIA ATRÁS los efectos de la transición
        // 2 -> 3 se ejecutan igual y lo dejarían escondido.
        pergamino.visible = true;
        pergamino.scale.setScalar(1);
        pergamino.rotation.set(-0.34, 0, 0);
        pergamino.userData.hoja.material.opacity = 1;
        pergamino.userData.sello.scale.setScalar(1);

        const u = pergamino.userData.uniformes;
        if (tl) tl.kill();
        tl = gsap.timeline();
        tl.fromTo(u.uEnrollado, { value: 1 }, {
          value: 0,
          duration: 1.9,
          ease: 'power2.inOut',
          onUpdate: () => pergamino.userData.ajustarPalos(),
        });
      },
      desactivar() {},
      animar(t, dt, activa) {
        pergamino.userData.animar(t);
        if (activa) {
          pergamino.position.y = alturaEn(LUGARES.centro.x, LUGARES.centro.z) + 27
            + Math.sin(t * 0.5) * 0.5;
          pergamino.rotation.z = Math.sin(t * 0.32) * 0.018;
        }
      },
    };
  },
};
