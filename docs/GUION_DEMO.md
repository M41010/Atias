# Guion de la demostración de Atias

Para enseñar la app a la cooperativa, unos 10 minutos de recorrido y el resto para escuchar. El objetivo
no es impresionar: es que vea que Atias le ayuda a **vender y contratar sin fallar**, y que diga qué le
haría falta para avalar el piloto.

## Antes de empezar

- [ ] Docker en marcha: `docker compose up -d` y la app abre en `http://localhost:3000`.
- [ ] Sesión iniciada en **Acceso de la cooperativa**.
- [ ] Interruptor **Demostración** en **Sí** (menú lateral). Se ven datos simulados con la franja amarilla
  «Modo demostración: datos simulados»: así nadie confunde la demo con resultados reales.
- [ ] Pestañas abiertas en este orden: Resumen, Previsión diaria, Invernaderos, Temporeros, Datos de campo,
  Precisión.
- [ ] Para la pantalla del agricultor: un enlace creado en **Enlaces** (**Crear enlace**) y abierto en una
  pestaña con la vista de móvil del navegador (F12 → icono de móvil). Hoy la app solo se abre desde este
  ordenador, no desde el móvil.
- [ ] Este guion impreso y algo para apuntar sus respuestas.

## Recorrido (unos 10 minutos)

| # | Pantalla y clic | Qué enseñar | Qué decir |
|---|---|---|---|
| 1 | **Resumen** | Previsión para la venta, temporeros necesarios y fruta madura observada, cada una con su margen. Advertencias. | «Cada lunes tendrías esto: cuánto vender y a cuántos llamar, con el margen al lado. Y te avisa si un vídeo salió mal.» |
| 2 | **Previsión diaria** | Tabla de lunes a viernes por familia: R (real), Téc. (técnico) y Atias. Abrir una familia con la flecha. | «Es la misma vista que ya usáis: real y previsión por día. Atias va al lado del técnico para comparar, no lo sustituye.» |
| 3 | **Invernaderos** → clic en un invernadero → botón **Hilera 1** | Kilos por día de ese invernadero y el detalle por hilera y tramo. | «De dónde sale cada kilo: hilera a hilera, tramo a tramo. Se puede comprobar.» |
| 4 | **Temporeros** | Personas por día y por familia. Cambiar **Kg por jornal** o los **Días de recolección** y ver cómo cambia. | «Pones cuántos kilos recoge una persona en cada cultivo y te dice a cuántos llamar cada día.» |
| 5 | **Datos de campo** | Ficha del invernadero, **Previsiones y cosecha por día** y **Tramos de control**. | «Aquí se apuntan la previsión del agricultor y del técnico y los kilos de la báscula. Con esto medimos el error de verdad.» |
| 6 | **Precisión** | Atias, agricultor y técnico frente a lo recogido. Señalar la franja de datos simulados. | «Esto es lo más importante: cuánto se equivoca cada uno frente a la báscula. Ahora son datos simulados; los reales llegan con el piloto.» |
| 7 | **Precisión** → botón **Presentar** | Pantalla completa, se pasa con las flechas. | «Así lo enseñaremos a los dueños el 23, con los datos reales del piloto.» |
| 8 | **Resumen** → botón **Informe PDF** → **Imprimir o guardar en PDF** | La hoja semanal para quien no entra en la app. | «Cada semana, una hoja para quien prefiera el papel o el correo.» |
| 9 | Pestaña del agricultor (vista de móvil) | **Grabar** / **Elegir** por hilera y lado, y **Datos de la semana**. | «El agricultor solo graba con su móvil. Si se corta la conexión, sigue sola al volver: no tiene que repetir nada.» |

## Qué NO prometer

- **Precisión:** todavía no hay cifra. Se graba el **14-11** y se recoge del **16 al 20-11**. Una semana
  orienta, no demuestra: el objetivo de error ≤ 10 % solo se afirma con **al menos 8 semanas** e
  invernaderos y con el extremo alto del intervalo por debajo del 10 %.
- **Datos de la demo:** son simulados. No sacar conclusiones de esas cifras.
- **Futuro, no hoy:** conexión con el ERP, cámara sobre raíl, kilos por caja, plagas y estado de la
  planta. Están en la hoja de ruta.
- **Precio:** aún no hay. Lo que sí hay es el piloto gratis de 4 semanas.

## Preguntas para hacerle (lo más valioso de la reunión)

1. ¿Cómo prevéis hoy la cosecha y quién lo hace?
2. ¿Qué os cuesta equivocaros? Kilos que no se venden bien, compromisos que no se cubren, temporeros de más o de menos.
3. ¿Quién usaría Atias cada semana y en qué momento?
4. ¿Qué tendrías que ver para decir que sí?
5. ¿Qué datos del ERP podríais compartir (kilos reales, previsión del técnico) y de qué forma?
6. ¿Qué invernaderos y familias serían buenos para la primera temporada?

## Objeciones probables

| Si dice… | Respuesta corta y honesta |
|---|---|
| «¿Y si el agricultor no graba?» | La app avisa de las hileras que faltan y la cifra sale marcada como parcial. Grabar lleva unos minutos por hilera con el móvil. |
| «¿Cuánto acierta?» | Aún no lo sabemos y no lo vamos a inventar. Lo medimos con el piloto frente a la báscula y lo compararemos con vuestro técnico. |
| «¿Cuánto cuesta?» | Todavía no hay precio. Proponemos un piloto gratis de 4 semanas para que lo comparéis con vuestra báscula. |
| «¿Y nuestros datos?» | Cada agricultor entra con un enlace personal y solo ve lo suyo; la cooperativa, con usuario y contraseña. Los vídeos que se sustituyen o se quitan se borran a los 7 días. |
| «Ya tenemos al técnico.» | Atias no lo sustituye: le da una cifra contada para contrastar la suya. |
| «¿Y si falla la conexión en el campo?» | La subida se pausa sin conexión y sigue sola al volver. |

## Cierre: qué pedirle

- Que **avale el piloto** de esta semana (grabación el 14-11 y kilos del 16 al 20-11).
- Que apoye llevar los resultados a la **presentación a los dueños del 23-11**.
- Un nombre de contacto para los datos del ERP y la previsión del técnico.
- Apuntar sus respuestas y enviarle al día siguiente un resumen de una página.
