/**
 * banderas.js — Estandartes que ondean.
 * El ondeo se hace en el shader del vertice (no en JavaScript): asi
 * ondear veinte banderas no le cuesta nada al procesador.
 */

import {
  Group, Mesh, PlaneGeometry, CylinderGeometry, MeshStandardMaterial,
  Color, DoubleSide,
} from 'three';
import { alturaEn } from './relieve.js';
import { PALETA } from './paleta.js';

const relojes = [];

/** Crea un estandarte: asta + pano que ondea. */
export function crearBandera({
  posicion = [0, 0],
  color = PALETA.rojoOscuro,
  colorFranja = null,
  alto = 4.2,
  ancho = 1.9,
  altoPano = 1.25,
  giro = 0,
  fase = Math.random() * 6.28,
} = {}) {
  const grupo = new Group();
  const [x, z] = posicion;
  const y = alturaEn(x, z);
  grupo.position.set(x, y, z);
  grupo.rotation.y = giro;

  const asta = new Mesh(
    new CylinderGeometry(0.055, 0.07, alto, 5),
    new MeshStandardMaterial({ color: new Color('#4A3A26'), roughness: 0.85 })
  );
  asta.position.y = alto / 2;
  grupo.add(asta);

  const geo = new PlaneGeometry(ancho, altoPano, 14, 6);
  geo.translate(ancho / 2, 0, 0);

  const mat = new MeshStandardMaterial({
    color: new Color(color),
    roughness: 0.78,
    side: DoubleSide,
    flatShading: false,
  });

  mat.userData.uniformes = { uTiempo: { value: fase }, uFuerza: { value: 1 } };
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, mat.userData.uniformes);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        uniform float uTiempo;
        uniform float uFuerza;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        {
          float d = transformed.x / ${ancho.toFixed(3)};
          float onda = sin(d * 6.0 - uTiempo * 5.0) * 0.22
                     + sin(d * 11.0 - uTiempo * 7.3) * 0.09;
          transformed.z += onda * d * uFuerza;
          transformed.y += sin(d * 4.0 - uTiempo * 4.2) * 0.07 * d * uFuerza;
        }`);
    mat.userData.shader = shader;
  };

  const pano = new Mesh(geo, mat);
  pano.position.set(0.05, alto - altoPano / 2 - 0.2, 0);
  grupo.add(pano);

  // Franja cruzada (la cruz de Borgona de los tercios, simplificada).
  if (colorFranja) {
    const franja = new Mesh(
      new PlaneGeometry(ancho * 0.96, altoPano * 0.2, 10, 2),
      new MeshStandardMaterial({ color: new Color(colorFranja), side: DoubleSide, roughness: 0.8 })
    );
    franja.geometry.translate(ancho * 0.48, 0, 0);
    franja.position.set(0.06, alto - altoPano / 2 - 0.2, 0.012);
    franja.rotation.z = 0.22;
    grupo.add(franja);
  }

  relojes.push(mat.userData.uniformes);
  grupo.userData.uniformes = mat.userData.uniformes;
  return grupo;
}

/** Hay que llamarlo una vez por cuadro para que todas ondeen. */
export function animarBanderas(dt) {
  for (const u of relojes) u.uTiempo.value += dt;
}
