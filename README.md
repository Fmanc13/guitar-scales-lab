# Laboratorio de guitarra — escalas

Web local (sin dependencias de runtime, sin build) para practicar escalas: diagrama por
posiciones, sonido, metrónomo y fondo armónico.

Notación americana (`C D E F G A B`). Todo en un solo lugar: diagrama + sonido + tempo.

**Publicado:** https://fmanc13.github.io/guitar-scales-lab/ (GitHub Pages, rama `main`).

## Cómo se usa

```bash
npm install        # sólo jsdom, para los tests
npm start          # http://localhost:5173
npm test           # 19 checks: teoría, contrato HTML/JS y smoke test de UI
```

No hay paso de build. Cinco archivos servidos tal cual:

| Archivo | Qué hace |
| --- | --- |
| `index.html` | Estructura de la página y la consola de práctica |
| `styles.css` | Diseño (simple, claro, alto contraste) |
| `js/theory.js` | Teoría pura y testeable: escalas, ortografía de notas, mástil, posiciones |
| `js/app.js` | UI (diagramas SVG), motor de audio Web Audio, metrónomo y fondo armónico |
| `server.mjs` | Servidor estático de ~40 líneas (los módulos ES no cargan desde `file://`) |

El material que se retiró de la página (improvisación, melodía y fuentes) está archivado en
`docs/material-archivado.pdf` (fuente LaTeX en `docs/material-archivado.tex`); el módulo
`js/content.js` se eliminó del proyecto.

## Qué trae

**Escalas.** 14 escalas (mayor, menor natural, pentatónicas, blues, los 7 modos,
menor armónica, menor melódica, lidio ♭7, alterada) en las 12 tónicas, con ortografía
correcta (`G# mayor` da `F##`, no `G`).

- **Círculos por nota**: la tónica en rojo con anillo negro y el resto en plateado (`#C0C0C0`).
  Lo que el diagrama tiene que gritar de un vistazo es dónde está la tónica, no el grado.
  El traste 0 no se dibuja como columna; en la **posición 1** las cuerdas al aire que
  pertenecen a la escala se marcan con círculos a la izquierda del traste 1.
- **Todas las posiciones a la vez**: cada escala se puede tocar en 5-7 cajas (un box por nota
  disponible en la 6ª cuerda) y se muestran todas juntas en **un solo mástil continuo**. El
  selector **Posición** elige una y la marca con un rectángulo de luz cálida.
- Etiquetas siempre por nota (`C E♭ G`); no hay notación por grados en el mástil.
- Clic en cualquier punto = suena la nota.
- Consola: tempo, compás, click, fondo (`drone`, bucle I-IV-V-vi, 12 compases de blues),
  articulación (legato / portato / staccato) y volumen. El fondo se arma con la tonalidad
  (no con la escala elegida), así que sigue sonando bien sobre la pentatónica o el blues.

## Fuentes

- **Absolutely Understand Guitar**, Scotty West (2001) — `absolutely-understand-guitar.pdf`
  (lecciones 11-24: intervalos, *Must Know Scales*, digitaciones, modos, pentatónicas, blues).
- **Composición Integral**, Mauro De María (2015) — `Composicion integral.pdf`.
- Verificación cruzada de fórmulas: totalguitarist.com, premierguitar.com, muted.io.

## Digresiones honestas

- Las digitaciones no están copiadas de ninguna tabla: se derivan del principio del
  **box de 5 trastes** (índice y meñique como bisagras) que explica el material base.
- El material de improvisación y melodía (con sus fuentes: Guitar World, Improvis.io,
  MusicScene, cap. 15 y 18 de De María) está archivado en `docs/material-archivado.pdf`.
