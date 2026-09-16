/**
 * main.js — Arranque de la presentación.
 *
 * Crea el renderizador, el mundo, la cámara, los efectos y las 15 escenas,
 * y luego deja todo en manos del Director.
 */

import './estilos/ui.css';

import { WebGLRenderer, PerspectiveCamera, ACESFilmicToneMapping, Clock } from 'three';
import { gsap } from 'gsap';

import { ESCENAS } from './data/escenas.js';
import { Mundo } from './nucleo/mundo.js';
import { Rig } from './nucleo/camara.js';
import { Director } from './nucleo/director.js';
import { Rendimiento } from './nucleo/rendimiento.js';
import { conectarControles, alternarPantallaCompleta } from './nucleo/entrada.js';
import { Sonido } from './nucleo/audio.js';
import { Paneles } from './ui/paneles.js';
import { Progreso } from './ui/progreso.js';
import { Cartel } from './ui/cartel.js';
import { Efectos } from './mundo/efectos.js';
import { crearEscenarios } from './escenas/indice.js';
import { animarBanderas } from './mundo/banderas.js';
import { orientarLetreros } from './mundo/letrero.js';

const lienzo = document.getElementById('lienzo');
const parametros = new URLSearchParams(location.search);

/**
 * GSAP, por defecto, "congela" el tiempo de las animaciones cuando un cuadro
 * tarda más de medio segundo. En una computadora lenta eso hacía que un vuelo
 * de 5 segundos durara casi un minuto y que el texto apareciera a cuentagotas.
 * Subimos el umbral: preferimos que un vuelo dé un salto a que se eternice en
 * plena exposición.
 */
gsap.ticker.lagSmoothing(900, 33);

/* ---------------------------------------------------------- renderizador */

const renderer = new WebGLRenderer({
  canvas: lienzo,
  antialias: true,
  powerPreference: 'high-performance',
  stencil: false,
});
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.toneMapping = ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.02;
renderer.shadowMap.enabled = false;

const camara = new PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.5, 2400);

/* --------------------------------------------------------------- interfaz */

const capaUI = document.getElementById('interfaz');
const paneles = new Paneles(document.getElementById('textos'));
const cartel = new Cartel(document.getElementById('carteles'));
const avisoLigero = document.getElementById('avisoLigero');
const avisoFps = document.getElementById('avisoFps');
const avisoSonido = document.getElementById('avisoSonido');
const ayuda = document.getElementById('ayuda');
const mostrarFps = parametros.has('fps');
if (mostrarFps) avisoFps.classList.remove('aviso--oculto');

/* ------------------------------------------------------------ arranque */

// Esperamos a las fuentes: los retratos, los carteles y el documento real
// llevan texto dibujado en un canvas, y si Cinzel no está lista todavía
// saldrían con la letra equivocada y ya no se podría cambiar.
const fuentesListas = (document.fonts?.ready || Promise.resolve()).catch(() => {});

let director = null;
let efectos = null;
let escenarios = [];
let mundo = null;
let rig = null;
let rendimiento = null;
let sonido = null;
const letreros = [];

fuentesListas.then(iniciar);

function iniciar() {
  /* ----------------------------------------------------------- el mundo */

  mundo = new Mundo({ calidad: parametros.get('calidad') === 'baja' ? 'baja' : 'alta' });
  rig = new Rig(camara);

  efectos = new Efectos(mundo, camara, capaUI);
  escenarios = crearEscenarios(mundo, { efectos, camara, letreros });

  /* --------------------------------------------------------- rendimiento */

  rendimiento = new Rendimiento(renderer, {
    alCambiarModo: (activo, motivo) => {
      avisoLigero.classList.toggle('aviso--oculto', !activo);
      avisoLigero.textContent = motivo === 'automatico' ? 'Modo ligero (automático)' : 'Modo ligero';
      efectos.aplicarModoLigero(activo);
    },
  });

  sonido = new Sonido({
    alCambiar: (encendido) => {
      avisoSonido.classList.toggle('aviso--oculto', !encendido);
    },
  });
  // Los rayos de la tormenta suenan.
  efectos.alTrueno = (fuerza) => sonido.trueno(fuerza);

  /* ------------------------------------------------------------ director */

  const progreso = new Progreso(
    document.getElementById('progreso'),
    ESCENAS,
    (indice) => director.ir(indice)
  );

  director = new Director({
    escenas: ESCENAS,
    rig,
    mundo,
    paneles,
    progreso,
    cartel,
    escenarios,
    efectos,
    alCambiar: (esc) => sonido.ambiente(esc.ambiente, esc),
  });

  conectarControles({
    siguiente: () => director.siguiente(),
    anterior: () => director.anterior(),
    inicio: () => director.inicio(),
    saltarA: (n) => director.saltarA(n),
    total: () => ESCENAS.length,
    pantallaCompleta: alternarPantallaCompleta,
    modoLigero: () => rendimiento.alternar(),
    sonido: () => sonido.alternar(director.escena),
  });

  window.addEventListener('resize', redimensionar);
  redimensionar();

  // Escena inicial (o la que se pida con ?escena=7, útil para ensayar).
  const inicial = Math.max(1, Math.min(ESCENAS.length,
    parseInt(parametros.get('escena') || '1', 10))) - 1;
  director.ir(inicial, { inmediato: true, conTexto: false });

  renderer.setAnimationLoop(cuadro);

  // Quitamos la pantalla de carga cuando el primer cuadro ya se dibujó.
  // El texto no empieza a animarse hasta entonces: si no, en una laptop
  // lenta el título aparecía a medias.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const carga = document.getElementById('cargando');
    if (carga) {
      carga.classList.add('se-va');
      setTimeout(() => carga.remove(), 900);
    }
    director.presentarTextoActual();
    gsap.to(ayuda, {
      opacity: 0, duration: 1.2, delay: 8,
      onComplete: () => { ayuda.style.display = 'none'; },
    });
  }));

  // Para depurar desde la consola del navegador.
  window.presentacion = { director, mundo, rig, rendimiento, efectos, escenarios, sonido, ESCENAS };
}

/* ------------------------------------------------------- tamaño de pantalla */

function redimensionar() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camara.aspect = w / h;
  camara.updateProjectionMatrix();
  renderer.setSize(w, h, false);
  if (compositor) compositor.setSize(w, h);
}

/* ------------------------------------------------- desenfoque de velocidad */

let compositor = null;

/**
 * El desenfoque de movimiento sólo se monta la primera vez que hace falta
 * (cuesta memoria) y nunca en modo ligero.
 */
async function prepararCompositor() {
  if (compositor) return compositor;
  const [{ EffectComposer }, { RenderPass }, { AfterimagePass }] = await Promise.all([
    import('three/addons/postprocessing/EffectComposer.js'),
    import('three/addons/postprocessing/RenderPass.js'),
    import('three/addons/postprocessing/AfterimagePass.js'),
  ]);
  const c = new EffectComposer(renderer);
  c.addPass(new RenderPass(mundo.escena, camara));
  const estela = new AfterimagePass(0.82);
  c.addPass(estela);
  c.setSize(window.innerWidth, window.innerHeight);
  compositor = c;
  return c;
}

/* --------------------------------------------------------------- bucle */

const reloj = new Clock();
let tiempo = 0;

function cuadro() {
  const dt = Math.min(reloj.getDelta(), 0.1);
  tiempo += dt;

  rig.actualizar(dt);
  mundo.ambiente.seguir(camara);
  mundo.actualizar(tiempo, dt);

  animarBanderas(dt);
  efectos.animar(tiempo, dt);

  for (let i = 0; i < escenarios.length; i++) {
    escenarios[i].animar(tiempo, dt, director.estaActiva(i));
  }

  orientarLetreros(letreros, camara);

  if (efectos.desenfocando) {
    if (compositor) compositor.render(dt);
    else { prepararCompositor(); renderer.render(mundo.escena, camara); }
  } else {
    renderer.render(mundo.escena, camara);
  }

  rendimiento.medir();
  if (mostrarFps) avisoFps.textContent = `${Math.round(rendimiento.fps)} FPS`;
}
