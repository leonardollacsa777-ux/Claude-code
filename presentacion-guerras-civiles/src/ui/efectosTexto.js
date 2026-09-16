/**
 * efectosTexto.js — Las cinco formas en que aparece el texto.
 *
 * Se eligen en escenas.js con el campo `efectoTexto`:
 *   'tinta'    -> se escribe con tinta, letra por letra
 *   'dorado'   -> letras grabadas en dorado, con un brillo que las recorre
 *   'quema'    -> el papel se quema y revela el texto
 *   'piedras'  -> las letras caen como piedras
 *   'destello' -> destello de luz y el texto queda
 *
 * Igual que con las transiciones, dos escenas seguidas nunca usan el mismo.
 */

import { gsap } from 'gsap';

export const NOMBRES = ['tinta', 'dorado', 'quema', 'piedras', 'destello'];

/**
 * Parte un texto para poder animarlo.
 * OJO: cada palabra va dentro de un <span class="palabra"> que NO se puede
 * partir. Sin esto el navegador cortaria palabras a la mitad
 * ("...ENTR / E LOS..."), porque cada letra seria una caja independiente.
 */
function trocear(elemento, porPalabra = false) {
  const texto = elemento.textContent;
  elemento.textContent = '';
  const trozos = [];

  for (const parte of texto.split(/(\s+)/)) {
    if (!parte) continue;
    if (/^\s+$/.test(parte)) {
      elemento.appendChild(document.createTextNode(' '));
      continue;
    }

    const palabra = document.createElement('span');
    palabra.className = 'palabra';

    if (porPalabra) {
      palabra.classList.add('trozo');
      palabra.textContent = parte;
      trozos.push(palabra);
    } else {
      for (const letra of parte) {
        const s = document.createElement('span');
        s.className = 'trozo';
        s.textContent = letra;
        palabra.appendChild(s);
        trozos.push(s);
      }
    }
    elemento.appendChild(palabra);
  }
  return trozos;
}

/** Decide si conviene trocear por letra o por palabra (por rendimiento). */
function preparar(elementos, limiteLetras = 150) {
  const todos = [];
  for (const el of elementos) {
    const porPalabra = el.textContent.length > limiteLetras;
    todos.push(...trocear(el, porPalabra));
  }
  return todos;
}

/**
 * Cuanto puede durar como maximo el reparto de una animacion.
 * En una exposicion el expositor empieza a hablar enseguida: el texto
 * tiene que estar completo en poco mas de un segundo, tambien en una
 * laptop lenta.
 */
const REPARTO = 0.75;
const paso = (n, base) => Math.min(base, REPARTO / Math.max(n, 1));

const EFECTOS = {

  /** Se escribe con tinta: las letras aparecen corridas y se asientan. */
  tinta(elementos, tl, retraso) {
    const trozos = preparar(elementos);
    gsap.set(trozos, { opacity: 0, filter: 'blur(5px)', x: -5 });
    tl.to(trozos, {
      opacity: 1, filter: 'blur(0px)', x: 0,
      duration: 0.45,
      ease: 'power2.out',
      stagger: { each: paso(trozos.length, 0.022) },
    }, retraso);
  },

  /** Letras grabadas en dorado, con un brillo que las recorre. */
  dorado(elementos, tl, retraso) {
    const trozos = preparar(elementos);
    gsap.set(trozos, { opacity: 0, scale: 0.86, color: '#6B5418' });
    tl.to(trozos, {
      opacity: 1, scale: 1,
      duration: 0.45,
      ease: 'back.out(1.8)',
      stagger: { each: paso(trozos.length, 0.02) },
    }, retraso);
    tl.to(trozos, {
      color: '#F0D780',
      textShadow: '0 0 14px rgba(201,162,39,0.75)',
      duration: 0.3,
      stagger: { each: paso(trozos.length, 0.016) },
    }, retraso + 0.12);
    tl.to(trozos, {
      color: '',
      textShadow: '0 1px 0 rgba(0,0,0,0.6)',
      duration: 0.55,
      ease: 'power2.out',
    }, retraso + 0.8);
  },

  /** El papel se quema de abajo hacia arriba y revela el texto. */
  quema(elementos, tl, retraso) {
    const d = paso(elementos.length, 0.15);
    for (let i = 0; i < elementos.length; i++) {
      const el = elementos[i];
      el.classList.add('quemando');
      gsap.set(el, { opacity: 0, '--quema': '0%' });
      tl.to(el, {
        opacity: 1,
        duration: 0.18,
        ease: 'none',
      }, retraso + i * d);
      tl.fromTo(el,
        { '--quema': '0%' },
        { '--quema': '112%', duration: 0.8, ease: 'power1.inOut' },
        retraso + i * d
      );
      tl.call(() => el.classList.remove('quemando'), null, retraso + i * d + 0.85);
    }
  },

  /** Las letras caen desde arriba como piedras y rebotan al asentarse. */
  piedras(elementos, tl, retraso) {
    const trozos = preparar(elementos, 110);
    gsap.set(trozos, { opacity: 0, y: -46, rotateZ: () => (Math.random() - 0.5) * 34 });
    tl.to(trozos, {
      opacity: 1, y: 0, rotateZ: 0,
      duration: 0.55,
      ease: 'bounce.out',
      stagger: { each: paso(trozos.length, 0.025), from: 'random' },
    }, retraso);
  },

  /** Un destello de luz y el texto queda escrito. */
  destello(elementos, tl, retraso) {
    const d = paso(elementos.length, 0.12);
    for (let i = 0; i < elementos.length; i++) {
      const el = elementos[i];
      gsap.set(el, { opacity: 0, filter: 'brightness(6) blur(9px)', scale: 1.06 });
      tl.to(el, {
        opacity: 1,
        duration: 0.16,
        ease: 'power3.out',
      }, retraso + i * d);
      tl.to(el, {
        filter: 'brightness(1) blur(0px)', scale: 1,
        duration: 0.55,
        ease: 'power2.out',
      }, retraso + i * d + 0.05);
    }
  },
};

/**
 * Aplica un efecto a una lista de elementos de texto.
 * Devuelve la linea de tiempo para poder saltarla al final.
 */
export function aplicarEfecto(nombre, elementos, { retraso = 0, tl = null } = {}) {
  const linea = tl || gsap.timeline();
  const efecto = EFECTOS[nombre] || EFECTOS.destello;
  efecto(elementos, linea, retraso);
  return linea;
}

export default EFECTOS;
