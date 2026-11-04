---
name: Atias
description: Kilos previstos y temporeros necesarios para la recolección, cada cifra con su margen y su procedencia.
colors:
  brand: "#17803d"
  brand-ink: "#11632f"
  brand-soft: "#e7f4ea"
  warn: "#c98a0c"
  warn-ink: "#77500a"
  warn-soft: "#fdf3d7"
  warn-line: "#f3dd9f"
  bad-ink: "#a42b1a"
  ok-ink: "#1a6836"
  ok-soft: "#e5f4e9"
  canvas: "#f7f8f6"
  sunken: "#eef0ec"
  surface: "#ffffff"
  ink: "#16201a"
  muted: "#5a665e"
  line: "#e3e6e1"
  line-strong: "#c9cec7"
  control: "#89938b"
typography:
  display:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.025em"
  metric:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.333
    letterSpacing: "-0.025em"
  unit:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 500
    lineHeight: 1.4
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.429
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.429
  table:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label-small:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.333
  caption:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.333
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  panel: "20px"
  header: "24px"
  page: "32px"
components:
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "20px"
  panel-header:
    typography: "{typography.title}"
    padding: "14px 20px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "40px"
  button-secondary-hover:
    backgroundColor: "{colors.sunken}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "4px 10px"
    height: "36px"
  select-harvest:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "40px"
  nav-link:
    textColor: "{colors.muted}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "40px"
  nav-link-hover:
    backgroundColor: "{colors.sunken}"
    textColor: "{colors.ink}"
  nav-link-active:
    backgroundColor: "{colors.brand-soft}"
    textColor: "{colors.brand-ink}"
  link-action:
    textColor: "{colors.brand-ink}"
    typography: "{typography.label}"
  pill-warn:
    backgroundColor: "{colors.warn-soft}"
    textColor: "{colors.warn-ink}"
    typography: "{typography.label-small}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  pill-ok:
    backgroundColor: "{colors.ok-soft}"
    textColor: "{colors.ok-ink}"
    typography: "{typography.label-small}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  pill-neutral:
    backgroundColor: "{colors.sunken}"
    textColor: "{colors.muted}"
    typography: "{typography.label-small}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  pill-brand:
    backgroundColor: "{colors.brand-soft}"
    textColor: "{colors.brand-ink}"
    typography: "{typography.label-small}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  notice-simulated:
    backgroundColor: "{colors.warn-soft}"
    textColor: "{colors.warn-ink}"
    typography: "{typography.label}"
    padding: "8px 16px"
  table-header:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.muted}"
    typography: "{typography.label-small}"
    padding: "10px 20px"
  table-cell:
    typography: "{typography.table}"
    padding: "11px 20px"
  range-band:
    backgroundColor: "{colors.sunken}"
    rounded: "{rounded.full}"
    height: "6px"
---

# Design System: Atias

## Overview

**Creative North Star: "La Cifra con su Margen"**

Atias es un panel de gestión del estándar del sector, a la altura de Linear y Stripe en orden y precisión. Toda la composición existe para que dos cifras, kilos que vender y personas que contratar, se lean sin abrir nada, y para que cada una lleve visible su rango, su estado y su procedencia. La cifra destaca por tamaño y peso; su margen la acompaña siempre.

La densidad es de herramienta de trabajo: tablas compactas, texto base de 14 px, líneas de 1 px y paneles blancos sobre un fondo gris muy claro. El color no decora: el verde señala acción y selección, el ámbar marca lo que aún no está probado y el rojo, lo que ha fallado. La superficie no cambia de carácter entre pantallas; solo cambia el dato.

El sistema rechaza cualquier disfraz agrícola y la fila de tarjetas sueltas sin relación entre sí.

**Key Characteristics:**
- Fondo gris muy claro, superficies blancas y tinta casi negra.
- Una familia tipográfica, Inter, con cifras tabulares en todo dato numérico.
- Líneas de 1 px y radios pequeños; profundidad casi nula.
- Ámbar reservado a lo experimental, lo simulado y lo parcial.
- Las cifras relacionadas comparten panel, separadas por líneas.
- Recalcular es la única animación con significado: la cifra transita hacia su nuevo valor.

## Colors

Neutros de matiz verdoso muy leve, con tres familias semánticas que nunca se usan como adorno.

### Primary
- **Verde Hoja** (#17803d): anillo de foco, marca central de la banda de rango de lo observado y, al 25 %, su relleno. Ningún control lo usa como relleno.
- **Verde Hoja Tinta** (#11632f): texto verde. Enlaces de acción, marca Atias, elemento de navegación activo y pastilla de resultados nuevos (6,50:1 sobre su fondo suave).
- **Verde Hoja Suave** (#e7f4ea): fondo de selección. Navegación activa, pastilla «Nuevo» y texto seleccionado.

### Secondary
- **Ámbar Señal** (#c98a0c): solo al 30 %, como relleno de la banda de rango de la previsión. Con 2,95:1 sobre blanco, nunca es color de texto.
- **Ámbar Tinta** (#77500a): texto ámbar y marca central de la banda de previsión. Rótulos «Experimental», notas de parcial y provisional, e icono de advertencia de severidad normal.
- **Ámbar Suave** (#fdf3d7): fondo de pastillas ámbar y de la franja de datos simulados.
- **Ámbar Línea** (#f3dd9f): borde inferior de la franja de datos simulados.

### Tertiary
- **Rojo Fallo** (#a42b1a): texto e icono de error. Advertencias de severidad alta, «Revisar hilera», campo inválido y fallos de carga o guardado.
- **Verde Estado Tinta** (#1a6836) y **Verde Estado Suave** (#e5f4e9): exclusivos de la pastilla «Analizado».

### Neutral
- **Lienzo** (#f7f8f6): fondo de la aplicación, cabecera de tabla, hover de fila y filas de tramo desplegadas.
- **Hundido** (#eef0ec): carril de la banda de rango, hover de navegación y botón, esqueleto de carga, pastilla neutra y aviso sin conexión.
- **Superficie** (#ffffff): paneles, navegación lateral y controles.
- **Tinta** (#16201a): texto principal.
- **Gris Texto** (#5a665e): descripciones, rangos, unidades y cabeceras de tabla (5,24:1 incluso sobre Hundido).
- **Línea** (#e3e6e1): bordes de panel y separadores.
- **Línea Fuerte** (#c9cec7): borde de botón secundario, borde discontinuo de estado vacío y barra de desplazamiento.
- **Borde de Control** (#89938b): borde de campos y selector (3,18:1 sobre blanco, para que el control se identifique como tal).

### Named Rules
**La Regla del Ámbar Honesto.** El ámbar significa «todavía no probado»: experimental, simulado, parcial o provisional. Si un dato está validado, no lleva ámbar; si no lo está, no se le quita.

**La Regla del Verde Medido.** El verde es para acción, selección y foco, con una extensión de datos: la banda de lo observado, que así se distingue a primera vista de la previsión en ámbar. El contrato de dirección lo limitaba a acción y selección; se registra lo construido.

**La Regla Nunca Solo Color.** Todo estado lleva palabra o icono con nombre accesible. Una pastilla sin texto o un punto de color no son un estado.

## Typography

**Display Font:** Inter (con system-ui, sans-serif)
**Body Font:** Inter (con system-ui, sans-serif)

**Character:** Una sola familia neutra y precisa; la jerarquía sale del tamaño y del peso, nunca de otra voz. El cuerpo declara las variantes tipográficas «cv11» y «ss03» de Inter.

### Hierarchy
- **Display** (600, 3rem, 1): la cifra de la decisión en cada pantalla: previsión para la venta en Resumen y temporeros necesarios en Temporeros.
- **Metric** (600, 1.875rem, 1.2): cifras de apoyo dentro del mismo panel y resultado lateral en Parámetros.
- **Headline** (600, 1.5rem, 1.333): título de página, uno por pantalla, con reparto equilibrado de línea.
- **Unit** (500, 1.25rem, 1.4; 1.125rem junto a Metric): «kg» y «personas», en Gris Texto y sin el tracking negativo de la cifra.
- **Title** (600, 1rem, 1.5): título de panel y de estados vacío o de error.
- **Body** (400, 0.875rem, 1.429): descripciones, rangos y navegación. La descripción de estado vacío se limita a 56ch.
- **Label** (500, 0.875rem, 1.429): rótulo sobre una cifra, enlaces de acción, botones y selector.
- **Table** (400, 0.875rem, 1.5): celdas de tabla; la primera columna sube a 500.
- **Label Small** (500, 0.75rem, 1.333): cabeceras de tabla y pastillas.
- **Caption** (400, 0.75rem, 1.333): línea secundaria en una celda, «parcial» y mensaje de campo inválido.

### Named Rules
**La Regla de la Cifra Tabular.** Toda cifra que se compara o se recalcula usa numerales tabulares, y en tabla va alineada a la derecha. Una columna de kilos debe poder leerse por posición.

**La Regla de la Cifra Principal.** El tamaño Display aparece una sola vez por vista y se reserva a la decisión. Si una pantalla no tiene decisión principal, su cifra mayor es Metric.

**La Regla de la Frase.** Rótulos y cabeceras se escriben en minúscula de frase, sin versales ni tracking abierto. El orden lo da el peso.

## Layout

Aplicación de dos zonas: a partir de 768 px, navegación lateral de 224 px y contenido fluido; por debajo, la navegación pasa a una barra superior con desplazamiento horizontal. El contenido tiene un máximo de 1160 px, con márgenes de 16 px (32 px en escritorio) y 24–28 px en vertical.

El ritmo es regular: 20 px entre paneles y dentro de ellos, 24 px bajo la cabecera de página, 8–12 px en grupos internos. La franja de datos simulados queda fija arriba del contenido. El panel resumen reparte tres columnas (1,25 / 0,85 / 1) y se apila bajo 768 px, con separadores que pasan de verticales a horizontales. Parámetros añade desde 1024 px una columna lateral fija de 280 px con el resultado siempre a la vista.

Las tablas se adaptan por prioridad: rangos y columnas secundarias se ocultan bajo 1024 o 640 px, el relleno lateral de celda baja a 8 px bajo 640 px y, si aún no caben, se desplazan dentro de su panel. Los puntos de corte son 640, 768 y 1024 px.

### Named Rules
**La Regla del Panel Único.** Las cifras que se leen juntas viven en un solo panel, divididas por líneas de 1 px. Tres tarjetas sueltas no sirven para comparar.

## Elevation & Depth

Sistema plano con capas tonales: Lienzo, Superficie y Hundido dan la profundidad, y las líneas de 1 px, la estructura. Solo el panel lleva una sombra, ambiental y casi imperceptible. No hay sombras de estado ni capas flotantes propias.

### Shadow Vocabulary
- **Reposo de panel** (`box-shadow: 0 1px 2px rgb(20 30 24 / 0.04)`): asienta el panel sobre el lienzo. No cambia al pasar el cursor.

### Named Rules
**La Regla de la Línea Primero.** Para separar se usa una línea o un cambio de tono. Una sombra nueva no es una forma de dar importancia.

## Shapes

Esquinas contenidas y escalonadas: 8 px en paneles y bloques de estado, 6 px en controles y navegación, 4 px en el botón de hilera, y forma de cápsula solo en pastillas y bandas de rango. Los bordes son de 1 px y continuos; el borde discontinuo se reserva al estado vacío. El panel recorta su contenido para que las tablas respeten sus esquinas.

## Components

### Buttons
Discretos y utilitarios; acompañan a una tarea de edición sin competir con la cifra.
- **Shape:** esquinas contenidas (6 px), altura mínima de 40 px, icono de 15 px con separación de 8 px.
- **Secondary:** Superficie con borde Línea Fuerte y texto Label. Se usa en Reintentar, Restablecer y Deshacer.
- **Hover / Focus:** fondo Hundido en 150 ms; al pulsar, borde Gris Texto; foco con anillo Verde Hoja de 2 px y separación de 2 px.
- **Disabled:** opacidad 0,55 y cursor no permitido.
- **Primary:** no existe un botón relleno. La acción principal, abrir invernadero, es la fila entera de la tabla.

### Chips
Pastillas de estado de una línea, nunca interactivas.
- **Style:** cápsula sin borde, Label Small, fondo suave y tinta de su misma familia; icono de 12 px cuando indica estado de análisis.
- **State:** «Analizado» en Verde Estado; «Analizando» neutra con icono giratorio; «Con advertencias» en ámbar; «Con problema» en Rojo Fallo; «Experimental», «Parcial» y «Simuladas» en ámbar; «Nuevo» en Verde Hoja. En cabecera de columna, la previsión lleva la forma abreviada «Exp.» con su explicación accesible.

### Cards / Containers
El panel es el único contenedor.
- **Corner Style:** 8 px.
- **Background:** Superficie.
- **Shadow Strategy:** Reposo de panel; ver Elevation & Depth.
- **Border:** 1 px Línea, con la misma línea bajo la cabecera opcional.
- **Internal Padding:** 20 px en contenido; 14 × 20 px en cabecera, con título, descripción y acción a la derecha.
- **Estados:** carga con bloques Hundido pulsantes; error centrado con icono rojo y Reintentar; vacío con borde discontinuo y explicación de cuándo llegarán datos.

### Inputs / Fields
- **Style:** Superficie con borde de control de 1 px, 6 px de radio y 36 px de altura. Los numéricos alinean a la derecha con cifras tabulares y unidad junto al campo. El selector de recolección comparte tratamiento, con 40 px de altura y texto Label.
- **Focus:** borde Tinta al pasar el cursor en 150 ms; foco con el anillo global.
- **Error:** borde Rojo Fallo y mensaje Caption con el rango válido y el valor que se mantiene. Un valor inválido no altera los cálculos.

### Navigation
- **Style:** enlaces de 40 px con icono de 16 px y texto de 14 px en Gris Texto.
- **States:** hover con fondo Hundido y texto Tinta en 150 ms; activo con fondo Verde Hoja Suave, texto Verde Hoja Tinta y peso 600.
- **Mobile:** barra superior de una línea con desplazamiento horizontal. La marca Atias es solo texto, 600 a 1.125rem, en Verde Hoja Tinta.

### Tabla de datos
Compacta, con cifras a la derecha.
- **Estructura:** cabecera Lienzo en Label Small, separadores de 1 px Línea sin borde en la última fila, y primera columna como encabezado de fila.
- **Fila enlace:** toda la fila es un único enlace para puntero, teclado y lector; hover Lienzo en 150 ms y flecha en Gris Texto al final.
- **Desglose:** una hilera se abre con flecha que gira en 150 ms; sus tramos aparecen por opacidad en 150 ms, con fondo Lienzo y texto de 13 px.
- **Dato pendiente:** raya «—» o «Pendiente de análisis», nunca un cero.

### Bloque de cifra
La pieza característica del sistema, en orden: rótulo con su pastilla, cifra, unidad, banda de rango, frase «Entre X y Y» y contexto.
- **Banda de rango:** carril Hundido de 6 px, relleno de rango y marca vertical de 2 px en el valor central. Ámbar para previsión, Verde Hoja para observado. Dentro de un panel, todas comparten escala (el máximo de la previsión más un 4 %) para poder compararse.
- **Recalculado:** al cambiar un parámetro, la cifra transita en 220 ms con `cubic-bezier(0.16, 1, 0.3, 1)` y se anuncia solo su valor final al lector.

### Franja de datos simulados
Banda fija de una frase, en Ámbar Suave con borde Ámbar Línea y texto Label centrado, presente en todas las pantallas mientras los datos sean simulados. El aviso sin conexión se apila debajo en Hundido.

### Lista de advertencias
Filas separadas por línea con icono de 17 px, ámbito en Label, mensaje y acción en Gris Texto, y enlace «Ver hilera». Triángulo Rojo Fallo para severidad alta; icono de información Ámbar Tinta para el resto.

### Named Rules
**La Regla del Rango Adjunto.** Una cifra destacada de kilos nunca aparece sin su rango en texto. La banda solo lo refuerza: es decorativa para el lector de pantalla y la frase lleva el dato.

**La Regla del Rótulo Experimental.** Toda previsión lleva su rótulo ámbar visible junto a la cifra o en la cabecera de su columna, y también la cifra destacada de temporeros que se deriva de ella.

## Do's and Don'ts

### Do:
- **Do** usa los tokens de color para todo color; el único literal admitido es la sombra de reposo de panel.
- **Do** coloca lo observado y lo previsto como cifras separadas, con su rótulo y su color de banda.
- **Do** marca lo parcial en cada cifra afectada, con pastilla en bloques de cifra y la palabra «parcial» en celdas.
- **Do** muestra los estados de carga, error y vacío con los tratamientos de panel establecidos, y explica qué ocurrirá después.
- **Do** limita las transiciones de estado a 150 ms y respeta la preferencia de movimiento reducido en giros y pulsos.
- **Do** usa iconos SVG de trazo de la misma familia (Lucide), con 12–22 px y ocultos al lector salvo que transmitan estado.

### Don't:
- **Don't** añadas disfraz agrícola: nada de ilustraciones de fruta, texturas de tierra ni paletas temáticas.
- **Don't** compongas una fila de tarjetas sueltas para cifras que se leen juntas.
- **Don't** mezcles observado y previsión en una misma cifra, ni presentes una previsión sin su rótulo experimental.
- **Don't** uses el ámbar como acento decorativo ni Ámbar Señal como texto.
- **Don't** comuniques un estado solo con color.
- **Don't** escribas rótulos en versales ni con tracking abierto.
- **Don't** añadas sombras para dar importancia ni animes el dato salvo para mostrar un recálculo.
