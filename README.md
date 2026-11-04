# Atias

Estimación semanal de kilogramos de fruta madura en invernaderos a partir de vídeo, con desglose por
cultivo, invernadero, hilera y planta. Cultivos iniciales: tomate cherry, pimiento y pepino.

> **Estado: prototipo con datos simulados.** La tubería funciona de principio a fin con vídeo sintético,
> pero aún no se ha probado con imagen real ni existe un detector entrenado. **No hay ninguna medida de
> precisión real.** El objetivo de error ≤ 10 % sigue sin validar.

## Probarlo

Requiere [uv](https://docs.astral.sh/uv/).

```powershell
uv sync
uv run atias demo      # Genera el escenario SIMULADO en data/simulado (unos 2 minutos)
uv run atias servir    # Abre http://127.0.0.1:8000
uv run pytest
```

La demostración usa 3 invernaderos simulados y 4 semanas: 2 para calibrar y 2 para evaluar. En la última
semana se inyectan fallos a propósito (un lado sin capturar y un vídeo oscuro) para ver las advertencias.

## Órdenes

| Orden | Para qué |
|---|---|
| `atias registros <csv/xlsx> [--salida informe.md]` | Revisa estructura y calidad de los registros de cosecha y dice para qué sirven. **Primer paso con datos reales** |
| `atias analizar <manifiesto.json> --perfiles <perfiles.json>` | Analiza una sesión de captura |
| `atias cosecha <csv>` | Importa kg reales: `invernadero,cultivo,semana,alcance,kg,origen` |
| `atias validar` | Calcula el error frente a la cosecha real y da el veredicto |
| `atias servir` | Arranca la aplicación web local |

`config/cultivos.plantilla.json` es la plantilla de parámetros reales: deliberadamente sin valores. Lo que
falte no se inventa: sin peso por fruto la app da frutos, pero no kg.

## Documentación

- [docs/DISENO.md](docs/DISENO.md): requisitos, hipótesis, arquitectura, fases y riesgos.
- [docs/VALIDACION.md](docs/VALIDACION.md): cómo se calcula y se comprueba el error del 10 %.
- [docs/CAPTURA.md](docs/CAPTURA.md): raíles, cámaras fijas y otras alternativas, y cómo decidir.

## Estructura

```text
src/atias/
  domain.py       Perfiles de cultivo; cada parámetro lleva su origen (simulado o medido)
  vision/         Detector (interfaz y referencia), seguimiento, madurez, tubería de vídeo
  session.py      Análisis de una sesión a partir de su manifiesto
  estimation.py   Recuentos a kg, con su rango
  reports.py      Agregación planta → hilera → invernadero → cultivo → total
  validation.py   Métricas de error y veredicto del objetivo
  records.py      Revisión de registros de cosecha
  simulation.py   Generador de datos SIMULADOS
  store.py        SQLite local
  api.py, static/ API de solo lectura y aplicación web instalable
```

## Reglas del sistema

- El resultado es **fruta madura observada en la captura**. No es una previsión de lunes a jueves.
- Cualquier dato o parámetro simulado impide dar el objetivo por cumplido.
- La visión y el cálculo de kg no usan modelos de lenguaje. Claude Code se usa solo para desarrollar.

## Limitaciones actuales

- `ColorBaselineDetector` solo sirve con vídeo sintético. Falta entrenar un detector con imágenes reales
  e implementar la interfaz `Detector`.
- La asignación a plantas requiere marcadores ArUco, cuya viabilidad está por confirmar.
- El «rango orientativo» recoge la incertidumbre de `k` y de los pesos, no los errores del detector ni los
  fallos de captura: la cosecha real puede quedar fuera de él. No es una garantía.
- API sin autenticación y solo en localhost. La subida de vídeo desde la web y la sincronización central no existen.
