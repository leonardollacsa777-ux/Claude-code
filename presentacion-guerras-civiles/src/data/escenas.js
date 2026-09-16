/**
 * ================================================================
 *  escenas.js  —  TODO EL CONTENIDO DE LA PRESENTACION
 * ================================================================
 *
 *  ESTE ES EL UNICO ARCHIVO QUE HAY QUE TOCAR PARA CORREGIR TEXTOS.
 *  No hace falta saber programar: solo cambiar lo que esta entre comillas.
 *
 *  Reglas para editar sin romper nada:
 *    1. Cambia SOLO el texto que esta entre comillas '...'.
 *    2. No borres las comas, los corchetes [ ] ni las llaves { }.
 *    3. Si tu texto lleva un apostrofo ('), escribelo asi: \'
 *    4. Guarda el archivo: la pagina se actualiza sola.
 *
 *  Que significa cada campo:
 *    id        -> numero de la escena (1 a 15). No lo cambies.
 *    titulo    -> titulo grande que sale en pantalla.
 *    expositor -> quien habla: 'Tejada', 'Llacsa' o 'Carmona'.
 *    puntos    -> las vinetas del panel de texto.
 *    lugar     -> sitio real del mapa (ver src/data/lugares.js).
 *    camara    -> desde donde mira la camara. Mejor no tocar.
 *    efectoTexto        -> como aparece el texto (ver src/ui/efectosTexto.js).
 *    transicionSiguiente-> como viaja la camara a la escena siguiente.
 *    ambiente  -> hora del dia y clima de la escena.
 *
 *  OJO: las fechas y los datos historicos estan verificados.
 *       No los cambies sin revisar el cuaderno.
 */

import { punto } from './lugares.js';

export const ESCENAS = [
  // ---------------------------------------------------------------- 1
  {
    id: 1,
    titulo: 'Las guerras civiles entre los conquistadores',
    subtitulo: 'Perú, 1537 – 1554',
    expositor: 'Tejada',
    lugar: 'salinas',
    esPortada: true,
    puntos: [
      'Integrantes: Tejada · Llacsa · Carmona',
      '2.° "C" – Ciencias Sociales',
    ],
    camara: {
      posicion: punto('salinas', -6, 4.2, 26),
      objetivo: punto('salinas', 0, 3.4, 0),
    },
    ambiente: 'atardecer',
    efectoTexto: 'dorado',
    transicionSiguiente: 'atravesar-humo',
  },

  // ---------------------------------------------------------------- 2
  {
    id: 2,
    titulo: '¿Qué fueron las guerras civiles?',
    expositor: 'Tejada',
    lugar: 'centro',
    puntos: [
      'Fueron enfrentamientos armados entre los propios españoles que conquistaron el Tahuantinsuyo.',
      'Duraron cerca de 17 años (1537 – 1554).',
      'Lucharon por el poder, las tierras y las riquezas del Perú.',
      'Al final, la Corona española impuso su autoridad.',
    ],
    camara: {
      posicion: punto('centro', 0, 30, 34),
      objetivo: punto('centro', 0, 27, 0),
    },
    ambiente: 'dia',
    efectoTexto: 'tinta',
    transicionSiguiente: 'pergamino-a-mapa',
  },

  // ---------------------------------------------------------------- 3
  {
    id: 3,
    titulo: 'El origen del conflicto',
    expositor: 'Tejada',
    lugar: 'centro',
    puntos: [
      'Capitulación de Toledo (1529): Francisco Pizarro recibe la gobernación de Nueva Castilla.',
      '1534: el rey le otorga a Diego de Almagro la gobernación de Nueva Toledo, al sur.',
      'El problema: los dos creían que el Cusco les pertenecía.',
    ],
    camara: {
      posicion: punto('centro', 30, 290, 270),
      objetivo: punto('centro', -14, 0, 20),
    },
    ambiente: 'dia',
    efectoTexto: 'dorado',
    transicionSiguiente: 'giro-orbital',
  },

  // ---------------------------------------------------------------- 4
  {
    id: 4,
    titulo: 'Personajes principales',
    expositor: 'Tejada',
    lugar: 'centro',
    puntos: [
      'Francisco Pizarro: gobernador de Nueva Castilla.',
      'Diego de Almagro: socio de Pizarro y gobernador de Nueva Toledo.',
      'Hernando Pizarro: hermano de Francisco; venció en Las Salinas.',
      'Diego de Almagro "el Mozo": hijo de Almagro.',
      'Cristóbal Vaca de Castro: enviado del rey.',
      'Blasco Núñez Vela: primer virrey del Perú.',
      'Gonzalo Pizarro: hermano de Francisco; líder de los encomenderos.',
      'Pedro de la Gasca: "el Pacificador".',
      'Francisco Hernández Girón: líder de la última rebelión.',
    ],
    camara: {
      posicion: punto('centro', 0, 62, 78),
      objetivo: punto('centro', 0, 56, 0),
    },
    ambiente: 'dia',
    efectoTexto: 'destello',
    transicionSiguiente: 'cielo-dia',
  },

  // ---------------------------------------------------------------- 5
  {
    id: 5,
    titulo: 'Almagro vuelve de Chile (1537)',
    expositor: 'Tejada',
    lugar: 'cusco',
    cartel: { texto: 'CUSCO', anio: '1537' },
    puntos: [
      'Almagro regresa de Chile sin encontrar las riquezas que buscaba.',
      'Abril de 1537: ocupa el Cusco y apresa a Hernando y Gonzalo Pizarro.',
      '12 de julio de 1537: vence a Alonso de Alvarado en la batalla de Abancay.',
    ],
    camara: {
      posicion: punto('cusco', -16, 14, 22),
      objetivo: punto('cusco', 0, 4, 0),
    },
    ambiente: 'dia',
    efectoTexto: 'quema',
    transicionSiguiente: 'rasante',
  },

  // ---------------------------------------------------------------- 6
  {
    id: 6,
    titulo: 'Batalla de Las Salinas (1538)',
    expositor: 'Llacsa',
    lugar: 'salinas',
    cartel: { texto: 'LAS SALINAS', anio: '1538' },
    puntos: [
      'Batalla de Las Salinas, cerca del Cusco.',
      'Hernando Pizarro derrota a los almagristas.',
      '8 de julio de 1538: Diego de Almagro es ejecutado en el Cusco.',
    ],
    marcador: '6 de abril de 1538',
    camara: {
      posicion: punto('salinas', -10, 6, 18),
      objetivo: punto('salinas', 2, 3, -2),
    },
    ambiente: 'polvo',
    efectoTexto: 'piedras',
    transicionSiguiente: 'cielo-dia-a-noche',
  },

  // ---------------------------------------------------------------- 7
  {
    id: 7,
    titulo: 'El asesinato de Francisco Pizarro (1541)',
    expositor: 'Llacsa',
    lugar: 'lima',
    cartel: { texto: 'LIMA', anio: '1541' },
    puntos: [
      'Los almagristas, llamados "los de Chile", quedaron pobres y resentidos.',
      '26 de junio de 1541: entran al palacio de Lima y asesinan a Francisco Pizarro.',
      'Almagro el Mozo, hijo de Almagro, se proclama gobernador.',
    ],
    camara: {
      posicion: punto('lima', -14, 8, 16),
      objetivo: punto('lima', 0, 4, 0),
    },
    ambiente: 'noche',
    efectoTexto: 'tinta',
    transicionSiguiente: 'tormenta',
  },

  // ---------------------------------------------------------------- 8
  {
    id: 8,
    titulo: 'Batalla de Chupas (1542)',
    expositor: 'Llacsa',
    lugar: 'chupas',
    cartel: { texto: 'CHUPAS', anio: '1542' },
    puntos: [
      'Segunda guerra: los almagristas contra la Corona.',
      'El rey envía a Cristóbal Vaca de Castro.',
      '16 de septiembre de 1542: batalla de Chupas, cerca de Huamanga.',
      'Almagro el Mozo es derrotado y luego ejecutado en el Cusco.',
    ],
    camara: {
      posicion: punto('chupas', -12, 9, 20),
      objetivo: punto('chupas', 0, 6, 0),
    },
    ambiente: 'lluvia',
    efectoTexto: 'destello',
    transicionSiguiente: 'atravesar-corona',
  },

  // ---------------------------------------------------------------- 9
  {
    id: 9,
    titulo: 'Las Leyes Nuevas (1542)',
    expositor: 'Llacsa',
    lugar: 'chupas',
    puntos: [
      'El rey Carlos I de España (Carlos V) dicta las Leyes Nuevas.',
      'Buscaban proteger a los indígenas y prohibían que las encomiendas se heredaran.',
      'Se crea el Virreinato del Perú.',
      'Los encomenderos se sienten perjudicados y se preparan para rebelarse.',
    ],
    camara: {
      posicion: punto('chupas', 0, 46, 30),
      objetivo: punto('chupas', 0, 41, 0),
    },
    ambiente: 'dia',
    efectoTexto: 'dorado',
    transicionSiguiente: 'estela-sello',
  },

  // ---------------------------------------------------------------- 10
  {
    id: 10,
    titulo: 'Rebelión de Gonzalo Pizarro: Iñaquito (1546)',
    expositor: 'Llacsa',
    lugar: 'quito',
    cartel: { texto: 'QUITO', anio: '1546' },
    puntos: [
      'Tercera guerra: la rebelión de los encomenderos.',
      '1544: llega el primer virrey, Blasco Núñez Vela, para aplicar las Leyes Nuevas.',
      'Gonzalo Pizarro se rebela y lo enfrenta.',
      '18 de enero de 1546: batalla de Iñaquito; el virrey muere.',
    ],
    camara: {
      posicion: punto('quito', -14, 11, 20),
      objetivo: punto('quito', 2, 5, -2),
    },
    ambiente: 'niebla',
    efectoTexto: 'piedras',
    transicionSiguiente: 'espiral-agua',
  },

  // ---------------------------------------------------------------- 11
  {
    id: 11,
    titulo: 'La Gasca, "el Pacificador" (1547–1548)',
    expositor: 'Carmona',
    lugar: 'jaquijahuana',
    cartel: { texto: 'JAQUIJAHUANA', anio: '1548' },
    puntos: [
      'El rey envía a Pedro de la Gasca, "el Pacificador".',
      '20 de octubre de 1547: Gonzalo Pizarro gana en Huarina.',
      '9 de abril de 1548: en Jaquijahuana, muchos de sus soldados se pasan al bando del rey.',
      '10 de abril de 1548: Gonzalo Pizarro es ejecutado.',
    ],
    camara: {
      posicion: punto('jaquijahuana', -12, 10, 20),
      objetivo: punto('jaquijahuana', 0, 4, 0),
    },
    ambiente: 'dia',
    efectoTexto: 'quema',
    transicionSiguiente: 'barrido',
  },

  // ---------------------------------------------------------------- 12
  {
    id: 12,
    titulo: 'La rebelión de Hernández Girón (1553–1554)',
    expositor: 'Carmona',
    lugar: 'pucara',
    cartel: { texto: 'PUCARÁ', anio: '1554' },
    puntos: [
      '12 de noviembre de 1553: Francisco Hernández Girón se rebela en el Cusco.',
      'Fue la última sublevación de los encomenderos.',
      '21 de mayo de 1554: gana la batalla de Chuquinga.',
      '8 de octubre de 1554: es derrotado en Pucará.',
      '7 de diciembre de 1554: es ejecutado en Lima.',
    ],
    camara: {
      posicion: punto('pucara', -11, 8, 18),
      objetivo: punto('pucara', 0, 4, 0),
    },
    ambiente: 'atardecer',
    efectoTexto: 'tinta',
    transicionSiguiente: 'subida-al-cielo',
  },

  // ---------------------------------------------------------------- 13
  {
    id: 13,
    titulo: 'Línea de tiempo',
    expositor: 'Carmona',
    lugar: 'centro',
    puntos: [
      '1537 – Almagro toma el Cusco / batalla de Abancay',
      '1538 – Batalla de Las Salinas / muerte de Almagro',
      '1541 – Asesinato de Francisco Pizarro',
      '1542 – Batalla de Chupas / Leyes Nuevas',
      '1546 – Batalla de Iñaquito',
      '1547 – Batalla de Huarina',
      '1548 – Batalla de Jaquijahuana',
      '1554 – Batallas de Chuquinga y Pucará',
    ],
    camara: {
      posicion: punto('centro', -46, 300, 330),
      objetivo: punto('centro', 0, 70, 50),
    },
    ambiente: 'sobrenubes',
    efectoTexto: 'destello',
    transicionSiguiente: 'carrera',
  },

  // ---------------------------------------------------------------- 14
  {
    id: 14,
    titulo: 'Consecuencias',
    expositor: 'Carmona',
    lugar: 'centro',
    puntos: [
      'Murieron los principales conquistadores: Diego de Almagro, Francisco Pizarro, Almagro el Mozo y Gonzalo Pizarro.',
      'La Corona española impuso su autoridad en el Perú.',
      'Se consolidó el Virreinato del Perú y la autoridad del virrey ya no fue discutida.',
      'La Gasca repartió de nuevo las encomiendas entre quienes fueron leales al rey.',
      'Terminó la etapa de la conquista y comenzó la organización del Virreinato.',
    ],
    camara: {
      posicion: punto('centro', 0, 205, 250),
      objetivo: punto('centro', 0, 120, 40),
    },
    ambiente: 'dia',
    efectoTexto: 'dorado',
    transicionSiguiente: 'amanecer',
  },

  // ---------------------------------------------------------------- 15
  {
    id: 15,
    titulo: 'Conclusión',
    expositor: 'Carmona',
    lugar: 'centro',
    esCierre: true,
    puntos: [
      'Conclusión: la ambición por el poder y las riquezas dividió a los conquistadores; al final, el gran ganador fue el rey de España.',
      '¡Gracias!',
      '¿Preguntas?',
    ],
    camara: {
      posicion: punto('centro', 62, 270, 390),
      objetivo: punto('centro', 0, 40, 60),
    },
    ambiente: 'amanecer',
    efectoTexto: 'quema',
    transicionSiguiente: 'rebobinado',
  },
];

/** Colores con los que se marca a cada expositor en la barra de progreso. */
export const EXPOSITORES = {
  Tejada:  { color: '#C9A227', escenas: [1, 2, 3, 4, 5] },
  Llacsa:  { color: '#7A1E1E', escenas: [6, 7, 8, 9, 10] },
  Carmona: { color: '#2E6F7E', escenas: [11, 12, 13, 14, 15] },
};

export default ESCENAS;
