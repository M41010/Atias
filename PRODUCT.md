# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Elegido por el responsable del proyecto: Next.js, Tailwind CSS, framer-motion y React Query en la web; API con Express, que encarga el procesamiento de vídeo a Python. Se ejecuta en local durante el prototipo y pasará a la nube después.

## Users

- **Cooperativa (usuaria principal).** Consulta desde el ordenador. Necesita saber cuántos kilos podrá vender y cuántos temporeros hacen falta para la recolección.
- **Agricultor piloto.** Graba con el móvil dentro del invernadero y sube el vídeo desde una pantalla simple, con soltura media en apps y hojas de cálculo. No ve los datos de otros agricultores.

## Product Purpose

Estimar los kilogramos de fruta madura de un invernadero a partir de vídeo y anticipar la cosecha de la semana siguiente, para que la cooperativa pueda comprometer ventas y contratar a los temporeros necesarios.

El éxito es que una estimación semanal sustituya a la intuición en estas dos decisiones, con un error comprobado frente a lo cosechado. El objetivo es un error de hasta el 10 % en kg por invernadero, todavía sin medir.

## Positioning

La estimación sale de la propia fruta filmada en cada hilera, no de medias históricas, y cada cifra muestra de dónde viene y cuánta incertidumbre arrastra.

## Operating Context

- Ciclo semanal: captura el viernes o el sábado, y recolección de lunes a jueves.
- El agricultor graba un vídeo por hilera y lado, y al subirlo indica invernadero, hilera y lado.
- Parámetros: cultivo y variedad, dimensiones, cosechas anteriores y clima interior.
- La cooperativa indica los kg que recoge una persona por jornal en cada cultivo y los días disponibles.
- La conexión en el invernadero puede ser inestable: la subida no debe perder trabajo.
- Unos 600 invernaderos de dimensiones distintas en la visión final. El piloto es un solo invernadero.

## Capabilities and Constraints

- Cultivos iniciales: tomate cherry y pimiento (madurez por color) y pepino (madurez por calibre).
- Cada resultado distingue dos cifras que nunca se mezclan: **kg maduros observados** en la captura y **previsión de la semana siguiente**, rotulada como experimental.
- La cifra de kg se destaca como valor central con su rango.
- Temporeros: kg previstos ÷ (kg por jornal × días disponibles), por cultivo y ajustable por la cooperativa.
- Desglose por cultivo, invernadero, hilera y tramo de hilera. No se da detalle por planta exacta porque no hay marcadores físicos.
- Muestra fecha y hora de captura, estado del análisis, advertencias y comparación con la cosecha real cuando exista.
- La maduración inicial la indica el agricultor o agrónomo, y se corrige cada semana con lo cosechado.
- El agricultor entra con un enlace personal que le da la cooperativa, sin contraseña. Quien tenga el enlace puede subir vídeos.
- La cooperativa ve los resultados nuevos marcados dentro de la app. No hay avisos externos en el prototipo.
- Sin decidir: cómo entra la cooperativa y qué permisos tiene.

## Brand Commitments

Estándar del sector, elegido por el responsable del proyecto: un panel de gestión familiar y sin disfraz temático, a la altura de Linear y Stripe en orden, precisión y fiabilidad.

## Evidence on Hand

No hay vídeos, cosechas anteriores ni mediciones reales. Todo dato de la app es simulado y debe verse como tal. No hay clientes, testimonios ni cifras de precisión que se puedan citar. No hay logotipo ni identidad visual previos; existe el nombre Atias.

## Product Principles

1. Una decisión, una cifra: kilos que vender y personas que contratar se entienden sin abrir nada más.
2. Nunca más seguridad que los datos: observado, previsto y simulado se distinguen siempre, y una advertencia nunca queda escondida.
3. El trabajo del agricultor no se pierde: una mala conexión retrasa la subida, pero no obliga a repetirla.
4. La cifra se puede rastrear: del total a la hilera y de la hilera a su vídeo.

## Accessibility & Inclusion

Interfaz en español. El estado nunca se comunica solo con color, y el móvil debe leerse bien con mucha luz y usarse con una mano.
