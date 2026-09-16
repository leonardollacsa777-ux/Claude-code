/**
 * letrero.js — Carteles de texto dentro del mundo 3D
 * (fechas de batalla, años de la línea de tiempo, nombres de lugares).
 */

import {
  Mesh, PlaneGeometry, MeshBasicMaterial, CanvasTexture,
  SRGBColorSpace, DoubleSide, Group, Color,
} from 'three';
import { PALETA } from './paleta.js';

export function crearLetrero(texto, {
  alto = 2,
  color = PALETA.pergamino,
  fondo = 'rgba(12,18,28,0.82)',
  borde = PALETA.dorado,
  fuente = 'Cinzel, Georgia, serif',
  peso = 600,
  relleno = 0.45,
  mirarCamara = true,
} = {}) {
  const px = 128;
  const medir = document.createElement('canvas').getContext('2d');
  medir.font = `${peso} ${px}px ${fuente}`;
  const anchoTexto = medir.measureText(texto).width;

  const pad = px * relleno;
  const A = Math.ceil(anchoTexto + pad * 2);
  const H = Math.ceil(px * 1.55);

  const c = document.createElement('canvas');
  c.width = A;
  c.height = H;
  const x = c.getContext('2d');

  if (fondo) {
    x.fillStyle = fondo;
    x.fillRect(0, 0, A, H);
  }
  if (borde) {
    x.strokeStyle = borde;
    x.lineWidth = 6;
    x.strokeRect(3, 3, A - 6, H - 6);
  }

  x.fillStyle = color;
  x.font = `${peso} ${px}px ${fuente}`;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText(texto, A / 2, H / 2 + px * 0.04);

  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;

  const ancho = alto * (A / H);
  const malla = new Mesh(
    new PlaneGeometry(ancho, alto),
    new MeshBasicMaterial({ map: tex, transparent: true, side: DoubleSide, depthWrite: false })
  );
  malla.renderOrder = 7;
  malla.userData.mirarCamara = mirarCamara;
  malla.userData.medidas = { ancho, alto };
  return malla;
}

/** Hace que una lista de letreros mire siempre a la camara. */
export function orientarLetreros(lista, camara) {
  for (const l of lista) {
    if (!l.visible) continue;
    l.quaternion.copy(camara.quaternion);
  }
}

/** Un pilar de piedra con su año grabado (escena 13). */
export function crearPilar(anio, descripcion, { alto = 9 } = {}) {
  const grupo = new Group();

  const piedra = new Mesh(
    new PlaneGeometry(1, 1),
    new MeshBasicMaterial({ visible: false })
  );
  grupo.add(piedra);

  const letreroAnio = crearLetrero(anio, {
    alto: 2.6, color: '#FFE9A8', fondo: 'rgba(10,16,26,0.86)', peso: 700,
  });
  letreroAnio.position.y = alto;
  grupo.add(letreroAnio);

  const letreroTexto = crearLetrero(descripcion, {
    alto: 1.15, color: PALETA.pergamino, fondo: 'rgba(10,16,26,0.7)',
    borde: null, fuente: '"EB Garamond", Georgia, serif', peso: 500, relleno: 0.35,
  });
  letreroTexto.position.y = alto - 2.3;
  grupo.add(letreroTexto);

  grupo.userData.letreros = [letreroAnio, letreroTexto];
  grupo.userData.alto = alto;
  return grupo;
}

export { Color };
