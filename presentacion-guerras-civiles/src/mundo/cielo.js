/**
 * cielo.js — El cielo y el "ambiente" de cada escena.
 *
 * Cada escena declara su ambiente en escenas.js ('atardecer', 'noche',
 * 'lluvia'...). Aqui estan definidos: color del cielo, sol, niebla y luces.
 * Al cambiar de escena, todo se interpola poco a poco, asi que el paso del
 * dia a la noche ocurre DURANTE el vuelo, no de golpe.
 */

import {
  Mesh, SphereGeometry, ShaderMaterial, BackSide, Color,
  DirectionalLight, HemisphereLight, Fog, Vector3,
} from 'three';
import { gsap } from 'gsap';

export const AMBIENTES = {
  dia: {
    cieloAlto: '#4E7FB0', cieloBajo: '#C9D6DF', sol: '#FFF3D6',
    solIntensidad: 2.0, solDir: [-0.45, 0.8, 0.35],
    hemiCielo: '#9FC0DC', hemiSuelo: '#8A7048', hemiIntensidad: 0.75,
    niebla: '#B9C6CE', nieblaCerca: 70, nieblaLejos: 620, brilloSol: 0.35,
  },
  atardecer: {
    cieloAlto: '#2E3A5C', cieloBajo: '#E7A15A', sol: '#FFC978',
    solIntensidad: 2.1, solDir: [-0.85, 0.28, 0.2],
    hemiCielo: '#7E6E86', hemiSuelo: '#5B3C22', hemiIntensidad: 0.62,
    niebla: '#C98F5C', nieblaCerca: 40, nieblaLejos: 460, brilloSol: 0.75,
  },
  amanecer: {
    cieloAlto: '#27406B', cieloBajo: '#F2C888', sol: '#FFE2A8',
    solIntensidad: 1.9, solDir: [0.9, 0.22, -0.15],
    hemiCielo: '#93A6C4', hemiSuelo: '#6B5030', hemiIntensidad: 0.68,
    niebla: '#D9B588', nieblaCerca: 55, nieblaLejos: 560, brilloSol: 0.8,
  },
  noche: {
    cieloAlto: '#060B16', cieloBajo: '#0F1A2B', sol: '#9FB6D8',
    solIntensidad: 0.42, solDir: [0.35, 0.65, -0.5],
    hemiCielo: '#16243C', hemiSuelo: '#0B0F18', hemiIntensidad: 0.3,
    niebla: '#0F1A2B', nieblaCerca: 26, nieblaLejos: 300, brilloSol: 0.12,
    estrellas: true,
  },
  lluvia: {
    cieloAlto: '#25303E', cieloBajo: '#55636E', sol: '#B9C4CC',
    solIntensidad: 0.75, solDir: [-0.3, 0.7, 0.25],
    hemiCielo: '#48596A', hemiSuelo: '#39342C', hemiIntensidad: 0.5,
    niebla: '#4E5C68', nieblaCerca: 20, nieblaLejos: 220, brilloSol: 0.08,
  },
  niebla: {
    cieloAlto: '#7C8794', cieloBajo: '#C3CBD1', sol: '#E8EDF2',
    solIntensidad: 1.0, solDir: [-0.2, 0.85, 0.3],
    hemiCielo: '#AEB9C2', hemiSuelo: '#7A7469', hemiIntensidad: 0.8,
    niebla: '#B4BEC6', nieblaCerca: 14, nieblaLejos: 165, brilloSol: 0.15,
  },
  polvo: {
    cieloAlto: '#6B5C4A', cieloBajo: '#D9B98A', sol: '#FFD9A0',
    solIntensidad: 1.75, solDir: [-0.7, 0.45, 0.3],
    hemiCielo: '#A7906F', hemiSuelo: '#6B4B2E', hemiIntensidad: 0.6,
    niebla: '#C0A176', nieblaCerca: 18, nieblaLejos: 210, brilloSol: 0.5,
  },
  sobrenubes: {
    cieloAlto: '#1E3F6E', cieloBajo: '#A8C6E0', sol: '#FFFFFF',
    solIntensidad: 2.3, solDir: [-0.35, 0.85, 0.2],
    hemiCielo: '#BBD4E8', hemiSuelo: '#9AA7B4', hemiIntensidad: 0.9,
    niebla: '#CBDCEA', nieblaCerca: 120, nieblaLejos: 900, brilloSol: 0.4,
  },
};

const VS = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position.z = gl_Position.w; // el cielo siempre al fondo
  }
`;

const FS = /* glsl */ `
  varying vec3 vDir;
  uniform vec3 uAlto;
  uniform vec3 uBajo;
  uniform vec3 uSolColor;
  uniform vec3 uSolDir;
  uniform float uBrilloSol;
  uniform float uEstrellas;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  void main() {
    float h = clamp(vDir.y * 0.5 + 0.5, 0.0, 1.0);
    float t = pow(h, 0.62);
    vec3 col = mix(uBajo, uAlto, t);

    // Halo del sol.
    float d = max(dot(normalize(vDir), normalize(uSolDir)), 0.0);
    col += uSolColor * pow(d, 18.0) * uBrilloSol * 1.6;
    col += uSolColor * pow(d, 3.0) * uBrilloSol * 0.22;

    // Estrellas (solo de noche).
    if (uEstrellas > 0.01 && vDir.y > 0.02) {
      vec3 q = floor(normalize(vDir) * 220.0);
      float s = hash(q);
      float brillo = smoothstep(0.9975, 1.0, s);
      col += vec3(0.85, 0.9, 1.0) * brillo * uEstrellas * vDir.y;
    }

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

export function crearCielo() {
  const geo = new SphereGeometry(1, 40, 24);
  const mat = new ShaderMaterial({
    vertexShader: VS,
    fragmentShader: FS,
    side: BackSide,
    depthWrite: false,
    uniforms: {
      uAlto: { value: new Color(AMBIENTES.dia.cieloAlto) },
      uBajo: { value: new Color(AMBIENTES.dia.cieloBajo) },
      uSolColor: { value: new Color(AMBIENTES.dia.sol) },
      uSolDir: { value: new Vector3(...AMBIENTES.dia.solDir) },
      uBrilloSol: { value: AMBIENTES.dia.brilloSol },
      uEstrellas: { value: 0 },
    },
  });
  const m = new Mesh(geo, mat);
  m.name = 'cielo';
  m.frustumCulled = false;
  m.renderOrder = -1000;
  return m;
}

/**
 * Gestiona el ambiente: guarda las luces y la niebla, y las interpola
 * cuando la escena cambia.
 */
export class Ambiente {
  constructor(escena) {
    this.escena = escena;
    this.cielo = crearCielo();
    escena.add(this.cielo);

    this.sol = new DirectionalLight(0xffffff, 2.0);
    this.sol.name = 'sol';
    escena.add(this.sol);
    escena.add(this.sol.target);

    this.hemi = new HemisphereLight(0xffffff, 0x444444, 0.75);
    escena.add(this.hemi);

    escena.fog = new Fog(0xb9c6ce, 70, 620);
    // Distancias "base" de la niebla. La niebla real se calcula en seguir(),
    // estirandola segun lo alto que vaya la camara: a ras del suelo queremos
    // niebla atmosferica, pero desde 300 metros hay que ver el Peru entero.
    this.niebla = { cerca: 70, lejos: 620 };

    this.actual = null;
    this.aplicar('dia', 0);
  }

  /** Mantiene el domo del cielo alrededor de la camara y ajusta la niebla. */
  seguir(camara) {
    this.cielo.position.copy(camara.position);
    this.cielo.scale.setScalar(Math.max(camara.far * 0.45, 400));

    // Cuanto mas alto vuela la camara, mas lejos se ve.
    const escala = 1 + Math.max(0, camara.position.y) / 46;
    this.escena.fog.near = this.niebla.cerca * Math.min(escala, 4.5);
    this.escena.fog.far = this.niebla.lejos * Math.min(escala, 4.5);

    const d = this.uSolDir;
    if (d) {
      this.sol.position.copy(camara.position).addScaledVector(d, 260);
      this.sol.target.position.copy(camara.position);
      this.sol.target.updateMatrixWorld();
    }
  }

  /**
   * Cambia el ambiente. `duracion` en segundos: si es > 0, el cielo,
   * la niebla y las luces cambian poco a poco (para los viajes dia->noche).
   */
  aplicar(nombre, duracion = 1.6) {
    const a = AMBIENTES[nombre] || AMBIENTES.dia;
    if (this.actual === nombre && duracion > 0) return;
    this.actual = nombre;

    const u = this.cielo.material.uniforms;
    const dir = new Vector3(...a.solDir).normalize();
    this.uSolDir = dir;

    const destino = {
      alto: new Color(a.cieloAlto),
      bajo: new Color(a.cieloBajo),
      solCol: new Color(a.sol),
      niebla: new Color(a.niebla),
      hemiC: new Color(a.hemiCielo),
      hemiS: new Color(a.hemiSuelo),
    };

    if (duracion <= 0) {
      u.uAlto.value.copy(destino.alto);
      u.uBajo.value.copy(destino.bajo);
      u.uSolColor.value.copy(destino.solCol);
      u.uSolDir.value.copy(dir);
      u.uBrilloSol.value = a.brilloSol;
      u.uEstrellas.value = a.estrellas ? 1 : 0;
      this.sol.color.copy(destino.solCol);
      this.sol.intensity = a.solIntensidad;
      this.hemi.color.copy(destino.hemiC);
      this.hemi.groundColor.copy(destino.hemiS);
      this.hemi.intensity = a.hemiIntensidad;
      this.escena.fog.color.copy(destino.niebla);
      this.niebla.cerca = a.nieblaCerca;
      this.niebla.lejos = a.nieblaLejos;
      return;
    }

    const conf = { duration: duracion, ease: 'power2.inOut', overwrite: 'auto' };
    gsap.to(u.uAlto.value, { r: destino.alto.r, g: destino.alto.g, b: destino.alto.b, ...conf });
    gsap.to(u.uBajo.value, { r: destino.bajo.r, g: destino.bajo.g, b: destino.bajo.b, ...conf });
    gsap.to(u.uSolColor.value, { r: destino.solCol.r, g: destino.solCol.g, b: destino.solCol.b, ...conf });
    gsap.to(u.uSolDir.value, { x: dir.x, y: dir.y, z: dir.z, ...conf });
    gsap.to(u.uBrilloSol, { value: a.brilloSol, ...conf });
    gsap.to(u.uEstrellas, { value: a.estrellas ? 1 : 0, ...conf });
    gsap.to(this.sol.color, { r: destino.solCol.r, g: destino.solCol.g, b: destino.solCol.b, ...conf });
    gsap.to(this.sol, { intensity: a.solIntensidad, ...conf });
    gsap.to(this.hemi.color, { r: destino.hemiC.r, g: destino.hemiC.g, b: destino.hemiC.b, ...conf });
    gsap.to(this.hemi.groundColor, { r: destino.hemiS.r, g: destino.hemiS.g, b: destino.hemiS.b, ...conf });
    gsap.to(this.hemi, { intensity: a.hemiIntensidad, ...conf });
    gsap.to(this.escena.fog.color, { r: destino.niebla.r, g: destino.niebla.g, b: destino.niebla.b, ...conf });
    gsap.to(this.niebla, { cerca: a.nieblaCerca, lejos: a.nieblaLejos, ...conf });
  }
}
