# DESIGN — Laboratorio de guitarra

Guía de diseño de la web (`index.html` + `styles.css` + SVG de `js/app.js`).
Sirve para que cualquier cambio visual sea consistente sin tener que releer todo el CSS.

**Fuente de verdad de los tokens:** `:root` en `styles.css`.
**Fuente de verdad de los colores de nota:** `ROOT_COLOR` / `NOTE_COLOR` en `js/theory.js`.
Nada acá es decorativo-por-decorar: cada regla existe para que el diagrama se lea de un vistazo.

<!-- AGENT NOTE: tokens extraídos por lectura directa del código (valores declarados), no por
     un pase de computed styles en navegador. -->

---

## 1. Identidad

- **Qué es:** herramienta de práctica de escalas, no landing. Densidad media-alta, cero scroll-bait.
- **Tema:** **oscuro**. Fondo casi negro (`--bg`), superficies gris zinc (`--card`, `--line`),
  texto claro (`--ink`) y **un solo acento cálido** (`--accent` = `#faf4d3`) para el botón
  primario, la opción seleccionada, la banda de posición y el anillo de la tónica.
- **El color saturado está reservado** a la tónica (rojo) y al acento. Si un elemento nuevo usa
  color fuerte sin decir "tónica" o "acción principal", está mal.
- **Sin título en la página:** el archivo empieza directo en la consola de práctica. No hay
  `header`, ni subtítulo, ni badge de tónica, ni pestañas.
- **Referencia conceptual:** el rojo marca el centro tonal; el acento cálido marca lo activo.

## 2. Color

### 2.1 Tokens semánticos (`:root`, `styles.css`)

| Token | Valor | Uso |
| --- | --- | --- |
| `--bg` | `#18181b` | fondo del `body` y de los inputs |
| `--card` | `#27272a` | consola, mástil (superficie de la tarjeta) |
| `--ink` | `#f5f5f5` | texto principal |
| `--muted` | `#a1a1aa` | texto secundario, labels, números de traste, cuerdas |
| `--line` | `#3f3f46` | bordes suaves, hover de botón, trastes |
| `--line-strong` | `#52525b` | bordes de controles, inlays |
| `--accent` | `#faf4d3` | acento cálido: primario, selección, banda de posición, anillo de tónica |
| `--shadow` | `0 1px 0 var(--line)` | única elevación del sistema |

`color-scheme: dark` está seteado en `html` para que los controles nativos (checkbox, select)
salgan oscuros.

### 2.2 Paleta de notas (`ROOT_COLOR` / `NOTE_COLOR`, `js/theory.js`)

| Rol | Hex | Notas |
| --- | --- | --- |
| Tónica | `#c92a2a` | además lleva anillo `--accent` y texto blanco |
| Resto | `#C0C0C0` | texto oscuro `#1b1b1b` (blanco no se lee sobre plata) |

No hay color por grado: el diagrama solo distingue tónica de no-tónica.

### 2.3 Contraste

Texto blanco sobre el rojo de la tónica y texto oscuro (`#1b1b1b`) sobre el plateado (etiquetas
del mástil, 11px bold). El mástil es oscuro (`#27272a`), así que el plateado y el rojo resaltan.
Cualquier color nuevo de nota tiene que aguantar texto encima; si no, cambiar el `fill` de
`.note-label`, como se hizo con `.note.root .note-label`.
Texto normal: `--ink` sobre `--card`/`--bg`; `--muted` solo para 13px o más.

## 3. Tipografía

- **UI: Lato self-hosted** (`fonts/lato-400.woff2`, `fonts/lato-700.woff2`, OFL en `fonts/OFL.txt`),
  declarado con `@font-face` + `font-display: swap`. Fallback al stack del sistema.
  `index.html` preloadea el 400.
- **Datos y mono:** `"Cascadia Mono", Consolas, "SF Mono", ui-monospace, monospace` — solo para
  `code` y `output`.

| Nivel | Tamaño | Notas |
| --- | --- | --- |
| cuerpo | 15px | `p` con margen 6px |
| `code` | 13px | fondo `--line`, radio 3px |
| labels / `.gsel-caption` / `.formula` | 12–13px | color `--muted` |
| `.note-label` (SVG) | 11px bold | texto dentro del círculo |
| `.open-label` | 12px | nombre de la cuerda al aire |
| `.fret-num` | 11px | número de traste |

## 4. Espacio, forma y layout

- **Base de espaciado: 4px.** Se usan 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28.
- **Ancho de contenido: todo el ancho de la ventana** (`header` ya no existe; `.console` y `main`
  usan el ancho completo) con padding lateral de 20px.
- **El mástil sí está acotado:** `.fret-wrap` tiene `max-width: 675px` y `margin: 0 auto`.
- **Alto constante:** `neckSvg` usa un `viewBox` de ancho fijo (`w = 674`) y reparte los trastes
  con `cellW = (674 - 58) / n`. Así el alto renderizado (214px) y el tamaño del círculo son
  idénticos en todas las escalas (13–15 trastes), y cambiar de escala no mueve nada.
- **Radios:** 3px (`code`) · 6px (inputs) · 7px (botones) · 10px (consola, mástil, GlideSelect).
- **Bordes:** 1px `--line` en superficies, 1px `--line-strong` en controles. **La consola no lleva
  borde** (solo fondo `--card`).
- **Breakpoint: 720px** — los GlideSelect pasan a ancho completo.

## 5. Componentes

| Componente | Selector | Rasgos que no se negocian |
| --- | --- | --- |
| Consola de práctica | `.console` | tarjeta `--card` **sin borde**, `display: grid` de 2 filas, controles en `flex-wrap` |
| Botón | `button` + `.primary` / `.ghost` / `.small` | `.primary` = fondo `--accent` texto oscuro; `.ghost` sin fondo; `.small` 3px 9px |
| GlideSelect | `.gsel` / `.gsel-trigger` / `.gsel-menu` | dropdown propio (ver §5.1) |
| Mástil | `.fret-wrap` / `.neck-box` / `.fret-svg` | un único SVG continuo con todas las posiciones (trastes 1 al último box, sin traste 0), `viewBox` fijo. En la posición 1 las cuerdas al aire de la escala son círculos a la izquierda del traste 1. La posición elegida se marca con `rect.pos-window` en `--accent` (14% fill / 40% stroke). Etiquetas siempre por nombre de nota |
| Leyenda | `.legend` / `.chip` | chip = muestra de 12px + grado + nota |
| Fórmula | `.formula` | grados, notas e intervalos (código T/S) en una línea |

Estados: `.note.active`, `.beat-dot.on`, `.note:hover`, `.gsel.is-open`, `.gsel-item.is-selected`.
Los tests verifican que `.fret-svg`, `.neck-box`, `.legend`, `.formula`, `.note.active` y
`.beat-dot.on` sigan existiendo en `styles.css` — no renombrar.

### 5.1 GlideSelect (`js/glide-select.js`)

Port vanilla del componente GlideSelect, sin React ni build. **Mejora un `<select>` nativo** que
queda oculto (`.gsel-native { display: none }`) como fuente de verdad de `value`/`options`/`change`
(lo usan la app y los tests). Encima renderiza:

- `.gsel-caption` (de `aria-label` del select) + `.gsel-trigger` (`role="combobox"`, valor actual + chevron).
- `.gsel-menu` (`role="listbox"`) con `max-height: min(58vh, 360px)` y scroll interno.
- `.gsel-glide`: el resaltado que se **desliza** (`translateY` + `height` con transición) hasta la
  opción activa/hover; vive detrás de los `.gsel-item`.
- Colores por variables CSS seteadas desde JS: `--gsel-accent`, `--gsel-surface`, `--gsel-highlight`,
  `--gsel-text`, `--gsel-radius`, `--gsel-menu-w`, `--gsel-pop`, `--gsel-glide`.
- `placement: 'auto'` elige abajo o arriba según el espacio (clave en teléfonos).
- Teclado: ArrowUp/Down, Home/End, Enter/Space, Escape, Tab. Cierra al click afuera.
- Un `MutationObserver` sobre el `<select>` reconstruye las opciones cuando la app las cambia
  (`#posSelect`), y `change` del select refresca el trigger.

Colores que usa la app para los tres selectores: acento `#faf4d3`, superficie `#27272a`,
highlight `#3f3f46`, texto `#f5f5f5`, radius 10, `menuWidth` 130 (Tónica) / 300 (Escala) / 220 (Posición).

## 6. Accesibilidad

- Foco visible obligatorio: los `<g>` del SVG usan `:focus-visible circle:first-child` con
  `stroke: var(--accent); stroke-width: 3` (el anillo del navegador no es confiable en SVG).
- Cada nota es `role="button"` + `tabindex="0"` + `aria-label` con cuerda, traste, grado y nota;
  Enter y Espacio la tocan.
- El GlideSelect expone `role="combobox"`/`role="listbox"`/`role="option"`, `aria-expanded`,
  `aria-activedescendant` y navegación por teclado; el `<select>` nativo queda como modelo de datos.
- `.beat-dots` es `aria-hidden="true"` (el pulso se muestra, no se anuncia).
- Ningún estado se comunica solo por color: la tónica lleva anillo y el texto de la nota.

## 7. Voz y microcopy

- Español rioplatense, segunda persona: "Hacé clic en cualquier punto", "Elegí una posición".
- Sin marketing ni signos de admiración. Se explica el porqué musical en una frase.
- Notación americana (`C D E F G A B`) y símbolos reales en los grados (`♭3`, `♯4`, `♭7`).
- Intervalos en código `T`/`S` (`TTSTTT`; `T+S` para 1½ tono).

## 8. Hacer / No hacer

### Hacer

- Reusar `var(--*)` para cualquier color de layout.
- Mantener el acento cálido para la tónica, la selección y la acción principal.
- Probar en 320px, 390px y 720px antes de dar por terminado un cambio de layout.

### No hacer

- Agregar frameworks o dependencias de runtime: la web no tiene build.
- Volver a fondos claros: el tema es oscuro (`color-scheme: dark`).
- Sombras difusas o gradientes (la única sombra fuerte es la del menú de GlideSelect).
- Colores nuevos de nota sin verificar el contraste del texto encima.
- Renombrar `.note.active`, `.beat-dot.on`, `.fret-svg`, `.neck-box`, `.legend`, `.formula`.

---

## 9. Guía de edición manual

| Querés cambiar… | Archivo | Ancla |
| --- | --- | --- |
| Fondo, tinta, bordes, acento | `styles.css` | bloque `:root` |
| Fuente (Lato) | `styles.css` / `index.html` / `fonts/` | `@font-face`, el `<link rel=preload>` y los `.woff2` |
| Ancho / alto del mástil | `styles.css` / `js/app.js` | `.fret-wrap { max-width }` y `viewBox` en `neckSvg` |
| Colores de nota | `js/theory.js` | `ROOT_COLOR`, `NOTE_COLOR` |
| Colores del diagrama (fondo, trastes, cuerdas, inlays, anillo, banda) | `js/app.js` | hex fijos dentro de `neckSvg` |
| Escalas, grados y posiciones | `js/theory.js` | `SCALES`, `positions`, `fretboard` |
| Estructura de la página y la consola | `index.html` | — |
| Comportamiento de los dropdowns | `js/glide-select.js` | `createGlideSelect` |

### Aviso: los colores del mástil están duplicados

El SVG se dibuja desde JavaScript y **no** lee las variables CSS. Estos hex están en `js/app.js`:
fondo `#27272a`, trastes `#3f3f46`, cuerdas `#a1a1aa`, inlays `#52525b`, anillo/banda `#faf4d3`.
Si cambiás los tokens en `:root`, cambialos también ahí.

### Cambiar los colores de nota

1. Editar `ROOT_COLOR` / `NOTE_COLOR` en `js/theory.js`.
2. Verificar el contraste: la tónica usa `.note.root .note-label` en blanco; el plateado `#1b1b1b`.
3. `npm test` y mirar el mástil: `npm start` → `http://localhost:5173`.

### Regla de oro al editar

Sin build, sin dependencias de runtime: si un cambio visual necesita una herramienta nueva, el
cambio está mal planteado. Todo se resuelve en `index.html`, `styles.css`, `js/app.js`,
`js/theory.js`, `js/glide-select.js` y `fonts/`.

### Verificación después de editar

```bash
npm test                 # 19 checks: teoría, contrato HTML/JS/CSS y smoke de UI
npm start                # http://localhost:5173
```

Checklist visual: sin título · consola sin borde · tema oscuro · Lato cargada ·
un mástil continuo de alto fijo (214px en toda escala) · selector de posición que mueve la banda
cálida · dropdowns GlideSelect que se abren sin salirse de pantalla (arriba si no hay lugar) ·
nada desbordado a 320px.
