/**
 * estela.js — La estela dorada que va dibujando la ruta sobre el mapa.
 *
 * Toma el camino que va a recorrer la camara, lo apoya sobre el relieve
 * y lo dibuja como una cinta luminosa que crece a la vez que el vuelo.
 */

import {
  Mesh, TubeGeometry, CatmullRomCurve3, ShaderMaterial,
  AdditiveBlending, Color, Vector3,
} from 'three';
import { gsap } from 'gsap';
import { alturaEn } from './relieve.js';

const VS = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FS = /* glsl */ `
  uniform vec3 uColor;
  uniform float uProgreso;
  uniform float uOpacidad;
  varying vec2 vUv;
  void main() {
    // Solo se ve la parte de la ruta ya recorrida.
    if (vUv.x > uProgreso) discard;
    // La punta brilla mas y la cola se apaga.
    float cola = smoothstep(uProgreso - 0.55, uProgreso, vUv.x);
    float borde = 1.0 - abs(vUv.y - 0.5) * 2.0;
    float a = uOpacidad * (0.35 + cola * 0.85) * smoothstep(0.0, 0.45, borde);
    gl_FragColor = vec4(uColor * (0.8 + cola * 1.4), a);
    #include <colorspace_fragment>
  }
`;

export class Estela {
  constructor(padre) {
    this.padre = padre;
    this.malla = null;
    this.tl = null;
  }

  /**
   * Dibuja la ruta.
   * @param puntos   los puntos del vuelo (Vector3)
   * @param duracion cuanto tarda en dibujarse
   * @param color    color de la estela
   */
  dibujar(puntos, duracion = 4, color = '#F0D780') {
    this.borrar();
    if (!puntos || puntos.length < 2) return;

    // Apoyamos la ruta sobre el terreno: la estela se ve EN el mapa.
    const guia = new CatmullRomCurve3(puntos.map((p) => p.clone()), false, 'catmullrom', 0.5);
    const sobreMapa = [];
    const pasos = 70;
    for (let i = 0; i <= pasos; i++) {
      const p = guia.getPoint(i / pasos);
      sobreMapa.push(new Vector3(p.x, alturaEn(p.x, p.z) + 1.6, p.z));
    }

    const curva = new CatmullRomCurve3(sobreMapa, false, 'catmullrom', 0.5);
    const geo = new TubeGeometry(curva, 110, 0.75, 5, false);

    const mat = new ShaderMaterial({
      vertexShader: VS,
      fragmentShader: FS,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        uColor: { value: new Color(color) },
        uProgreso: { value: 0 },
        uOpacidad: { value: 0.9 },
      },
    });

    this.malla = new Mesh(geo, mat);
    this.malla.frustumCulled = false;
    this.malla.renderOrder = 6;
    this.padre.add(this.malla);

    this.tl = gsap.timeline();
    this.tl.to(mat.uniforms.uProgreso, { value: 1, duration: duracion * 0.86, ease: 'power1.inOut' }, 0);
    this.tl.to(mat.uniforms.uOpacidad, { value: 0, duration: 1.3, ease: 'power2.in' }, duracion * 0.86);
    this.tl.call(() => this.borrar(), null, duracion * 0.86 + 1.3);
  }

  borrar() {
    if (this.tl) { this.tl.kill(); this.tl = null; }
    if (this.malla) {
      this.padre.remove(this.malla);
      this.malla.geometry.dispose();
      this.malla.material.dispose();
      this.malla = null;
    }
  }
}
