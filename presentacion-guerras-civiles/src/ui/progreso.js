/**
 * progreso.js — La barra de abajo: en que escena vamos y quien expone.
 */

import { EXPOSITORES } from '../data/escenas.js';

export class Progreso {
  constructor(contenedor, escenas, alElegir) {
    this.raiz = contenedor;
    this.escenas = escenas;
    this.pasos = [];

    const barra = document.createElement('div');
    barra.className = 'progreso__barra';

    for (const esc of escenas) {
      const paso = document.createElement('button');
      paso.className = 'progreso__paso';
      paso.type = 'button';
      paso.dataset.expositor = esc.expositor;
      paso.style.setProperty('--color', EXPOSITORES[esc.expositor]?.color || '#C9A227');
      paso.title = `${esc.id}. ${esc.titulo} — ${esc.expositor}`;
      paso.setAttribute('aria-label', paso.title);
      paso.innerHTML = `<span class="progreso__relleno"></span>`;
      paso.addEventListener('click', (e) => {
        e.stopPropagation();
        alElegir?.(esc.id - 1);
      });
      barra.appendChild(paso);
      this.pasos.push(paso);
    }

    const pie = document.createElement('div');
    pie.className = 'progreso__pie';
    pie.innerHTML = `
      <div class="progreso__expositores">
        ${Object.entries(EXPOSITORES).map(([nombre, d]) =>
          `<span class="progreso__quien" data-expositor="${nombre}">
             <i style="background:${d.color}"></i>${nombre}
             <em>escenas ${d.escenas[0]}–${d.escenas[d.escenas.length - 1]}</em>
           </span>`).join('')}
      </div>
      <div class="progreso__contador"><b>1</b> / ${escenas.length}</div>
    `;

    this.raiz.appendChild(barra);
    this.raiz.appendChild(pie);
    this.contador = pie.querySelector('.progreso__contador b');
    this.quienes = pie.querySelectorAll('.progreso__quien');
  }

  marcar(indice) {
    const esc = this.escenas[indice];
    this.pasos.forEach((p, i) => {
      p.classList.toggle('es-actual', i === indice);
      p.classList.toggle('es-visto', i < indice);
    });
    this.contador.textContent = String(indice + 1);
    this.quienes.forEach((q) => {
      q.classList.toggle('es-actual', q.dataset.expositor === esc.expositor);
    });
  }
}
