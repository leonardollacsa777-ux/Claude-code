/**
 * relampagos.js — Los rayos de la tormenta (transicion 7 -> 8).
 *
 * Cada rayo es una linea quebrada que aparece dos o tres cuadros, mas un
 * golpe de luz en toda la escena. Barato y muy eficaz.
 */

import {
  Group, Line, BufferGeometry, BufferAttribute, LineBasicMaterial,
  PointLight, Color, AdditiveBlending,
} from 'three';
import { gsap } from 'gsap';
import { semilla } from './ruido.js';

function geometriaRayo(rnd, alto = 46, tramos = 11) {
  const pos = new Float32Array((tramos + 1) * 3);
  let x = 0;
  let z = 0;
  for (let i = 0; i <= tramos; i++) {
    const t = i / tramos;
    x += (rnd() - 0.5) * 6.5;
    z += (rnd() - 0.5) * 5.0;
    pos[i * 3] = x;
    pos[i * 3 + 1] = alto * (1 - t);
    pos[i * 3 + 2] = z;
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(pos, 3));
  return g;
}

export class Relampagos {
  constructor(padre, { alDestellar = null } = {}) {
    this.grupo = new Group();
    this.grupo.name = 'relampagos';
    this.grupo.visible = false;
    padre.add(this.grupo);
    this.alDestellar = alDestellar;

    const rnd = semilla(404);
    this.rayos = [];
    for (let i = 0; i < 4; i++) {
      const mat = new LineBasicMaterial({
        color: new Color('#DCE9FF'),
        transparent: true,
        opacity: 0,
        blending: AdditiveBlending,
        depthWrite: false,
      });
      const linea = new Line(geometriaRayo(rnd, 40 + rnd() * 28), mat);
      linea.frustumCulled = false;
      this.grupo.add(linea);
      this.rayos.push(linea);
    }

    this.luz = new PointLight(0xdce9ff, 0, 340, 1.4);
    this.grupo.add(this.luz);

    this.rnd = rnd;
    this.tl = null;
  }

  /** Lanza una tormenta de `duracion` segundos alrededor de la camara. */
  tormenta(camara, duracion = 5) {
    this.detener();
    this.grupo.visible = true;

    const tl = gsap.timeline({
      onComplete: () => {
        this.grupo.visible = false;
        this.tl = null;
      },
    });

    const cuantos = Math.max(3, Math.round(duracion));
    for (let i = 0; i < cuantos; i++) {
      const cuando = 0.3 + (i / cuantos) * (duracion - 0.9) + this.rnd() * 0.35;
      tl.call(() => this.fogonazo(camara), null, cuando);
    }
    tl.to({}, { duration: duracion });

    this.tl = tl;
    return tl;
  }

  /** Un rayo suelto. */
  fogonazo(camara) {
    const rayo = this.rayos[Math.floor(this.rnd() * this.rayos.length)];
    const lado = this.rnd() < 0.5 ? -1 : 1;

    rayo.position.set(
      camara.position.x + lado * (22 + this.rnd() * 55),
      camara.position.y + 12 + this.rnd() * 30,
      camara.position.z - 30 - this.rnd() * 70
    );
    rayo.rotation.y = this.rnd() * 6.28;

    this.luz.position.copy(rayo.position);

    const fuerza = 0.55 + this.rnd() * 0.45;
    gsap.fromTo(rayo.material, { opacity: 0 }, {
      opacity: fuerza, duration: 0.05, ease: 'none',
      onComplete: () => {
        gsap.to(rayo.material, { opacity: 0, duration: 0.22 + this.rnd() * 0.2, ease: 'power2.in' });
      },
    });
    gsap.fromTo(this.luz, { intensity: 0 }, {
      intensity: 900 * fuerza, duration: 0.06,
      onComplete: () => gsap.to(this.luz, { intensity: 0, duration: 0.3, ease: 'power2.in' }),
    });

    this.alDestellar?.(fuerza);
  }

  detener() {
    if (this.tl) { this.tl.kill(); this.tl = null; }
    for (const r of this.rayos) r.material.opacity = 0;
    this.luz.intensity = 0;
    this.grupo.visible = false;
  }
}
