"""Hace una copia del vídeo como la que deja WhatsApp: 480 píxeles de alto y con menos detalle.

Se ejecuta dentro de la imagen del análisis, que ya trae OpenCV (ver ejecutar.mjs):
    python baja_resolucion.py entrada.mp4 salida.mp4

OpenCV no trae el códec H.264 de WhatsApp: el archivo sale con MPEG-4 y puede pesar más que el
original. Sirve para ver qué dice el control de calidad, no para medir la subida.
"""

import sys

import cv2

HEIGHT = 480

source, target = sys.argv[1], sys.argv[2]
capture = cv2.VideoCapture(source)
if not capture.isOpened():
    sys.exit(f"No se puede abrir {source}")
fps = capture.get(cv2.CAP_PROP_FPS) or 30
width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
size = (round(width * HEIGHT / height / 2) * 2, HEIGHT) if height > HEIGHT else (width, height)
writer = cv2.VideoWriter(target, cv2.VideoWriter_fourcc(*"mp4v"), fps, size)
if not writer.isOpened():
    sys.exit(f"No se puede escribir {target}")
frames = 0
while True:
    ok, frame = capture.read()
    if not ok:
        break
    frame = cv2.resize(frame, size, interpolation=cv2.INTER_AREA)
    # WhatsApp comprime mucho y se pierde el detalle fino: se imita con un ligero desenfoque.
    writer.write(cv2.GaussianBlur(frame, (3, 3), 0))
    frames += 1
writer.release()
capture.release()
print(f"{target}: {size[0]}x{size[1]}, {frames} fotogramas")
