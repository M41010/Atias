# Vídeo de presentación

Vídeo de unos 60 segundos (1920×1080, 30 fps) en los seis idiomas de la web, programado con
[Remotion](https://www.remotion.dev) (React) y three.js.

1. **Invernadero (0–34 s):** recreación 3D de un multitúnel. La cámara entra y recorre una hilera de
   tomate cherry, pepino y pimiento. Cada fruto maduro se marca con un recuadro y suma en el contador.
   Después la vista se encoge dentro de un móvil (hoy) y pasa a la cámara sobre raíl (próximamente).
2. **Hacia la app (34–40 s):** los datos viajan a la pantalla de la cooperativa.
3. **La app (40–54 s):** capturas reales de la aplicación en modo demostración, con datos de ejemplo.
4. **Logo (54–60 s).**

## Estado

De momento solo se ha generado la versión en español (horizontal y vertical). Los otros cinco idiomas se generarán más
adelante, cuando el proyecto esté más avanzado (los rótulos ya están en `src/texts.ts`).

## Uso

```powershell
npm install
npm run estudio          # vista previa interactiva en el navegador
node render.mjs es       # genera out/atias-es.mp4 (sin argumentos, los seis idiomas)
node render.mjs --vertical es   # versión vertical 9:16 para móvil: out/atias-es-vertical.mp4
```

La versión vertical (composiciones `AtiasVertical-<idioma>`, 1080×1920) usa las mismas escenas:
cada parte lee el tamaño de la composición y adapta la cámara (más abierta), los rótulos (más
grandes y más arriba), el móvil (de pie) y las capturas de la app (más cerca). La web en español la
enseña en móvil.

`render.mjs` usa el Chrome instalado (variable `CHROME` para otra ruta), porque la descarga del
navegador de Remotion puede quedarse colgada.

## Vídeo para los dueños de la cooperativa

Vídeo aparte, para enviar por WhatsApp o correo: 86 s, solo en español, sin voz (rótulos grandes), sin
nombrar a la cooperativa. Solo enseña lo que ya está hecho. Composiciones `AtiasDuenos` (1920×1080) y
`AtiasDuenosVertical` (1080×1920), en `src/Duenos.tsx`.

| Tiempo | Escena |
|---|---|
| 0–8 s | La pregunta de cada semana: kilos para vender y temporeros |
| 8–20 s | El invernadero 3D: el agricultor graba con el móvil y Atias cuenta la fruta madura |
| 20–30 s | Las dos cifras de la semana, cada una con su margen |
| 30–80 s | La app: Resumen, Previsión diaria, ficha de un invernadero (kilos por día, mapa, tiempo y maduración), Producción y Precisión |
| 80–86 s | Logo |

Las capturas de `public/app-duenos/` son de la app en modo demostración (datos simulados); cada escena con
cifras lleva la etiqueta «Datos de prueba». Se capturan a 1920×1080 con escala 2.

```powershell
node render.mjs --duenos   # out/atias-duenos.mp4 y out/atias-duenos-vertical.mp4
```

**Música:** «Uplifting and Inspiring Acoustic Corporate», de Wavecont (Pixabay, licencia de contenido de
Pixabay, sin atribución obligatoria). Pixabay no deja descargarla de forma automática: hay que guardarla a
mano como `public/musica/cancion.mp3`. Si el archivo está, `render.mjs` la añade (volumen 0,6, entrada de
1 s y salida de unos 2,5 s, cortada a la duración del vídeo); si no, el vídeo sale en silencio y lo avisa.
Desde un worktree, la busca también en la copia principal del repositorio y la copia.

## Dónde está cada cosa

| Archivo | Qué contiene |
|---|---|
| `src/texts.ts` | Rótulos en los seis idiomas (pendientes de revisión nativa, como la web) |
| `src/scene.ts` | Calendario, recorrido de la cámara y posición de plantas y frutos (con semilla fija) |
| `src/Greenhouse.tsx` | Escena 3D: estructura, plantas, frutos y raíl |
| `src/Overlays.tsx` | Recuadros de detección, contador, marco del móvil y etiquetas del raíl |
| `src/Parts.tsx` | Rótulos, transición, capturas de la app y logo |
| `public/app/` | Capturas de la app en modo demostración. Si la app cambia, se vuelven a capturar |
| `src/Duenos.tsx` | Vídeo para los dueños: escenas, encuadres de cada captura y rótulos |
| `public/app-duenos/` | Capturas del vídeo para los dueños, también en modo demostración |
| `props-musica.json` | Propiedades que usa `render.mjs --duenos` cuando hay música |
| `public/fonts/` | Archivo variable, la tipografía de la web (licencia OFL) |

## Licencia de Remotion

Remotion es gratuito para personas y empresas de hasta tres trabajadores. Si Atias crece por encima,
hace falta su licencia de empresa: <https://www.remotion.dev/license>.
