/**
 * director.js — Quien decide que pasa y cuando.
 *
 * Es la maquina de estados de la presentacion:
 *   - guarda en que escena estamos
 *   - construye el vuelo de la camara entre dos estaciones
 *   - desvanece el texto al salir y lo hace aparecer al llegar
 *   - cambia el ambiente (hora del dia y clima) DURANTE el vuelo
 *   - si el expositor presiona "siguiente" en pleno vuelo, lo salta al final
 */

import { Vector3 } from 'three';
import { gsap } from 'gsap';
import { TRANSICIONES, validarTransiciones } from '../transiciones/indice.js';
import { aplicarEfectosTransicion } from '../transiciones/efectos.js';
import { alturaEn } from '../mundo/relieve.js';
import { LUGARES } from '../data/lugares.js';
import { alturaCrucero } from './camara.js';

/** Vuelo generico para cuando se salta de una escena a otra cualquiera. */
const SALTO = {
  etiqueta: 'Salto directo',
  duracion: 2.6,
  perfil({ p0, p1, m0, m1 }) {
    const crucero = Math.max(alturaCrucero(p0, p1, 50), p0.y + 20, p1.y + 20);
    const dir = p1.clone().sub(p0);
    return {
      duracion: 2.6,
      suavizado: 'power3.inOut',
      curvaPuntos: [
        p0.clone(),
        p0.clone().lerp(p1, 0.3).setY(crucero * 0.85),
        p0.clone().lerp(p1, 0.72).setY(crucero * 0.7),
        p1.clone(),
      ],
      curvaMira: [m0.clone(), m0.clone().lerp(m1, 0.5), m1.clone()],
      inclinacionMax: dir.x > 0 ? 0.05 : -0.05,
    };
  },
};

export class Director {
  constructor({ escenas, rig, mundo, paneles, progreso, cartel, escenarios = [], efectos = null, telon = null, alCambiar = null }) {
    this.escenas = escenas;
    this.rig = rig;
    this.mundo = mundo;
    this.escenarios = escenarios;
    this.efectos = efectos;
    this.telon = telon;
    // Qué escenas deben animarse ahora mismo: la actual y, mientras se
    // vuela, también la de destino (así se ve viva al llegar).
    this.activas = new Set([0]);
    this.paneles = paneles;
    this.progreso = progreso;
    this.cartel = cartel;
    this.alCambiar = alCambiar;

    this.indice = 0;
    this.tlActiva = null;
    this.ambienteDestino = null;

    // Avisa por consola si alguien rompio la regla de no repetir transiciones.
    const problemas = validarTransiciones(escenas);
    if (problemas.length) {
      console.warn('[guion] Revisa src/data/escenas.js:\n - ' + problemas.join('\n - '));
    }
  }

  get total() { return this.escenas.length; }
  get escena() { return this.escenas[this.indice]; }
  get enTransicion() { return !!this.tlActiva && this.tlActiva.isActive(); }

  /**
   * Convierte las coordenadas de escenas.js en coordenadas del mundo.
   * En escenas.js la altura (Y) es "metros por encima del suelo", asi que
   * aqui le sumamos la altura real del terreno en ese punto.
   */
  resolver(escena) {
    const p = escena.camara.posicion;
    const o = escena.camara.objetivo;
    return {
      posicion: [p[0], alturaEn(p[0], p[2]) + p[1], p[2]],
      objetivo: [o[0], alturaEn(o[0], o[2]) + o[1], o[2]],
    };
  }

  /** Decide QUE transicion usar entre dos escenas y si va en reversa. */
  elegirTransicion(desdeIdx, haciaIdx) {
    const ultimo = this.total - 1;

    if (haciaIdx === desdeIdx + 1) {
      return { def: TRANSICIONES[this.escenas[desdeIdx].transicionSiguiente], reversa: false };
    }
    if (desdeIdx === ultimo && haciaIdx === 0) {
      return { def: TRANSICIONES[this.escenas[ultimo].transicionSiguiente], reversa: false };
    }
    if (haciaIdx === desdeIdx - 1) {
      return { def: TRANSICIONES[this.escenas[haciaIdx].transicionSiguiente], reversa: true };
    }
    if (desdeIdx === 0 && haciaIdx === ultimo) {
      return { def: TRANSICIONES[this.escenas[ultimo].transicionSiguiente], reversa: true };
    }
    return { def: SALTO, reversa: false };
  }

  /** Arma las opciones de vuelo para el rig. */
  construirVuelo(desdeIdx, haciaIdx) {
    const { def, reversa } = this.elegirTransicion(desdeIdx, haciaIdx);
    const definicion = def || SALTO;

    const A = this.resolver(this.escenas[desdeIdx]);
    const B = this.resolver(this.escenas[haciaIdx]);

    // En reversa calculamos el camino en su sentido original y luego lo
    // recorremos al reves: asi se ve el mismo vuelo, rebobinado.
    const origen = reversa ? B : A;
    const destino = reversa ? A : B;

    const ctx = {
      p0: new Vector3(...origen.posicion),
      p1: new Vector3(...destino.posicion),
      m0: new Vector3(...origen.objetivo),
      m1: new Vector3(...destino.objetivo),
      lugares: LUGARES,
      desde: this.escenas[desdeIdx],
      hacia: this.escenas[haciaIdx],
    };

    const opciones = definicion.perfil(ctx);

    if (reversa) {
      if (opciones.curvaPuntos) opciones.curvaPuntos = [...opciones.curvaPuntos].reverse();
      if (opciones.curvaMira) opciones.curvaMira = [...opciones.curvaMira].reverse();
      if (opciones.inclinacionMax) opciones.inclinacionMax *= -1;
    }

    return { definicion, opciones, destino: B, reversa };
  }

  /** Movimiento de reposo segun el tipo de escena. */
  derivaDe(escena) {
    if (escena.esPortada) return { ampX: 0.1, ampY: 0.12, vel: 0.07, orbita: 0.004 };
    if (escena.ambiente === 'sobrenubes') return { ampX: 1.6, ampY: 1.0, vel: 0.08, orbita: 0.018 };
    if (escena.vibra || escena.ambiente === 'polvo') return { ampX: 0.5, ampY: 0.35, vel: 0.2, orbita: 0.016 };
    return { ampX: 0.7, ampY: 0.45, vel: 0.12, orbita: 0.012 };
  }

  /** ¿Hay que animar esta escena en este momento? */
  estaActiva(indice) {
    return this.activas.has(indice);
  }

  /**
   * Sólo se ve la escena actual (y la de destino mientras se vuela).
   *
   * Hace falta porque varias batallas ocurrieron casi en el mismo sitio:
   * el Cusco, Las Salinas y Jaquijahuana están a pocos kilómetros, o sea
   * a dos o tres unidades del mapa. Si se dibujaran todas a la vez, los
   * ejércitos y los carteles de unas se meterían dentro de las otras.
   */
  aplicarVisibilidad() {
    for (let i = 0; i < this.escenarios.length; i++) {
      const g = this.escenarios[i]?.grupo;
      if (g) g.visible = this.activas.has(i);
    }
  }

  /** Lo que ocurre al aterrizar en una escena. */
  llegar(indice, { mostrarCartel = true } = {}) {
    const esc = this.escenas[indice];
    this.indice = indice;
    this.activas = new Set([indice]);
    this.aplicarVisibilidad();
    this.progreso?.marcar(indice);
    this.rig.ajustarDeriva(this.derivaDe(esc));

    // Si esta escena tiene imagen o video, el telón la muestra a pantalla
    // completa; si no, se ve su escenario 3D. Ver src/ui/telon.js.
    this.telon?.mostrar(esc.id, { retraso: 0.05 });

    // La escena 3D de destino se enciende (partículas, ejércitos, luces).
    this.escenarios[indice]?.activar({
      efectos: this.efectos, mundo: this.mundo, rig: this.rig, director: this,
    });

    if (mostrarCartel && esc.cartel) {
      this.cartel?.mostrar(esc.cartel);
    }
    if (esc.vibra || esc.ambiente === 'polvo') {
      this.rig.vibrar(0.07, 1.4);
    }
    this.alCambiar?.(esc, indice);
  }

  /** Va a una escena. Es el unico camino de entrada a todo. */
  ir(indice, { inmediato = false, conTexto = true } = {}) {
    const destinoIdx = ((indice % this.total) + this.total) % this.total;

    // Si hay un vuelo en marcha, el primer toque lo manda al final.
    if (this.enTransicion) {
      this.saltarAlFinal();
      return false;
    }
    if (destinoIdx === this.indice && !inmediato) return false;

    const esc = this.escenas[destinoIdx];

    if (inmediato) {
      const c = this.resolver(esc);
      this.efectos?.apagar();
      for (let i = 0; i < this.escenarios.length; i++) {
        if (i !== destinoIdx) this.escenarios[i]?.desactivar({ efectos: this.efectos });
      }
      this.rig.colocar(c.posicion, c.objetivo);
      this.mundo.ambiente.aplicar(esc.ambiente, 0);
      this.llegar(destinoIdx, { mostrarCartel: false });
      if (conTexto) this.paneles.mostrar(esc, { retraso: 0.15 });
      return true;
    }

    const { definicion, opciones, destino } = this.construirVuelo(this.indice, destinoIdx);
    const duracion = opciones.duracion || definicion.duracion || 3;
    const salidaIdx = this.indice;

    this.ambienteDestino = esc.ambiente;

    // El telón se va: durante el vuelo se ve el mapa 3D. Eso es lo que
    // mantiene los viajes de cámara entre ciudades.
    this.telon?.ocultar({ duracion: Math.min(0.6, duracion * 0.2) });

    // Durante el vuelo se animan las dos escenas: la que dejamos y la que llega.
    this.activas = new Set([salidaIdx, destinoIdx]);
    this.aplicarVisibilidad();
    this.escenarios[salidaIdx]?.desactivar({ efectos: this.efectos });

    const tl = gsap.timeline({
      onComplete: () => {
        this.tlActiva = null;
        this.llegar(destinoIdx);
        this.paneles.mostrar(esc, { retraso: 0.12 });
      },
    });

    // 1) El texto de la escena actual se va.
    tl.add(this.paneles.ocultar({ duracion: Math.min(0.5, duracion * 0.18) }), 0);

    // 2) La camara vuela.
    tl.add(this.rig.volar(destino, opciones), 0);

    // 3) A mitad del vuelo cambia la luz (asi el dia se vuelve noche EN EL AIRE).
    tl.call(() => {
      this.mundo.ambiente.aplicar(esc.ambiente, duracion * 0.55);
    }, null, duracion * 0.22);

    // 4) Y los efectos propios de ESTA transición: humo, nubes, cóndores,
    //    estela, tormenta, destello… (ver src/transiciones/efectos.js)
    if (this.efectos) {
      const nombre = Object.keys(TRANSICIONES).find((k) => TRANSICIONES[k] === definicion);
      aplicarEfectosTransicion(nombre, {
        efectos: this.efectos,
        tl,
        duracion,
        puntos: opciones.curvaPuntos || [],
        mundo: this.mundo,
        camara: this.rig.camara,
        desde: this.escenas[salidaIdx],
        hacia: esc,
      });
    }

    this.tlActiva = tl;
    this.transicionActual = definicion;
    return true;
  }

  /** Manda el vuelo en curso directo a su final. */
  saltarAlFinal() {
    if (!this.tlActiva) return;
    const tl = this.tlActiva;
    if (this.ambienteDestino) {
      this.mundo.ambiente.aplicar(this.ambienteDestino, 0.3);
    }
    // Los efectos en curso se cortan: si no, el humo o la tormenta seguirían
    // sonando en una escena a la que ya llegamos.
    this.efectos?.apagar();
    tl.progress(1);
  }

  /** Muestra el texto de la escena actual (se usa al terminar de cargar). */
  presentarTextoActual() {
    this.paneles.mostrar(this.escena, { retraso: 0.1 });
  }

  siguiente() { return this.ir(this.indice + 1); }
  anterior() { return this.ir(this.indice - 1); }
  inicio() {
    if (this.enTransicion) { this.saltarAlFinal(); return false; }
    if (this.indice === 0) return false;
    return this.ir(0);
  }
  saltarA(numero) {
    const i = Math.max(1, Math.min(this.total, numero)) - 1;
    return this.ir(i);
  }
}
