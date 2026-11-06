# Diseño del sistema

Estado a 4 de noviembre de 2026. Aún no se dispone de vídeos, registros de cosecha ni datos del
invernadero piloto, y ninguna cifra de precisión está medida.

## 1. Requisitos: qué está confirmado y qué no

### Confirmado por el proyecto

| Tema | Requisito |
|---|---|
| Usuaria principal | La cooperativa, para decidir cuántos kilos vender y cuántos temporeros contratar |
| Resultado | Kg observados y previsión experimental por cultivo, con desglose por invernadero, hilera y tramo, y total |
| Cálculo de temporeros | Previsión ÷ (kg por jornal × días), por cultivo y ajustable |
| Cultivos | Tomate cherry y pimiento (madurez por color); pepino (madurez por calibre) |
| Frecuencia | Semanal. Captura el sábado, recolección de lunes a viernes (el sábado no se cosecha) |
| Objetivo | Error ≤ 10 % en kg por invernadero, comparado con lo cosechado. Sin afirmarlo antes de medirlo |
| Escala | Unos 600 invernaderos de dimensiones distintas |
| Captura final | Automática. La idea inicial son raíles con cámara por ambos lados, a comparar con alternativas |
| Piloto | El agricultor graba con el móvil un vídeo por hilera y lado, y lo sube con un enlace personal |
| Tecnología | Next.js, Tailwind, framer-motion y React Query; API con Express; análisis en Python |
| Despliegue | En local por ahora y en la nube después |
| Entorno | Condiciones extremas; equipo protegido o expuesto solo durante el recorrido; conexión no garantizada |
| Claude | Herramienta de desarrollo. Sin API ni modelo de lenguaje en producción salvo razón clara |

### Hipótesis a comprobar

| Hipótesis | Por qué importa | Cómo se comprueba |
|---|---|---|
| H1. Los registros permiten sacar kg por invernadero, cultivo y semana | Sin ello no se puede validar | `atias registros <archivo>` |
| H2. Los registros incluyen número de frutos o permiten deducir g/fruto | Si no, hay que pesar muestras | Igual, y pesada de muestra |
| H3. El tramo de hilera basta como unidad de detalle | Se decidió no usar marcadores físicos: sin ellos no hay detalle por planta exacta, y los tramos deben estimarse por posición en el vídeo | Comparar tramos con conteo manual |
| H4. El móvil permite ver suficiente fruta por ambos lados | Determina si el piloto mide algo útil | Conteo manual en plantas de control |
| H5. El color separa madurez en cada variedad bajo la luz del invernadero | Ni el umbral ni la variedad están definidos | Etiquetado con criterio del agrónomo |
| H6. El calibre del pepino se puede medir con una sola cámara | La escala cambia con la distancia y el fruto puede estar tapado | Fruto medido a mano frente a estimado |
| H7. Un factor de corrección es estable entre semanas e invernaderos | Determina si se puede escalar sin calibrar cada uno | Calibrar en unas semanas, evaluar en otras |
| H8. Lo recolectado de lunes a viernes se relaciona de forma estable con lo observado | De ello depende que el resultado sirva para planificar | Datos del piloto; Fase 3 |

## 2. Una distinción que condiciona el proyecto

El sistema de la Fase 1 mide **lo que está maduro al capturar** (sábado). La recolección
de lunes a viernes incluye además **lo que madure entre la captura y la recogida**, y en semanas de
calor esa diferencia puede ser grande. En consecuencia:

- Comparar directamente lo observado con la cosecha de lunes a viernes da un error que **no mide**
  el sistema de visión. La simulación lo muestra: la misma estimación da mucho más error contra esa
  cosecha, sin que el detector haya cambiado.
- La aplicación rotula siempre el dato como «fruta madura observada» y marca esa comparación como
  «no comparable». El veredicto lo aplica el código, no depende de quien lea el informe.
- Para validar el sistema de visión hace falta una **cosecha de control justo después de capturar**
  (ver [VALIDACION.md](VALIDACION.md)).

El prototipo ofrece además una **previsión experimental** para la recolección: lo observado más la parte de
los inmaduros que madurará, con un porcentaje que indica el agricultor o agrónomo y se corrige con lo cosechado.
Va siempre rotulada y separada de lo observado, y es la cifra destacada para planificar la venta. El modelo
aprendido fruto a fruto sigue siendo la Fase 3.

## 3. Arquitectura

```text
 Agricultor (móvil)            Web (Next.js)              API (Express)            PostgreSQL
 enlace personal ───────────▶  /subir/<enlace>  ── /api ──▶ subidas (tus)  ───────▶ datos y estados
                                                            │                      volumen de vídeos
 Cooperativa (ordenador)                                    │
 correo y contraseña ───────▶  resumen, enlaces, ...  ──────┤
                                                            ▼
                                                   Análisis (Python): visión y kg
```

El análisis todavía no procesa los vídeos subidos, y los kilos y temporeros de la app siguen simulados.
Ver [DOCKER.md](DOCKER.md) para arrancarlo.

### Qué hace cada componente

| Función | Componente | Motivo |
|---|---|---|
| Detección visual | Modelo propio tipo YOLO, con imágenes públicas y después vídeos del piloto etiquetados. Entrenamiento en GPU en la nube | Sin coste por vídeo y medible. Aún no existe |
| Madurez | Color por variedad; calibre del pepino por definir | Criterio explicable y ajustable por el agrónomo |
| Conteo único | Seguimiento entre fotogramas y factor de solape entre lados | Ver riesgos R2 |
| Kilogramos | Fórmula determinista con parámetros medidos | Auditable y reproducible |
| Modelo de lenguaje | **Ninguno en producción** | Coste por uso y dependencia de la red, sin ventaja frente a un detector entrenado |

### Conexión

Una mala conexión no debe perder trabajo: las subidas son reanudables y siguen solas al volver la red.
La consulta sin conexión de la cooperativa todavía no guarda copia de los datos.

### Escalado a 600 invernaderos (no se construye ahora)

Los invernaderos, enlaces y dimensiones ya son datos, no código. Cuánto cómputo hace falta se decidirá
midiendo la duración real del análisis con el detector entrenado. Lo que falta para la nube está en
[DOCKER.md](DOCKER.md).

## 4. Plan por fases

Cada fase avanza solo si supera su criterio de paso. Los umbrales definitivos se fijan con el negocio.

### Fase 0: datos y definición (en curso)

- [x] Web de la cooperativa, subida real, acceso, enlaces y cálculo de error.
- [ ] Revisar los registros reales con `uv run atias registros <archivo>`.
- [ ] Fijar con el agrónomo la madurez por variedad y el calibre comercial del pepino.
- [ ] Probar la subida en un móvil real, y acordar la cosecha de control.

**Paso:** registros revisados, definición de madurez escrita y protocolo de validación aceptado.

### Fase 1: prototipo y piloto con móvil

1. Recoger vídeos reales con la subida, siguiendo un protocolo de grabación.
2. Etiquetar frutos y entrenar el detector, separando los datos por **semana e hilera**, no por
   fotograma: fotogramas contiguos casi idénticos en entrenamiento y prueba darían una precisión falsa.
3. Adaptar el análisis a tramos sin marcadores y conectarlo a los vídeos recibidos.
4. Medir el conteo frente a conteo manual en plantas de control, calibrar factores y pesar muestras por clase.
5. Evaluar en semanas posteriores frente a cosecha pesada.

**Resultado:** fruta madura observada y previsión experimental, siempre separadas.
**Paso:** error medido con el protocolo de [VALIDACION.md](VALIDACION.md), con sus causas identificadas.

### Fase 2: captura automática

1. Banco de pruebas de alternativas en el piloto ([CAPTURA.md](CAPTURA.md)).
2. Prototipo con recorrido automático, protección, limpieza y recuperación de fallos.
3. **Recalibrar**: cambiar de cámara o de recorrido invalida el detector y el factor `k`.
4. Fichas de instalación por tipo de invernadero, a partir de las dimensiones reales.

**Paso:** recorridos desatendidos durante varias semanas, con precisión no inferior a la del móvil.
Después, ampliar a un segundo invernadero **distinto** antes de planificar el despliegue completo.

### Fase 3: predicción de maduración (posterior)

**No disponible en el piloto.** Objetivo: estimar qué frutos inmaduros madurarán antes de cada recolección.

Datos necesarios:

- **Capturas repetidas del mismo fruto**, idealmente varias por semana en una muestra de plantas: una
  captura semanal solo muestra el inicio y el final. Con capturas el sábado y a mitad de semana, se ve
  la transición dentro de la ventana que interesa.
- **Color o calibre por fruto a lo largo del tiempo**, para medir la velocidad de cambio.
- **Clima interior** (temperatura, radiación, humedad), probablemente el factor principal.
- **Fechas y kg de recolección** dentro de la ventana, y variedad y fase del cultivo.
- Las **cosechas históricas sin imágenes** sirven de contexto y estacionalidad, pero no enseñan a
  predecir fruto a fruto.

Asociar frutos entre semanas es difícil porque cambian el color, el tamaño, la posición de la rama y las
hojas; además, la planta crece y se descuelga. Propuesta por niveles:

1. **Por planta o tramo, sin identificar frutos.** Modelar qué parte de los inmaduros de un tramo se
   recolecta en la ventana. Es lo más robusto y quizá suficiente para los kg por invernadero.
2. **Por racimo o fruto en una muestra**, con posición relativa al marcador y altura, registro entre
   capturas y etiquetas físicas de verificación. Sirve para enseñar y evaluar la curva de maduración.
3. **Sensor mejorado** (profundidad para posición 3D) solo si los niveles anteriores no alcanzan.

El sistema ya guarda desde hoy los recuentos de frutos **inmaduros** por planta, aunque no se muestran.
Conviene guardar también una muestra de vídeos originales del piloto para poder reprocesarlos.

## 5. Principales riesgos técnicos

| # | Riesgo | Efecto | Mitigación | Estado |
|---|---|---|---|---|
| R1 | **Frutos tapados** por hojas o por otros frutos | Subestimación que varía con el follaje y la fase del cultivo | Factor `k` medido contra conteo manual y vigilado por fase; capturar desde ambos lados; valorar deshojado y ángulos | Mecanismo listo; `k` real pendiente |
| R2 | **Doble conteo** entre fotogramas | Sobreestimación | Seguimiento con compensación del movimiento de cámara | Hecho para vídeo sintético; sin probar en real |
| R2b | Doble conteo **entre lados** o entre pasadas | Sobreestimación | Sin fruto emparejado entre lados, `A + B − solape·min(A,B)`; si no se ha medido, `max(A,B)` con aviso. Plantear 3D en Fase 2 | Hecho; solape real pendiente |
| R3 | **Relación fruto-tramo** | Sin marcadores, la posición a lo largo de la hilera depende de la velocidad al grabar | Estimar la posición a lo largo del vídeo y validar con conteo manual. El código actual aún usa marcadores ArUco y debe adaptarse | Pendiente |
| R4 | **Convertir fruto en kg** | Un error en el peso medio se traslada entero al total y **no se compensa al agregar** | Peso por clase, variedad y fase, de pesadas reales; vigilar deriva. En cherry, el registro puede ir por racimo o caja | Modelo listo; falta el dato |
| R5 | **Medir el calibre** con una cámara | Clasificación errónea, que en pepino cambia qué cuenta como maduro | Escala por marcador y percentil alto de longitud. Una hoja parte un pepino y crea «pepinos pequeños» falsos (visto en simulación). Valorar profundidad | Parcial |
| R6 | **Color cambiante** por sol, encalado, sombras o variedad | Madurez mal clasificada | Captura a hora o luz controlada (iluminación activa de noche); carta de color de referencia | Pendiente |
| R7 | **Cambio de condiciones**: cámara, variedad, invernadero, estación | Lo calibrado deja de valer | Validar por separado y controlar la deriva con cosecha real; el `k` y el detector quedan ligados a un método de captura | Diseño |
| R8 | **Cifras reales engañosas**: la cosecha incluye maduración posterior, fruta de la semana anterior o descartes | Validar contra algo que no se ha estimado | Protocolo de cosecha de control | Definido |
| R9 | **Sobreajuste al piloto** | Prometer una precisión que no escala | Evaluar fuera de muestra y en otro invernadero antes de escalar | Aplicado en el cálculo |

## 6. Decisiones aplazadas a propósito

Sin datos sería inventar: número de cámaras y raíles, presupuesto, cómputo por finca, plazo de despliegue
y modelo de detector definitivo.
