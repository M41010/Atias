---
name: Atias · web pública
description: La cuadrícula de campo en verde Hoja con el símbolo de la Nave. Escaparate del producto en seis idiomas.
colors:
  trap: "#f1f4ec"
  trap-deep: "#dfe7d6"
  ink: "#0f2b20"
  ink-soft: "#3a5446"
  sprout: "#3f8f2a"
  sprout-light: "#8fd14f"
  paper: "#ffffff"
  paper-muted: "#4f5f55"
  fruit: "#c8231b"
  fruit-unripe: "#6f9a2c"
  leaf-dark: "#1f3a1d"
  observed: "#17803d"
  observed-ink: "#11632f"
  forecast: "#c98a0c"
  forecast-ink: "#77500a"
  forecast-soft: "#fdf3d7"
typography:
  display:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontStretch: "72%"
    fontWeight: 850
    lineHeight: 0.92
    letterSpacing: "-0.02em"
    fontSize: "clamp(3.25rem, 6.6vw, 5.5rem)"
  numeral:
    fontFamily: "Archivo"
    fontStretch: "78%"
    fontWeight: 850
    fontVariantNumeric: "tabular-nums"
  body:
    fontFamily: "Archivo"
    fontSize: "1.0625rem"
    lineHeight: 1.55
  lead:
    fontFamily: "Archivo"
    fontSize: "1.2rem"
    fontWeight: 500
    maxWidth: "46ch"
grid:
  cell: "24px"
  major: "5 celdas"
  minorLine: "rgb(15 43 32 / 0.07)"
  majorLine: "rgb(15 43 32 / 0.22)"
rules:
  heavy: "3px solid ink"
  light: "2px solid ink"
rounded:
  none: "0"
  fruit: "9999px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.trap}"
    height: "52px"
    border: "3px solid ink"
    hover: "se invierte: fondo claro con tinta"
  label:
    backgroundColor: "{colors.paper}"
    border: "3px solid ink"
  field:
    backgroundColor: "{colors.paper}"
    border: "2px solid ink"
    height: "48px"
    invalid: "borde rojo fruto y mensaje con icono"
---

# Atias · web pública

## Idea

**La cuadrícula de campo.** Una hoja de medición en verde muy claro, con cuadrícula fina cada 24 px y una línea mayor cada cinco celdas, tinta verde profunda y etiquetas blancas donde va el texto largo y los datos. La marca es un especialista del invernadero que mide; no se ata a un cultivo, porque Atias crecerá hacia plagas, riego y seguimiento de plantas. Rechaza la portada agrícola de degradado verde, foto de dron y tres tarjetas.

Es un mundo distinto del panel de la cooperativa (`DESIGN.md` en la raíz). Comparten dos colores con el mismo significado: verde para lo observado y ámbar para la previsión aún sin validar.

## Color

- **Fondo Hoja** (`trap`, verde muy claro) es el suelo de toda la página. Los tokens conservan el nombre `trap` del diseño anterior para no tocar los componentes.
- **Tinta** (verde profundo) para texto, bordes, la banda del piloto y el pie. Sobre tinta, el texto va en el fondo claro.
- **Verde brote** solo en el punto de medida de la marca (`sprout` sobre claro, `sprout-light` sobre tinta).
- **Etiqueta blanca** solo para texto largo, tablas, el formulario y el contador.
- **Rojo fruto** solo en frutos maduros y en errores del formulario.
- **Verde observado** y **ámbar previsión** solo dentro de etiquetas, con su leyenda nombrada al lado.
- Texto secundario en `ink-soft`, teñido de verde, nunca gris.

## Tipografía

Una familia, **Archivo** variable, alojada con la web. Titulares y cifras en anchura condensada (72-78 %) y peso 850: la voz de las etiquetas impresas. Texto normal a anchura completa. Cifras tabulares en todo dato. Rótulos en minúscula de frase, sin versales ni tracking abierto.

## Estructura

- Contenedor de 1320 px con márgenes de 16 px (32 px desde 640 px).
- Las secciones alternan fondo con cuadrícula (`.plate`), fondo liso para los pasajes de lectura, y banda de tinta para el piloto y el pie. El texto que va directamente sobre el fondo, sin etiqueta, prefiere el fondo liso.
- Separación por líneas de 3 px de tinta, nunca por sombras. Sin radios salvo en los frutos.
- Listas de contenido relacionado (para quién, principios, etapas del producto) como filas de una sola tabla, nunca como tarjetas sueltas.

## Pieza característica: el contador

Etiqueta blanca con un invernadero de ejemplo dibujado con celdas de la cuadrícula. La tira pasa por delante de una línea de lectura clara. Cada fruto maduro que la cruza se enmarca y rellena una celda negra en el recuento; las celdas vacías son lo que queda por contar. Un solo control (el deslizador del recorrido) mueve a la vez frutos, kilos con su margen y temporeros. Se anima una vez al verse (7 s, salida exponencial); con movimiento reducido muestra el resultado directamente. Siempre lleva el rótulo «Datos inventados para mostrar el método».

## Marca

Dos piezas (`src/components/Mark.tsx`):

- **Símbolo, la Nave** (`NaveMark`): tres naves de un multitúnel sobre la línea de suelo, una marca en cada pata y el punto de medida en la nave central. Va solo: favicon, cierre de la portada, pie y página de idiomas. No se pone junto al logotipo en la cabecera, para no repetir el dibujo.
- **Logotipo** (`Wordmark`): «ATIAS» en mayúsculas, Archivo al 88 % de anchura y peso 800, con la nave central del símbolo, sin modificar, haciendo de A.

El favicon (`public/marca.svg`) es el símbolo en claro sobre un cuadrado de tinta.

## Pendientes y honestidad

- Lo que la empresa no ha dado se muestra como hueco con borde discontinuo, nunca inventado: titular, NIF, domicilio, correo y proveedor del formulario.
- El formulario valida pero no envía mientras no exista `NEXT_PUBLIC_FORMULARIO_URL`, y lo dice.
- Ninguna cifra de precisión ni cliente. El piloto se presenta separando lo que funciona de lo que se está comprobando.
