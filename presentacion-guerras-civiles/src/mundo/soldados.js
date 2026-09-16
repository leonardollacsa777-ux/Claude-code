/**
 * soldados.js — Los ejercitos.
 *
 * Cada soldado es una silueta low-poly (capa, cabeza, casco) con su arma:
 * pica larga, arcabuz o espada. Se dibujan con InstancedMesh, o sea que
 * doscientos soldados cuestan apenas tres llamadas de dibujo: por eso corre
 * en una laptop del colegio.
 */

import {
  Group, InstancedMesh, Object3D, Color, MeshStandardMaterial,
  CylinderGeometry, BoxGeometry, ConeGeometry, DynamicDrawUsage,
} from 'three';
import * as BGU from 'three/addons/utils/BufferGeometryUtils.js';
import { alturaEn } from './relieve.js';
import { semilla } from './ruido.js';
import { PALETA } from './paleta.js';

const _m = new Object3D();

/** Cuerpo del soldado: capa + cabeza + casco, todo en una sola geometria. */
function geometriaCuerpo() {
  const capa = new CylinderGeometry(0.16, 0.42, 1.15, 6, 1);
  capa.translate(0, 0.58, 0);
  const cabeza = new BoxGeometry(0.26, 0.26, 0.22);
  cabeza.translate(0, 1.28, 0);
  const casco = new ConeGeometry(0.2, 0.22, 6);
  casco.translate(0, 1.5, 0);
  return BGU.mergeGeometries([capa, cabeza, casco], false);
}

const ARMAS = {
  pica:    { largo: 3.4, grosor: 0.035, alto: 1.5, inclinacion: -0.32 },
  arcabuz: { largo: 1.5, grosor: 0.06,  alto: 1.0, inclinacion: 1.15 },
  espada:  { largo: 0.9, grosor: 0.05,  alto: 1.0, inclinacion: 0.55 },
};

function geometriaArma(tipo) {
  const a = ARMAS[tipo] || ARMAS.pica;
  const g = new CylinderGeometry(a.grosor, a.grosor, a.largo, 4);
  g.translate(0, a.largo / 2, 0);
  g.rotateX(a.inclinacion);
  g.translate(0.26, a.alto - a.largo * 0.18, 0);
  return g;
}

/**
 * Crea un ejercito.
 *   centro     : [x, z] donde se planta
 *   rumbo      : hacia donde mira (radianes)
 *   cantidad   : cuantos soldados
 *   color      : color del bando
 *   arma       : 'pica' | 'arcabuz' | 'espada'
 */
export function crearEjercito({
  centro = [0, 0],
  rumbo = 0,
  cantidad = 90,
  ancho = 14,
  fondo = 7,
  color = PALETA.rojoOscuro,
  arma = 'pica',
  escala = 1,
  sembrado = 7,
} = {}) {
  const grupo = new Group();
  grupo.name = 'ejercito';

  const matCuerpo = new MeshStandardMaterial({
    roughness: 0.92, metalness: 0.05, flatShading: true,
  });
  const matArma = new MeshStandardMaterial({
    color: new Color('#3B2C1C'), roughness: 0.8, metalness: 0.25, flatShading: true,
  });

  const cuerpos = new InstancedMesh(geometriaCuerpo(), matCuerpo, cantidad);
  const armas = new InstancedMesh(geometriaArma(arma), matArma, cantidad);
  cuerpos.instanceMatrix.setUsage(DynamicDrawUsage);
  armas.instanceMatrix.setUsage(DynamicDrawUsage);
  cuerpos.frustumCulled = false;
  armas.frustumCulled = false;

  const rnd = semilla(sembrado);
  const base = new Color(color);
  const plazas = [];

  for (let i = 0; i < cantidad; i++) {
    // Formacion en bloque, con desorden para que no parezca una cuadricula.
    const filas = Math.max(2, Math.round(Math.sqrt(cantidad * (fondo / ancho))));
    const porFila = Math.ceil(cantidad / filas);
    const fila = Math.floor(i / porFila);
    const col = i % porFila;

    const u = (col / Math.max(porFila - 1, 1) - 0.5) * ancho + (rnd() - 0.5) * 1.5;
    const v = (fila / Math.max(filas - 1, 1) - 0.5) * fondo + (rnd() - 0.5) * 1.1;

    plazas.push({
      u, v,
      giro: rumbo + (rnd() - 0.5) * 0.4,
      alto: escala * (0.9 + rnd() * 0.24),
      fase: rnd() * Math.PI * 2,
    });

    const c = base.clone();
    c.offsetHSL(0, 0, (rnd() - 0.5) * 0.14);
    cuerpos.setColorAt(i, c);
  }
  if (cuerpos.instanceColor) cuerpos.instanceColor.needsUpdate = true;

  grupo.add(cuerpos, armas);

  const cos = Math.cos(rumbo);
  const sin = Math.sin(rumbo);

  /**
   * Coloca a los soldados.
   *   avance  : cuanto han caminado hacia adelante (en unidades del mundo)
   *   t       : tiempo, para el balanceo de la marcha
   */
  function colocar(avance = 0, t = 0) {
    for (let i = 0; i < cantidad; i++) {
      const p = plazas[i];
      // El eje "u" es el frente de la formacion; el "v" la profundidad.
      const dx = p.u * cos - (p.v + avance) * sin;
      const dz = p.u * sin + (p.v + avance) * cos;
      const x = centro[0] + dx;
      const z = centro[1] + dz;
      const y = alturaEn(x, z);

      const paso = Math.sin(t * 5.5 + p.fase) * 0.055;
      _m.position.set(x, y + paso, z);
      _m.rotation.set(0, p.giro, Math.sin(t * 2.7 + p.fase) * 0.03);
      _m.scale.setScalar(p.alto);
      _m.updateMatrix();
      cuerpos.setMatrixAt(i, _m.matrix);
      armas.setMatrixAt(i, _m.matrix);
    }
    cuerpos.instanceMatrix.needsUpdate = true;
    armas.instanceMatrix.needsUpdate = true;
  }

  colocar(0, 0);

  grupo.userData.colocar = colocar;
  grupo.userData.cantidad = cantidad;
  grupo.userData.cuerpos = cuerpos;

  /** Cambia el color de algunos soldados: para Jaquijahuana, cuando se pasan al rey. */
  grupo.userData.tenir = (fraccion, nuevoColor) => {
    const c = new Color(nuevoColor);
    const cuantos = Math.floor(cantidad * fraccion);
    for (let i = 0; i < cuantos; i++) {
      const cc = c.clone();
      cc.offsetHSL(0, 0, (i % 7 - 3) * 0.02);
      cuerpos.setColorAt(i, cc);
    }
    if (cuerpos.instanceColor) cuerpos.instanceColor.needsUpdate = true;
  };

  return grupo;
}
