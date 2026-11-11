# Docker

Atias se ejecuta en cuatro contenedores:

| Servicio | Qué hace | Puerto |
|---|---|---|
| `web` | Aplicación Next.js. Reenvía `/api` a la API, así el móvil solo necesita este puerto | `localhost:3000` |
| `api` | Express: subidas reanudables (tus), datos de la semana y vídeos recibidos | `localhost:4000` |
| `db` | PostgreSQL | Solo interno |
| `analisis` | Python con la pila de visión. Por ahora revisa la calidad de los vídeos recibidos; no cuenta frutos | Solo interno |

Los vídeos se guardan en el volumen `videos` y la base de datos en `postgres`. `docker compose down` los conserva; `docker compose down -v` **los borra**.

La subida, los enlaces, la cosecha real y «Vídeos recibidos» usan datos reales. Los kilos y temporeros siguen simulados, porque aún no hay detector que cuente frutos.

Enlaces de prueba: `/subir/demo-invernadero-1`, `-2` y `-3`. Son públicos, así que están apagados por defecto. En este equipo se activan con `ATIAS_DATOS_DEMO=1` en el archivo `.env` (copia `.env.example`). Al arrancar sin ellos, la API los retira de la base de datos.

## Cuentas de la cooperativa

La web de la cooperativa exige iniciar sesión. Las cuentas se gestionan con un comando, y la contraseña generada solo se muestra una vez:

```powershell
# Crear una cuenta, o cambiar su contraseña
docker compose exec api node dist/usuarios.js crear correo@ejemplo.com "Nombre"

# Retirar el acceso
docker compose exec api node dist/usuarios.js retirar correo@ejemplo.com
```

En modo desarrollo, usa `npx tsx src/usuarios.ts` en lugar de `node dist/usuarios.js`.

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

## Ensayo del agricultor

Repite de forma automática el envío de vídeos y mide cuánto tarda cada paso. Son dos pruebas:

- **Agricultor con el móvil** (Android simulado, 8 Mbit/s de subida), en `/subir/demo-invernadero-1`: a la hilera 1 lado A le corta la conexión a mitad; en el lado B cierra la página a mitad y vuelve a elegir el archivo; en la hilera 2 lado A la red falla sin que el móvil lo note. En los tres casos comprueba que la subida sigue por donde iba.
- **El dueño desde su ordenador** (Chrome de escritorio, 20 Mbit/s), en `/subir/demo-invernadero-2`: elige con «Elegir» cuatro vídeos seguidos sin recargar, dos de ellos en baja resolución como los que llegan por WhatsApp, y comprueba que se suben uno tras otro y que la revisión avisa de la baja resolución.

Al final entra como cooperativa y espera a que todos los vídeos estén revisados y contados.

Usa una pila aparte (proyecto `atias-ensayo`, puertos 3100 y 4100, con sus propias imágenes y volúmenes): la pila real y sus datos no se tocan. Al terminar la borra con `down -v`.

```powershell
cd scripts/ensayo-agricultor
npm install
npm run navegador        # solo la primera vez: descarga Chromium para Playwright
npm run ensayo           # unos 10 minutos
```

- Con un vídeo de verdad, grabado con el móvil en el invernadero: `$env:ENSAYO_VIDEO="D:\ruta\hilera.mp4"; npm run ensayo`. Es lo que conviene hacer antes del 14 de noviembre.
- Otra velocidad de subida: `$env:ENSAYO_SUBIDA_MBPS="3"` para el móvil y `$env:ENSAYO_SUBIDA_ESCRITORIO_MBPS="10"` para el ordenador.
- Para mirar la pila al terminar: `npm run ensayo -- --mantener` y abre `http://localhost:3100`.

Los tiempos quedan en `scripts/ensayo-agricultor/resultados/tiempos.json` y la pantalla de Resumen en `resultados/resumen.png`. Sin vídeo propio usa el de presentación de la web, que no es un invernadero. Como aún no hay detector entrenado, el ensayo cuenta con el detector de referencia por color: el recorrido y los tiempos sirven, los frutos contados no.

## Probar desde el móvil

1. Arranca con `compose.red-local.yaml`.
2. Busca con `ipconfig` la IPv4 de tu adaptador wifi o Ethernet. Ignora las de VirtualBox, WSL o Docker, que el móvil no puede alcanzar.
3. Abre en el móvil `http://<esa-ip>:3000/subir/demo-invernadero-1`, conectado a la misma wifi.
4. Si no carga, revisa si el Firewall de Windows bloquea el puerto 3000.

Mientras esté activo, cualquier equipo de esa red puede llegar a la web y usar los enlaces de prueba. La cooperativa está protegida con contraseña, pero sin HTTPS viaja sin cifrar. Usa `docker compose down` al terminar y no lo hagas en una red pública.

## Seguridad

Lo que ya está protegido, con pruebas automáticas en `api/src/app.test.ts`:

- **Vídeos:** solo se aceptan MP4, MOV, WebM, 3GP y MKV, y se sirven con su tipo exacto y con una política que impide ejecutar código. Así un archivo disfrazado de vídeo no puede actuar con la sesión de la cooperativa.
- **Espacio:** como máximo 8 GB por vídeo (unos 10 minutos en 4K) y 4 versiones guardadas por lado de hilera, de media, en cada invernadero y recolección. Además, no se acepta un vídeo que deje el disco con menos de `ATIAS_ESPACIO_LIBRE_GB` libres (10 por defecto).
- **Acceso:** sin proxy de confianza, 5 fallos bloquean la cuenta 15 minutos. Con `ATIAS_PROXY_DE_CONFIANZA=1` el bloqueo va por equipo: 5 fallos por cuenta y equipo, 20 por equipo y 50 por cuenta desde todos.
- **Otras webs:** las peticiones que cambian algo se rechazan si llegan desde otra página, además de la protección de la cookie.
- **Cabeceras:** la web no se puede mostrar dentro de otra, no carga nada de fuera y no envía la dirección `/subir/…`, que contiene el enlace privado, a otras webs.
- **Contenedores:** sin privilegios ni capacidades especiales. El análisis, que abre vídeos que no son de confianza, tiene además límite de memoria (3 GB), de CPU (2) y de procesos, y no puede escribir fuera de `/tmp`.

Lo que no cubre: todas las cuentas de la cooperativa pueden hacer lo mismo, y no queda registro de quién cambió cada cosa salvo en la cosecha real y los enlaces.

## Antes de pasar a la nube

Las imágenes de `compose.yaml` no llevan secretos ni datos, y no se ejecutan como root. Faltan estas piezas, que dependen de elegir proveedor:

- Registro de imágenes y publicación automática.
- HTTPS y dominio, con `ATIAS_COOKIE_SEGURA=1`. Añadir en `web/next.config.ts` `Strict-Transport-Security` y `upgrade-insecure-requests`.
- Un proxy delante de la web que **sustituya** `X-Forwarded-For` por la dirección real del cliente, y entonces `ATIAS_PROXY_DE_CONFIANZA=1`. Si el proxy no la sustituye, un atacante podría inventarse la dirección.
- Almacenamiento de objetos para los vídeos (tus tiene adaptador para S3), base de datos gestionada y copias de seguridad. Cambiar `POSTGRES_PASSWORD` por una contraseña larga y aleatoria, y no poner `ATIAS_DATOS_DEMO`.
- No publicar el puerto 4000 de la API: solo la web debe llegar a ella.
- Con varias copias de la API: bloqueo de subidas y de intentos de acceso compartido, porque los actuales son en memoria.
- Repetir la auditoría de seguridad contra el entorno en la nube.
- Una GPU o cola de trabajos si el análisis real lo requiere, a medir con el detector entrenado.
