/**
 * pergamino.js — El pergamino antiguo con su sello de lacre.
 *
 * Aparece en la escena 2, se aplana hasta convertirse en el mapa (transicion
 * 2 -> 3) y vuelve al final, en la escena 15, para enrollarse otra vez.
 * Es el objeto que cose el principio con el final.
 */

import {
  Group, Mesh, PlaneGeometry, CylinderGeometry, TorusGeometry,
  MeshStandardMaterial, Color, DoubleSide,
} from 'three';
import { texturaPergamino } from './textura.js';
import { PALETA } from './paleta.js';

export function crearPergamino({ ancho = 30, alto = 19 } = {}) {
  const grupo = new Group();
  grupo.name = 'pergamino';

  const tex = texturaPergamino(1024, { bordesQuemados: true });

  const geo = new PlaneGeometry(ancho, alto, 60, 34);
  const mat = new MeshStandardMaterial({
    map: tex,
    color: new Color('#FFFFFF'),
    roughness: 0.94,
    metalness: 0,
    side: DoubleSide,
  });

  // uEnrollado: 0 = extendido, 1 = enrollado en los dos extremos.
  mat.userData.uniformes = {
    uEnrollado: { value: 1 },
    uRadio: { value: 1.5 },
    uOndaHoja: { value: 1 },
    uTiempo: { value: 0 },
  };
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, mat.userData.uniformes);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        uniform float uEnrollado;
        uniform float uRadio;
        uniform float uOndaHoja;
        uniform float uTiempo;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        {
          float mitad = ${(ancho / 2).toFixed(3)};
          float k = clamp(uEnrollado, 0.0, 1.0);

          // Cuanto papel queda enrollado a cada lado.
          float zonaRollo = mitad * k;
          float d = abs(transformed.x) - (mitad - zonaRollo);

          if (d > 0.0 && k > 0.001) {
            float lado = sign(transformed.x);
            float ang = d / max(uRadio, 0.05);
            float bordeRecto = lado * (mitad - zonaRollo);
            transformed.x = bordeRecto + lado * sin(ang) * uRadio;
            transformed.z += (1.0 - cos(ang)) * uRadio;
          }

          // Ondulacion suave: el papel nunca esta perfectamente plano.
          transformed.z += sin(transformed.x * 0.45 + uTiempo * 0.7) * 0.16 * uOndaHoja
                         + sin(transformed.y * 0.7 - uTiempo * 0.5) * 0.10 * uOndaHoja;
        }`);
    mat.userData.shader = shader;
  };

  const hoja = new Mesh(geo, mat);
  hoja.name = 'hoja';
  grupo.add(hoja);

  // Los dos palos del rollo.
  const palos = [];
  const matPalo = new MeshStandardMaterial({
    color: new Color('#5A4326'), roughness: 0.8, flatShading: true,
  });
  for (const lado of [-1, 1]) {
    const palo = new Mesh(new CylinderGeometry(0.42, 0.42, alto * 1.06, 10), matPalo);
    palo.rotation.z = Math.PI / 2;
    palo.rotation.y = Math.PI / 2;
    palo.position.set(lado * (ancho / 2), 0, 1.5);
    grupo.add(palo);
    palos.push({ palo, lado });
  }

  // Sello de lacre rojo.
  const sello = new Group();
  const disco = new Mesh(
    new CylinderGeometry(1.5, 1.7, 0.4, 20),
    new MeshStandardMaterial({
      color: new Color(PALETA.rojoOscuro), roughness: 0.42, metalness: 0.1,
    })
  );
  disco.rotation.x = Math.PI / 2;
  sello.add(disco);

  const aro = new Mesh(
    new TorusGeometry(1.0, 0.16, 8, 22),
    new MeshStandardMaterial({
      color: new Color(PALETA.dorado), roughness: 0.3, metalness: 0.85,
      emissive: new Color(PALETA.dorado).multiplyScalar(0.12),
    })
  );
  aro.position.z = 0.26;
  sello.add(aro);

  // Cintas del sello.
  for (const lado of [-1, 1]) {
    const cinta = new Mesh(
      new PlaneGeometry(0.5, 2.6),
      new MeshStandardMaterial({
        color: new Color('#8E2420'), roughness: 0.7, side: DoubleSide,
      })
    );
    cinta.position.set(lado * 0.35, -1.9, 0.1);
    cinta.rotation.z = lado * 0.22;
    sello.add(cinta);
  }

  sello.position.set(ancho * 0.30, -alto * 0.26, 0.55);
  sello.name = 'sello';
  grupo.add(sello);

  grupo.userData.uniformes = mat.userData.uniformes;
  grupo.userData.hoja = hoja;
  grupo.userData.sello = sello;
  grupo.userData.palos = palos;
  grupo.userData.medidas = { ancho, alto };

  /** Coloca los palos segun lo enrollado que este el pergamino. */
  grupo.userData.ajustarPalos = () => {
    const k = grupo.userData.uniformes.uEnrollado.value;
    const r = grupo.userData.uniformes.uRadio.value;
    for (const { palo, lado } of palos) {
      palo.position.x = lado * (ancho / 2 - (ancho / 2) * k);
      palo.position.z = 1.2 + (1 - Math.cos(Math.PI * k)) * r;
      palo.visible = k > 0.02;
    }
    sello.visible = k < 0.35;
  };

  grupo.userData.animar = (t) => {
    grupo.userData.uniformes.uTiempo.value = t;
  };

  grupo.userData.ajustarPalos();
  return grupo;
}
