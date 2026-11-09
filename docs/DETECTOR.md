# Detector de fruta

Atias cuenta los frutos de cada vídeo con un detector **RF-DETR** (Apache 2.0) entrenado en Google Colab y exportado a ONNX, que el servicio de análisis ejecuta sin GPU.

## Cómo cuenta

1. Analiza unos 3 fotogramas por segundo, a como mucho 1920 px de ancho, partidos en 2×2 teselas para que un tomate cherry no quede en unos pocos píxeles.
2. El detector encuentra cada fruto. El seguimiento lo reconoce en los fotogramas siguientes con ayuda del desplazamiento medido de la imagen, para contarlo **una sola vez**.
3. Cada fruto va al tramo de hilera que le corresponde según **cuánto ha avanzado la cámara** hasta verlo, no según el tiempo. Así una parada o un cambio de ritmo no lo mueven de tramo. Si la cámara apenas avanza, se reparte por tiempo y se avisa.
4. La madurez la da el modelo o, en el modo «fruto + color», el color del fruto con los rangos de `config/cultivos.plantilla.json`. Esos rangos son **provisionales**: hay que comprobarlos con vuestros vídeos.

La hilera se divide en `tramos` iguales (8 por defecto, columna `greenhouses.tramos`).

## Entrenar e instalar un modelo

1. Abre `notebooks/entrenar_detector.ipynb` en [Google Colab](https://colab.research.google.com) (*Archivo → Subir cuaderno*).
2. *Entorno de ejecución → Cambiar tipo → GPU (T4)*, y *Ejecutar todo*. Tarda de 1 a 3 horas.
3. Descomprime el `modelo-<cultivo>.zip` descargado dentro de la carpeta `modelos/` de Atias. Debe quedar `modelos/tomate_cherry/modelo.onnx` y `modelo.json`.
4. Nada más. El análisis lo usa sin reiniciar y empieza a contar los vídeos pendientes. Para comprobarlo:

```powershell
docker compose exec analisis .venv/bin/python -c "import urllib.request; print(urllib.request.urlopen('http://127.0.0.1:8000/salud').read().decode())"
```

`detectores` debe incluir el cultivo.

Con un modelo nuevo, para volver a contar lo ya contado:

```powershell
docker compose exec api node dist/recontar.js tomate_cherry
```

## Datos de entrenamiento

| Cultivo | Datos públicos | Licencia | Nota |
|---|---|---|---|
| Tomate | [AgRobTomato](https://zenodo.org/records/5596799): 449 imágenes de invernadero, 6.084 tomates | CC BY 4.0 | Casi todos verdes: 30 maduros y 184 rojizos. Por eso el modo por defecto es «fruto + color». No es cherry. |
| Pimiento | Sin descarga abierta automática | — | Subir un ZIP COCO y anotar su licencia |
| Pepino | Sin descarga abierta automática | — | Subir un ZIP COCO; hace falta el modo `clases` (calibre) |

**Lo que más mejora el modelo son fotogramas etiquetados de vuestros propios vídeos**: unos 150–200, exportados en COCO desde una herramienta de etiquetado (CVAT, Label Studio o Roboflow), y subidos en `DATOS_PROPIOS`. El cuaderno reserva una parte para medir el error y nunca la usa para entrenar.

## Velocidad

Depende de la CPU. El cuaderno mide al final cuánto tardaría un vídeo de 10 minutos. Si es demasiado, usa un modelo `small` o `nano`, o da más núcleos al análisis con `ATIAS_CPUS_ANALISIS` en `.env`.

## Lo que este conteo aún no mide

El número de frutos visibles no es el de frutos totales: las hojas tapan una parte. La diferencia se mide con los conteos a mano de los tramos de control (`docs/GUIA_GRABACION.md`) y se corrige con el factor de visibilidad descrito en `docs/VALIDACION.md`.
