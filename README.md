# Laboratorio de guitarra — escalas

Web local (sin dependencias de runtime, sin build) para practicar escalas: diagrama por
posiciones, sonido, metrónomo y fondo armónico. Tema oscuro, tipografía Lato self-hosted y
dropdowns propios (GlideSelect).

Notación americana (`C D E F G A B`). Todo en un solo lugar: diagrama + sonido + tempo.

**Publicado:** https://fmanc13.github.io/guitar-scales-lab/ (GitHub Pages, rama `main`).

## Cómo se usa

```bash
npm install        # sólo jsdom, para los tests
npm start          # http://localhost:5173
npm test           # 22 checks: teoría, contrato HTML/JS y smoke test de UI
```

No hay paso de build. Seis archivos + las fuentes, servidos tal cual:

| Archivo | Qué hace |
| --- | --- |
| `index.html` | Estructura de la página y la consola de práctica |
| `styles.css` | Diseño oscuro (zinc + acento cálido #faf4d3), Lato, GlideSelect |
| `js/theory.js` | Teoría pura y testeable: escalas, ortografía de notas, mástil, posiciones |
| `js/app.js` | UI (diagramas SVG), motor de audio Web Audio, metrónomo y fondo armónico |
| `js/glide-select.js` | Dropdown propio (port vanilla de GlideSelect) sobre los `<select>` |
| `server.mjs` | Servidor estático de ~40 líneas (los módulos ES no cargan desde `file://`) |
| `fonts/` | Lato 400/700 en `.woff2` + `OFL.txt` (SIL Open Font License) |

El material que se retiró de la página (improvisación, melodía y fuentes) está archivado en
`docs/material-archivado.pdf` (fuente LaTeX en `docs/material-archivado.tex`); el módulo
`js/content.js` se eliminó del proyecto.

## Qué trae

**Escalas.** 14 escalas (mayor, menor natural, pentatónicas, blues, los 7 modos,
menor armónica, menor melódica, lidio ♭7, alterada) en las 12 tónicas, con ortografía
correcta (`G# mayor` da `F##`, no `G`).

- **Círculos por nota**: la tónica en rojo con anillo negro y el resto en plateado (`#C0C0C0`).
  Lo que el diagrama tiene que gritar de un vistazo es dónde está la tónica, no el grado.
  El traste 0 no se dibuja como columna; las **cuerdas al aire de la escala** se marcan
  siempre con un círculo a la izquierda del traste 1 (las que no pertenecen a la escala
  conservan la letra de la cuerda).
- **Todas las posiciones a la vez**: cada escala se puede tocar en 5-7 cajas (un box por nota
  disponible en la 6ª cuerda) y se muestran todas juntas en **un solo mástil continuo**. El
  selector **Posición** elige una y la marca con un rectángulo de luz cálida, que en la caja
  abierta se extiende hasta envolver las cuerdas al aire. En la pentatónica la caja sigue la
  digitación real de 2 notas por cuerda (no un ancho fijo), para no caer en trastes vacíos.
- **Patrón diagonal**: con el selector **Patrón** en «Diagonal 2 notas/cuerda» el mástil
  muestra el recorrido de 2 notas por cuerda subiendo un traste por cuerda, sin banda de
  posición. La posición elegida marca la nota de arranque en la 6ª cuerda.
- Etiquetas siempre por nota (`C E♭ G`); no hay notación por grados en el mástil.
- Clic en cualquier punto = suena la nota.
- Consola: tempo, compás, click, fondo (`drone`, bucle I-IV-V-vi, i-iv-v, 12 compases de blues,
  y los bucles generados rock I-♭VII-IV, andaluza i-VII-VI-V, jazz ii-V-I, pop vi-IV-I-V y
  modal I-♭II-♭VII), articulación (legato / portato / staccato) y volumen. El fondo se arma con
  la tonalidad (no con la escala elegida), así que sigue sonando bien sobre la pentatónica o el blues.

## Fuentes

- **Absolutely Understand Guitar**, Scotty West (2001) — `absolutely-understand-guitar.pdf`
  (lecciones 11-24: intervalos, *Must Know Scales*, digitaciones, modos, pentatónicas, blues).
- **Composición Integral**, Mauro De María (2015) — `Composicion integral.pdf`.
- Verificación cruzada de fórmulas: totalguitarist.com, premierguitar.com, muted.io.

