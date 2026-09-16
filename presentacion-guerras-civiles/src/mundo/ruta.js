/**
 * ruta.js — Rutas punteadas sobre el mapa.
 * Se usan para el regreso de Almagro desde Chile y para marcar recorridos.
 */

import {
  Group, Mesh, InstancedMesh, Object3D, SphereGeometry,
  MeshBasicMaterial, Color, CatmullRomCurve3, Vector3, AdditiveBlending,
} from 'three';
import { alturaEn } from './relieve.js';
import { PALETA } from './paleta.js';

const _m = new Object3D();

/**
 * Ruta de puntos que se van encendiendo.
 * @param puntos  lista de [x, z] por los que pasa la ruta
 */
export function crearRuta(puntos, {
  cantidad = 64,
  color = PALETA.dorado,
  tamano = 0.45,
  altura = 1.4,
} = {}) {
  const grupo = new Group();
  grupo.name = 'ruta';

  const guia = new CatmullRomCurve3(
    puntos.map(([x, z]) => new Vector3(x, 0, z)),
    false, 'catmullrom', 0.5
  );

  const mat = new MeshBasicMaterial({
    color: new Color(color),
    transparent: true,
    opacity: 0.95,
    blending: AdditiveBlending,
    depthWrite: false,
  });

  const bolas = new InstancedMesh(new SphereGeometry(tamano, 8, 6), mat, cantidad);
  bolas.frustumCulled = false;
  bolas.renderOrder = 6;

  const sitios = [];
  for (let i = 0; i < cantidad; i++) {
    const t = i / (cantidad - 1);
    const p = guia.getPoint(t);
    sitios.push(new Vector3(p.x, alturaEn(p.x, p.z) + altura, p.z));
  }

  grupo.add(bolas);

  let progreso = 0;

  function pintar(t = 0) {
    for (let i = 0; i < cantidad; i++) {
      const k = i / (cantidad - 1);
      const visible = k <= progreso;
      const pulso = visible ? 1 + Math.sin(t * 3 - k * 9) * 0.28 : 0;
      _m.position.copy(sitios[i]);
      _m.scale.setScalar(visible ? pulso : 0.0001);
      _m.updateMatrix();
      bolas.setMatrixAt(i, _m.matrix);
    }
    bolas.instanceMatrix.needsUpdate = true;
  }

  pintar(0);

  grupo.userData.pintar = pintar;
  grupo.userData.setProgreso = (v) => { progreso = v; };
  grupo.userData.getProgreso = () => progreso;
  grupo.userData.sitios = sitios;
  grupo.userData.material = mat;
  return grupo;
}
