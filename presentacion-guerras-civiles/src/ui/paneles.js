/**
 * paneles.js — La capa HTML que va encima del mundo 3D.
 * Los objetos 3D son el escenario; el texto vive aqui, en HTML,
 * para que se lea nitido desde el fondo del salon.
 */

import { gsap } from 'gsap';
import { aplicarEfecto } from './efectosTexto.js';

export class Paneles {
  constructor(contenedor) {
    this.raiz = contenedor;
    this.actual = null;
    this.tl = null;
  }

  /** Construye el panel de una escena (sin animarlo todavia). */
  construir(escena) {
    const panel = document.createElement('article');
    // Con muchas vinetas reducimos la letra para que TODO entre en pantalla.
    const denso = (escena.puntos?.length || 0) >= 7;
    panel.className = 'panel' + (escena.esPortada ? ' panel--portada' : '') +
                                (escena.esCierre ? ' panel--cierre' : '') +
                                (denso ? ' panel--denso' : '');

    const marca = document.createElement('div');
    marca.className = 'panel__expositor';
    marca.dataset.expositor = escena.expositor;
    marca.innerHTML = `<span class="punto"></span>${escena.expositor}`;
    panel.appendChild(marca);

    const h = document.createElement('h1');
    h.className = 'panel__titulo';
    h.textContent = escena.titulo;
    panel.appendChild(h);

    const animables = [h];

    if (escena.subtitulo) {
      const s = document.createElement('p');
      s.className = 'panel__subtitulo';
      s.textContent = escena.subtitulo;
      panel.appendChild(s);
      animables.push(s);
    }

    if (escena.marcador) {
      const m = document.createElement('div');
      m.className = 'panel__marcador';
      m.textContent = escena.marcador;
      panel.appendChild(m);
      animables.push(m);
    }

    if (escena.puntos?.length) {
      const ul = document.createElement('ul');
      ul.className = 'panel__puntos';
      for (const texto of escena.puntos) {
        const li = document.createElement('li');
        li.textContent = texto;
        ul.appendChild(li);
        animables.push(li);
      }
      panel.appendChild(ul);
    }

    return { panel, animables };
  }

  /** Muestra la escena con su efecto de texto. */
  mostrar(escena, { retraso = 0 } = {}) {
    this.limpiar();
    const { panel, animables } = this.construir(escena);
    this.raiz.appendChild(panel);
    this.actual = panel;

    const tl = gsap.timeline();
    gsap.set(panel, { opacity: 0, y: 16 });
    tl.to(panel, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, retraso);
    aplicarEfecto(escena.efectoTexto, animables, { retraso: retraso + 0.12, tl });
    this.tl = tl;
    return tl;
  }

  /** Desvanece el texto actual (se usa al empezar un vuelo). */
  ocultar({ duracion = 0.45 } = {}) {
    if (!this.actual) return gsap.timeline();
    const panel = this.actual;
    this.actual = null;
    const tl = gsap.timeline({
      onComplete: () => panel.remove(),
    });
    tl.to(panel, { opacity: 0, y: -14, duration: duracion, ease: 'power2.in' });
    return tl;
  }

  limpiar() {
    if (this.tl) this.tl.kill();
    this.raiz.querySelectorAll('.panel').forEach((p) => p.remove());
    this.actual = null;
  }
}
