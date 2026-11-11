"""Análisis del ensayo: igual que el real, pero cuenta con el detector de referencia por color.

Solo para la pila del ensayo (compose.ensayo.yaml). Así se mide el recorrido completo hasta la
cooperativa sin tener aún el modelo entrenado. Sus números no valen.
"""

from atias import worker
from atias.vision.detector import ColorBaselineDetector

worker.Detectors.get = lambda self, crop: ColorBaselineDetector()
worker.main()
