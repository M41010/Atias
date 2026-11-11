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

## Publicar con HTTPS

Para que los agricultores suban los vídeos desde el invernadero, con datos móviles, la web tiene que estar en internet con HTTPS. Hay dos caminos, y **aún no está decidido cuál**:

- **(a) Túnel desde este equipo** (preparado en `compose.tunel.yaml`): Atias sigue en este PC y un contenedor `cloudflared` abre una conexión de salida hacia Cloudflare. No se abren puertos en el router ni hace falta IP fija.
- **(b) Servidor en la nube**: Atias se mueve a un servidor alquilado. Comparación al final de esta sección.

### Qué cambia al publicar

`compose.tunel.yaml` fija para la API, digan lo que digan `.env`:

- `ATIAS_DATOS_DEMO=0`: los enlaces de prueba públicos se retiran.
- `ATIAS_COOKIE_SEGURA=1`: la cookie de sesión de la cooperativa solo viaja cifrada. En este equipo, `http://localhost:3000` sigue funcionando en Chrome, Edge y Firefox.
- `ATIAS_PROXY_DE_CONFIANZA=cloudflare`: la dirección de cada visitante sale de `CF-Connecting-IP`, que escribe Cloudflare; lo que diga `X-Forwarded-For` se ignora. Así los bloqueos de acceso van por equipo.

El túnel solo llega a la web, que reenvía `/api`. La API, la base de datos y el análisis siguen sin salida a internet. La comprobación de origen de la API compara con el dominio público que pidió el navegador, así que funciona tras el túnel sin más cambios.

Subidas: cada trozo de vídeo viaja en una petición de 8 MB (`CHUNK_BYTES` en `web/src/lib/upload.ts`). Cloudflare corta las peticiones de más de 100 MB en el plan gratuito, así que un vídeo de 8 GB pasa en unas 1.000 peticiones y, si se corta la conexión, se reanuda donde iba.

### Túnel con nombre (el bueno)

Da una dirección fija (por ejemplo `https://app.<tu-dominio>`), que no cambia aunque se reinicie el equipo. Es la que hay que usar en los enlaces que se envían a los agricultores.

Lo tiene que hacer el dueño, con su cuenta:

1. Crea una cuenta gratuita en Cloudflare y añade un dominio propio (hay que comprarlo si no se tiene; puede ser el de la web pública, usando un subdominio como `app.`). Cloudflare tiene que gestionar el DNS del dominio.
2. En el panel de Cloudflare: **Zero Trust → Networks → Tunnels → Create a tunnel → Cloudflared**. Ponle un nombre (por ejemplo `atias`).
3. En la pantalla de instalación, copia el token (el texto largo tras `--token` en cualquiera de los comandos que muestra). No instales nada en Windows: el contenedor ya lo hace.
4. En **Public Hostname**: subdominio `app`, tu dominio, tipo `HTTP`, URL `web:3000`. No cambies «HTTP Host Header»: la API necesita el dominio real para aceptar las peticiones.
5. Pega el token en `.env`: `CLOUDFLARE_TUNNEL_TOKEN=...`. Es una contraseña: no lo envíes ni lo subas al repositorio.
6. Recomendado: en **SSL/TLS → Edge Certificates**, activa «Always Use HTTPS». No actives «Bot Fight Mode» ni «Under Attack» para este dominio: pueden frenar las subidas desde el móvil.

Arrancar (sustituye a `docker compose up`):

```powershell
docker compose -f compose.yaml -f compose.tunel.yaml up -d --build
```

Comprobar:

1. `docker compose -f compose.yaml -f compose.tunel.yaml logs cloudflared` muestra `Registered tunnel connection` (normalmente cuatro veces).
2. Desde el móvil, **con la wifi apagada**, abre `https://app.<tu-dominio>/acceder` y entra con una cuenta de la cooperativa.
3. Crea un enlace de un invernadero, ábrelo en el móvil con datos y sube un vídeo corto. Debe aparecer en «Vídeos recibidos».
4. `https://app.<tu-dominio>/subir/demo-invernadero-1` debe decir que el enlace no es válido.

Parar la publicación (Atias sigue en local):

```powershell
docker compose -f compose.yaml -f compose.tunel.yaml down
docker compose up -d
```

Usa los mismos `-f` que al arrancar: con solo `docker compose down`, `cloudflared` seguiría en marcha. En una emergencia, borrar el túnel en el panel de Cloudflare lo corta al momento, esté el PC como esté.

### Túnel rápido (solo para probar)

Sin cuenta ni dominio. La dirección es aleatoria (`https://<palabras>.trycloudflare.com`) y **cambia cada vez que el túnel se reinicia**: los enlaces enviados a los agricultores dejarían de funcionar. Úsalo solo para probar el móvil con datos un momento.

```powershell
docker compose -f compose.yaml -f compose.tunel-rapido.yaml up -d --build
docker compose -f compose.yaml -f compose.tunel-rapido.yaml logs cloudflared   # busca trycloudflare.com
docker compose -f compose.yaml -f compose.tunel-rapido.yaml down
```

### El PC tiene que estar encendido y despierto

Con el túnel, Atias está en este PC: si se apaga, se suspende o pierde internet, los agricultores no pueden subir (las subidas se reanudan al volver, pero solo si el móvil sigue con la página abierta o la vuelve a abrir). Durante la grabación y la subida:

- **Configuración → Sistema → Energía**: «Suspender» en **Nunca** con corriente. Desde PowerShell: `powercfg /change standby-timeout-ac 0` y `powercfg /change hibernate-timeout-ac 0`. Apagar la pantalla no importa.
- Pausa las actualizaciones de Windows esos días para que no reinicie solo.
- Docker Desktop: activa «Start Docker Desktop when you sign in». Los contenedores vuelven solos (`restart: unless-stopped`), pero Windows debe tener la sesión iniciada.
- Que quede espacio en disco: cada vídeo puede ocupar 4–8 GB y la subida se rechaza si el disco baja de `ATIAS_ESPACIO_LIBRE_GB`.
- La conexión de casa recibe todos los vídeos: con fibra no suele ser problema; con ADSL o 4G en casa, sí.

### Seguridad al publicar

- Cualquiera en internet llega a la web. Los enlaces `/subir/…` son la llave de cada invernadero: envíalos solo por un canal privado y retíralos al acabar. La cooperativa exige contraseña; crea cuentas solo para quien las necesite.
- Cloudflare descifra el tráfico en sus servidores antes de reenviarlo por el túnel: ve los vídeos y los enlaces al pasar. Es lo normal en este tipo de servicio, pero conviene saberlo.
- Cambia `POSTGRES_PASSWORD` por una larga y aleatoria antes de publicar. Ojo: en una base de datos ya creada, cambiar `.env` no basta; hay que cambiarla también dentro de PostgreSQL (`ALTER USER atias PASSWORD '...'`).
- No combines el túnel con `compose.red-local.yaml`: desde la red local se podría falsear `CF-Connecting-IP`.
- Opcional, más adelante: Cloudflare Access (gratis hasta 50 personas) puede pedir un código por correo antes de entrar a la parte de la cooperativa, dejando libres las páginas y llamadas de los agricultores. Hay que probarlo bien antes de una grabación.

### Comparación con un servidor en la nube

| | (a) Túnel desde este PC | (b) Servidor en la nube |
|---|---|---|
| Coste mensual | 0 € (Cloudflare gratis) + dominio, unos 10–20 €/año | Servidor de 4 núcleos y 8 GB de memoria en un proveedor económico (Hetzner, OVH, Contabo…): del orden de 10–30 €/mes, más disco para vídeos (100–500 GB, del orden de 5–25 €/mes). En AWS, Google Cloud o Azure, bastante más. **Precios orientativos: hay que comprobarlos.** |
| Preparación | Lo de esta sección: menos de una hora | Contratar el servidor, instalar Docker, copiar la base de datos y los vídeos, HTTPS (el mismo túnel o Caddy), copias de seguridad. Uno o dos días |
| Disponibilidad | Depende de que el PC esté encendido, despierto y con internet | 24 h, sin depender de casa |
| Análisis (contar frutos) | Usa la CPU de este PC | Hay que pagar la CPU; con GPU, mucho más caro |
| Datos | Se quedan en este PC | En el proveedor; elegir centro de datos en la UE |
| Copias de seguridad | A mano | Instantáneas del proveedor, normalmente de pago aparte |

Recomendación para la grabación del 14 de noviembre: (a), por rapidez y coste, con el PC preparado como se indica arriba. (b) cuando haya varias cooperativas o haga falta estar siempre disponible. Las dos son compatibles: el túnel con nombre se puede mover al servidor sin cambiar la dirección que tienen los agricultores.

## Seguridad

Lo que ya está protegido, con pruebas automáticas en `api/src/app.test.ts`:

- **Vídeos:** solo se aceptan MP4, MOV, WebM, 3GP y MKV, y se sirven con su tipo exacto y con una política que impide ejecutar código. Así un archivo disfrazado de vídeo no puede actuar con la sesión de la cooperativa.
- **Espacio:** como máximo 8 GB por vídeo (unos 10 minutos en 4K) y 4 versiones guardadas por lado de hilera, de media, en cada invernadero y recolección. Además, no se acepta un vídeo que deje el disco con menos de `ATIAS_ESPACIO_LIBRE_GB` libres (10 por defecto).
- **Subir desde la cooperativa** (pantalla Subir vídeos): sin enlace del agricultor, la subida exige la sesión de la cooperativa y no caduca el lunes. Vale para cualquier invernadero y para una recolección ya registrada, la de la semana en curso o las cuatro próximas. Tiene los mismos límites de tipo, tamaño, versiones y espacio, y sustituye igual que el agricultor: el vídeo anterior sigue vigente hasta que llega el nuevo completo. Si la petición trae un enlace, manda el enlace y no se mira la sesión.
- **Acceso:** sin proxy de confianza, 5 fallos bloquean la cuenta 15 minutos. Con `ATIAS_PROXY_DE_CONFIANZA=1` (o `cloudflare` tras el túnel) el bloqueo va por equipo: 5 fallos por cuenta y equipo, 20 por equipo y 50 por cuenta desde todos.
- **Otras webs:** las peticiones que cambian algo se rechazan si llegan desde otra página, además de la protección de la cookie.
- **Cabeceras:** la web no se puede mostrar dentro de otra, no carga nada de fuera y no envía la dirección `/subir/…`, que contiene el enlace privado, a otras webs.
- **Contenedores:** sin privilegios ni capacidades especiales. El análisis, que abre vídeos que no son de confianza, tiene además límite de memoria (3 GB), de CPU (2) y de procesos, y no puede escribir fuera de `/tmp`.

Lo que no cubre: todas las cuentas de la cooperativa pueden hacer lo mismo, y no queda registro de quién cambió cada cosa salvo en la cosecha real y los enlaces. Tampoco de si un vídeo lo subió el agricultor o la cooperativa.

## Antes de pasar a la nube

Las imágenes de `compose.yaml` no llevan secretos ni datos, y no se ejecutan como root. Faltan estas piezas, que dependen de elegir proveedor:

- Registro de imágenes y publicación automática.
- HTTPS y dominio, con `ATIAS_COOKIE_SEGURA=1` (el túnel de «Publicar con HTTPS» sirve también en la nube). Añadir en `web/next.config.ts` `Strict-Transport-Security` y `upgrade-insecure-requests`.
- Un proxy delante de la web que **sustituya** `X-Forwarded-For` por la dirección real del cliente, y entonces `ATIAS_PROXY_DE_CONFIANZA=1`. Si el proxy no la sustituye, un atacante podría inventarse la dirección.
- Almacenamiento de objetos para los vídeos (tus tiene adaptador para S3), base de datos gestionada y copias de seguridad. Cambiar `POSTGRES_PASSWORD` por una contraseña larga y aleatoria, y no poner `ATIAS_DATOS_DEMO`.
- No publicar el puerto 4000 de la API: solo la web debe llegar a ella.
- Con varias copias de la API: bloqueo de subidas y de intentos de acceso compartido, porque los actuales son en memoria.
- Repetir la auditoría de seguridad contra el entorno en la nube.
- Una GPU o cola de trabajos si el análisis real lo requiere, a medir con el detector entrenado.
