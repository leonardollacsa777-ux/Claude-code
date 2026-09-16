# Créditos y fuentes

## Imágenes

**Esta presentación no usa ninguna imagen descargada de internet.**

Todo lo que se ve —el relieve del Perú, la textura de pergamino con los bordes
quemados, el humo, las siluetas y los retratos— está **generado por código**
(mallas 3D y texturas dibujadas en un `<canvas>`). Por eso:

- funciona sin internet y sin archivos externos;
- no hay ningún problema de derechos de autor;
- el archivo final pesa poco.

Esto sigue la indicación del encargo: *"Si no encuentras una imagen adecuada,
usa siluetas o figuras 3D estilizadas en su lugar"*. Se hizo así porque la red
del entorno donde se programó no permite descargar de Wikimedia Commons.

Los **nueve retratos** de la escena 4 son dibujos hechos con código al estilo
de un grabado antiguo (`src/mundo/retratos.js`). **No son retratos reales** de
los personajes: son figuras estilizadas que los representan. Cada uno lleva
algún rasgo que sí está documentado, como el parche en el ojo de Diego de
Almagro o el hábito de clérigo de Pedro de la Gasca.

Si más adelante quieren añadir retratos reales, deben ser de **dominio público**
(por ejemplo, pinturas antiguas de Wikimedia Commons). Se colocan en
`public/img/` y se anota aquí el título de la obra, el autor y el enlace.

## Tipografías

| Fuente | Autor | Licencia |
|---|---|---|
| **Cinzel** (títulos) | Natanael Gama | SIL Open Font License 1.1 |
| **EB Garamond** (textos) | Georg Duffner y Octavio Pardo | SIL Open Font License 1.1 |

Se instalan con el paquete [`@fontsource`](https://fontsource.org) y los archivos
`.woff2` (solo el juego latino) están **copiados dentro del proyecto**, en
`src/estilos/fuentes/`, para que la presentación no le pida nada a Google.

## Librerías

| Librería | Para qué | Licencia |
|---|---|---|
| [three.js](https://threejs.org) | El mundo 3D | MIT |
| [GSAP](https://gsap.com) | Las animaciones y los vuelos de cámara | Licencia estándar de GSAP (uso gratuito en proyectos no comerciales) |
| [Vite](https://vite.dev) | Herramienta de desarrollo y de construcción | MIT |
| [vite-plugin-singlefile](https://github.com/richardtallent/vite-plugin-singlefile) | Genera el archivo único | MIT |

## Datos históricos

Fechas, nombres y lugares tomados del material del curso de Ciencias Sociales
(2.° de secundaria). No se modificaron.

## Sonido

El sonido está **generado por el propio navegador** con la Web Audio API:
ruido rosado filtrado para el viento y la lluvia, osciladores graves para los
tambores y un estallido de ruido con caída para los truenos.

**No se usa ningún archivo de audio descargado**, así que no hay ningún
problema de derechos. Está apagado por defecto y se enciende con la tecla **M**
(ver `src/nucleo/audio.js`).
