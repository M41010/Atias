# Docker

Atias se ejecuta en tres contenedores:

| Servicio | Qué hace | Puerto |
|---|---|---|
| `web` | Aplicación Next.js. Aún usa datos simulados | `localhost:3000` |
| `api` | API con Express. Por ahora solo informa de su estado | `localhost:4000` |
| `analisis` | Python con la pila de visión. Por ahora solo informa de su estado | Solo interno |

Los servicios aún no trabajan juntos: la web no llama a la API, y la API solo comprueba que el análisis responde.

## Arrancar

Requiere Docker Desktop en marcha.

```powershell
# Igual que en producción
docker compose up --build

# Desarrollo: los cambios se aplican al guardar
docker compose -f compose.yaml -f compose.dev.yaml up --build --watch

# Probar desde el móvil, en tu misma red
docker compose -f compose.yaml -f compose.red-local.yaml up --build

# Parar
docker compose down
```

Para ver el estado: `docker compose ps`, `http://localhost:4000/salud` y `http://localhost:4000/listo`.

## Probar desde el móvil

1. Arranca con `compose.red-local.yaml`.
2. Busca la IPv4 de este equipo con `ipconfig`.
3. Abre en el móvil `http://<esa-ip>:3000/subir/demo-invernadero-1`, conectado a la misma wifi.
4. Si no carga, revisa si el Firewall de Windows bloquea el puerto 3000.

Mientras esté activo, cualquier equipo de esa red puede entrar y la app no tiene contraseña. Usa `docker compose down` al terminar y no lo hagas en una red pública.

## Antes de pasar a la nube

Las imágenes de `compose.yaml` no llevan secretos ni datos, y no se ejecutan como root. Faltan estas piezas, que dependen de elegir proveedor:

- Registro de imágenes y publicación automática.
- HTTPS, dominio y autenticación.
- Almacenamiento para vídeos y base de datos fuera de los contenedores. Hoy no se guarda ningún dato en ellos.
- Una GPU o cola de trabajos si el análisis real lo requiere, a medir con el detector entrenado.
- Validar los enlaces del agricultor en el servidor.
