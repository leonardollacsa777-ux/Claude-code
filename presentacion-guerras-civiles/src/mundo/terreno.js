/**
 * terreno.js — El mapa 3D en relieve del Peru y los Andes.
 *
 * Es UNA SOLA malla que vive durante toda la presentacion: la camara
 * nunca sale de este mundo. En la escena 2 esta misma malla aparece
 * enrollada como pergamino y en la transicion 2->3 se desenrolla hasta
 * volverse el mapa, sin ningun corte (uniform `uDesenrollado`).
 */

import {
  Mesh, PlaneGeometry, MeshStandardMaterial, Color,
  Float32BufferAttribute, DoubleSide, CircleGeometry, MeshPhysicalMaterial,
  ClampToEdgeWrapping,
} from 'three';
import { alturaEn, NIVEL_MAR, NIVEL_LAGO, LAGO_INFO, enElLago, suave01 } from './relieve.js';
import { LIMITES } from '../data/lugares.js';
import { texturaPergamino } from './textura.js';
import { PALETA } from './paleta.js';

const ANCHO = LIMITES.maxX - LIMITES.minX; // 290
const LARGO = LIMITES.maxZ - LIMITES.minZ; // 500
const CENTRO_X = (LIMITES.maxX + LIMITES.minX) / 2;
const CENTRO_Z = (LIMITES.maxZ + LIMITES.minZ) / 2;

/** Color del suelo segun su altura y su zona. Pinta el mapa como un mapa. */
function colorDelSuelo(x, z, h, destino) {
  const mar = new Color(PALETA.mar);
  const marHondo = new Color(PALETA.marHondo);
  const arena = new Color('#D6C08E');
  const sierra = new Color(PALETA.tierraClara);
  const alta = new Color(PALETA.pergamino);
  const nieve = new Color(PALETA.nieve);
  const selva = new Color(PALETA.selva);

  if (h <= NIVEL_MAR + 0.05) {
    const hondo = suave01((NIVEL_MAR - h) / 1.8);
    return destino.copy(mar).lerp(marHondo, hondo);
  }

  // Selva al este de la cordillera.
  const verde = suave01((x - (LIMITES.minX + ANCHO * 0.62)) / 40);

  if (h < 1.2) destino.copy(arena);
  else if (h < 7) destino.copy(arena).lerp(sierra, suave01((h - 1.2) / 5.8));
  else if (h < 13) destino.copy(sierra).lerp(alta, suave01((h - 7) / 6));
  else destino.copy(alta).lerp(nieve, suave01((h - 13) / 5));

  if (verde > 0 && h < 9) destino.lerp(selva, verde * 0.8);

  return destino;
}

export function crearTerreno({ calidad = 'alta' } = {}) {
  const segX = calidad === 'alta' ? 150 : 96;
  const segZ = calidad === 'alta' ? 250 : 160;

  const geo = new PlaneGeometry(ANCHO, LARGO, segX, segZ);
  geo.rotateX(-Math.PI / 2);
  geo.translate(CENTRO_X, 0, CENTRO_Z);

  const pos = geo.attributes.position;
  const colores = new Float32Array(pos.count * 3);
  const c = new Color();

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    let h = alturaEn(x, z);

    // Bordes del mapa: se hunden un poco para que el pergamino "termine".
    const bx = Math.min(x - LIMITES.minX, LIMITES.maxX - x) / 26;
    const bz = Math.min(z - LIMITES.minZ, LIMITES.maxZ - z) / 26;
    const borde = suave01(Math.min(bx, bz));
    h = NIVEL_MAR - 1.2 + (h - (NIVEL_MAR - 1.2)) * borde;

    pos.setY(i, h);

    colorDelSuelo(x, z, h, c);
    // Los bordes se ven quemados.
    if (borde < 1) c.lerp(new Color(PALETA.quemado), (1 - borde) * 0.85);

    colores[i * 3] = c.r;
    colores[i * 3 + 1] = c.g;
    colores[i * 3 + 2] = c.b;
  }

  geo.setAttribute('color', new Float32BufferAttribute(colores, 3));
  geo.computeVertexNormals();

  // La textura cubre el mapa UNA sola vez. Si se repitiera en mosaico, los
  // bordes quemados que lleva dibujados aparecerian como una rejilla oscura
  // cruzando todo el Peru.
  const mapa = texturaPergamino(1024);
  mapa.repeat.set(1, 1);
  mapa.wrapS = mapa.wrapT = ClampToEdgeWrapping;

  const mat = new MeshStandardMaterial({
    vertexColors: true,
    map: mapa,
    roughness: 0.95,
    metalness: 0.0,
    flatShading: true, // el look low-poly, sin duplicar vertices
  });

  // --- Enganche para la transicion 2 -> 3 (pergamino que se aplana) ---
  // uDesenrollado: 1 = mapa plano (normal), 0 = enrollado como pergamino.
  mat.userData.uniformes = {
    uDesenrollado: { value: 1 },
    uEjeRollo: { value: CENTRO_Z },
    uRadioRollo: { value: 26 },
  };
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, mat.userData.uniformes);
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform float uDesenrollado;
         uniform float uEjeRollo;
         uniform float uRadioRollo;`
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         {
           float k = 1.0 - clamp(uDesenrollado, 0.0, 1.0);
           if (k > 0.0001) {
             float d = transformed.z - uEjeRollo;
             float ang = d / max(uRadioRollo, 0.001);
             float rr = uRadioRollo - transformed.y * 0.35;
             vec3 rollo = vec3(transformed.x, sin(ang) * rr, uEjeRollo + cos(ang) * rr - rr);
             transformed = mix(transformed, rollo, k);
           }
         }`
      );
    mat.userData.shader = shader;
  };

  const malla = new Mesh(geo, mat);
  malla.name = 'terreno';
  malla.receiveShadow = true;
  malla.matrixAutoUpdate = false;
  malla.updateMatrix();
  return malla;
}

/** El oceano Pacifico: un plano grande y brillante. */
export function crearMar() {
  // El mar termina ANTES del borde quemado del mapa: asi el pergamino
  // se ve como una hoja con sus bordes, no como un rectangulo de agua.
  const geo = new PlaneGeometry(ANCHO - 48, LARGO - 48, 1, 1);
  geo.rotateX(-Math.PI / 2);
  geo.translate(CENTRO_X, NIVEL_MAR + 0.3, CENTRO_Z);
  const mat = new MeshPhysicalMaterial({
    color: new Color(PALETA.mar),
    roughness: 0.22,
    metalness: 0.0,
    transparent: true,
    opacity: 0.88,
    side: DoubleSide,
  });
  const m = new Mesh(geo, mat);
  m.name = 'mar';
  m.renderOrder = 1;
  return m;
}

/** El lago Titicaca, donde ocurre la batalla de Huarina (1547). */
export function crearLago() {
  const geo = new CircleGeometry(1, 56);
  geo.rotateX(-Math.PI / 2);
  geo.scale(LAGO_INFO.largo * 1.16, 1, LAGO_INFO.ancho * 1.16);
  geo.rotateY(-LAGO_INFO.giro);
  geo.translate(LAGO_INFO.x, NIVEL_LAGO, LAGO_INFO.z);
  const mat = new MeshPhysicalMaterial({
    color: new Color(PALETA.lago),
    roughness: 0.14,
    metalness: 0.05,
    transparent: true,
    opacity: 0.9,
  });
  const m = new Mesh(geo, mat);
  m.name = 'lago';
  m.renderOrder = 1;
  return m;
}

export { ANCHO, LARGO, CENTRO_X, CENTRO_Z, alturaEn, enElLago };
