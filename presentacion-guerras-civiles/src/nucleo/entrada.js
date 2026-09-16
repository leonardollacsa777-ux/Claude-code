/**
 * entrada.js — Los controles de la exposicion.
 *
 *   ->  Espacio  o clic  : escena siguiente
 *   <-                   : escena anterior (vuelo en reversa)
 *   Inicio               : volver a la portada
 *   F                    : pantalla completa
 *   L                    : modo ligero
 *   M                    : sonido (llega en la Fase 3)
 *   1..9, 0              : saltar a una escena
 */

export function conectarControles(acciones, { elemento = window } = {}) {
  const digitos = [];

  function limpiarDigitos() {
    digitos.length = 0;
  }

  let temporizador = null;
  function acumularDigito(d) {
    digitos.push(d);
    clearTimeout(temporizador);
    // Espera un momento por si escriben "12" y no "1" y "2".
    temporizador = setTimeout(() => {
      const n = parseInt(digitos.join(''), 10);
      limpiarDigitos();
      if (!Number.isNaN(n)) acciones.saltarA?.(n);
    }, 420);
  }

  function alPresionar(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    switch (e.key) {
      case 'ArrowRight':
      case ' ':
      case 'PageDown':
      case 'Enter':
        e.preventDefault();
        acciones.siguiente?.();
        break;

      case 'ArrowLeft':
      case 'PageUp':
      case 'Backspace':
        e.preventDefault();
        acciones.anterior?.();
        break;

      case 'Home':
        e.preventDefault();
        acciones.inicio?.();
        break;

      case 'End':
        e.preventDefault();
        acciones.saltarA?.(acciones.total?.() || 15);
        break;

      case 'f':
      case 'F':
        acciones.pantallaCompleta?.();
        break;

      case 'l':
      case 'L':
        acciones.modoLigero?.();
        break;

      case 'm':
      case 'M':
        acciones.sonido?.();
        break;

      case 'Escape':
        limpiarDigitos();
        break;

      default:
        if (/^[0-9]$/.test(e.key)) {
          e.preventDefault();
          acumularDigito(e.key);
        }
    }
  }

  function alHacerClic(e) {
    // Los clics en la barra de progreso los maneja la propia barra.
    if (e.target.closest('#progreso')) return;
    acciones.siguiente?.();
  }

  elemento.addEventListener('keydown', alPresionar);
  window.addEventListener('click', alHacerClic);

  return () => {
    elemento.removeEventListener('keydown', alPresionar);
    window.removeEventListener('click', alHacerClic);
  };
}

/** Pantalla completa (tecla F). */
export function alternarPantallaCompleta() {
  const d = document;
  if (!d.fullscreenElement) {
    d.documentElement.requestFullscreen?.().catch(() => {});
  } else {
    d.exitFullscreen?.().catch(() => {});
  }
}
