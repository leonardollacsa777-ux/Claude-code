/**
 * transiciones/efectos.js — Qué se ve durante cada transición.
 *
 * `src/transiciones/indice.js` define POR DÓNDE vuela la cámara.
 * Este archivo define QUÉ PASA mientras vuela: el humo que se atraviesa,
 * las nubes, los cóndores, la estela, la tormenta, el destello dorado…
 *
 * Cada entrada recibe:
 *   efectos   el gestor de efectos
 *   tl        la línea de tiempo del vuelo (para encadenar cosas)
 *   duracion  cuánto dura la transición
 *   puntos    los puntos por los que pasa la cámara
 *   mundo     para alcanzar objetos compartidos (el pergamino, la corona…)
 *   camara    la cámara
 */

import { gsap } from 'gsap';
import { Vector3 } from 'three';

/** Punto medio del recorrido: donde conviene poner el humo o el destello. */
function medio(puntos) {
  if (!puntos || !puntos.length) return [0, 0, 0];
  const p = puntos[Math.floor(puntos.length / 2)];
  return [p.x, p.y, p.z];
}

export const EFECTOS_TRANSICION = {

  // 1 -> 2 : la cámara atraviesa el humo de la batalla.
  'atravesar-humo'({ efectos, puntos, duracion }) {
    efectos.mostrarNubes(false, 0.6);
    const m = medio(puntos);
    efectos.cortinaHumo([m[0], m[1] - 1, m[2]], duracion);
  },

  // 2 -> 3 : el pergamino se estira y SE CONVIERTE en el mapa.
  'pergamino-a-mapa'({ efectos, tl, duracion, mundo }) {
    efectos.mostrarNubes(false, 0.8);
    const pergamino = mundo.obtener('pergamino');
    if (!pergamino) return;

    const hoja = pergamino.userData.hoja;
    const sello = pergamino.userData.sello;

    // Crece, se aplana y se funde con el mapa que ya está debajo.
    tl.to(pergamino.scale, { x: 9, y: 9, z: 9, duration: duracion * 0.72, ease: 'power2.in' }, 0.15);
    tl.to(pergamino.rotation, { x: -Math.PI / 2 + 0.06, duration: duracion * 0.66, ease: 'power2.inOut' }, 0.15);
    tl.to(hoja.material, { opacity: 0, duration: duracion * 0.34, ease: 'power2.in' }, duracion * 0.5);
    tl.call(() => { hoja.material.transparent = true; }, null, 0);
    if (sello) tl.to(sello.scale, { x: 0.01, y: 0.01, z: 0.01, duration: duracion * 0.3 }, 0.1);

    // Al terminar lo dejamos listo por si se vuelve atrás.
    tl.call(() => {
      pergamino.visible = false;
      pergamino.scale.setScalar(1);
      pergamino.rotation.x = -0.34;
      hoja.material.opacity = 1;
      if (sello) sello.scale.setScalar(1);
    }, null, duracion);
  },

  // 3 -> 4 : los retratos se levantan del mapa girando.
  'giro-orbital'({ efectos, tl, duracion, mundo }) {
    efectos.mostrarNubes(false, 0.8);
    const retratos = mundo.obtener('retratos');
    if (!retratos) return;
    gsap.killTweensOf(retratos.scale);
    retratos.scale.set(0.02, 0.02, 0.02);
    tl.to(retratos.scale, {
      x: 1, y: 1, z: 1,
      duration: duracion * 0.7,
      ease: 'back.out(1.35)',
    }, duracion * 0.24);
  },

  // 4 -> 5 : VIAJE POR EL CIELO de día, con cóndores y estela.
  'cielo-dia'({ efectos, puntos, duracion }) {
    efectos.mostrarNubes(true, 1.1, 0.62);
    efectos.volarCondores(duracion);
    efectos.dibujarEstela(puntos, duracion, '#F0D780');
    gsap.delayedCall(duracion - 0.9, () => efectos.mostrarNubes(false, 1.1));
  },

  // 5 -> 6 : picada y vuelo a ras del suelo.
  'rasante'({ efectos, duracion }) {
    efectos.mostrarNubes(false, 0.5);
    efectos.desenfoque(true);
    gsap.delayedCall(duracion - 0.5, () => efectos.desenfoque(false));
  },

  // 6 -> 7 : VIAJE POR EL CIELO con el atardecer volviéndose noche.
  'cielo-dia-a-noche'({ efectos, puntos, duracion }) {
    efectos.mostrarNubes(true, 1.2, 0.5);
    efectos.volarCondores(duracion * 0.7);
    efectos.dibujarEstela(puntos, duracion, '#E8C27A');
    gsap.delayedCall(duracion - 1.0, () => efectos.mostrarNubes(false, 1.2));
  },

  // 7 -> 8 : VIAJE POR LA TORMENTA.
  'tormenta'({ efectos, duracion }) {
    efectos.mostrarNubes(true, 0.9, 0.8);
    efectos.tormenta(duracion);
    gsap.delayedCall(duracion * 0.45, () => efectos.clima('lluvia', 1.2));
    gsap.delayedCall(duracion - 0.8, () => efectos.mostrarNubes(false, 1.4));
  },

  // 8 -> 9 : atravesar la corona con un destello dorado.
  'atravesar-corona'({ efectos, tl, duracion }) {
    efectos.mostrarNubes(false, 0.6);
    tl.call(() => {
      efectos.parpadeo(0.92, '#FFE9A8', 0.9);
      efectos.clima(null, 0.8);
    }, null, duracion * 0.52);
  },

  // 9 -> 10 : el sello estalla y su estela guía el vuelo hacia el norte.
  'estela-sello'({ efectos, tl, puntos, duracion, mundo }) {
    const documento = mundo.obtener('documento');
    if (documento?.userData.sello) {
      const s = documento.userData.sello;
      const p = new Vector3();
      s.getWorldPosition(p);
      efectos.estallidoSello([p.x, p.y, p.z], 2.6);
      gsap.killTweensOf(s.scale);
      tl.to(s.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 0.35, ease: 'power3.in' }, 0);
      tl.call(() => s.scale.setScalar(1), null, duracion);
    }
    efectos.mostrarNubes(true, 1.2, 0.55);
    efectos.dibujarEstela(puntos, duracion, '#E06A5A');
    gsap.delayedCall(duracion - 1.0, () => efectos.mostrarNubes(false, 1.2));
  },

  // 10 -> 11 : espiral hacia arriba y vuelo a ras del lago.
  'espiral-agua'({ efectos, puntos, duracion }) {
    efectos.mostrarNubes(true, 1.0, 0.45);
    efectos.volarCondores(duracion * 0.6);
    efectos.dibujarEstela(puntos, duracion, '#9FD8E8');
    gsap.delayedCall(duracion * 0.5, () => efectos.mostrarNubes(false, 1.2));
  },

  // 11 -> 12 : barrido lateral rapidísimo.
  'barrido'({ efectos, duracion }) {
    efectos.mostrarNubes(false, 0.4);
    efectos.desenfoque(true);
    gsap.delayedCall(duracion - 0.4, () => efectos.desenfoque(false));
  },

  // 12 -> 13 : subida por encima de las nubes.
  'subida-al-cielo'({ efectos, duracion }) {
    efectos.mostrarNubes(true, duracion * 0.6, 0.58);
  },

  // 13 -> 14 : carrera por el camino de luz.
  'carrera'({ efectos, duracion }) {
    efectos.desenfoque(true);
    efectos.mostrarNubes(true, 0.8, 0.4);
    gsap.delayedCall(duracion - 0.5, () => {
      efectos.desenfoque(false);
      efectos.parpadeo(0.55, '#FFE9A8', 0.8);
    });
  },

  // 14 -> 15 : amanece sobre los Andes.
  'amanecer'({ efectos, duracion }) {
    efectos.mostrarNubes(true, duracion * 0.7, 0.35);
  },

  // 15 -> 1 : rebobinado rápido a la portada.
  'rebobinado'({ efectos, duracion, mundo }) {
    efectos.rebobinar(duracion);
    efectos.mostrarNubes(false, 0.5);
    // Dejamos el pergamino de la escena 2 listo para volver a usarse.
    const pergamino = mundo.obtener('pergamino');
    if (pergamino) {
      pergamino.visible = true;
      pergamino.scale.setScalar(1);
      pergamino.rotation.x = -0.34;
      pergamino.userData.hoja.material.opacity = 1;
      pergamino.userData.uniformes.uEnrollado.value = 1;
      pergamino.userData.ajustarPalos();
    }
  },
};

/** Lanza los efectos de una transición. Si no tiene, no pasa nada. */
export function aplicarEfectosTransicion(nombre, ctx) {
  const fn = EFECTOS_TRANSICION[nombre];
  if (fn) fn(ctx);
}

export default EFECTOS_TRANSICION;
