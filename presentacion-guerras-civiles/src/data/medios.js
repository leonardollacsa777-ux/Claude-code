/**
 * medios.js — Las imágenes y videos fotorrealistas de cada escena.
 *
 * CÓMO SE USA (no hay que programar nada):
 *   1. Genera la imagen o el video en Higgsfield con el prompt que está
 *      en PROMPTS-HIGGSFIELD.md.
 *   2. Guárdalo en la carpeta  public/medios/  con el nombre exacto que
 *      aparece abajo, por ejemplo  escena-01.jpg  o  escena-01.mp4
 *   3. Listo. La presentación lo detecta sola al abrirse.
 *
 * Si una escena NO tiene su archivo, esa escena usa el escenario 3D de
 * siempre. O sea que puedes ir añadiéndolas de a poco.
 *
 * Extensiones que reconoce, en este orden de preferencia:
 *   .mp4  .webm  .jpg  .jpeg  .png  .webp
 * (si hay un .mp4 y un .jpg de la misma escena, gana el video)
 */

/** Dónde viven los archivos. Relativo, para que funcione también con file:// */
export const CARPETA = './medios/';

export const EXTENSIONES = ['mp4', 'webm', 'jpg', 'jpeg', 'png', 'webp'];

/** Nombre base del archivo de cada escena: escena-01, escena-02… */
export function nombreBase(id) {
  return `escena-${String(id).padStart(2, '0')}`;
}

/**
 * Movimiento lento de la cámara sobre la imagen (el "efecto Ken Burns").
 * Sin esto una foto fija se ve muerta en pantalla.
 *
 * Como en las transiciones, NO se repite el mismo dos veces seguidas.
 *   escala : de cuánto a cuánto hace zoom
 *   x, y   : cuánto se desplaza, en porcentaje del ancho
 *   giro   : inclinación muy leve, en grados
 */
export const MOVIMIENTOS = {
  1:  { escala: [1.14, 1.00], x: [0, 0],    y: [2, -2],  giro: [0.4, 0] },   // se acerca
  2:  { escala: [1.00, 1.09], x: [-3, 2],   y: [0, 0],   giro: [0, -0.3] },  // se aleja y viaja
  3:  { escala: [1.10, 1.02], x: [3, -3],   y: [-1, 1],  giro: [-0.3, 0.2] },
  4:  { escala: [1.02, 1.12], x: [0, 0],    y: [1, -3],  giro: [0, 0.4] },
  5:  { escala: [1.12, 1.01], x: [-4, 1],   y: [0, 0],   giro: [0.3, 0] },
  6:  { escala: [1.05, 1.16], x: [2, -2],   y: [0, 2],   giro: [-0.2, 0.3] }, // batalla: entra
  7:  { escala: [1.14, 1.03], x: [0, 0],    y: [-2, 2],  giro: [0.2, -0.2] },
  8:  { escala: [1.03, 1.13], x: [-2, 3],   y: [1, -1],  giro: [-0.4, 0] },
  9:  { escala: [1.16, 1.02], x: [1, -1],   y: [3, -1],  giro: [0, 0.3] },   // documento: se acerca
  10: { escala: [1.02, 1.12], x: [3, -3],   y: [0, 0],   giro: [0.3, -0.3] },
  11: { escala: [1.12, 1.02], x: [-3, 3],   y: [-1, 1],  giro: [-0.2, 0.2] },
  12: { escala: [1.04, 1.14], x: [0, 0],    y: [2, -2],  giro: [0.4, -0.1] },
  13: { escala: [1.14, 1.01], x: [2, -4],   y: [0, 0],   giro: [0, 0.3] },
  14: { escala: [1.01, 1.11], x: [0, 0],    y: [-2, 2],  giro: [-0.3, 0.2] },
  15: { escala: [1.11, 1.00], x: [-2, 2],   y: [1, -1],  giro: [0.2, 0] },   // cierre: se aleja
};

/** Cuánto dura el movimiento (segundos). Largo, para que no se note el bucle. */
export const DURACION_MOVIMIENTO = 26;

/** Qué tan fuerte reacciona la imagen al movimiento de la cámara 3D. */
export const FUERZA_PARALLAX = 0.9;
