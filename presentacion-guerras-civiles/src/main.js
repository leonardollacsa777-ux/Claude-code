/**
 * main.js — Arranque de la presentacion.
 *
 * Crea el renderizador, el mundo, la camara y la interfaz, y luego
 * deja todo en manos del Director.
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
import { Paneles } from './ui/paneles.js';
import { Progreso } from './ui/progreso.js';
import { Cartel } from './ui/cartel.js';
import { crearCajasPrueba } from './escenas/cajasPrueba.js';

const lienzo = document.getElementById('lienzo');
const parametros = new URLSearchParams(location.search);

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

/* ------------------------------------------------------------ el mundo */

const mundo = new Mundo({ calidad: parametros.get('calidad') === 'baja' ? 'baja' : 'alta' });

// FASE 1: marcadores de prueba en las 15 estaciones.
const cajas = crearCajasPrueba(ESCENAS);
mundo.decorado.add(cajas);
mundo.animar((t) => cajas.userData.animar(t));

const rig = new Rig(camara);

/* -------------------------------------------------------------- interfaz */

const paneles = new Paneles(document.getElementById('textos'));
const cartel = new Cartel(document.getElementById('carteles'));
const progreso = new Progreso(
  document.getElementById('progreso'),
  ESCENAS,
  (indice) => director.ir(indice)
);

const avisoLigero = document.getElementById('avisoLigero');
const avisoFps = document.getElementById('avisoFps');
const ayuda = document.getElementById('ayuda');

const rendimiento = new Rendimiento(renderer, {
  alCambiarModo: (activo, motivo) => {
    avisoLigero.classList.toggle('aviso--oculto', !activo);
    avisoLigero.textContent = motivo === 'automatico' ? 'Modo ligero (automático)' : 'Modo ligero';
  },
});

const mostrarFps = parametros.has('fps');
if (mostrarFps) avisoFps.classList.remove('aviso--oculto');

/* -------------------------------------------------------------- director */

const director = new Director({
  escenas: ESCENAS,
  rig,
  mundo,
  paneles,
  progreso,
  cartel,
});

conectarControles({
  siguiente: () => director.siguiente(),
  anterior: () => director.anterior(),
  inicio: () => director.inicio(),
  saltarA: (n) => director.saltarA(n),
  total: () => ESCENAS.length,
  pantallaCompleta: alternarPantallaCompleta,
  modoLigero: () => rendimiento.alternar(),
  sonido: () => console.info('[sonido] Llega en la Fase 3.'),
});

/* ------------------------------------------------------- tamano de pantalla */

function redimensionar() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camara.aspect = w / h;
  camara.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}
window.addEventListener('resize', redimensionar);

/* ------------------------------------------------------------ bucle */

const reloj = new Clock();
let tiempo = 0;

function cuadro() {
  const dt = Math.min(reloj.getDelta(), 0.1);
  tiempo += dt;

  rig.actualizar(dt);
  mundo.ambiente.seguir(camara);
  mundo.actualizar(tiempo, dt);

  renderer.render(mundo.escena, camara);

  rendimiento.medir();
  if (mostrarFps) avisoFps.textContent = `${Math.round(rendimiento.fps)} FPS`;
}
renderer.setAnimationLoop(cuadro);

/* ------------------------------------------------------------ arranque */

// Escena inicial (o la que se pida con ?escena=7, util para revisar).
const inicial = Math.max(1, Math.min(ESCENAS.length, parseInt(parametros.get('escena') || '1', 10))) - 1;
director.ir(inicial, { inmediato: true, conTexto: false });

// Quitamos la pantalla de carga cuando el primer cuadro ya se dibujo.
// Importante: el primer cuadro es el mas pesado (se genera el relieve).
// Por eso el texto NO empieza a animarse hasta que ese cuadro ya se dibujo;
// si no, en una laptop lenta el titulo aparecia a medias.
requestAnimationFrame(() => requestAnimationFrame(() => {
  const carga = document.getElementById('cargando');
  carga.classList.add('se-va');
  setTimeout(() => carga.remove(), 900);
  director.presentarTextoActual();
  // La ayuda se desvanece sola para no molestar durante la exposicion.
  gsap.to(ayuda, { opacity: 0, duration: 1.2, delay: 7, onComplete: () => (ayuda.style.display = 'none') });
}));

// Para depurar desde la consola del navegador.
window.presentacion = { director, mundo, rig, rendimiento, ESCENAS };
