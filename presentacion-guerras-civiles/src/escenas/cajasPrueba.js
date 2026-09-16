/**
 * cajasPrueba.js — FASE 1: marcadores provisionales.
 *
 * Una caja y un cartel en cada una de las 15 estaciones, para comprobar
 * que el recorrido de la camara, el mapa y la navegacion funcionan.
 * En la Fase 2 cada caja se reemplaza por la escena 3D de verdad
 * (ejercitos, pergamino, corona, ciudades...).
 */

import {
  Group, Mesh, BoxGeometry, CylinderGeometry, MeshStandardMaterial,
  Sprite, SpriteMaterial, CanvasTexture, Color, SRGBColorSpace,
} from 'three';
import { alturaEn } from '../mundo/relieve.js';
import { LUGARES } from '../data/lugares.js';
import { EXPOSITORES } from '../data/escenas.js';

function etiqueta(texto, subtexto, color) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 160;
  const ctx = c.getContext('2d');

  ctx.fillStyle = 'rgba(10, 16, 26, 0.86)';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, c.width - 6, c.height - 6);

  ctx.fillStyle = '#E8D9B5';
  ctx.font = 'bold 74px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(texto, c.width / 2, 58);

  ctx.fillStyle = color;
  ctx.font = '38px Georgia, serif';
  ctx.fillText(subtexto, c.width / 2, 120);

  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

export function crearCajasPrueba(escenas) {
  const grupo = new Group();
  grupo.name = 'cajasPrueba';

  // Varias escenas comparten lugar (por ejemplo 2, 3, 13, 14 y 15 estan en
  // el centro del mapa). Las repartimos en circulo para que se vean todas.
  const cuantas = {};
  for (const esc of escenas) cuantas[esc.lugar] = (cuantas[esc.lugar] || 0) + 1;
  const vistas = {};

  for (const esc of escenas) {
    const lugar = LUGARES[esc.lugar] || LUGARES.centro;
    const total = cuantas[esc.lugar];
    const orden = (vistas[esc.lugar] = (vistas[esc.lugar] || 0) + 1) - 1;
    const radio = total > 1 ? 9 + total * 1.6 : 0;
    const angulo = (orden / total) * Math.PI * 2;
    const px = lugar.x + Math.cos(angulo) * radio;
    const pz = lugar.z + Math.sin(angulo) * radio;
    const suelo = alturaEn(px, pz);
    const color = EXPOSITORES[esc.expositor]?.color || '#C9A227';

    const marca = new Group();
    marca.position.set(px, suelo, pz);
    marca.name = `estacion-${esc.id}`;

    // Poste
    const poste = new Mesh(
      new CylinderGeometry(0.22, 0.22, 9, 6),
      new MeshStandardMaterial({ color: new Color('#4A3A26'), roughness: 0.9 })
    );
    poste.position.y = 4.5;
    marca.add(poste);

    // Caja de prueba
    const caja = new Mesh(
      new BoxGeometry(4.2, 4.2, 4.2),
      new MeshStandardMaterial({
        color: new Color(color),
        roughness: 0.55,
        metalness: 0.15,
        emissive: new Color(color).multiplyScalar(0.18),
      })
    );
    caja.position.y = 2.3;
    caja.rotation.y = Math.PI * 0.18;
    marca.add(caja);

    // Cartel flotante con el numero de escena
    const cartel = new Sprite(new SpriteMaterial({
      map: etiqueta(String(esc.id), lugar.nombre.toUpperCase(), color),
      transparent: true,
      depthTest: true,
    }));
    cartel.scale.set(8, 2.5, 1);
    // Alturas escalonadas: Cusco, Las Salinas y Jaquijahuana estan muy juntos
    // en el mapa y si no sus carteles se taparian entre si.
    cartel.position.y = 11.5 + (orden % 3) * 3.8;
    marca.add(cartel);

    marca.userData.caja = caja;
    grupo.add(marca);
  }

  // Giro lento para que se note que el mundo esta vivo.
  grupo.userData.animar = (t) => {
    for (const marca of grupo.children) {
      const caja = marca.userData.caja;
      if (caja) {
        caja.rotation.y = t * 0.35 + marca.position.x * 0.01;
        caja.position.y = 2.3 + Math.sin(t * 1.2 + marca.position.z * 0.05) * 0.35;
      }
    }
  };

  return grupo;
}
