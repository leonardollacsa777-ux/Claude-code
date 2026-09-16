/**
 * camara.js — El "rig" de camara.
 *
 * La camara NUNCA se anima directamente. Se animan dos cosas por separado:
 *   - `pos`  : donde esta la camara
 *   - `mira` : el punto al que mira
 * Asi el giro de cabeza es independiente del camino que recorre, que es
 * justo lo que hace que un vuelo parezca de pelicula y no un zoom.
 *
 * Ademas:
 *   - `deriva`     : movimiento suave y continuo mientras el expositor habla
 *                    (la imagen nunca se queda quieta).
 *   - `sacudida`   : vibracion leve para las batallas.
 *   - `inclinacion`: giro sobre el eje de la camara (para espirales y picadas).
 */

import { Vector3, CatmullRomCurve3, MathUtils } from 'three';
import { gsap } from 'gsap';
import { alturaEn } from '../mundo/relieve.js';

const _tmp = new Vector3();
const _tmp2 = new Vector3();

export class Rig {
  constructor(camara) {
    this.camara = camara;
    this.pos = new Vector3(0, 60, 120);
    this.mira = new Vector3(0, 0, 0);

    this.deriva = { ampX: 0.8, ampY: 0.5, vel: 0.12, orbita: 0.012 };
    this.sacudida = 0;
    this.inclinacion = 0;
    this.reloj = 0;

    // Altura minima sobre el suelo: evita que la camara entre en un cerro.
    this.margenSuelo = 1.6;
    this.evitarSuelo = true;
  }

  /** Coloca la camara de golpe (sin animacion). */
  colocar(pos, mira) {
    this.pos.set(pos[0], pos[1], pos[2]);
    this.mira.set(mira[0], mira[1], mira[2]);
    this.inclinacion = 0;
    this.actualizar(0);
  }

  /** Movimiento de reposo de la escena actual. */
  ajustarDeriva(opciones = {}) {
    this.deriva = {
      ampX: 0.8, ampY: 0.5, vel: 0.12, orbita: 0.012,
      ...opciones,
    };
  }

  actualizar(dt) {
    this.reloj += dt;
    const t = this.reloj;
    const d = this.deriva;

    _tmp.copy(this.pos);

    // Orbita lentisima alrededor del punto que mira.
    if (d.orbita) {
      const ang = Math.sin(t * d.vel) * d.orbita;
      const dx = _tmp.x - this.mira.x;
      const dz = _tmp.z - this.mira.z;
      const c = Math.cos(ang);
      const s = Math.sin(ang);
      _tmp.x = this.mira.x + dx * c - dz * s;
      _tmp.z = this.mira.z + dx * s + dz * c;
    }

    // "Respiracion": sube y baja apenas.
    _tmp.y += Math.sin(t * d.vel * 2.3) * d.ampY;
    _tmp.x += Math.sin(t * d.vel * 1.7 + 1.1) * d.ampX;

    // Vibracion de batalla.
    if (this.sacudida > 0.0001) {
      const s = this.sacudida;
      _tmp.x += (Math.sin(t * 37.1) + Math.sin(t * 23.7)) * 0.5 * s;
      _tmp.y += (Math.sin(t * 41.3) + Math.sin(t * 29.1)) * 0.5 * s;
      _tmp.z += Math.sin(t * 31.9) * s * 0.6;
    }

    // No atravesar el suelo.
    if (this.evitarSuelo) {
      const suelo = alturaEn(_tmp.x, _tmp.z) + this.margenSuelo;
      if (_tmp.y < suelo) _tmp.y = suelo;
    }

    this.camara.position.copy(_tmp);
    this.camara.lookAt(this.mira);
    if (Math.abs(this.inclinacion) > 0.0001) {
      this.camara.rotateZ(this.inclinacion);
    }
  }

  /**
   * Vuelo de una estacion a otra.
   * Devuelve una linea de tiempo de GSAP; el director puede saltarla
   * al final con .progress(1) si el expositor presiona "siguiente".
   */
  volar(destino, opciones = {}) {
    const {
      duracion = 3.2,
      suavizado = 'power2.inOut',
      curvaPuntos = null,
      curvaMira = null,
      inclinacionMax = 0,
      suavizadoMira = 'power2.inOut',
      desfaseMira = 0.06,
      alCambiar = null,
      evitarSueloEnVuelo = true,
    } = opciones;

    const desdePos = this.pos.clone();
    const desdeMira = this.mira.clone();
    const haciaPos = new Vector3(destino.posicion[0], destino.posicion[1], destino.posicion[2]);
    const haciaMira = new Vector3(destino.objetivo[0], destino.objetivo[1], destino.objetivo[2]);

    const puntos = curvaPuntos || [desdePos.clone(), haciaPos.clone()];
    const curva = new CatmullRomCurve3(puntos, false, 'catmullrom', 0.5);
    curva.arcLengthDivisions = 240;

    const puntosMira = curvaMira || [
      desdeMira.clone(),
      desdeMira.clone().lerp(haciaMira, 0.5),
      haciaMira.clone(),
    ];
    const curvaM = new CatmullRomCurve3(puntosMira, false, 'catmullrom', 0.5);

    const estado = { t: 0, m: 0, giro: 0 };
    const rig = this;
    const guardarEvitar = this.evitarSuelo;
    this.evitarSuelo = evitarSueloEnVuelo;

    const tl = gsap.timeline({
      onComplete() {
        rig.pos.copy(haciaPos);
        rig.mira.copy(haciaMira);
        rig.inclinacion = 0;
        rig.evitarSuelo = guardarEvitar;
      },
    });

    tl.to(estado, {
      t: 1,
      duration: duracion,
      ease: suavizado,
      onUpdate() {
        curva.getPointAt(MathUtils.clamp(estado.t, 0, 1), _tmp2);
        rig.pos.copy(_tmp2);
        if (alCambiar) alCambiar(estado.t);
      },
    }, 0);

    tl.to(estado, {
      m: 1,
      duration: duracion,
      ease: suavizadoMira,
      onUpdate() {
        curvaM.getPoint(MathUtils.clamp(estado.m, 0, 1), _tmp2);
        rig.mira.copy(_tmp2);
      },
    }, desfaseMira * duracion);

    if (inclinacionMax) {
      tl.to(rig, { inclinacion: inclinacionMax, duration: duracion * 0.4, ease: 'sine.inOut' }, 0)
        .to(rig, { inclinacion: 0, duration: duracion * 0.6, ease: 'sine.inOut' }, duracion * 0.4);
    }

    return tl;
  }

  /** Vibracion de batalla: sube y baja sola. */
  vibrar(intensidad = 0.12, duracion = 0.9) {
    gsap.killTweensOf(this, 'sacudida');
    const tl = gsap.timeline();
    tl.to(this, { sacudida: intensidad, duration: duracion * 0.25, ease: 'power2.out' })
      .to(this, { sacudida: 0, duration: duracion * 0.75, ease: 'power2.in' });
    return tl;
  }
}

/** Altura de crucero segura para volar por encima de la cordillera. */
export function alturaCrucero(desde, hasta, margen = 46) {
  let maxH = -Infinity;
  const pasos = 24;
  for (let i = 0; i <= pasos; i++) {
    const t = i / pasos;
    const x = desde.x + (hasta.x - desde.x) * t;
    const z = desde.z + (hasta.z - desde.z) * t;
    maxH = Math.max(maxH, alturaEn(x, z));
  }
  return maxH + margen;
}

export { Vector3 };
