// Permite abrir las pantallas de la cooperativa sin conexión. Solo guarda la aplicación:
// nunca intercepta /api (datos, vídeos, subidas) ni /subir, cuya dirección contiene un enlace privado.

const CACHE = "atias-pantallas-v2";
const OFFLINE_PAGE = "/sin-conexion.html";
const SCREENS = ["/", "/invernaderos", "/videos", "/enlaces", "/cosecha", "/temporeros", "/parametros"];
const ASSET = /\/_next\/static\/[^"'\\\s)<>]+/g;

const isScreen = ({ pathname }) =>
  !["/api", "/subir", "/acceder", "/_next"].some((path) => pathname === path || pathname.startsWith(`${path}/`));

async function saveAsset(cache, path) {
  if (await cache.match(path)) return;
  const response = await fetch(path);
  if (response.ok) await cache.put(path, response);
}

/** Guarda cada pantalla junto con los archivos que necesita, que aparecen en su HTML. */
async function saveScreen(cache, path) {
  const response = await fetch(path, { cache: "no-cache" });
  if (!response.ok || response.redirected) return;
  const html = await response.clone().text();
  await cache.put(path, response);
  await Promise.allSettled([...new Set(html.match(ASSET) ?? [])].map((asset) => saveAsset(cache, asset)));
}

async function saveScreens() {
  const cache = await caches.open(CACHE);
  await Promise.allSettled([OFFLINE_PAGE, ...SCREENS].map((path) => saveScreen(cache, path)));
}

async function networkFirst(request, path) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok && !response.redirected) await cache.put(path, response.clone());
    return response;
  } catch {
    return (await cache.match(path)) ?? (await cache.match(OFFLINE_PAGE)) ?? Response.error();
  }
}

// Los nombres incluyen el contenido: un archivo guardado nunca queda desactualizado.
async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const saved = await cache.match(new URL(request.url).pathname);
  if (saved) return saved;
  const response = await fetch(request);
  if (response.ok) await cache.put(new URL(request.url).pathname, response.clone());
  return response;
}

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => name !== CACHE).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "guardar-pantallas") event.waitUntil(saveScreens());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
  } else if (request.mode === "navigate" && isScreen(url)) {
    event.respondWith(networkFirst(request, url.pathname));
  }
});
