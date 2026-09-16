/**
 * transiciones/indice.js — Las 15 transiciones del recorrido.
 *
 * Cada una describe UNA FORMA DE VOLAR distinta. En la Fase 2 cada una
 * recibe ademas sus efectos visuales (humo, tormenta, condores, estela...),
 * pero el camino de la camara ya es propio de cada transicion.
 *
 * REGLA DE ORO: nunca se repite la misma transicion dos veces seguidas.
 * `validarTransiciones()` lo comprueba al arrancar y avisa por consola.
 */

import { Vector3 } from 'three';
import { alturaEn, NIVEL_LAGO } from '../mundo/relieve.js';
import { alturaCrucero } from '../nucleo/camara.js';

const V = (a) => new Vector3(a[0], a[1], a[2]);

/* ---------------------------------------------------------------- ayudas */

/** Arco por el cielo: sube, cruza y baja. Es la base de los "viajes". */
function puntosArco(p0, p1, { crucero, salida = 0.2, entrada = 0.82, lateral = 0, bajada = 0.5 }) {
  const dir = p1.clone().sub(p0);
  const perp = new Vector3(-dir.z, 0, dir.x).normalize();
  return [
    p0.clone(),
    p0.clone().lerp(p1, salida).setY(crucero * 0.78).addScaledVector(perp, lateral * 0.4),
    p0.clone().lerp(p1, 0.5).setY(crucero).addScaledVector(perp, lateral),
    p0.clone().lerp(p1, entrada).setY(crucero * bajada).addScaledVector(perp, lateral * 0.3),
    p1.clone(),
  ];
}

/** Vuelo pegado al terreno. */
function puntosRasante(p0, p1, { altura = 4, pasos = 6 } = {}) {
  const pts = [p0.clone()];
  for (let i = 1; i < pasos; i++) {
    const t = i / pasos;
    const p = p0.clone().lerp(p1, t);
    p.y = alturaEn(p.x, p.z) + altura;
    pts.push(p);
  }
  pts.push(p1.clone());
  return pts;
}

/** Espiral ascendente alrededor del punto de partida. */
function puntosEspiral(p0, p1, { vueltas = 1.25, radio = 26, alto = 70, pasos = 14 }) {
  const centro = new Vector3(p0.x, p0.y, p0.z);
  const pts = [p0.clone()];
  for (let i = 1; i <= pasos; i++) {
    const t = i / pasos;
    const ang = t * Math.PI * 2 * vueltas;
    const r = radio * (1 - t * 0.35);
    pts.push(new Vector3(
      centro.x + Math.cos(ang) * r,
      centro.y + alto * t,
      centro.z + Math.sin(ang) * r
    ));
  }
  pts.push(p0.clone().lerp(p1, 0.55).setY(centro.y + alto * 1.05));
  pts.push(p1.clone());
  return pts;
}

/* ------------------------------------------------------- las 15 transiciones */

export const TRANSICIONES = {

  // 1 -> 2 : la camara atraviesa el humo de la batalla.
  'atravesar-humo': {
    etiqueta: 'Atravesar el humo',
    duracion: 3.0,
    esViaje: false,
    perfil({ p0, p1, m0, m1 }) {
      const medio = p0.clone().lerp(p1, 0.55);
      medio.y += 3;
      return {
        duracion: 3.0,
        suavizado: 'power1.inOut',
        curvaPuntos: [p0.clone(), p0.clone().lerp(p1, 0.28).setY(p0.y + 1.4), medio, p1.clone()],
        curvaMira: [m0.clone(), m0.clone().lerp(m1, 0.6), m1.clone()],
        desfaseMira: 0.1,
      };
    },
  },

  // 2 -> 3 : el pergamino se aplana y SE CONVIERTE en el mapa.
  'pergamino-a-mapa': {
    etiqueta: 'El pergamino se vuelve mapa',
    duracion: 4.0,
    esViaje: false,
    perfil({ p0, p1, m0, m1 }) {
      return {
        duracion: 4.0,
        suavizado: 'power2.inOut',
        curvaPuntos: [
          p0.clone(),
          p0.clone().lerp(p1, 0.35).setY(p0.y + (p1.y - p0.y) * 0.18),
          p0.clone().lerp(p1, 0.72).setY(p0.y + (p1.y - p0.y) * 0.62),
          p1.clone(),
        ],
        curvaMira: [m0.clone(), m0.clone().lerp(m1, 0.45), m1.clone()],
        desfaseMira: 0.0,
      };
    },
  },

  // 3 -> 4 : media vuelta alrededor de los retratos que se levantan.
  'giro-orbital': {
    etiqueta: 'Giro orbital',
    duracion: 3.0,
    esViaje: false,
    perfil({ p0, p1, m0, m1 }) {
      const centro = m1.clone();
      const r0 = p0.clone().sub(centro);
      const pts = [p0.clone()];
      const pasos = 8;
      for (let i = 1; i <= pasos; i++) {
        const t = i / pasos;
        const ang = t * Math.PI * 0.85;
        const c = Math.cos(ang);
        const s = Math.sin(ang);
        const x = centro.x + r0.x * c - r0.z * s;
        const z = centro.z + r0.x * s + r0.z * c;
        const y = p0.y + (p1.y - p0.y) * t;
        pts.push(new Vector3(x, y, z));
      }
      pts.push(p1.clone());
      return {
        duracion: 3.0,
        suavizado: 'power2.inOut',
        curvaPuntos: pts,
        curvaMira: [m0.clone(), m0.clone().lerp(m1, 0.5), m1.clone()],
      };
    },
  },

  // 4 -> 5 : VIAJE POR EL CIELO de dia, hacia el sur, y picada al Cusco.
  'cielo-dia': {
    etiqueta: 'Viaje por el cielo (día)',
    duracion: 5.0,
    esViaje: true,
    condores: true,
    estela: true,
    perfil({ p0, p1, m0, m1 }) {
      const crucero = Math.max(alturaCrucero(p0, p1, 58), p0.y + 30);
      return {
        duracion: 5.0,
        suavizado: 'power2.inOut',
        curvaPuntos: puntosArco(p0, p1, { crucero, salida: 0.18, entrada: 0.86, bajada: 0.42 }),
        curvaMira: [
          m0.clone(),
          p0.clone().lerp(p1, 0.45).setY(crucero * 0.25),
          p1.clone().lerp(m1, 0.6),
          m1.clone(),
        ],
        inclinacionMax: 0.1,
        desfaseMira: 0.08,
      };
    },
  },

  // 5 -> 6 : picada y vuelo a ras del suelo entre los soldados.
  'rasante': {
    etiqueta: 'Vuelo rasante',
    duracion: 3.5,
    esViaje: true,
    desenfoque: true,
    perfil({ p0, p1, m0, m1 }) {
      const pts = puntosRasante(p0, p1, { altura: 3.2, pasos: 7 });
      pts[1].y = Math.max(pts[1].y, p0.y * 0.8);
      return {
        duracion: 3.5,
        suavizado: 'power3.inOut',
        curvaPuntos: pts,
        curvaMira: [m0.clone(), m0.clone().lerp(m1, 0.55), m1.clone()],
        inclinacionMax: -0.07,
        desfaseMira: 0.12,
      };
    },
  },

  // 6 -> 7 : VIAJE POR EL CIELO con el atardecer volviendose noche.
  'cielo-dia-a-noche': {
    etiqueta: 'Viaje por el cielo (día → noche)',
    duracion: 5.0,
    esViaje: true,
    condores: true,
    estela: true,
    cambioDeLuz: true,
    perfil({ p0, p1, m0, m1 }) {
      const crucero = Math.max(alturaCrucero(p0, p1, 64), 86);
      return {
        duracion: 5.0,
        suavizado: 'power2.inOut',
        curvaPuntos: puntosArco(p0, p1, { crucero, salida: 0.16, entrada: 0.84, lateral: 14, bajada: 0.4 }),
        curvaMira: [
          m0.clone(),
          p0.clone().lerp(p1, 0.4).setY(crucero * 0.3),
          m1.clone().lerp(p1, 0.3),
          m1.clone(),
        ],
        inclinacionMax: 0.08,
      };
    },
  },

  // 7 -> 8 : VIAJE POR LA TORMENTA, con relampagos.
  'tormenta': {
    etiqueta: 'Viaje por la tormenta',
    duracion: 5.0,
    esViaje: true,
    relampagos: true,
    estela: false,
    perfil({ p0, p1, m0, m1 }) {
      const crucero = Math.max(alturaCrucero(p0, p1, 70), 96);
      const pts = puntosArco(p0, p1, { crucero, salida: 0.22, entrada: 0.8, lateral: -22, bajada: 0.46 });
      // Sacudidas del viento: el camino no es limpio.
      pts[1].x += 9; pts[1].y += 6;
      pts[3].x -= 7; pts[3].y += 4;
      return {
        duracion: 5.0,
        suavizado: 'power1.inOut',
        curvaPuntos: pts,
        curvaMira: [m0.clone(), p0.clone().lerp(p1, 0.5).setY(crucero * 0.5), m1.clone()],
        inclinacionMax: 0.16,
      };
    },
  },

  // 8 -> 9 : atravesar la corona con un destello dorado.
  'atravesar-corona': {
    etiqueta: 'Atravesar la corona',
    duracion: 3.0,
    esViaje: false,
    destello: true,
    perfil({ p0, p1, m0, m1 }) {
      const alto = Math.max(p0.y, p1.y) + 16;
      return {
        duracion: 3.0,
        suavizado: 'power2.in',
        curvaPuntos: [
          p0.clone(),
          p0.clone().lerp(p1, 0.42).setY(alto),
          p0.clone().lerp(p1, 0.78).setY(alto * 0.92),
          p1.clone(),
        ],
        curvaMira: [m0.clone(), m0.clone().lerp(m1, 0.35).setY(alto), m1.clone()],
        desfaseMira: 0.05,
      };
    },
  },

  // 9 -> 10 : el sello estalla y su estela guia el vuelo hacia el norte.
  'estela-sello': {
    etiqueta: 'Seguir la estela del sello',
    duracion: 5.0,
    esViaje: true,
    estela: true,
    condores: false,
    perfil({ p0, p1, m0, m1 }) {
      const crucero = Math.max(alturaCrucero(p0, p1, 60), 92);
      return {
        duracion: 5.0,
        suavizado: 'power2.inOut',
        curvaPuntos: puntosArco(p0, p1, { crucero, salida: 0.24, entrada: 0.88, lateral: 18, bajada: 0.34 }),
        curvaMira: [
          m0.clone(),
          p0.clone().lerp(p1, 0.55).setY(crucero * 0.4),
          m1.clone(),
        ],
        inclinacionMax: -0.09,
      };
    },
  },

  // 10 -> 11 : espiral hacia arriba y vuelo a ras del lago Titicaca.
  'espiral-agua': {
    etiqueta: 'Espiral y vuelo sobre el agua',
    duracion: 5.0,
    esViaje: true,
    sobreAgua: true,
    perfil({ p0, p1, m0, m1, lugares }) {
      const titicaca = lugares?.titicaca;
      const pts = puntosEspiral(p0, p1, { vueltas: 1.15, radio: 24, alto: 74, pasos: 12 });
      if (titicaca) {
        // Pasa rozando el lago antes de llegar a Jaquijahuana.
        pts.splice(pts.length - 1, 0,
          new Vector3(titicaca.x - 16, NIVEL_LAGO + 5.5, titicaca.z + 6),
          new Vector3(titicaca.x + 10, NIVEL_LAGO + 4.0, titicaca.z - 4)
        );
      }
      return {
        duracion: 5.0,
        suavizado: 'power1.inOut',
        curvaPuntos: pts,
        curvaMira: [
          m0.clone(),
          p0.clone().setY(p0.y + 40),
          titicaca ? new Vector3(titicaca.x, NIVEL_LAGO, titicaca.z) : m0.clone().lerp(m1, 0.5),
          m1.clone(),
        ],
        inclinacionMax: 0.22,
        desfaseMira: 0.04,
      };
    },
  },

  // 11 -> 12 : barrido lateral rapidisimo entre estandartes.
  'barrido': {
    etiqueta: 'Barrido rápido',
    duracion: 2.5,
    esViaje: true,
    desenfoque: true,
    perfil({ p0, p1, m0, m1 }) {
      const pts = puntosRasante(p0, p1, { altura: 7, pasos: 5 });
      return {
        duracion: 2.5,
        suavizado: 'power4.inOut',
        curvaPuntos: pts,
        curvaMira: [m0.clone(), m0.clone().lerp(m1, 0.5), m1.clone()],
        suavizadoMira: 'power3.inOut',
        inclinacionMax: 0.05,
        desfaseMira: 0.16,
      };
    },
  },

  // 12 -> 13 : subida por encima de las nubes hasta ver todo el Peru.
  'subida-al-cielo': {
    etiqueta: 'Subida al cielo',
    duracion: 4.0,
    esViaje: false,
    perfil({ p0, p1, m0, m1 }) {
      return {
        duracion: 4.0,
        suavizado: 'power2.inOut',
        curvaPuntos: [
          p0.clone(),
          p0.clone().setY(p0.y + (p1.y - p0.y) * 0.45),
          p0.clone().lerp(p1, 0.5).setY(p0.y + (p1.y - p0.y) * 0.8),
          p1.clone(),
        ],
        curvaMira: [m0.clone(), m0.clone().lerp(m1, 0.4), m1.clone()],
        desfaseMira: 0.14,
      };
    },
  },

  // 13 -> 14 : carrera a gran velocidad por el camino de luz.
  'carrera': {
    etiqueta: 'Carrera por la línea de tiempo',
    duracion: 4.0,
    esViaje: false,
    desenfoque: true,
    perfil({ p0, p1, m0, m1 }) {
      return {
        duracion: 4.0,
        suavizado: 'power3.in',
        curvaPuntos: [
          p0.clone(),
          p0.clone().lerp(p1, 0.3).setY(p0.y * 0.92),
          p0.clone().lerp(p1, 0.68).setY(p1.y * 1.12),
          p1.clone(),
        ],
        curvaMira: [m0.clone(), m0.clone().lerp(m1, 0.7), m1.clone()],
        suavizadoMira: 'power2.out',
        desfaseMira: 0.02,
      };
    },
  },

  // 14 -> 15 : amanece sobre los Andes y la camara se aleja.
  'amanecer': {
    etiqueta: 'Amanecer sobre los Andes',
    duracion: 4.5,
    esViaje: false,
    cambioDeLuz: true,
    perfil({ p0, p1, m0, m1 }) {
      return {
        duracion: 4.5,
        suavizado: 'power1.inOut',
        curvaPuntos: [
          p0.clone(),
          p0.clone().lerp(p1, 0.4).setY(p0.y + 8),
          p0.clone().lerp(p1, 0.75).setY((p0.y + p1.y) * 0.55),
          p1.clone(),
        ],
        curvaMira: [m0.clone(), m0.clone().lerp(m1, 0.5), m1.clone()],
        desfaseMira: 0.1,
      };
    },
  },

  // 15 -> 1 : rebobinado rapido de vuelta a la portada.
  'rebobinado': {
    etiqueta: 'Rebobinado',
    duracion: 2.5,
    esViaje: false,
    rebobinar: true,
    perfil({ p0, p1, m0, m1 }) {
      return {
        duracion: 2.5,
        suavizado: 'power4.inOut',
        curvaPuntos: [
          p0.clone(),
          p0.clone().lerp(p1, 0.5).setY(p0.y * 1.15),
          p1.clone().setY(p1.y + 24),
          p1.clone(),
        ],
        curvaMira: [m0.clone(), m0.clone().lerp(m1, 0.8), m1.clone()],
        suavizadoMira: 'power2.inOut',
        desfaseMira: 0.0,
      };
    },
  },
};

/**
 * Comprueba que el guion de transiciones este bien:
 *  - que todas existan
 *  - que NINGUNA se repita dos veces seguidas
 * Devuelve la lista de problemas (vacia si todo esta bien).
 */
export function validarTransiciones(escenas) {
  const problemas = [];
  let anterior = null;
  for (const esc of escenas) {
    const nombre = esc.transicionSiguiente;
    if (!nombre) {
      problemas.push(`Escena ${esc.id}: le falta "transicionSiguiente".`);
      continue;
    }
    if (!TRANSICIONES[nombre]) {
      problemas.push(`Escena ${esc.id}: la transicion "${nombre}" no existe.`);
      continue;
    }
    if (nombre === anterior) {
      problemas.push(
        `Escena ${esc.id}: la transicion "${nombre}" se repite dos veces seguidas. ` +
        `Elige otra de: ${Object.keys(TRANSICIONES).join(', ')}`
      );
    }
    anterior = nombre;
  }

  // Lo mismo para los efectos de texto.
  let efAnterior = null;
  for (const esc of escenas) {
    if (esc.efectoTexto && esc.efectoTexto === efAnterior) {
      problemas.push(`Escena ${esc.id}: el efecto de texto "${esc.efectoTexto}" se repite dos veces seguidas.`);
    }
    efAnterior = esc.efectoTexto;
  }

  return problemas;
}

export { V };
export default TRANSICIONES;
