/**
 * rendimiento.js — Para que corra fluido en una laptop del colegio.
 *
 *  - Limita el pixelRatio a 1.5 (en pantallas retina ahorra la mitad del trabajo).
 *  - Mide los FPS todo el rato.
 *  - Si baja de 30 FPS durante 3 segundos, enciende el MODO LIGERO solo:
 *    menos particulas, sin sombras y menos resolucion.
 *  - Con la tecla L se enciende o apaga a mano.
 */

export class Rendimiento {
  constructor(renderer, { alCambiarModo = null } = {}) {
    this.renderer = renderer;
    this.alCambiarModo = alCambiarModo;

    this.ligero = false;
    this.automatico = true;
    // Guardamos como estaban las sombras para no encenderlas sin querer.
    this.sombrasBase = renderer.shadowMap.enabled;

    this.cuadros = 0;
    this.fps = 60;
    this.segundosLentos = 0;
    this.inicioVentana = 0;

    this.aplicarPixelRatio();
  }

  aplicarPixelRatio() {
    const tope = this.ligero ? 1.0 : 1.5;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, tope));
  }

  /**
   * Se llama en cada cuadro.
   * Medimos con el reloj de verdad (performance.now) y no con el delta del
   * bucle, porque ese delta viene recortado a 0,1 s: en una computadora muy
   * lenta el recorte hacia que el modo ligero tardara 10 segundos en entrar
   * en vez de 3.
   */
  medir() {
    const ahora = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
    if (!this.inicioVentana) {
      this.inicioVentana = ahora;
      return;
    }

    this.cuadros++;
    const ventana = ahora - this.inicioVentana;
    if (ventana < 0.5) return;

    this.fps = this.cuadros / ventana;
    this.cuadros = 0;
    this.inicioVentana = ahora;

    if (!this.automatico || this.ligero) return;

    if (this.fps < 30) {
      this.segundosLentos += ventana;
      if (this.segundosLentos >= 3) {
        this.activar(true, 'automatico');
      }
    } else {
      this.segundosLentos = 0;
    }
  }

  activar(valor, motivo = 'manual') {
    if (this.ligero === valor) return;
    this.ligero = valor;
    this.segundosLentos = 0;
    if (motivo === 'manual') this.automatico = false;
    this.aplicarPixelRatio();
    this.renderer.shadowMap.enabled = this.sombrasBase && !valor;
    this.alCambiarModo?.(valor, motivo);
  }

  alternar() {
    this.activar(!this.ligero, 'manual');
  }
}
