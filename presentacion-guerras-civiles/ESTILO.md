# Estilo que quiere Leonardo (para la próxima vez)

> Nota para retomar este proyecto. Lo importante está aquí arriba.

## La referencia

Leonardo mandó un video (12 sep 2026) de una presentación turca sobre
**Fatih Sultan Mehmed y la toma de Constantinopla**, hecha como una
**exposición de museo digital**. Eso es lo que le gusta.

Cómo es ese estilo:

- **Imágenes fotorrealistas a pantalla completa.** Escenas históricas
  generadas con IA, con luz cinematográfica, mucho contraste y ambiente
  oscuro. Parecen óleos de museo o fotogramas de película, no dibujos.
- **Tipografía grande encima de la imagen**, en un lado, sin competir con
  ella. Títulos cortos y contundentes ("53 GÜN", "GEDİK").
- **Una imagen por idea.** Nada de listas largas.
- **Recorrido continuo**, no diapositivas sueltas.
- Enmarcado de galería: la primera escena era un cuadro colgado en un museo.

## Qué le gustó de lo que ya hicimos

Sus palabras: *"Me encanta la forma en que se transita"*. Los **vuelos de
cámara y las transiciones se conservan**. Lo que no le convenció fue que
todo el escenario sea un **mapa low-poly**: quiere escenarios que parezcan
reales.

## La decisión que tomamos

**Híbrido:**
- Cada escena = imagen o video fotorrealista a pantalla completa + el texto encima.
- Cada transición = el vuelo 3D por el mapa que ya existe.
- Si a una escena le falta su archivo, usa su escenario 3D actual.

Y con **imágenes para las 15 escenas y video corto para 3 o 4** (portada,
una batalla, el cierre).

## Lo que ya está construido para eso

`src/ui/telon.js` + `src/data/medios.js` + los estilos `.telon` en
`src/estilos/ui.css`, ya conectados al director y a `main.js`.

Funciona así: al arrancar busca `public/medios/escena-01.*` … `escena-15.*`
(acepta `.mp4 .webm .jpg .jpeg .png .webp`, gana el video si hay los dos).
Lo que encuentra lo muestra a pantalla completa con movimiento lento de
cámara (Ken Burns) y parallax ligado a la deriva del rig; lo que no, se
queda en 3D. **No hay que configurar nada: basta con el nombre del archivo.**

Ver `public/medios/LEEME.txt`.

## Lo que falta (no se llegó a hacer)

1. **`PROMPTS-HIGGSFIELD.md`** — los 15 prompts, con un bloque de estilo
   común para que las imágenes parezcan una sola colección, el nombre de
   archivo de cada una y cuáles conviene hacer en video.
2. **Probar el telón con medios de verdad.** Se escribió y compila, pero
   no se llegó a verificar en el navegador con una imagen y un video
   reales. Hay que comprobar: que los detecte, que el vídeo arranque en
   bucle y mudo, que el telón se quite durante los vuelos y que se salte
   el dibujado 3D mientras tapa la pantalla.
3. **Build con medios pesados.** Con videos ya no cabe todo en un solo
   archivo HTML: hay que entregar una carpeta (`presentacion.html` +
   `medios/`) además de la variante de archivo único para cuando solo
   haya imágenes.

## Límites del entorno (importante, ahorra tiempo)

- **No se pueden descargar imágenes ni videos desde aquí.** La red solo
  permite registros de paquetes (npm, PyPI). Wikimedia, Pexels, Unsplash,
  Pixabay y gamma.app dan todos error de conexión.
- **No hay conector de Higgsfield**, y aunque hubiera clave, tampoco se
  podría llamar por lo anterior.
- **Gamma sí genera imágenes fotorrealistas** (`generate_image`, tipo
  `photo`) pero la cuenta se quedó **sin créditos**.

Conclusión: **las imágenes las genera Leonardo** (Higgsfield u otro) y se
pegan en `public/medios/`. Todo lo demás se hace desde aquí.

## Aviso honesto para CREDITOS.md

Las imágenes generadas con IA **no son documentos ni fotografías
históricas** (la fotografía no existía en 1537-1554). Son ilustraciones.
Hay que decirlo en `CREDITOS.md` para que no se presenten como auténticas.
