/**
 * audio.js — Sonido ambiente, opcional y APAGADO por defecto (tecla M).
 *
 * No hay ningún archivo de audio: todo lo genera el navegador con la Web
 * Audio API (ruido filtrado para el viento y la lluvia, golpes graves para
 * los tambores, un estallido con caída para los truenos). Así no hay
 * problemas de derechos y la presentación no pesa ni un kilobyte más.
 */

/** Cuánto se oye cada cosa en cada ambiente. */
const AMBIENTES = {
  dia:        { viento: 0.22, tambor: 0.0,  lluvia: 0.0, tono: 520 },
  atardecer:  { viento: 0.30, tambor: 0.10, lluvia: 0.0, tono: 430 },
  amanecer:   { viento: 0.24, tambor: 0.0,  lluvia: 0.0, tono: 620 },
  noche:      { viento: 0.16, tambor: 0.06, lluvia: 0.0, tono: 320 },
  lluvia:     { viento: 0.26, tambor: 0.08, lluvia: 0.5, tono: 900 },
  niebla:     { viento: 0.20, tambor: 0.0,  lluvia: 0.0, tono: 380 },
  polvo:      { viento: 0.34, tambor: 0.22, lluvia: 0.0, tono: 700 },
  sobrenubes: { viento: 0.40, tambor: 0.0,  lluvia: 0.0, tono: 1100 },
};

export class Sonido {
  constructor({ alCambiar = null } = {}) {
    this.alCambiar = alCambiar;
    this.encendido = false;
    this.ctx = null;
    this.ambienteActual = 'dia';
    this.tamborTimer = null;
  }

  /** El navegador sólo deja crear audio tras un gesto del usuario. */
  crear() {
    if (this.ctx) return;
    const CtxAudio = window.AudioContext || window.webkitAudioContext;
    if (!CtxAudio) return;

    const ctx = new CtxAudio();
    this.ctx = ctx;

    this.maestro = ctx.createGain();
    this.maestro.gain.value = 0;
    this.maestro.connect(ctx.destination);

    // --- Ruido base, reutilizado por el viento y la lluvia ---
    const largo = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, largo, ctx.sampleRate);
    const datos = buffer.getChannelData(0);
    let ultimo = 0;
    for (let i = 0; i < largo; i++) {
      const blanco = Math.random() * 2 - 1;
      // Ruido rosado: más grave, más parecido al viento de verdad.
      ultimo = (ultimo + 0.02 * blanco) / 1.02;
      datos[i] = ultimo * 3.2;
    }
    this.buffer = buffer;

    // --- Viento ---
    this.viento = ctx.createBufferSource();
    this.viento.buffer = buffer;
    this.viento.loop = true;
    this.filtroViento = ctx.createBiquadFilter();
    this.filtroViento.type = 'bandpass';
    this.filtroViento.frequency.value = 520;
    this.filtroViento.Q.value = 0.7;
    this.ganViento = ctx.createGain();
    this.ganViento.gain.value = 0.22;
    this.viento.connect(this.filtroViento).connect(this.ganViento).connect(this.maestro);
    this.viento.start();

    // Ráfagas: el viento sube y baja solo.
    this.lfo = ctx.createOscillator();
    this.lfo.frequency.value = 0.06;
    this.lfoGan = ctx.createGain();
    this.lfoGan.gain.value = 0.09;
    this.lfo.connect(this.lfoGan).connect(this.ganViento.gain);
    this.lfo.start();

    // --- Lluvia ---
    this.lluvia = ctx.createBufferSource();
    this.lluvia.buffer = buffer;
    this.lluvia.loop = true;
    this.filtroLluvia = ctx.createBiquadFilter();
    this.filtroLluvia.type = 'highpass';
    this.filtroLluvia.frequency.value = 1400;
    this.ganLluvia = ctx.createGain();
    this.ganLluvia.gain.value = 0;
    this.lluvia.connect(this.filtroLluvia).connect(this.ganLluvia).connect(this.maestro);
    this.lluvia.start();

    this.ganTambor = ctx.createGain();
    this.ganTambor.gain.value = 0;
    this.ganTambor.connect(this.maestro);

    this.aplicarAmbiente(this.ambienteActual, 0.1);
  }

  /** Enciende o apaga el sonido (tecla M). */
  alternar(escena = null) {
    this.encendido = !this.encendido;

    if (this.encendido) {
      this.crear();
      this.ctx?.resume?.();
      if (escena) this.ambiente(escena.ambiente, escena);
      this.rampa(this.maestro?.gain, 0.5, 1.2);
      this.arrancarTambores();
    } else {
      this.rampa(this.maestro?.gain, 0, 0.6);
      this.pararTambores();
    }

    this.alCambiar?.(this.encendido);
    return this.encendido;
  }

  /** Cambia el ambiente sonoro al cambiar de escena. */
  ambiente(nombre, escena = null) {
    this.ambienteActual = nombre in AMBIENTES ? nombre : 'dia';
    this.escenaActual = escena;
    if (!this.encendido || !this.ctx) return;
    this.aplicarAmbiente(this.ambienteActual, 2.2);
  }

  aplicarAmbiente(nombre, segundos) {
    const a = AMBIENTES[nombre] || AMBIENTES.dia;
    if (!this.ctx) return;
    this.rampa(this.ganViento.gain, a.viento, segundos);
    this.rampa(this.ganLluvia.gain, a.lluvia * 0.5, segundos);
    this.rampa(this.filtroViento.frequency, a.tono, segundos);
    this.fuerzaTambor = a.tambor;
  }

  rampa(param, valor, segundos) {
    if (!param || !this.ctx) return;
    const ahora = this.ctx.currentTime;
    param.cancelScheduledValues(ahora);
    param.setValueAtTime(param.value, ahora);
    param.linearRampToValueAtTime(valor, ahora + segundos);
  }

  /* -------------------------------------------------------- tambores */

  arrancarTambores() {
    this.pararTambores();
    const golpe = () => {
      if (!this.encendido) return;
      if ((this.fuerzaTambor || 0) > 0.02) this.tambor(this.fuerzaTambor);
      this.tamborTimer = setTimeout(golpe, 900 + Math.random() * 700);
    };
    this.tamborTimer = setTimeout(golpe, 800);
  }

  pararTambores() {
    if (this.tamborTimer) {
      clearTimeout(this.tamborTimer);
      this.tamborTimer = null;
    }
  }

  /** Un golpe de tambor: seno grave que cae de tono. */
  tambor(fuerza = 0.2) {
    if (!this.ctx || !this.encendido) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(95, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.22);

    const gan = ctx.createGain();
    gan.gain.setValueAtTime(0.0001, t);
    gan.gain.exponentialRampToValueAtTime(Math.max(fuerza, 0.02), t + 0.012);
    gan.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);

    osc.connect(gan).connect(this.ganTambor);
    this.ganTambor.gain.setValueAtTime(1, t);
    osc.start(t);
    osc.stop(t + 0.55);
  }

  /** Un trueno: estallido de ruido que se apaga poco a poco. */
  trueno(fuerza = 1) {
    if (!this.ctx || !this.encendido) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const retardo = 0.12 + Math.random() * 0.5;

    const fuente = ctx.createBufferSource();
    fuente.buffer = this.buffer;
    fuente.loop = true;

    const filtro = ctx.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.frequency.setValueAtTime(900, t + retardo);
    filtro.frequency.exponentialRampToValueAtTime(90, t + retardo + 1.6);

    const gan = ctx.createGain();
    gan.gain.setValueAtTime(0.0001, t + retardo);
    gan.gain.exponentialRampToValueAtTime(0.42 * fuerza, t + retardo + 0.05);
    gan.gain.exponentialRampToValueAtTime(0.0001, t + retardo + 2.1);

    fuente.connect(filtro).connect(gan).connect(this.maestro);
    fuente.start(t + retardo);
    fuente.stop(t + retardo + 2.3);
  }
}
