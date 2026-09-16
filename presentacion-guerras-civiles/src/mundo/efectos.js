/**
 * efectos.js — Todo lo que ocurre DURANTE las transiciones.
 *
 * Las transiciones (src/transiciones/indice.js) piden aqui sus efectos:
 * nubes que atravesar, condores, la estela dorada, la tormenta, la lluvia,
 * el destello al atravesar la corona y el desenfoque de velocidad.
 */

import { Group, Vector3 } from 'three';
import { gsap } from 'gsap';
import { crearNubes } from './nubes.js';
import { crearCondores } from './condores.js';
import { Estela } from './estela.js';
import { Relampagos } from './relampagos.js';
import { crearParticulas } from './particulas.js';

export class Efectos {
  constructor(mundo, camara, capaUI) {
    this.mundo = mundo;
    this.camara = camara;

    this.grupo = new Group();
    this.grupo.name = 'efectos';
    mundo.escena.add(this.grupo);

    // --- Nubes ---
    this.nubes = crearNubes({ cantidad: 110 });
    this.grupo.add(this.nubes);

    // --- Condores ---
    this.condores = crearCondores({ cantidad: 4 });
    this.grupo.add(this.condores);

    // --- Estela dorada ---
    this.estela = new Estela(this.grupo);

    // --- Destello a pantalla completa (capa HTML) ---
    this.velo = document.createElement('div');
    this.velo.className = 'velo';
    capaUI.appendChild(this.velo);

    // --- Relampagos ---
    // alTrueno lo conecta main.js con el módulo de sonido.
    this.alTrueno = null;
    this.relampagos = new Relampagos(this.grupo, {
      alDestellar: (fuerza) => {
        this.parpadeo(fuerza * 0.4, '#DCE9FF');
        this.alTrueno?.(fuerza);
      },
    });

    // --- Clima que acompana a la camara ---
    this.lluvia = crearParticulas('lluvia', { sembrado: 55 });
    this.lluvia.puntos.visible = false;
    this.grupo.add(this.lluvia.puntos);

    this.nieve = crearParticulas('nieve', { sembrado: 56 });
    this.nieve.puntos.visible = false;
    this.grupo.add(this.nieve.puntos);

    // --- Estallido del sello de lacre (transicion 9 -> 10) ---
    this.sello = crearParticulas('sello', { sembrado: 58 });
    this.sello.puntos.visible = false;
    this.grupo.add(this.sello.puntos);

    // --- Cortina de humo (transicion 1 -> 2) ---
    this.humo = crearParticulas('humoDenso', { sembrado: 57 });
    this.humo.puntos.visible = false;
    this.humo.intensidad = 0;
    this.grupo.add(this.humo.puntos);

    this.climaActual = null;
    this.desenfocando = false;
    this.ligero = false;
    this._tmp = new Vector3();
  }

  /* ------------------------------------------------------------- nubes */

  /** Enciende o apaga la capa de nubes (durante los viajes por el cielo). */
  mostrarNubes(visible, duracion = 1.2, opacidad = 0.55) {
    gsap.to(this.nubes.material.uniforms.uOpacidad, {
      value: visible ? opacidad : 0,
      duration: duracion,
      ease: 'power2.inOut',
      overwrite: 'auto',
    });
  }

  /* ---------------------------------------------------------- condores */

  volarCondores(duracion = 5) {
    this.condores.visible = true;
    gsap.killTweensOf(this.condores.scale);
    this.condores.scale.setScalar(0.01);
    gsap.to(this.condores.scale, { x: 1, y: 1, z: 1, duration: 0.9, ease: 'power2.out' });
    gsap.to(this.condores.scale, {
      x: 0.01, y: 0.01, z: 0.01,
      duration: 0.8,
      delay: Math.max(duracion - 1.1, 0.4),
      ease: 'power2.in',
      onComplete: () => { this.condores.visible = false; },
    });
  }

  /* ------------------------------------------------------------ estela */

  dibujarEstela(puntos, duracion = 4, color = '#F0D780') {
    this.estela.dibujar(puntos, duracion, color);
  }

  /* ---------------------------------------------------------- tormenta */

  tormenta(duracion = 5) {
    this.relampagos.tormenta(this.camara, duracion);
  }

  /* ------------------------------------------------------------- clima */

  /** 'lluvia', 'nieve' o null. Las particulas siguen a la camara. */
  clima(nombre, duracion = 1.5) {
    for (const [clave, sistema] of [['lluvia', this.lluvia], ['nieve', this.nieve]]) {
      const activo = clave === nombre;
      if (activo) {
        sistema.puntos.visible = true;
        gsap.to(sistema, { intensidad: 1, duration: duracion, overwrite: 'auto' });
      } else if (sistema.puntos.visible) {
        gsap.to(sistema, {
          intensidad: 0, duration: duracion, overwrite: 'auto',
          onComplete: () => { sistema.puntos.visible = false; },
        });
      }
    }
    this.climaActual = nombre;
  }

  /* -------------------------------------------------- cortina de humo */

  /** El humo que la camara atraviesa al salir de la portada. */
  cortinaHumo(posicion, duracion = 3) {
    this.humo.puntos.visible = true;
    this.humo.mover(posicion[0], posicion[1], posicion[2]);
    gsap.killTweensOf(this.humo);
    gsap.fromTo(this.humo, { intensidad: 0 },
      { intensidad: 1.5, duration: duracion * 0.45, ease: 'power2.in' });
    gsap.to(this.humo, {
      intensidad: 0,
      duration: duracion * 0.45,
      delay: duracion * 0.5,
      ease: 'power2.out',
      onComplete: () => { this.humo.puntos.visible = false; },
    });
  }

  /* ------------------------------------------------- estallido del sello */

  /** El sello de lacre estalla en partículas rojas. */
  estallidoSello(posicion, duracion = 2.4) {
    this.sello.puntos.visible = true;
    this.sello.mover(posicion[0], posicion[1], posicion[2]);
    this.sello.intensidad = 1;
    gsap.killTweensOf(this.sello);
    gsap.to(this.sello, {
      intensidad: 0,
      duration: duracion,
      ease: 'power2.in',
      onComplete: () => { this.sello.puntos.visible = false; },
    });
  }

  /* ---------------------------------------------------------- destello */

  /** Un golpe de luz que cubre la pantalla (atravesar la corona, rayos). */
  parpadeo(fuerza = 0.8, color = '#FFE9A8', duracion = 0.7) {
    this.velo.style.background = color;
    gsap.killTweensOf(this.velo);
    gsap.fromTo(this.velo,
      { opacity: 0 },
      {
        opacity: Math.min(fuerza, 1),
        duration: duracion * 0.25,
        ease: 'power2.out',
        onComplete: () => {
          gsap.to(this.velo, { opacity: 0, duration: duracion * 0.75, ease: 'power2.in' });
        },
      });
  }

  /** Rebobinado: un velo oscuro con rayas, como una cinta de video. */
  rebobinar(duracion = 2.5) {
    this.velo.classList.add('velo--rebobina');
    gsap.fromTo(this.velo, { opacity: 0 }, {
      opacity: 0.5, duration: 0.3, ease: 'power1.out',
      onComplete: () => {
        gsap.to(this.velo, {
          opacity: 0, duration: duracion - 0.5, ease: 'power1.in',
          onComplete: () => this.velo.classList.remove('velo--rebobina'),
        });
      },
    });
  }

  /* -------------------------------------------------------- desenfoque */

  /** Desenfoque de movimiento para los vuelos rapidos. */
  desenfoque(activo, duracion = 0.4) {
    if (this.ligero) { this.desenfocando = false; return; }
    this.desenfocando = activo;
  }

  /* ------------------------------------------------------------ ligero */

  aplicarModoLigero(activo) {
    this.ligero = activo;
    this.nubes.userData.ajustarCantidad(activo ? 0.35 : 1);
    for (const s of [this.lluvia, this.nieve, this.humo]) {
      s.cantidadVisible = activo ? 0.5 : 1;
    }
    if (activo) this.desenfocando = false;
  }

  /* ------------------------------------------------------------- cuadro */

  animar(t, dt) {
    this.nubes.userData.animar(t);
    this.condores.userData.seguir(this.camara, t);

    // El clima acompana a la camara: si no, llueve solo en un punto del mapa.
    const c = this.camara.position;
    if (this.lluvia.puntos.visible) {
      this.lluvia.mover(c.x, c.y + 16, c.z);
      this.lluvia.animar(dt);
      this.lluvia.ajustarNiebla(this.mundo.escena.fog);
    }
    if (this.nieve.puntos.visible) {
      this.nieve.mover(c.x, c.y + 14, c.z);
      this.nieve.animar(dt);
      this.nieve.ajustarNiebla(this.mundo.escena.fog);
    }
    if (this.humo.puntos.visible) {
      this.humo.animar(dt);
      this.humo.ajustarNiebla(this.mundo.escena.fog);
    }
    if (this.sello.puntos.visible) this.sello.animar(dt);
  }

  /** Apaga todo lo que este en marcha (al saltar de escena). */
  apagar() {
    this.relampagos.detener();
    this.estela.borrar();
    this.sello.puntos.visible = false;
    this.condores.visible = false;
    this.desenfocando = false;
    gsap.set(this.velo, { opacity: 0 });
  }
}
