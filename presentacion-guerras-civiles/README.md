# Las guerras civiles entre los conquistadores
### Perú, 1537 – 1554 · Presentación 3D

Presentación para **Ciencias Sociales, 2.° "C"**.
No son diapositivas: es **un solo mundo 3D** por el que la cámara vuela de una
batalla a otra, como en un documental.

**Expositores:** Tejada (escenas 1–5) · Llacsa (escenas 6–10) · Carmona (escenas 11–15)

> **Estado: Fase 1 terminada.** Ya funcionan el mapa 3D del Perú, el recorrido de
> la cámara, las 15 estaciones, los textos y la navegación. Las escenas 3D de
> verdad (ejércitos, pergamino, corona…) llegan en la Fase 2; ahora en cada
> estación hay una **caja de prueba** con el número de escena.

---

## Cómo verla

### Opción A — en la computadora del colegio (sin instalar nada)
*(disponible al final de la Fase 3)* Se abrirá un único archivo `index.html`
con doble clic. No necesita internet.

### Opción B — para trabajar en ella
Hace falta [Node.js](https://nodejs.org) (versión 20.19 o más nueva).

```bash
cd presentacion-guerras-civiles
npm install
npm run dev
```

Luego abre en Chrome: **http://localhost:5173**

---

## Controles

| Tecla | Qué hace |
|---|---|
| **→** · **Espacio** · **clic** | Escena siguiente |
| **←** | Escena anterior (el vuelo va en reversa) |
| **Inicio** | Volver a la portada |
| **Fin** | Ir a la última escena |
| **F** | Pantalla completa |
| **L** | Modo ligero (menos efectos, para computadoras lentas) |
| **M** | Sonido (llega en la Fase 3) |
| **1**…**15** | Saltar a una escena por su número |

También se puede hacer clic en la **barra de abajo** para ir a cualquier escena.

**Truco para ensayar:** `http://localhost:5173/?escena=7` abre directamente la
escena 7. Y `?fps` muestra los cuadros por segundo.

---

## Cómo corregir los textos

Todo el contenido está en **un solo archivo**:

```
src/data/escenas.js
```

Ahí están los 15 títulos y todas las viñetas. Solo hay que cambiar lo que está
entre comillas `'...'` y guardar: la página se actualiza sola.

> ⚠️ **Las fechas y los datos históricos están verificados.** No los cambies sin
> revisar el cuaderno.

---

## Cómo está organizado

```
src/
├── data/escenas.js      ← los textos (esto es lo que se edita)
├── data/lugares.js         latitud y longitud reales de cada batalla
├── nucleo/                 cámara, director de escenas, controles, rendimiento
├── mundo/                  terreno, cielo, texturas (todo generado por código)
├── escenas/                cada una de las 15 estaciones
├── transiciones/           las 15 formas distintas de volar entre escenas
└── ui/                     los paneles de texto y la barra de progreso
```

---

## Comandos

| Comando | Para qué |
|---|---|
| `npm run dev` | Trabajar en la presentación |
| `npm run build` | Generar el archivo único `dist/index.html` |
| `npm run preview` | Ver el archivo ya generado |
| `npm run capturas` | Revisar automáticamente las 15 escenas (necesita Playwright) |
