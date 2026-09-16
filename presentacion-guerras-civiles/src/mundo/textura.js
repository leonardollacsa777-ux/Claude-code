/**
 * textura.js — Texturas dibujadas por codigo (no hay archivos de imagen).
 * Asi la presentacion funciona sin internet y pesa poquisimo.
 */

import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';
import { fbm } from './ruido.js';
import { PALETA } from './paleta.js';

function lienzo(tam) {
  const c = document.createElement('canvas');
  c.width = c.height = tam;
  return c;
}

/** Pergamino antiguo: manchas, vetas y bordes quemados. */
export function texturaPergamino(tam = 1024, { bordesQuemados = true } = {}) {
  const c = lienzo(tam);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(tam, tam);
  const d = img.data;

  const base = [0xe8, 0xd9, 0xb5];
  const veta = [0xb9, 0x9d, 0x6d];

  for (let y = 0; y < tam; y++) {
    for (let x = 0; x < tam; x++) {
      const u = (x / tam) * 8;
      const v = (y / tam) * 8;

      // Manchas grandes + fibra fina del papel.
      const mancha = fbm(u * 1.2, v * 1.2, 5);
      const fibra = fbm(u * 26, v * 5, 2);
      let m = mancha * 0.75 + fibra * 0.25;
      m = Math.min(1, Math.max(0, (m - 0.22) * 2.1));

      let r = base[0] + (veta[0] - base[0]) * m;
      let g = base[1] + (veta[1] - base[1]) * m;
      let b = base[2] + (veta[2] - base[2]) * m;

      if (bordesQuemados) {
        // Distancia al borde mas cercano, 0 en el borde, 1 al centro.
        const dx = Math.min(x, tam - 1 - x) / tam;
        const dy = Math.min(y, tam - 1 - y) / tam;
        const borde = Math.min(dx, dy) * 2; // 0..1

        // El fuego no quema recto: le metemos ruido al contorno.
        const mordida = fbm((x / tam) * 16, (y / tam) * 16, 3) * 0.085;
        const q = 1 - Math.min(1, Math.max(0, (borde - mordida) / 0.105));
        if (q > 0) {
          const t = q * q;
          r = r * (1 - t) + 0x3a * t;
          g = g * (1 - t) + 0x24 * t;
          b = b * (1 - t) + 0x15 * t;
        }
      }

      const i = (y * tam + x) * 4;
      d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

/** Circulo suave: sirve de "chispa", brasa, polvo y punto de humo. */
export function texturaPunto(tam = 128, color = '#ffffff', dureza = 0.25) {
  const c = lienzo(tam);
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(tam / 2, tam / 2, tam * dureza * 0.1, tam / 2, tam / 2, tam / 2);
  g.addColorStop(0, color);
  g.addColorStop(dureza, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, tam, tam);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

/** Mancha irregular de humo / nube. */
export function texturaHumo(tam = 256) {
  const c = lienzo(tam);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(tam, tam);
  const d = img.data;
  for (let y = 0; y < tam; y++) {
    for (let x = 0; x < tam; x++) {
      const u = (x / tam) * 4;
      const v = (y / tam) * 4;
      const n = fbm(u * 2 + 11, v * 2 + 7, 4);
      const dx = (x / tam - 0.5) * 2;
      const dy = (y / tam - 0.5) * 2;
      const r = Math.sqrt(dx * dx + dy * dy);
      const caida = Math.max(0, 1 - r);
      const a = Math.max(0, Math.min(1, caida * caida * (0.35 + n * 0.95))) * 255;
      const i = (y * tam + x) * 4;
      d[i] = 255; d[i + 1] = 255; d[i + 2] = 255; d[i + 3] = a;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

export { PALETA };
