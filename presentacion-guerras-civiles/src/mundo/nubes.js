/**
 * nubes.js — La capa de nubes que la camara atraviesa en los viajes.
 *
 * Son laminas que siempre miran a la camara (billboards), dibujadas todas
 * de una sola vez. Estan repartidas por encima de la cordillera, a la altura
 * a la que vuela la camara, asi que los viajes las cruzan de verdad.
 */

import {
  Mesh, PlaneGeometry, InstancedBufferGeometry, InstancedBufferAttribute,
  ShaderMaterial, Color, DoubleSide,
} from 'three';
import { texturaHumo } from './textura.js';
import { semilla } from './ruido.js';
import { LIMITES } from '../data/lugares.js';

const VS = /* glsl */ `
  attribute vec3 aCentro;
  attribute float aEscala;
  attribute float aGiro;
  attribute float aAlfa;
  varying vec2 vUv;
  varying float vAlfa;
  varying float vDist;
  uniform float uTiempo;
  uniform float uDeriva;

  void main() {
    vUv = uv;
    vAlfa = aAlfa;

    vec3 centro = aCentro;
    centro.x += sin(uTiempo * 0.05 + aGiro) * uDeriva;

    vec4 mv = modelViewMatrix * vec4(centro, 1.0);
    vDist = -mv.z;

    float c = cos(aGiro);
    float s = sin(aGiro);
    vec2 esquina = vec2(
      position.x * c - position.y * s,
      position.x * s + position.y * c
    ) * aEscala;

    mv.xy += esquina;
    gl_Position = projectionMatrix * mv;
  }
`;

const FS = /* glsl */ `
  uniform sampler2D uMapa;
  uniform vec3 uColor;
  uniform float uOpacidad;
  varying vec2 vUv;
  varying float vAlfa;
  varying float vDist;

  void main() {
    vec4 t = texture2D(uMapa, vUv);
    // Se desvanecen cuando la camara esta encima, para que atravesarlas
    // se vea como entrar en la nube y no como chocar con una lamina.
    float cerca = smoothstep(2.0, 26.0, vDist);
    float a = t.a * uOpacidad * vAlfa * cerca;
    if (a < 0.004) discard;
    gl_FragColor = vec4(uColor, a);
    #include <colorspace_fragment>
  }
`;

export function crearNubes({ cantidad = 110, sembrado = 91 } = {}) {
  const base = new PlaneGeometry(1, 1);
  const geo = new InstancedBufferGeometry();
  geo.index = base.index;
  geo.attributes.position = base.attributes.position;
  geo.attributes.uv = base.attributes.uv;

  const centros = new Float32Array(cantidad * 3);
  const escalas = new Float32Array(cantidad);
  const giros = new Float32Array(cantidad);
  const alfas = new Float32Array(cantidad);

  const rnd = semilla(sembrado);
  for (let i = 0; i < cantidad; i++) {
    centros[i * 3] = LIMITES.minX + rnd() * (LIMITES.maxX - LIMITES.minX);
    centros[i * 3 + 1] = 52 + rnd() * 74;
    centros[i * 3 + 2] = LIMITES.minZ + rnd() * (LIMITES.maxZ - LIMITES.minZ);
    escalas[i] = 24 + rnd() * 56;
    giros[i] = rnd() * Math.PI * 2;
    alfas[i] = 0.4 + rnd() * 0.6;
  }

  geo.setAttribute('aCentro', new InstancedBufferAttribute(centros, 3));
  geo.setAttribute('aEscala', new InstancedBufferAttribute(escalas, 1));
  geo.setAttribute('aGiro', new InstancedBufferAttribute(giros, 1));
  geo.setAttribute('aAlfa', new InstancedBufferAttribute(alfas, 1));
  geo.instanceCount = cantidad;

  const mat = new ShaderMaterial({
    vertexShader: VS,
    fragmentShader: FS,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    uniforms: {
      uMapa: { value: texturaHumo(256) },
      uColor: { value: new Color('#FFFFFF') },
      uOpacidad: { value: 0.0 },
      uTiempo: { value: 0 },
      uDeriva: { value: 6 },
    },
  });

  const malla = new Mesh(geo, mat);
  malla.name = 'nubes';
  malla.frustumCulled = false;
  malla.renderOrder = 3;

  malla.userData.animar = (t) => { mat.uniforms.uTiempo.value = t; };
  malla.userData.uniformes = mat.uniforms;
  malla.userData.cantidadMaxima = cantidad;

  /** En modo ligero se dibujan menos nubes. */
  malla.userData.ajustarCantidad = (fraccion) => {
    geo.instanceCount = Math.max(12, Math.floor(cantidad * fraccion));
  };

  return malla;
}
