# DESIGN — Laboratorio de guitarra

Guía de diseño de la web (`index.html` + `styles.css` + SVG de `js/app.js`).
Sirve para que cualquier cambio visual sea consistente sin tener que releer todo el CSS.

**Fuente de verdad de los tokens:** `:root` en `styles.css`.
**Fuente de verdad de los colores de nota:** `ROOT_COLOR` / `NOTE_COLOR` en `js/theory.js`.
Nada acá es decorativo-por-decorar: cada regla existe para que el diagrama se lea de un vistazo.

<!-- AGENT NOTE: tokens extraídos por lectura directa del código (valores declarados), no por
     un pase de computed styles en navegador. No hay tema oscuro ni media query prefers-color-scheme. -->

---

## 1. Identidad

- **Qué es:** herramienta de práctica de escalas, no landing. Densidad media-alta, cero scroll-bait.
- **Material visual:** papel cálido y tinta. Fondo beige (`--bg`), tarjetas casi blancas (`--card`),
  texto casi negro (`--ink`), bordes finos color piedra. Nada de gradientes, glass, ni sombras
  difusas: la única sombra es una línea de 1px (`--shadow`) que separa la tarjeta del papel.
- **El color saturado está reservado** a la tónica de la escala y al botón primario. Si un
  elemento nuevo usa color fuerte sin decir "tónica" o "acción principal", está mal.
- **Referencia conceptual:** el rojo como marca de la tónica. El color señala el centro
  tonal, no la identidad de cada grado.

## 2. Color

### 2.1 Tokens semánticos (`:root`, `styles.css`)

| Token | Valor | Uso |
| --- | --- | --- |
| `--bg` | `#f7f5f0` | fondo del `body` |
| `--card` | `#fffdf8` | tarjetas, consola, mástil, fondo del SVG |
| `--ink` | `#1b1b1b` | texto, bordes activos, botón primario, anillo de tónica y de foco |
| `--muted` | `#6b665c` | texto secundario, labels, números de traste, cuerdas |
| `--line` | `#ddd6c8` | bordes suaves, separador de la leyenda |
| `--line-strong` | `#b9b2a4` | bordes de controles, trastes, punto apagado del metrónomo |
| `--shadow` | `0 1px 0 var(--line)` | única elevación del sistema |

Colores de apoyo fijos (no tokenizados, en `styles.css` y `js/app.js`): `#efeade` (fondo de `code`),
`#f2ede2` (hover secundario), `#333` (hover primario), `#f0a13c` (ventana de posición cálida),
`#e5ded0` (punto de beat apagado), `#e6e0d4` (inlays del mástil), `#fff` (inputs y botones).

### 2.2 Paleta de notas (`ROOT_COLOR` / `NOTE_COLOR`, `js/theory.js`)

| Rol | Hex | Notas |
| --- | --- | --- |
| Tónica | `#c92a2a` | además lleva anillo negro y texto blanco |
| Resto | `#C0C0C0` | texto oscuro `--ink` (blanco no se lee sobre plata) |

No hay color por grado: el diagrama solo distingue tónica de no-tónica.

### 2.3 Contraste

Texto blanco sobre el rojo de la tónica y texto oscuro (`--ink`) sobre el plateado (etiquetas
del mástil, 11px bold). Cualquier color nuevo de nota tiene que aguantar texto encima; si no,
cambiar el `fill` de `.note-label`, como se hizo con `.note.root .note-label`.
Texto normal: `--ink` sobre `--card`/`--bg`; `--muted` solo para 13px o más.

## 3. Tipografía

- **UI:** `"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif`,
  cuerpo `15px/1.55`. Sin fuentes externas, sin `@font-face`, sin descargas de red.
- **Datos y mono:** `"Cascadia Mono", Consolas, "SF Mono", ui-monospace, monospace` — se aplica a
  `code`, `output`, textos del SVG y `.chip`.

| Nivel | Tamaño | Notas |
| --- | --- | --- |
| `h1` | 26px | peso por defecto, `letter-spacing: -0.01em` |
| cuerpo | 15px | `p` con margen 6px |
| `code` | 13px | fondo `#efeade`, radio 3px |
| labels / `.formula` / `figcaption` | 12–13px | color `--muted` |
| `.note-label` (SVG) | 11px bold | texto dentro del círculo |
| `.open-label` | 12px | nombre de la cuerda al aire |
| `.fret-num` | 11px | número de traste |

Escala real: 11 / 12 / 13 / 15 / 26. Si aparece un 14px o un 17px, es accidente.

## 4. Espacio, forma y layout

- **Base de espaciado: 4px.** Se usan 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 34.
- **Ancho de contenido: todo el ancho de la ventana** (`max-width` quitado en `header.site`,
  `.console`, `main`), con padding lateral de 20px y la consola a 20px de los bordes.
- **El mástil sí está acotado:** `.fret-wrap` tiene `max-width: 675px` (75% del ancho del
  diagrama anterior) y `margin: 0 auto`. A ancho completo el diagrama crecía en alto y empujaba
  caption y leyenda fuera de pantalla; los bordes libres a los costados del mástil son
  intencionales.
- **Radios:** 3px (`code`) · 6px (inputs) · 7px (botones) · 10px (tarjetas y mástil).
- **Bordes:** 1px `--line` en superficies, 1px `--line-strong` en controles y trastes.
- **Breakpoint único: 720px** — el header deja de ser fila.

## 5. Componentes

| Componente | Selector | Rasgos que no se negocian |
| --- | --- | --- |
| Header | `header.site` | solo el `h1`, sin subtítulo ni badge |
| Consola de práctica | `.console` | tarjeta con `display: grid` de 2 filas, `gap: 10px`, controles en `flex-wrap` |
| Botón | `button` + `.primary` / `.ghost` / `.small` | 7px 13px de padding; `.primary` = fondo `--ink` texto blanco; `.ghost` sin fondo; `.small` 3px 9px |
| Toolbar | `.toolbar` | fila de `label` + `select` (Tónica, Escala, Vista, Posición) |
| Mástil | `.fret-wrap` / `.neck-box` / `.fret-svg` | `.fret-wrap` acota a 675px y centra; `.neck-box` es la tarjeta; un solo SVG continuo de **todas las posiciones** (trastes 1 al último box, sin traste 0). En la posición 1 las cuerdas al aire de la escala se dibujan como círculos a la izquierda del traste 1. La posición elegida se marca con un `rect.pos-window` cálido (`#f0a13c` al 26%) detrás de cuerdas y notas. Etiquetas siempre por nombre de nota |
| Leyenda | `.legend` / `.chip` | chip = muestra de 12px + grado + nota en mono 13px |
| Fórmula | `.formula` | grados, notas e intervalos en una línea mono 13px |

Estados: `.note.active`, `.beat-dot.on`, `.note:hover`.
Los tests verifican que esas clases sigan existiendo en `styles.css` — no renombrar.

## 6. Accesibilidad

- Foco visible obligatorio: los `<g>` del SVG usan `:focus-visible circle:first-child` con
  `stroke: #1b1b1b; stroke-width: 3` (el anillo del navegador no es confiable en SVG).
- Cada nota es `role="button"` + `tabindex="0"` + `aria-label` con cuerda, traste, grado y nota;
  Enter y Espacio la tocan.
- La posición y la vista son `<select>` nativos; el selector de posición tiene una opción por caja.
- `.beat-dots` es `aria-hidden="true"` (el pulso se muestra, no se anuncia).
- Ningún estado se comunica solo por color: la tónica lleva anillo negro y el texto de la nota.

## 7. Voz y microcopy

- Español rioplatense, segunda persona: "Hacé clic en cualquier punto", "Elegí una posición".
- Sin marketing ni signos de admiración. Se explica el porqué musical en una frase.
- Notación americana (`C D E F G A B`) y símbolos reales en los grados (`♭3`, `♯4`, `♭7`).

## 8. Hacer / No hacer

### Hacer

- Reusar `var(--*)` para cualquier color de layout.
- Mantener el color fuerte para la tónica y la acción principal.
- Probar en 720px de ancho antes de dar por terminado un cambio de layout.

### No hacer

- Agregar fuentes, iconos, frameworks de CSS o dependencias de runtime: la web no tiene build.
- Sombras difusas, gradientes, bordes redondeados > 10px fuera de pills.
- Colores nuevos de nota sin verificar el contraste del texto encima.
- Renombrar `.note.active`, `.beat-dot.on`, `.fret-svg`, `.neck-box`, `.legend`, `.formula`:
  `test/dom-contract.test.mjs` los exige.

---

## 9. Guía de edición manual

### Dónde tocar cada cosa

| Querés cambiar… | Archivo | Ancla |
| --- | --- | --- |
| Fondo, tinta, bordes, sombra | `styles.css` | bloque `:root` |
| Tipografía base o mono | `styles.css` | `body` y la regla `code, output, .fret-svg text, .chip` |
| Ancho de página | `styles.css` | `header.site`, `.console`, `main` (ancho completo) |
| Ancho y alto del mástil | `styles.css` | `.fret-wrap { max-width }` |
| Colores de nota | `js/theory.js` | `ROOT_COLOR`, `NOTE_COLOR` |
| Colores del diagrama (fondo, trastes, cuerdas, inlays, anillo, ventana cálida) | **`js/app.js`** | hex fijos dentro de `neckSvg` |
| Escalas, grados y posiciones | `js/theory.js` | `SCALES`, `ROOT_COLOR`/`NOTE_COLOR`, `positions`, `fretboard` |
| Estructura de la página y la consola | `index.html` | — |
| Breakpoint | `styles.css` | `@media (max-width: 720px)` |

`js/content.js` (ejercicios, melodía, fuentes) se eliminó: la página es solo escalas. Ese
material quedó archivado en `docs/material-archivado.pdf` (`docs/material-archivado.tex`).

### Aviso importante: los colores del mástil están duplicados

El SVG se dibuja desde JavaScript y **no** lee las variables CSS. Estos hex están repetidos en
`js/app.js`: fondo `#fffdf8`, cejuela/anillo `#1b1b1b`, trastes `#b9b2a4`, cuerdas `#6b665c`,
inlays `#e6e0d4`, ventana `#f0a13c`. Si cambiás esos tokens en `:root`, cambialos también ahí o
el diagrama va a quedar desalineado con el resto de la página.

### Cambiar los colores de nota

1. Editar `ROOT_COLOR` / `NOTE_COLOR` en `js/theory.js`.
2. Verificar el contraste del texto: la tónica usa `.note.root .note-label` en blanco; el
   plateado usa el `--ink` por defecto.
3. `npm test` y mirar el mástil: `npm start` → `http://localhost:5173`.

### Regla de oro al editar

Sin build, sin dependencias de runtime: si un cambio visual necesita una herramienta nueva, el
cambio está mal planteado. Todo se resuelve en `index.html`, `styles.css`, `js/app.js` y
`js/theory.js`, y se sirve tal cual.

### Verificación después de editar

```bash
npm test                 # 19 checks: teoría, contrato HTML/JS/CSS y smoke de UI
npm start                # http://localhost:5173
```

Checklist visual: un mástil continuo con todas las posiciones · selector de posición que mueve
el rectángulo cálido · sin traste 0 · tónica roja anillada en negro y el resto en plateado ·
puntos de beat apagados/encendidos · foco visible recorriendo las notas con Tab · nada
desbordado a 720px de ancho.
