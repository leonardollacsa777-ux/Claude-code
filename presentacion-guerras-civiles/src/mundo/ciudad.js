/**
 * ciudad.js — Maquetas simples de ciudad (el Cusco, Lima, Quito).
 * Casas con techo de teja, una iglesia con campanario y la plaza.
 */

import {
  Group, Mesh, BoxGeometry, ConeGeometry, CylinderGeometry,
  MeshStandardMaterial, Color, InstancedMesh, Object3D, DynamicDrawUsage,
} from 'three';
import * as BGU from 'three/addons/utils/BufferGeometryUtils.js';
import { alturaEn } from './relieve.js';
import { semilla } from './ruido.js';

const _m = new Object3D();

/** Una casa = cuerpo blanco + techo de teja, en una sola geometria. */
function geometriaCasa() {
  const cuerpo = new BoxGeometry(1, 1, 1);
  cuerpo.translate(0, 0.5, 0);
  return cuerpo;
}
function geometriaTecho() {
  const t = new ConeGeometry(0.82, 0.5, 4);
  t.rotateY(Math.PI / 4);
  t.translate(0, 1.25, 0);
  return t;
}

export function crearCiudad({
  centro = [0, 0],
  radio = 9,
  casas = 40,
  sembrado = 21,
  conIglesia = true,
  giro = 0,
} = {}) {
  const grupo = new Group();
  grupo.name = 'ciudad';

  const matMuro = new MeshStandardMaterial({
    color: new Color('#E2D6BE'), roughness: 0.92, flatShading: true,
  });
  const matTeja = new MeshStandardMaterial({
    color: new Color('#9C5334'), roughness: 0.88, flatShading: true,
  });

  const muros = new InstancedMesh(geometriaCasa(), matMuro, casas);
  const techos = new InstancedMesh(geometriaTecho(), matTeja, casas);
  muros.instanceMatrix.setUsage(DynamicDrawUsage);
  techos.instanceMatrix.setUsage(DynamicDrawUsage);

  const rnd = semilla(sembrado);
  const base = new Color('#E2D6BE');

  for (let i = 0; i < casas; i++) {
    // Reparto en anillos: deja libre la plaza del centro.
    const ang = rnd() * Math.PI * 2;
    const r = radio * (0.28 + Math.sqrt(rnd()) * 0.72);
    const x = centro[0] + Math.cos(ang) * r;
    const z = centro[1] + Math.sin(ang) * r;
    const y = alturaEn(x, z);

    const ancho = 1.5 + rnd() * 1.5;
    const alto = 1.3 + rnd() * 1.1;
    const fondo = 1.5 + rnd() * 1.4;

    _m.position.set(x, y, z);
    _m.rotation.set(0, giro + Math.round(rnd() * 4) * (Math.PI / 2) + (rnd() - 0.5) * 0.25, 0);
    _m.scale.set(ancho, alto, fondo);
    _m.updateMatrix();
    muros.setMatrixAt(i, _m.matrix);

    _m.scale.set(ancho * 1.18, alto, fondo * 1.18);
    _m.updateMatrix();
    techos.setMatrixAt(i, _m.matrix);

    const c = base.clone();
    c.offsetHSL(0, 0, (rnd() - 0.5) * 0.1);
    muros.setColorAt(i, c);
  }
  if (muros.instanceColor) muros.instanceColor.needsUpdate = true;
  grupo.add(muros, techos);

  if (conIglesia) {
    const iglesia = new Group();
    const y = alturaEn(centro[0], centro[1]);
    iglesia.position.set(centro[0], y, centro[1]);
    iglesia.rotation.y = giro;

    const nave = new Mesh(new BoxGeometry(5.2, 3.2, 8.4), matMuro);
    nave.position.y = 1.6;
    iglesia.add(nave);

    const techo = new Mesh(new ConeGeometry(4.2, 1.7, 4), matTeja);
    techo.rotation.y = Math.PI / 4;
    techo.position.y = 4.0;
    techo.scale.set(1, 1, 1.5);
    iglesia.add(techo);

    const torre = new Mesh(new BoxGeometry(2.1, 6.4, 2.1), matMuro);
    torre.position.set(0, 3.2, 4.6);
    iglesia.add(torre);

    const campanario = new Mesh(new ConeGeometry(1.7, 2.4, 4), matTeja);
    campanario.rotation.y = Math.PI / 4;
    campanario.position.set(0, 7.6, 4.6);
    iglesia.add(campanario);

    const cruz = new Mesh(
      new CylinderGeometry(0.07, 0.07, 1.3, 4),
      new MeshStandardMaterial({ color: new Color('#C9A227'), metalness: 0.8, roughness: 0.3 })
    );
    cruz.position.set(0, 9.4, 4.6);
    iglesia.add(cruz);

    grupo.add(iglesia);
    grupo.userData.iglesia = iglesia;
  }

  grupo.userData.centro = centro;
  return grupo;
}
