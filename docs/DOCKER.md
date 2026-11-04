# Docker

Atias se ejecuta en cuatro contenedores:

| Servicio | Qué hace | Puerto |
|---|---|---|
| `web` | Aplicación Next.js. Reenvía `/api` a la API, así el móvil solo necesita este puerto | `localhost:3000` |
| `api` | Express: subidas reanudables (tus), datos de la semana y vídeos recibidos | `localhost:4000` |
| `db` | PostgreSQL | Solo interno |
| `analisis` | Python con la pila de visión. Por ahora solo informa de su estado | Solo interno |

Los vídeos se guardan en el volumen `videos` y la base de datos en `postgres`. `docker compose down` los conserva; `docker compose down -v` **los borra**.

La subida y «Vídeos recibidos» usan datos reales. Los kilos y temporeros siguen simulados, porque los vídeos aún no se analizan.

Enlaces de prueba: `/subir/demo-invernadero-1`, `-2` y `-3`. Son públicos: desactívalos con `ATIAS_DATOS_DEMO=0` fuera del entorno local.

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

Pruebas de la API, con una PostgreSQL desechable: `docker compose -f compose.test.yaml run --rm --build api-test`.

Para ver el estado: `docker compose ps`, `http://localhost:4000/salud` y `http://localhost:4000/listo`.

## Probar desde el móvil

1. Arranca con `compose.red-local.yaml`.
2. Busca con `ipconfig` la IPv4 de tu adaptador wifi o Ethernet. Ignora las de VirtualBox, WSL o Docker, que el móvil no puede alcanzar.
3. Abre en el móvil `http://<esa-ip>:3000/subir/demo-invernadero-1`, conectado a la misma wifi.
4. Si no carga, revisa si el Firewall de Windows bloquea el puerto 3000.

Mientras esté activo, cualquier equipo de esa red puede entrar, ver lo enviado en «Vídeos recibidos» y usar los enlaces de prueba: la cooperativa aún no tiene contraseña. Usa `docker compose down` al terminar y no lo hagas en una red pública.

## Antes de pasar a la nube

Las imágenes de `compose.yaml` no llevan secretos ni datos, y no se ejecutan como root. Faltan estas piezas, que dependen de elegir proveedor:

- Registro de imágenes y publicación automática.
- HTTPS, dominio y **autenticación de la cooperativa**: hoy cualquiera con acceso puede ver sus datos.
- Almacenamiento de objetos para los vídeos (tus tiene adaptador para S3), base de datos gestionada y copias de seguridad. Cambiar `POSTGRES_PASSWORD` y poner `ATIAS_DATOS_DEMO=0`.
- Con varias copias de la API: bloqueo de subidas compartido, porque el actual es en memoria.
- Generar y revocar enlaces desde la cooperativa, y límites de peticiones y de disco.
- Una GPU o cola de trabajos si el análisis real lo requiere, a medir con el detector entrenado.
