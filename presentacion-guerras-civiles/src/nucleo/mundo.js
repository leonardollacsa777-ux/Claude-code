/**
 * mundo.js — El mundo 3D unico.
 *
 * Aqui se arma UNA sola escena de three.js que dura toda la presentacion.
 * Nunca se borra ni se recarga: la camara simplemente viaja por ella.
 * Tambien guarda el "registro de props": objetos que sobreviven entre
 * escenas y se transforman (el pergamino que se vuelve mapa, la corona
 * que se atraviesa y luego crece...). Eso es lo que hace que las
 * transiciones se sientan conectadas y no como diapositivas.
 */

import { Scene, Group } from 'three';
import { crearTerreno, crearMar, crearLago } from '../mundo/terreno.js';
import { Ambiente } from '../mundo/cielo.js';

export class Mundo {
  constructor({ calidad = 'alta' } = {}) {
    this.escena = new Scene();
    this.props = new Map();
    this.animables = [];

    this.terreno = crearTerreno({ calidad });
    this.mar = crearMar();
    this.lago = crearLago();

    this.escena.add(this.terreno, this.mar, this.lago);

    this.decorado = new Group();
    this.decorado.name = 'decorado';
    this.escena.add(this.decorado);

    this.ambiente = new Ambiente(this.escena);
  }

  /** Guarda un objeto que varias escenas van a compartir y transformar. */
  registrar(nombre, objeto) {
    this.props.set(nombre, objeto);
    return objeto;
  }

  obtener(nombre) {
    return this.props.get(nombre);
  }

  /** Objetos que necesitan actualizarse en cada cuadro. */
  animar(fn) {
    this.animables.push(fn);
  }

  actualizar(t, dt) {
    for (const fn of this.animables) fn(t, dt);
  }

  /** Control del uniform que aplana el pergamino hasta volverlo mapa. */
  set desenrollado(v) {
    const u = this.terreno.material.userData.uniformes;
    if (u) u.uDesenrollado.value = v;
  }
  get desenrollado() {
    return this.terreno.material.userData.uniformes?.uDesenrollado.value ?? 1;
  }
}
