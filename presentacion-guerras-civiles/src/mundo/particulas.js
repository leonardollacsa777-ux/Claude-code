/**
 * particulas.js — Humo, polvo, chispas, brasas y lluvia.
 *
 * Un solo sistema con "recetas". Todas las particulas de un sistema se
 * dibujan de una vez (Points), y la cantidad baja a la mitad en modo ligero.
 */

import {
  BufferGeometry, BufferAttribute, Points, ShaderMaterial,
  AdditiveBlending, NormalBlending, Color, Vector3,
} from 'three';
import { texturaPunto, texturaHumo } from './textura.js';
import { PALETA } from './paleta.js';
import { semilla } from './ruido.js';

// Shader propio: hace falta porque PointsMaterial no admite un tamano ni una
// transparencia distintos por particula, y sin eso el humo no se disuelve.
const VS = /* glsl */ `
  attribute float aTam;
  attribute float aAlfa;
  varying float vAlfa;
  varying float vNiebla;
  uniform float uTamBase;
  void main() {
    vAlfa = aAlfa;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNiebla = -mv.z;
    gl_PointSize = uTamBase * aTam * (260.0 / max(-mv.z, 0.1));
    gl_Position = projectionMatrix * mv;
  }
`;

const FS = /* glsl */ `
  uniform sampler2D uMapa;
  uniform vec3 uColor;
  uniform float uOpacidad;
  uniform vec3 uNieblaColor;
  uniform float uNieblaCerca;
  uniform float uNieblaLejos;
  uniform float uConNiebla;
  varying float vAlfa;
  varying float vNiebla;
  void main() {
    vec4 t = texture2D(uMapa, gl_PointCoord);
    float a = t.a * uOpacidad * vAlfa;
    if (a < 0.01) discard;
    vec3 col = uColor;
    if (uConNiebla > 0.5) {
      float f = smoothstep(uNieblaCerca, uNieblaLejos, vNiebla);
      col = mix(col, uNieblaColor, f);
      a *= 1.0 - f * 0.85;
    }
    gl_FragColor = vec4(col, a);
    #include <colorspace_fragment>
  }
`;

let texHumo = null;
let texPunto = null;
function texturas() {
  if (!texHumo) texHumo = texturaHumo(256);
  if (!texPunto) texPunto = texturaPunto(128, '#ffffff', 0.18);
  return { texHumo, texPunto };
}

export class Particulas {
  /**
   * @param receta  ver RECETAS abajo
   * @param opciones.origen  [x, y, z] donde nacen
   */
  constructor(receta, { origen = [0, 0, 0], cantidad = null, sembrado = 3 } = {}) {
    this.receta = receta;
    this.origen = new Vector3(...origen);
    this.cantidad = cantidad ?? receta.cantidad;
    this.rnd = semilla(sembrado);
    this.activo = true;
    this.intensidad = 1;

    const t = texturas();
    const n = this.cantidad;

    this.pos = new Float32Array(n * 3);
    this.vel = new Float32Array(n * 3);
    this.vida = new Float32Array(n);
    this.maxVida = new Float32Array(n);
    this.tam = new Float32Array(n);

    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(this.pos, 3));
    this.atrTam = new BufferAttribute(new Float32Array(n), 1);
    this.atrAlfa = new BufferAttribute(new Float32Array(n), 1);
    geo.setAttribute('aTam', this.atrTam);
    geo.setAttribute('aAlfa', this.atrAlfa);
    geo.boundingSphere = null;

    const mat = new ShaderMaterial({
      vertexShader: VS,
      fragmentShader: FS,
      transparent: true,
      depthWrite: false,
      blending: receta.aditivo ? AdditiveBlending : NormalBlending,
      uniforms: {
        uMapa: { value: receta.textura === 'humo' ? t.texHumo : t.texPunto },
        uColor: { value: new Color(receta.color) },
        uOpacidad: { value: receta.opacidad },
        uTamBase: { value: receta.tamano },
        uNieblaColor: { value: new Color('#b9c6ce') },
        uNieblaCerca: { value: 60 },
        uNieblaLejos: { value: 600 },
        uConNiebla: { value: receta.aditivo ? 0 : 1 },
      },
    });

    this.puntos = new Points(geo, mat);
    this.puntos.frustumCulled = false;
    this.puntos.renderOrder = receta.aditivo ? 5 : 4;
    this.material = mat;

    for (let i = 0; i < n; i++) this.nacer(i, true);
  }

  nacer(i, inicial = false) {
    const r = this.receta;
    const rnd = this.rnd;
    const i3 = i * 3;

    const d = r.dispersion;
    this.pos[i3] = this.origen.x + (rnd() - 0.5) * d[0];
    this.pos[i3 + 1] = this.origen.y + (inicial ? rnd() * d[1] : rnd() * d[1] * 0.25);
    this.pos[i3 + 2] = this.origen.z + (rnd() - 0.5) * d[2];

    const v = r.velocidad;
    this.vel[i3] = (rnd() - 0.5) * v[0];
    this.vel[i3 + 1] = v[1] * (0.55 + rnd() * 0.9);
    this.vel[i3 + 2] = (rnd() - 0.5) * v[2];

    this.maxVida[i] = r.vida[0] + rnd() * (r.vida[1] - r.vida[0]);
    this.vida[i] = inicial ? rnd() * this.maxVida[i] : 0;
    this.tam[i] = 0.6 + rnd() * 0.8;
  }

  /** Mueve el origen (para el humo que sigue a la camara, por ejemplo). */
  mover(x, y, z) {
    this.origen.set(x, y, z);
  }

  animar(dt) {
    if (!this.activo) return;
    const r = this.receta;
    const n = this.cantidad;
    const tamanos = this.atrTam.array;
    const alfas = this.atrAlfa.array;

    for (let i = 0; i < n; i++) {
      const i3 = i * 3;
      this.vida[i] += dt;
      if (this.vida[i] >= this.maxVida[i]) this.nacer(i);

      this.vel[i3 + 1] += r.gravedad * dt;
      this.vel[i3] += r.viento[0] * dt;
      this.vel[i3 + 2] += r.viento[1] * dt;

      this.pos[i3] += this.vel[i3] * dt;
      this.pos[i3 + 1] += this.vel[i3 + 1] * dt;
      this.pos[i3 + 2] += this.vel[i3 + 2] * dt;

      const k = this.vida[i] / this.maxVida[i];
      tamanos[i] = this.tam[i] * (r.crece ? 0.35 + k * 1.3 : 1 - k * 0.6);
      // Aparece rapido y se apaga despacio.
      alfas[i] = Math.min(1, k * 8) * (1 - k * k);
    }

    this.puntos.geometry.attributes.position.needsUpdate = true;
    this.atrTam.needsUpdate = true;
    this.atrAlfa.needsUpdate = true;
    this.material.uniforms.uOpacidad.value = r.opacidad * this.intensidad;
  }

  /** Copia la niebla de la escena para que las particulas se integren. */
  ajustarNiebla(niebla) {
    if (!niebla) return;
    const u = this.material.uniforms;
    u.uNieblaColor.value.copy(niebla.color);
    u.uNieblaCerca.value = niebla.near;
    u.uNieblaLejos.value = niebla.far;
  }

  destruir() {
    this.puntos.geometry.dispose();
    this.material.dispose();
  }
}

/** Las recetas. Cambiar estos numeros cambia el aspecto de cada efecto. */
export const RECETAS = {
  humo: {
    cantidad: 150, textura: 'humo', color: PALETA.humo, tamano: 9,
    opacidad: 0.34, aditivo: false, crece: true,
    dispersion: [16, 6, 12], velocidad: [0.5, 0.75, 0.5],
    gravedad: 0.06, viento: [0.12, 0], vida: [4.5, 9],
  },
  humoDenso: {
    cantidad: 190, textura: 'humo', color: '#8E8272', tamano: 16,
    opacidad: 0.5, aditivo: false, crece: true,
    dispersion: [26, 14, 22], velocidad: [0.8, 1.0, 0.8],
    gravedad: 0.04, viento: [0.18, 0], vida: [5, 10],
  },
  polvo: {
    cantidad: 170, textura: 'humo', color: '#C7A874', tamano: 5.5,
    opacidad: 0.3, aditivo: false, crece: true,
    dispersion: [22, 2.5, 16], velocidad: [1.3, 0.55, 1.3],
    gravedad: -0.12, viento: [0.1, 0.04], vida: [1.6, 3.6],
  },
  chispas: {
    cantidad: 110, textura: 'punto', color: '#FFCE72', tamano: 0.5,
    opacidad: 0.95, aditivo: true, crece: false,
    dispersion: [14, 1.2, 10], velocidad: [4.2, 3.4, 4.2],
    gravedad: -5.2, viento: [0, 0], vida: [0.5, 1.2],
  },
  brasas: {
    cantidad: 90, textura: 'punto', color: '#FF8A3C', tamano: 0.42,
    opacidad: 0.8, aditivo: true, crece: false,
    dispersion: [30, 5, 24], velocidad: [0.35, 1.5, 0.35],
    gravedad: -0.25, viento: [0.16, 0], vida: [2.5, 5.5],
  },
  lluvia: {
    cantidad: 320, textura: 'punto', color: '#AFC4D6', tamano: 0.3,
    opacidad: 0.55, aditivo: false, crece: false,
    dispersion: [46, 26, 46], velocidad: [0.5, -14, 0.5],
    gravedad: -9, viento: [1.2, 0], vida: [1.1, 2.0],
  },
  sello: {
    cantidad: 140, textura: 'punto', color: '#C4302B', tamano: 0.8,
    opacidad: 0.95, aditivo: true, crece: false,
    dispersion: [2, 2, 2], velocidad: [7, 5, 7],
    gravedad: -2.2, viento: [0, 0], vida: [0.9, 2.2],
  },
  nieve: {
    cantidad: 160, textura: 'punto', color: '#EAF2FA', tamano: 0.42,
    opacidad: 0.7, aditivo: false, crece: false,
    dispersion: [40, 22, 40], velocidad: [0.8, -1.6, 0.8],
    gravedad: -0.4, viento: [0.5, 0.2], vida: [3, 6],
  },
};

/** Atajo: crea un sistema con su receta. */
export function crearParticulas(nombre, opciones = {}) {
  const receta = RECETAS[nombre];
  if (!receta) throw new Error(`No existe la receta de particulas "${nombre}"`);
  return new Particulas(receta, opciones);
}
