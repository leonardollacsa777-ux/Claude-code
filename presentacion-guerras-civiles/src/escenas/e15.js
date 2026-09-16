/**
 * Escena 15 — Conclusión y cierre.
 * Amanece sobre los Andes y el pergamino del principio vuelve para
 * enrollarse: así se cierra el círculo de toda la presentación.
 */

import { Group, Vector3 } from 'three';
import { gsap } from 'gsap';
import { crearPergamino } from '../mundo/pergamino.js';
import { LUGARES } from '../data/lugares.js';
import { alturaEn } from '../mundo/relieve.js';

export default {
  id: 15,
  crear(mundo) {
    const grupo = new Group();
    grupo.name = 'escena-15';

    const L = LUGARES.centro;

    // Reproducimos aquí el punto de vista de la escena 15 (ver escenas.js)
    // para poner el pergamino justo delante de la cámara.
    const camX = L.x + 58;
    const camZ = L.z + 330;
    const camY = alturaEn(camX, camZ) + 190;
    const camPos = new Vector3(camX, camY, camZ);

    const miraX = L.x - 18;
    const miraZ = L.z + 70;
    const miraY = alturaEn(miraX, miraZ) + 52;
    const mira = new Vector3(miraX, miraY, miraZ);

    // A un tercio del camino entre la cámara y lo que mira.
    const sitio = camPos.clone().lerp(mira, 0.52);

    const pergamino = crearPergamino({ ancho: 52, alto: 32 });
    pergamino.position.copy(sitio);
    pergamino.lookAt(camPos);
    // Empieza abierto y se enrolla mientras el expositor cierra.
    pergamino.userData.uniformes.uEnrollado.value = 0;
    pergamino.userData.uniformes.uRadio.value = 4.2;
    pergamino.userData.ajustarPalos();
    grupo.add(pergamino);

    mundo.registrar('pergaminoFinal', pergamino);

    let tl = null;

    return {
      grupo,
      activar({ efectos }) {
        efectos.clima(null);
        efectos.mostrarNubes(true, 2.0, 0.34);
        const u = pergamino.userData.uniformes;
        if (tl) tl.kill();
        u.uEnrollado.value = 0;
        pergamino.userData.ajustarPalos();
        // Se enrolla despacio, al final de la exposición.
        tl = gsap.to(u.uEnrollado, {
          value: 0.72,
          duration: 9,
          delay: 6,
          ease: 'power1.inOut',
          onUpdate: () => pergamino.userData.ajustarPalos(),
        });
      },
      desactivar() {
        if (tl) { tl.kill(); tl = null; }
        pergamino.userData.uniformes.uEnrollado.value = 0;
        pergamino.userData.ajustarPalos();
      },
      animar(t, dt, activa) {
        pergamino.userData.animar(t);
        if (activa) {
          pergamino.position.y = sitio.y + Math.sin(t * 0.35) * 1.2;
        }
      },
    };
  },
};
