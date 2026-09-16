/**
 * cartel.js — El nombre de la ciudad que aparece en grande al llegar,
 * como en los documentales: "CUSCO — 1537".
 */

import { gsap } from 'gsap';

export class Cartel {
  constructor(contenedor) {
    this.raiz = contenedor;
  }

  mostrar({ texto, anio }, { duracion = 2.6 } = {}) {
    const el = document.createElement('div');
    el.className = 'cartel';
    el.innerHTML = `
      <span class="cartel__linea"></span>
      <span class="cartel__nombre">${texto}</span>
      <span class="cartel__anio">${anio}</span>
      <span class="cartel__linea"></span>
    `;
    this.raiz.appendChild(el);

    const nombre = el.querySelector('.cartel__nombre');
    const anioEl = el.querySelector('.cartel__anio');
    const lineas = el.querySelectorAll('.cartel__linea');

    const tl = gsap.timeline({ onComplete: () => el.remove() });
    gsap.set(el, { opacity: 1 });
    gsap.set(lineas, { scaleX: 0 });
    gsap.set(nombre, { opacity: 0, letterSpacing: '0.62em', y: 8 });
    gsap.set(anioEl, { opacity: 0, y: 6 });

    tl.to(lineas, { scaleX: 1, duration: 0.55, ease: 'power3.out' }, 0)
      .to(nombre, { opacity: 1, letterSpacing: '0.22em', y: 0, duration: 0.85, ease: 'power3.out' }, 0.08)
      .to(anioEl, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.42)
      .to(el, { opacity: 0, duration: 0.6, ease: 'power2.in' }, duracion);

    return tl;
  }
}
