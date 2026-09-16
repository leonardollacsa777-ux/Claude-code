/**
 * Escena 13 — Línea de tiempo.
 * Un camino de luz por encima de las nubes; en cada hito se levanta un
 * pilar con su año. La cámara lo recorrerá a toda velocidad en la
 * transición siguiente.
 */

import {
  Group, Mesh, TubeGeometry, CatmullRomCurve3, Vector3,
  ShaderMaterial, AdditiveBlending, Color,
} from 'three';
import { gsap } from 'gsap';
import { crearPilar } from '../mundo/letrero.js';
import { LUGARES } from '../data/lugares.js';

/** Los ocho hitos, en el orden en que ocurrieron. */
export const HITOS = [
  ['1537', 'Almagro toma el Cusco · Abancay'],
  ['1538', 'Las Salinas · muerte de Almagro'],
  ['1541', 'Asesinato de Francisco Pizarro'],
  ['1542', 'Chupas · Leyes Nuevas'],
  ['1546', 'Batalla de Iñaquito'],
  ['1547', 'Batalla de Huarina'],
  ['1548', 'Batalla de Jaquijahuana'],
  ['1554', 'Chuquinga y Pucará'],
];

const ALTURA = 96;

const VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const FS = `
  uniform vec3 uColor; uniform float uOpacidad; uniform float uTiempo;
  varying vec2 vUv;
  void main(){
    float borde = 1.0 - abs(vUv.y - 0.5) * 2.0;
    // Pulsos de luz que recorren el camino.
    float pulso = 0.55 + 0.45 * sin(vUv.x * 42.0 - uTiempo * 2.4);
    float a = uOpacidad * smoothstep(0.0, 0.5, borde) * pulso;
    gl_FragColor = vec4(uColor * (0.7 + pulso * 0.8), a);
    #include <colorspace_fragment>
  }
`;

export default {
  id: 13,
  crear(mundo, R) {
    const grupo = new Group();
    grupo.name = 'escena-13';

    const L = LUGARES.centro;

    // El camino cruza el mapa de sur a norte, por encima de las nubes.
    const puntos = [];
    for (let i = 0; i < HITOS.length; i++) {
      const t = i / (HITOS.length - 1);
      puntos.push(new Vector3(
        L.x + 74 - t * 150,
        ALTURA + Math.sin(t * Math.PI) * 13,
        L.z + 196 - t * 330
      ));
    }

    const curva = new CatmullRomCurve3(puntos, false, 'catmullrom', 0.5);
    const mat = new ShaderMaterial({
      vertexShader: VS,
      fragmentShader: FS,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        uColor: { value: new Color('#FFE09A') },
        uOpacidad: { value: 0 },
        uTiempo: { value: 0 },
      },
    });

    const camino = new Mesh(new TubeGeometry(curva, 180, 1.5, 6, false), mat);
    camino.frustumCulled = false;
    camino.renderOrder = 6;
    grupo.add(camino);
    mundo.registrar('caminoLuz', { malla: camino, curva, puntos });

    // Un pilar en cada hito.
    const pilares = [];
    for (let i = 0; i < HITOS.length; i++) {
      const [anio, texto] = HITOS[i];
      const p = crearPilar(anio, texto, { alto: 11 });
      p.position.copy(puntos[i]);
      p.position.y -= 3;
      grupo.add(p);
      pilares.push(p);
      R.letreros.push(...p.userData.letreros);
    }

    let tl = null;

    return {
      grupo,
      activar({ efectos }) {
        efectos.clima(null);
        efectos.mostrarNubes(true, 1.6, 0.5);
        if (tl) tl.kill();

        tl = gsap.timeline();
        tl.to(mat.uniforms.uOpacidad, { value: 0.85, duration: 1.4, ease: 'power2.out' }, 0);

        // Los pilares se levantan uno tras otro, en orden cronológico.
        for (let i = 0; i < pilares.length; i++) {
          const p = pilares[i];
          gsap.killTweensOf(p.scale);
          p.scale.set(1, 0.001, 1);
          tl.to(p.scale, { y: 1, duration: 0.7, ease: 'back.out(1.6)' }, 0.35 + i * 0.22);
        }
      },
      desactivar() {
        if (tl) { tl.kill(); tl = null; }
      },
      animar(t, dt, activa) {
        mat.uniforms.uTiempo.value = t;
        if (!activa) return;
        for (let i = 0; i < pilares.length; i++) {
          pilares[i].position.y = puntos[i].y - 3 + Math.sin(t * 0.5 + i) * 0.5;
        }
      },
    };
  },
};
