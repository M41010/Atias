# Protocolo de validación del objetivo del 10 %

## Fórmula

Para cada par (invernadero, cultivo, semana):

```text
error % = |kg estimados − kg reales| / kg reales × 100
```

Sobre el conjunto de pares se calcula:

| Métrica | Fórmula | Para qué |
|---|---|---|
| **WAPE** (principal) | Σ\|E − R\| / ΣR | Error ponderado por kg. No se dispara con cosechas pequeñas |
| Sesgo | Σ(E − R) / ΣR | Si se estima siempre de más o de menos. Un sesgo estable se puede corregir |
| P90 | Percentil 90 del error % | Cómo son las semanas malas |
| % dentro del objetivo | Pares con error ≤ 10 % | Con qué frecuencia se cumple |
| IC 90 % del WAPE | Bootstrap sobre pares | Cuánta incertidumbre deja el tamaño de muestra |

Los pares con cosecha real de 0 kg quedan fuera (el error relativo no existe), y se informa de cuántos son.

## Qué se compara con qué

| Estimación | Cosecha pesada | ¿Válido? |
|---|---|---|
| Observado en captura (Fase 1) | **Cosecha inmediata**: todo lo maduro, con el mismo criterio, justo tras capturar | **Sí** |
| Observado en captura (Fase 1) | Recolección de lunes a viernes | **No**: incluye fruta madurada después |
| Previsión lunes–viernes (Fase 3) | Recolección de lunes a viernes | Sí |

El alcance de cada cosecha se registra (`cosecha_inmediata` o `lunes_viernes`) y los alcances no se mezclan.

### Cosecha de control

Sirve para medir el sistema de visión sin el efecto de la maduración posterior:

1. Elegir hileras o un tramo representativo: incluir cabecera y centro, y zonas densas y claras.
2. Capturar. Inmediatamente después, recoger **todo** lo que cumpla el criterio de madurez, sin descartes.
3. Pesar por cultivo y anotar también número de frutos y peso por clase.
4. Registrar lo que se quedó sin recoger o se descartó.

La cosecha de control es parcial: valida el conteo y el peso, y el resultado por invernadero completo se
contrasta además con la recolección normal. Si el negocio no pudiera recoger justo tras capturar, la
alternativa es capturar justo antes de la recolección habitual del lunes; sigue habiendo un desfase, pero
pequeño. Debe anotarse.

## Criterio para afirmar que se cumple

La aplicación solo muestra **«Cumple en este piloto»** si se dan todas estas condiciones:

1. Datos reales: ningún dato simulado en vídeo, parámetros ni cosecha.
2. Estimación y cosecha comparables (tabla anterior).
3. Evaluación **fuera de muestra**: semanas no usadas para calibrar.
4. Al menos 8 pares por grupo evaluado. *Confirmado por el usuario el 2026-11-10.*
5. **Extremo superior del IC 90 % del WAPE ≤ 10 %**. *Confirmado el 2026-11-10:* es más exigente que pedir
   una media ≤ 10 %, y evita declarar el éxito por una racha de semanas buenas.

Aun así, el resultado vale para **ese invernadero, cultivo y método de captura**. Antes de escalar hay que
repetir en un invernadero diferente y, al cambiar del móvil a la captura automática, recalibrar y revalidar.

## Atribuir el error

El WAPE total no dice qué falla. Se mide cada eslabón por separado:

| Eslabón | Prueba | Referencia |
|---|---|---|
| Detección y clasificación | Precisión y exhaustividad por clase en imágenes etiquetadas de **otras semanas** | Etiquetas |
| Conteo único | Recuento por planta frente a frutos visibles | Conteo manual sobre el vídeo |
| Visibilidad (`k`) | Recuento frente a frutos totales en plantas de control | Conteo manual en la planta |
| Asignación a planta | Frutos asignados a la planta correcta | Muestra etiquetada |
| Peso | g/fruto por clase, por semana | Pesada de muestra |
| Calibre | mm estimados frente a medidos | Calibre o regla |

## Calendario de calibración y evaluación

Ejemplo sin duración fija: las primeras semanas sirven para calibrar `k` y pesos; las siguientes se
evalúan sin tocar nada. Al recalibrar, solo se evalúan las semanas posteriores. La duración real dependerá de
la variación entre semanas y del tamaño del error; conviene abarcar un cambio de fase o de clima.

## Estado actual

- La app calcula los kilos con el conteo real del detector y el peso por fruto medido (muestra pesada o lo
  recogido en los tramos de control); si aún no se ha pesado, usa el de partida de la familia y lo avisa.
- **Datos de campo** guarda las previsiones del agricultor y del técnico por separado, los kilos recogidos
  cada día, los tramos de control (con los metros desde la cabecera de cada cinta) y la muestra de peso.
- **Precisión** muestra el veredicto y las métricas de esta página (`web/src/lib/validation.ts`, misma
  lógica que `src/atias/validation.py`), cada semana frente al agricultor y al técnico, y los eslabones:
  detección en los tramos de control, fruta tapada (`k`), peso por fruto y lo observado frente a la
  cosecha de control.
- La semana en que se pesa la muestra calibra el peso: cuenta en el error orientativo, no en el veredicto.
- Una previsión con hileras sin contar no se compara con la cosecha entera.
- Los dos lados de una hilera se combinan con `max(A, B)` por tramo hasta medir cuánta fruta comparten.
