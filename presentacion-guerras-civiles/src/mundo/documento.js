/**
 * documento.js — El documento real de las Leyes Nuevas (1542).
 * Una hoja grande con su sello de lacre, escrita y sellada por codigo.
 */

import {
  Group, Mesh, PlaneGeometry, CylinderGeometry, TorusGeometry,
  MeshStandardMaterial, CanvasTexture, Color, SRGBColorSpace, DoubleSide,
} from 'three';
import { PALETA } from './paleta.js';
import { semilla } from './ruido.js';

function texturaDocumento({ titulo, anio, lineas }) {
  const A = 900;
  const H = 1200;
  const c = document.createElement('canvas');
  c.width = A;
  c.height = H;
  const x = c.getContext('2d');
  const rnd = semilla(777);

  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#EFE2C2');
  g.addColorStop(0.5, '#E3D3AC');
  g.addColorStop(1, '#D3C094');
  x.fillStyle = g;
  x.fillRect(0, 0, A, H);

  for (let i = 0; i < 150; i++) {
    x.globalAlpha = 0.03 + rnd() * 0.05;
    x.fillStyle = rnd() > 0.55 ? '#7A6742' : '#F7EDD4';
    x.beginPath();
    x.arc(rnd() * A, rnd() * H, 5 + rnd() * 34, 0, 6.3);
    x.fill();
  }
  x.globalAlpha = 1;

  // Orla doble.
  x.strokeStyle = '#8A6A2E';
  x.lineWidth = 6;
  x.strokeRect(46, 46, A - 92, H - 92);
  x.lineWidth = 2;
  x.strokeRect(62, 62, A - 124, H - 124);

  // Adornos en las esquinas.
  x.fillStyle = PALETA.dorado;
  for (const [ex, ey] of [[46, 46], [A - 46, 46], [46, H - 46], [A - 46, H - 46]]) {
    x.beginPath();
    x.arc(ex, ey, 13, 0, 6.3);
    x.fill();
  }

  // Titulo.
  x.fillStyle = '#3A2A12';
  x.textAlign = 'center';
  x.font = '700 78px Cinzel, Georgia, serif';
  x.fillText(titulo, A / 2, 190);

  x.font = '600 42px Cinzel, Georgia, serif';
  x.fillStyle = '#6B5124';
  x.fillText(anio, A / 2, 252);

  x.beginPath();
  x.moveTo(A * 0.22, 282);
  x.lineTo(A * 0.78, 282);
  x.strokeStyle = '#8A6A2E';
  x.lineWidth = 3;
  x.stroke();

  // "Texto" del documento: las frases de verdad, en pequeno, mas renglones.
  x.textAlign = 'left';
  x.fillStyle = '#3F2E17';
  let y = 352;
  for (const linea of lineas) {
    x.font = '400 34px "EB Garamond", Georgia, serif';
    const palabras = linea.split(' ');
    let renglon = '';
    for (const pal of palabras) {
      const prueba = renglon ? renglon + ' ' + pal : pal;
      if (x.measureText(prueba).width > A - 200) {
        x.fillText(renglon, 100, y);
        y += 44;
        renglon = pal;
      } else {
        renglon = prueba;
      }
    }
    if (renglon) { x.fillText(renglon, 100, y); y += 44; }
    y += 26;
  }

  // Renglones decorativos hasta abajo.
  x.strokeStyle = 'rgba(70,52,26,0.28)';
  x.lineWidth = 2;
  while (y < H - 230) {
    const largo = (A - 220) * (0.55 + rnd() * 0.45);
    x.beginPath();
    x.moveTo(100, y);
    x.lineTo(100 + largo, y);
    x.stroke();
    y += 40;
  }

  // Firma del rey.
  x.fillStyle = '#3A2A12';
  x.font = 'italic 46px "EB Garamond", Georgia, serif';
  x.fillText('Yo, el Rey', A - 360, H - 150);

  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function crearDocumento({ ancho = 20, alto = 26.6 } = {}) {
  const grupo = new Group();
  grupo.name = 'documento';

  const hoja = new Mesh(
    new PlaneGeometry(ancho, alto, 24, 30),
    new MeshStandardMaterial({
      map: texturaDocumento({
        titulo: 'LEYES NUEVAS',
        anio: 'MDXLII · 1542',
        lineas: [
          'Que se proteja a los indios y cese su mal tratamiento.',
          'Que las encomiendas no pasen en herencia a los hijos.',
          'Que se erija el Virreinato del Perú y su Audiencia.',
        ],
      }),
      roughness: 0.95,
      side: DoubleSide,
    })
  );
  grupo.add(hoja);

  // Ondulacion suave del papel.
  const pos = hoja.geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const px = pos.getX(i);
    const py = pos.getY(i);
    pos.setZ(i, Math.sin(px * 0.35) * 0.22 + Math.cos(py * 0.28) * 0.16);
  }
  hoja.geometry.computeVertexNormals();

  // Sello de lacre abajo a la izquierda.
  const sello = new Group();
  const disco = new Mesh(
    new CylinderGeometry(1.7, 1.9, 0.45, 22),
    new MeshStandardMaterial({ color: new Color('#8E1F1B'), roughness: 0.38, metalness: 0.08 })
  );
  disco.rotation.x = Math.PI / 2;
  sello.add(disco);

  const aro = new Mesh(
    new TorusGeometry(1.15, 0.18, 8, 24),
    new MeshStandardMaterial({
      color: new Color(PALETA.dorado), roughness: 0.28, metalness: 0.9,
      emissive: new Color(PALETA.dorado).multiplyScalar(0.15),
    })
  );
  aro.position.z = 0.28;
  sello.add(aro);

  for (const lado of [-1, 1]) {
    const cinta = new Mesh(
      new PlaneGeometry(0.6, 3.2),
      new MeshStandardMaterial({ color: new Color('#9B2420'), roughness: 0.7, side: DoubleSide })
    );
    cinta.position.set(lado * 0.4, -2.3, 0.08);
    cinta.rotation.z = lado * 0.26;
    sello.add(cinta);
  }

  sello.position.set(-ancho * 0.26, -alto * 0.34, 0.4);
  sello.name = 'sello';
  grupo.add(sello);

  grupo.userData.sello = sello;
  grupo.userData.hoja = hoja;
  grupo.userData.medidas = { ancho, alto };
  return grupo;
}
