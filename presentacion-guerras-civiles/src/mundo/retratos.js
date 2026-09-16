/**
 * retratos.js — Los nueve personajes, en marcos dorados.
 *
 * NO son fotos: son retratos dibujados por codigo, al estilo de un grabado
 * antiguo. Se hace asi porque no se pueden descargar imagenes (y ademas
 * garantiza que la presentacion funcione sin internet y sin problemas de
 * derechos de autor). Ver CREDITOS.md.
 */

import {
  Group, Mesh, PlaneGeometry, BoxGeometry, MeshStandardMaterial,
  CanvasTexture, Color, SRGBColorSpace, DoubleSide,
} from 'three';
import { PALETA } from './paleta.js';
import { semilla } from './ruido.js';

/** Los nueve, en el orden en que los nombra la escena 4. */
export const PERSONAJES = [
  { nombre: 'Francisco Pizarro',  tocado: 'casco',    barba: 'larga',  capa: '#5B2B2B', bando: 'pizarrista' },
  { nombre: 'Diego de Almagro',   tocado: 'casco',    barba: 'corta',  capa: '#2F3F56', bando: 'almagrista', parche: true },
  { nombre: 'Hernando Pizarro',   tocado: 'casco',    barba: 'corta',  capa: '#4A2E2E', bando: 'pizarrista' },
  { nombre: 'Almagro "el Mozo"',  tocado: 'sombrero', barba: 'ninguna', capa: '#33455E', bando: 'almagrista' },
  { nombre: 'Vaca de Castro',     tocado: 'birrete',  barba: 'larga',  capa: '#2B2B33', bando: 'corona' },
  { nombre: 'Blasco Núñez Vela',  tocado: 'sombrero', barba: 'larga',  capa: '#3A2C4A', bando: 'corona' },
  { nombre: 'Gonzalo Pizarro',    tocado: 'casco',    barba: 'larga',  capa: '#5B2B2B', bando: 'pizarrista' },
  { nombre: 'Pedro de la Gasca',  tocado: 'clerigo',  barba: 'corta',  capa: '#22242B', bando: 'corona' },
  { nombre: 'Hernández Girón',    tocado: 'sombrero', barba: 'corta',  capa: '#4A3A22', bando: 'rebelde' },
];

const ANCHO = 420;
const ALTO = 560;

function dibujarRetrato(p, indice) {
  const c = document.createElement('canvas');
  c.width = ANCHO;
  c.height = ALTO;
  const x = c.getContext('2d');
  const rnd = semilla(1000 + indice * 37);

  const cx = ANCHO / 2;

  // --- Fondo de pergamino ---
  const fondo = x.createRadialGradient(cx, ALTO * 0.42, 30, cx, ALTO * 0.5, ALTO * 0.78);
  fondo.addColorStop(0, '#E4D4AE');
  fondo.addColorStop(0.62, '#CBB688');
  fondo.addColorStop(1, '#8E7A52');
  x.fillStyle = fondo;
  x.fillRect(0, 0, ANCHO, ALTO);

  // Manchas de la edad.
  for (let i = 0; i < 90; i++) {
    x.globalAlpha = 0.03 + rnd() * 0.05;
    x.fillStyle = rnd() > 0.5 ? '#6B5836' : '#F0E4C4';
    const r = 4 + rnd() * 26;
    x.beginPath();
    x.arc(rnd() * ANCHO, rnd() * ALTO, r, 0, 6.3);
    x.fill();
  }
  x.globalAlpha = 1;

  const tinta = '#2A1F14';
  const tintaSuave = '#4A3826';

  // --- Hombros y capa ---
  x.fillStyle = p.capa;
  x.beginPath();
  x.moveTo(cx - 175, ALTO);
  x.quadraticCurveTo(cx - 150, ALTO - 150, cx - 62, ALTO - 196);
  x.lineTo(cx + 62, ALTO - 196);
  x.quadraticCurveTo(cx + 150, ALTO - 150, cx + 175, ALTO);
  x.closePath();
  x.fill();

  // Sombra de la capa.
  x.fillStyle = 'rgba(0,0,0,0.28)';
  x.beginPath();
  x.moveTo(cx - 175, ALTO);
  x.quadraticCurveTo(cx - 120, ALTO - 120, cx - 62, ALTO - 196);
  x.lineTo(cx - 20, ALTO - 196);
  x.lineTo(cx - 90, ALTO);
  x.closePath();
  x.fill();

  // --- Gorguera / golilla ---
  x.fillStyle = '#EDE4D0';
  x.strokeStyle = '#B9A87F';
  x.lineWidth = 2;
  for (let i = -5; i <= 5; i++) {
    x.beginPath();
    x.ellipse(cx + i * 15, ALTO - 202 + Math.abs(i) * 2.6, 17, 11, 0, 0, 6.3);
    x.fill();
    x.stroke();
  }

  // --- Cuello y cara ---
  const caraY = ALTO - 300;
  x.fillStyle = '#C9A882';
  x.fillRect(cx - 26, caraY + 62, 52, 60);

  x.fillStyle = '#D9BC96';
  x.beginPath();
  x.ellipse(cx, caraY, 62, 80, 0, 0, 6.3);
  x.fill();

  // Sombra lateral de la cara.
  x.fillStyle = 'rgba(80,55,30,0.20)';
  x.beginPath();
  x.ellipse(cx + 24, caraY + 6, 38, 74, 0, 0, 6.3);
  x.fill();

  // --- Ojos ---
  x.fillStyle = tinta;
  for (const lado of [-1, 1]) {
    if (p.parche && lado === 1) continue;
    x.beginPath();
    x.ellipse(cx + lado * 23, caraY - 8, 7, 4.5, 0, 0, 6.3);
    x.fill();
    x.strokeStyle = tintaSuave;
    x.lineWidth = 2.5;
    x.beginPath();
    x.arc(cx + lado * 23, caraY - 26, 15, Math.PI * 1.1, Math.PI * 1.9);
    x.stroke();
  }

  // Parche en el ojo (Almagro lo perdio en combate).
  if (p.parche) {
    x.strokeStyle = tinta;
    x.lineWidth = 4;
    x.beginPath();
    x.moveTo(cx + 5, caraY - 34);
    x.lineTo(cx + 55, caraY - 16);
    x.stroke();
    x.fillStyle = '#1C150E';
    x.beginPath();
    x.ellipse(cx + 24, caraY - 9, 16, 12, -0.2, 0, 6.3);
    x.fill();
  }

  // Nariz y boca.
  x.strokeStyle = tintaSuave;
  x.lineWidth = 3;
  x.beginPath();
  x.moveTo(cx - 2, caraY - 4);
  x.lineTo(cx - 8, caraY + 22);
  x.lineTo(cx + 6, caraY + 24);
  x.stroke();

  // --- Barba ---
  if (p.barba !== 'ninguna') {
    const largo = p.barba === 'larga' ? 92 : 52;
    x.fillStyle = '#3B2C1E';
    x.beginPath();
    x.moveTo(cx - 48, caraY + 18);
    x.quadraticCurveTo(cx - 40, caraY + 30 + largo, cx, caraY + 40 + largo);
    x.quadraticCurveTo(cx + 40, caraY + 30 + largo, cx + 48, caraY + 18);
    x.quadraticCurveTo(cx, caraY + 52, cx - 48, caraY + 18);
    x.fill();
    // Bigote.
    x.beginPath();
    x.ellipse(cx - 1, caraY + 36, 30, 10, 0, 0, 6.3);
    x.fill();
  } else {
    x.fillStyle = '#4A3826';
    x.beginPath();
    x.ellipse(cx - 1, caraY + 36, 22, 7, 0, 0, 6.3);
    x.fill();
  }

  // --- Tocado ---
  x.fillStyle = '#6E6A63';
  if (p.tocado === 'casco') {
    // Morrion con cresta.
    x.beginPath();
    x.ellipse(cx, caraY - 62, 74, 52, 0, Math.PI, 0);
    x.fill();
    x.fillStyle = '#8A857C';
    x.beginPath();
    x.ellipse(cx, caraY - 96, 12, 44, 0, Math.PI, 0);
    x.fill();
    x.fillStyle = '#5E5A53';
    x.beginPath();
    x.ellipse(cx, caraY - 58, 86, 13, 0, 0, 6.3);
    x.fill();
  } else if (p.tocado === 'sombrero') {
    x.fillStyle = '#2E2A24';
    x.beginPath();
    x.ellipse(cx, caraY - 62, 96, 15, 0, 0, 6.3);
    x.fill();
    x.beginPath();
    x.ellipse(cx, caraY - 82, 50, 38, 0, Math.PI, 0);
    x.fill();
    // Pluma.
    x.strokeStyle = '#B34A3A';
    x.lineWidth = 7;
    x.beginPath();
    x.moveTo(cx + 40, caraY - 74);
    x.quadraticCurveTo(cx + 104, caraY - 124, cx + 66, caraY - 150);
    x.stroke();
  } else if (p.tocado === 'birrete') {
    x.fillStyle = '#20242E';
    x.fillRect(cx - 58, caraY - 96, 116, 40);
    x.beginPath();
    x.ellipse(cx, caraY - 96, 66, 16, 0, 0, 6.3);
    x.fill();
  } else {
    // Clerigo: bonete y sotana.
    x.fillStyle = '#1C1C22';
    x.beginPath();
    x.ellipse(cx, caraY - 66, 58, 34, 0, Math.PI, 0);
    x.fill();
    x.fillRect(cx - 58, caraY - 70, 116, 12);
  }

  // --- Rayado de grabado ---
  x.globalAlpha = 0.10;
  x.strokeStyle = '#2A1F14';
  x.lineWidth = 1;
  for (let y = 0; y < ALTO; y += 4) {
    x.beginPath();
    x.moveTo(0, y);
    x.lineTo(ANCHO, y);
    x.stroke();
  }
  x.globalAlpha = 1;

  // --- Vineta ---
  const v = x.createRadialGradient(cx, ALTO * 0.45, ALTO * 0.3, cx, ALTO * 0.45, ALTO * 0.72);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(30,20,10,0.5)');
  x.fillStyle = v;
  x.fillRect(0, 0, ANCHO, ALTO);

  // --- Cartela con el nombre ---
  x.fillStyle = 'rgba(20,15,9,0.82)';
  x.fillRect(0, ALTO - 76, ANCHO, 76);
  x.strokeStyle = PALETA.dorado;
  x.lineWidth = 3;
  x.beginPath();
  x.moveTo(0, ALTO - 76);
  x.lineTo(ANCHO, ALTO - 76);
  x.stroke();

  x.fillStyle = '#F0D780';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  let tam = 40;
  x.font = `600 ${tam}px Cinzel, Georgia, serif`;
  while (x.measureText(p.nombre).width > ANCHO - 30 && tam > 18) {
    tam -= 2;
    x.font = `600 ${tam}px Cinzel, Georgia, serif`;
  }
  x.fillText(p.nombre, cx, ALTO - 38);

  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Un retrato con su marco dorado. */
export function crearRetrato(personaje, indice, { alto = 7 } = {}) {
  const grupo = new Group();
  const ancho = alto * (ANCHO / ALTO);

  const oro = new MeshStandardMaterial({
    color: new Color(PALETA.dorado), roughness: 0.3, metalness: 0.85,
    emissive: new Color(PALETA.dorado).multiplyScalar(0.1),
  });

  const lamina = new Mesh(
    new PlaneGeometry(ancho, alto),
    new MeshStandardMaterial({
      map: dibujarRetrato(personaje, indice),
      roughness: 0.9,
      side: DoubleSide,
    })
  );
  grupo.add(lamina);

  // Marco: cuatro listones.
  const g = alto * 0.07;
  const piezas = [
    [ancho + g * 2, g, 0, alto / 2 + g / 2],
    [ancho + g * 2, g, 0, -alto / 2 - g / 2],
    [g, alto, -ancho / 2 - g / 2, 0],
    [g, alto, ancho / 2 + g / 2, 0],
  ];
  for (const [w, h, px, py] of piezas) {
    const m = new Mesh(new BoxGeometry(w, h, g * 0.9), oro);
    m.position.set(px, py, -g * 0.15);
    grupo.add(m);
  }

  grupo.userData.personaje = personaje;
  grupo.userData.medidas = { ancho, alto };
  return grupo;
}

export { ANCHO as ANCHO_RETRATO, ALTO as ALTO_RETRATO };
