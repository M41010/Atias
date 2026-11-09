# Vídeo de presentación

Vídeo de unos 60 segundos (1920×1080, 30 fps) en los seis idiomas de la web, programado con
[Remotion](https://www.remotion.dev) (React) y three.js.

1. **Invernadero (0–34 s):** recreación 3D de un multitúnel. La cámara entra y recorre una hilera de
   tomate cherry, pepino y pimiento. Cada fruto maduro se marca con un recuadro y suma en el contador.
   Después la vista se encoge dentro de un móvil (hoy) y pasa a la cámara sobre raíl (próximamente).
2. **Hacia la app (34–40 s):** los datos viajan a la pantalla de la cooperativa.
3. **La app (40–54 s):** capturas reales de la aplicación en modo demostración, con datos de ejemplo.
4. **Logo (54–60 s).**

## Uso

```powershell
npm install
npm run estudio          # vista previa interactiva en el navegador
node render.mjs es       # genera out/atias-es.mp4 (sin argumentos, los seis idiomas)
```

`render.mjs` usa el Chrome instalado (variable `CHROME` para otra ruta), porque la descarga del
navegador de Remotion puede quedarse colgada.

## Dónde está cada cosa

| Archivo | Qué contiene |
|---|---|
| `src/texts.ts` | Rótulos en los seis idiomas (pendientes de revisión nativa, como la web) |
| `src/scene.ts` | Calendario, recorrido de la cámara y posición de plantas y frutos (con semilla fija) |
| `src/Greenhouse.tsx` | Escena 3D: estructura, plantas, frutos y raíl |
| `src/Overlays.tsx` | Recuadros de detección, contador, marco del móvil y etiquetas del raíl |
| `src/Parts.tsx` | Rótulos, transición, capturas de la app y logo |
| `public/app/` | Capturas de la app en modo demostración. Si la app cambia, se vuelven a capturar |
| `public/fonts/` | Archivo variable, la tipografía de la web (licencia OFL) |

## Licencia de Remotion

Remotion es gratuito para personas y empresas de hasta tres trabajadores. Si Atias crece por encima,
hace falta su licencia de empresa: <https://www.remotion.dev/license>.
