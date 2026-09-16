/**
 * telon.js — El telón: la imagen o el video fotorrealista de cada escena.
 *
 * Funciona así:
 *   - Al arrancar busca qué archivos existen en public/medios/ (ver
 *     src/data/medios.js). No hay que configurar nada: basta con que el
 *     archivo se llame escena-06.jpg o escena-06.mp4.
 *   - Al llegar a una escena que SÍ tiene archivo, el telón aparece a
 *     pantalla completa y el texto queda encima.
 *   - Al empezar un vuelo, el telón se va y se ve otra vez el mapa 3D.
 *     Por eso se conservan los vuelos de cámara entre ciudades.
 *   - Si una escena NO tiene archivo, no pasa nada: se usa su escenario 3D.
 *
 * La imagen nunca está quieta: hace un movimiento lento de acercamiento o
 * de barrido (el "efecto Ken Burns") y además se desplaza un poco con la
 * deriva de la cámara 3D, para que parezca parte del mismo mundo.
 */

import { gsap } from 'gsap';
import {
  CARPETA, EXTENSIONES, nombreBase, MOVIMIENTOS,
  DURACION_MOVIMIENTO, FUERZA_PARALLAX,
} from '../data/medios.js';

/** Orden de búsqueda: primero lo más probable, para hacer menos intentos. */
const ORDEN = ['mp4', 'jpg', 'png', 'webp', 'webm', 'jpeg'];

function esVideo(ext) {
  return ext === 'mp4' || ext === 'webm';
}

/** Intenta cargar una imagen. Devuelve la URL si existe, o null. */
function probarImagen(url) {
  return new Promise((listo) => {
    const img = new Image();
    img.onload = () => listo(img.naturalWidth > 0 ? url : null);
    img.onerror = () => listo(null);
    img.src = url;
  });
}

/** Intenta cargar un video. Devuelve la URL si existe, o null. */
function probarVideo(url) {
  return new Promise((listo) => {
    const v = document.createElement('video');
    let resuelto = false;
    const fin = (valor) => {
      if (resuelto) return;
      resuelto = true;
      v.removeAttribute('src');
      v.load();
      listo(valor);
    };
    v.muted = true;
    v.preload = 'metadata';
    v.onloadedmetadata = () => fin(v.videoWidth > 0 ? url : null);
    v.onerror = () => fin(null);
    // Por si el archivo no existe y el navegador no avisa.
    setTimeout(() => fin(null), 6000);
    v.src = url;
  });
}

export class Telon {
  constructor(contenedor, total = 15) {
    this.total = total;
    this.medios = new Map();   // id -> { url, ext, video }
    this.actual = null;
    this.tlMovimiento = null;
    this.visible = false;

    this.raiz = document.createElement('div');
    this.raiz.className = 'telon';
    this.raiz.setAttribute('aria-hidden', 'true');

    // Dos capas anidadas: una para el parallax y otra para el Ken Burns.
    // Separadas para que las dos animaciones no se pisen.
    this.capaParallax = document.createElement('div');
    this.capaParallax.className = 'telon__parallax';

    this.capaMedio = document.createElement('div');
    this.capaMedio.className = 'telon__medio';

    this.capaParallax.appendChild(this.capaMedio);
    this.raiz.appendChild(this.capaParallax);

    // Grano de película y viñeta: hacen que una imagen de IA se integre
    // con el resto y se vea "de época" en vez de recién salida del horno.
    const grano = document.createElement('div');
    grano.className = 'telon__grano';
    const vineta = document.createElement('div');
    vineta.className = 'telon__vineta';
    this.raiz.appendChild(grano);
    this.raiz.appendChild(vineta);

    contenedor.appendChild(this.raiz);

    this.desvio = { x: 0, y: 0 };
  }

  /** ¿El telón tapa toda la pantalla ahora mismo? (para no dibujar el 3D) */
  get cubriendo() {
    return this.visible && Number(getComputedStyle(this.raiz).opacity) > 0.985;
  }

  /** ¿Esta escena tiene imagen o video? */
  tiene(id) {
    return this.medios.has(id);
  }

  get cuantos() {
    return this.medios.size;
  }

  /**
   * Busca qué archivos existen. Se llama una vez, al arrancar.
   * No bloquea: la presentación funciona mientras tanto con el 3D.
   */
  async buscarMedios() {
    const tareas = [];
    for (let id = 1; id <= this.total; id++) {
      tareas.push(this.buscarUno(id));
    }
    await Promise.all(tareas);
    return this.medios.size;
  }

  async buscarUno(id) {
    const base = CARPETA + nombreBase(id);
    for (const ext of ORDEN) {
      if (!EXTENSIONES.includes(ext)) continue;
      const url = `${base}.${ext}`;
      const encontrado = esVideo(ext) ? await probarVideo(url) : await probarImagen(url);
      if (encontrado) {
        this.medios.set(id, { url, ext, video: esVideo(ext) });
        return;
      }
    }
  }

  /** Crea el <img> o el <video> de una escena. */
  crearElemento(medio) {
    if (medio.video) {
      const v = document.createElement('video');
      v.src = medio.url;
      v.muted = true;
      v.loop = true;
      v.autoplay = true;
      v.playsInline = true;
      v.setAttribute('playsinline', '');
      v.preload = 'auto';
      return v;
    }
    const img = document.createElement('img');
    img.src = medio.url;
    img.alt = '';
    img.decoding = 'async';
    return img;
  }

  /** Muestra el telón de una escena. Devuelve true si esa escena tiene medio. */
  mostrar(id, { duracion = 0.9, retraso = 0 } = {}) {
    const medio = this.medios.get(id);
    if (!medio) {
      this.ocultar({ duracion: 0.45 });
      return false;
    }

    // Si ya está puesto el de esta escena, no lo recargamos.
    if (this.actual === id && this.visible) return true;

    this.limpiar();
    const el = this.crearElemento(medio);
    this.capaMedio.appendChild(el);
    this.actual = id;
    this.visible = true;

    if (medio.video) {
      const intento = el.play();
      if (intento?.catch) intento.catch(() => {});
    }

    gsap.killTweensOf(this.raiz);
    gsap.fromTo(this.raiz,
      { opacity: 0 },
      { opacity: 1, duration: duracion, delay: retraso, ease: 'power2.out' });

    this.arrancarMovimiento(id);
    return true;
  }

  /** Quita el telón: se ve otra vez el mundo 3D (para los vuelos). */
  ocultar({ duracion = 0.55 } = {}) {
    if (!this.visible) return;
    this.visible = false;
    gsap.killTweensOf(this.raiz);
    gsap.to(this.raiz, {
      opacity: 0,
      duration: duracion,
      ease: 'power2.in',
      onComplete: () => {
        if (!this.visible) this.limpiar();
      },
    });
  }

  limpiar() {
    if (this.tlMovimiento) {
      this.tlMovimiento.kill();
      this.tlMovimiento = null;
    }
    for (const hijo of [...this.capaMedio.children]) {
      if (hijo.tagName === 'VIDEO') {
        hijo.pause();
        hijo.removeAttribute('src');
        hijo.load();
      }
      hijo.remove();
    }
    this.actual = null;
    gsap.set(this.capaMedio, { clearProps: 'transform' });
  }

  /** El movimiento lento de cámara sobre la imagen. */
  arrancarMovimiento(id) {
    const m = MOVIMIENTOS[id] || MOVIMIENTOS[1];
    if (this.tlMovimiento) this.tlMovimiento.kill();

    gsap.set(this.capaMedio, {
      scale: m.escala[0],
      xPercent: m.x[0],
      yPercent: m.y[0],
      rotate: m.giro[0],
    });

    // Va y vuelve, así nunca da un salto al terminar.
    this.tlMovimiento = gsap.to(this.capaMedio, {
      scale: m.escala[1],
      xPercent: m.x[1],
      yPercent: m.y[1],
      rotate: m.giro[1],
      duration: DURACION_MOVIMIENTO,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    });
  }

  /**
   * Parallax: la imagen se mueve un poquito con la deriva de la cámara 3D.
   * Es lo que evita que se vea como una foto pegada en la pantalla.
   */
  actualizar(rig) {
    if (!this.visible || !rig) return;
    const objetivoX = (rig.camara.position.x - rig.pos.x) * FUERZA_PARALLAX;
    const objetivoY = (rig.camara.position.y - rig.pos.y) * FUERZA_PARALLAX;
    // Suavizado, para que no vibre.
    this.desvio.x += (objetivoX - this.desvio.x) * 0.08;
    this.desvio.y += (objetivoY - this.desvio.y) * 0.08;
    this.capaParallax.style.transform =
      `translate3d(${this.desvio.x.toFixed(2)}px, ${(-this.desvio.y).toFixed(2)}px, 0)`;
  }

  /** En modo ligero quitamos el grano (es lo único que cuesta algo). */
  aplicarModoLigero(activo) {
    this.raiz.classList.toggle('telon--ligero', activo);
  }
}
