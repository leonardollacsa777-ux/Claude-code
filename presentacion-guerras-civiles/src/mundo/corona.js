/**
 * corona.js — La corona real de Castilla (simplificada).
 *
 * Es la imagen del rey en la presentacion: aparece en el cielo sobre Chupas,
 * la camara la atraviesa (transicion 8 -> 9) y al final crece enorme sobre
 * el mapa en la escena 14.
 */

import {
  Group, Mesh, CylinderGeometry, SphereGeometry, TorusGeometry, BoxGeometry,
  ConeGeometry, MeshStandardMaterial, Color,
} from 'three';
import { PALETA } from './paleta.js';

export function crearCorona({ radio = 3.2, puntas = 8 } = {}) {
  const grupo = new Group();
  grupo.name = 'corona';

  const oro = new MeshStandardMaterial({
    color: new Color(PALETA.dorado),
    roughness: 0.24,
    metalness: 0.92,
    emissive: new Color(PALETA.dorado).multiplyScalar(0.2),
  });
  const rubi = new MeshStandardMaterial({
    color: new Color('#9B1B1B'), roughness: 0.15, metalness: 0.35,
    emissive: new Color('#5A0E0E'),
  });
  const perla = new MeshStandardMaterial({
    color: new Color('#F3EADA'), roughness: 0.3, metalness: 0.2,
  });

  // Aro principal.
  const aro = new Mesh(new CylinderGeometry(radio, radio * 1.04, radio * 0.42, 28, 1, true), oro);
  aro.position.y = radio * 0.21;
  grupo.add(aro);

  // Molduras arriba y abajo del aro.
  for (const y of [0, radio * 0.42]) {
    const mold = new Mesh(new TorusGeometry(radio * 1.01, radio * 0.055, 8, 30), oro);
    mold.rotation.x = Math.PI / 2;
    mold.position.y = y;
    grupo.add(mold);
  }

  // Piedras del aro.
  for (let i = 0; i < puntas; i++) {
    const a = (i / puntas) * Math.PI * 2;
    const piedra = new Mesh(new SphereGeometry(radio * 0.1, 10, 8), i % 2 ? rubi : perla);
    piedra.position.set(Math.cos(a) * radio * 1.02, radio * 0.21, Math.sin(a) * radio * 1.02);
    piedra.scale.z = 0.55;
    grupo.add(piedra);
  }

  // Puntas de flor de lis (simplificadas a hojas).
  for (let i = 0; i < puntas; i++) {
    const a = (i / puntas) * Math.PI * 2;
    const punta = new Mesh(new ConeGeometry(radio * 0.16, radio * 0.52, 5), oro);
    punta.position.set(Math.cos(a) * radio, radio * 0.68, Math.sin(a) * radio);
    punta.lookAt(Math.cos(a) * radio * 2, radio * 1.6, Math.sin(a) * radio * 2);
    punta.rotateX(Math.PI / 2);
    grupo.add(punta);

    const bolita = new Mesh(new SphereGeometry(radio * 0.07, 8, 6), perla);
    bolita.position.set(Math.cos(a) * radio * 1.02, radio * 0.95, Math.sin(a) * radio * 1.02);
    grupo.add(bolita);
  }

  // Arcos que se juntan arriba (corona cerrada, como la imperial).
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const arco = new Mesh(new TorusGeometry(radio * 0.82, radio * 0.05, 6, 22, Math.PI), oro);
    arco.position.y = radio * 0.6;
    arco.rotation.y = a;
    arco.rotation.z = 0;
    grupo.add(arco);
  }

  // Orbe y cruz.
  const orbe = new Mesh(new SphereGeometry(radio * 0.18, 14, 12), oro);
  orbe.position.y = radio * 1.5;
  grupo.add(orbe);

  const cruzV = new Mesh(new BoxGeometry(radio * 0.07, radio * 0.42, radio * 0.07), oro);
  cruzV.position.y = radio * 1.8;
  grupo.add(cruzV);
  const cruzH = new Mesh(new BoxGeometry(radio * 0.26, radio * 0.07, radio * 0.07), oro);
  cruzH.position.y = radio * 1.82;
  grupo.add(cruzH);

  grupo.userData.animar = (t) => {
    grupo.rotation.y = t * 0.16;
  };

  return grupo;
}
