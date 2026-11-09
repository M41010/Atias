---
name: Atias · web pública
description: La placa cromática de conteo. Escaparate del producto en seis idiomas.
colors:
  trap: "#f7da1b"
  trap-deep: "#e9c90a"
  ink: "#141412"
  ink-soft: "#3b3608"
  paper: "#ffffff"
  paper-muted: "#55524a"
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
  minorLine: "rgb(20 20 18 / 0.10)"
  majorLine: "rgb(20 20 18 / 0.30)"
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
    hover: "se invierte: amarillo con tinta"
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

**La placa cromática de conteo.** Los técnicos cuelgan en el invernadero placas adhesivas amarillas con una cuadrícula impresa para contar; Atias cuenta fruta. La web entera es esa placa: amarillo a sangre, cuadrícula fina cada 24 px con una línea mayor cada cinco celdas, tinta negra y etiquetas blancas donde va el texto largo y los datos. Rechaza la portada agrícola de degradado verde, foto de dron y tres tarjetas.

Es un mundo distinto del panel de la cooperativa (`DESIGN.md` en la raíz). Comparten dos colores con el mismo significado: verde para lo observado y ámbar para la previsión aún sin validar.

## Color

- **Amarillo trampa** es el suelo de toda la página. Nunca es acento.
- **Tinta** para texto, bordes, la banda del piloto y el pie. Sobre tinta, el texto es amarillo.
- **Etiqueta blanca** solo para texto largo, tablas, el formulario y el contador.
- **Rojo fruto** solo en frutos maduros y en errores del formulario.
- **Verde observado** y **ámbar previsión** solo dentro de etiquetas, con su leyenda nombrada al lado.
- Texto secundario sobre amarillo en `ink-soft`, teñido de la propia placa, nunca gris.

## Tipografía

Una familia, **Archivo** variable, alojada con la web. Titulares y cifras en anchura condensada (72-78 %) y peso 850: la voz de las placas y etiquetas impresas. Texto normal a anchura completa. Cifras tabulares en todo dato. Rótulos en minúscula de frase, sin versales ni tracking abierto.

## Estructura

- Contenedor de 1320 px con márgenes de 16 px (32 px desde 640 px).
- Las secciones alternan placa con cuadrícula, amarillo liso para los pasajes de lectura, y banda de tinta para el piloto y el pie. El texto que va directamente sobre el fondo, sin etiqueta, prefiere el amarillo liso.
- Separación por líneas de 3 px de tinta, nunca por sombras. Sin radios salvo en los frutos.
- Listas de contenido relacionado (para quién, principios, etapas del producto) como filas de una sola tabla, nunca como tarjetas sueltas.

## Pieza característica: el contador

Etiqueta blanca con un invernadero de ejemplo dibujado con celdas de la cuadrícula. La tira pasa por delante de una línea de lectura amarilla. Cada fruto maduro que la cruza se enmarca y rellena una celda negra en el recuento; las celdas vacías son lo que queda por contar. Un solo control (el deslizador del recorrido) mueve a la vez frutos, kilos con su margen y temporeros. Se anima una vez al verse (7 s, salida exponencial); con movimiento reducido muestra el resultado directamente. Siempre lleva el rótulo «Datos inventados para mostrar el método».

## Marca

Marca de conteo de cinco (cuatro palos y el quinto cruzado) junto a «Atias» en Archivo condensado. El icono de pestaña es la misma marca sobre amarillo.

## Pendientes y honestidad

- Lo que la empresa no ha dado se muestra como hueco con borde discontinuo, nunca inventado: titular, NIF, domicilio, correo y proveedor del formulario.
- El formulario valida pero no envía mientras no exista `NEXT_PUBLIC_FORMULARIO_URL`, y lo dice.
- Ninguna cifra de precisión ni cliente. El piloto se presenta separando lo que funciona de lo que se está comprobando.
