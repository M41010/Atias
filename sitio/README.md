# Web pública de Atias

Escaparate del producto: Inicio, Quiénes somos, Producto y Contacto, más aviso legal y privacidad, en español, inglés, francés, neerlandés, italiano y portugués. Es una web estática: se publica en cualquier alojamiento sin servidor propio.

## Desarrollo

```powershell
cd sitio
npm install
npm run dev        # http://localhost:3100/es/
npm run build      # genera la web estática en out/
```

## Antes de publicar

Se configuran con variables de entorno al compilar (archivo `.env.local` en esta carpeta):

| Variable | Qué es |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Dominio público, sin barra final (p. ej. `https://atias.es`). Sin él, la web pide a los buscadores que no la indexen (`robots.txt` y `noindex`) y el mapa del sitio sale vacío. Con él, se generan URL canónicas, enlaces entre idiomas, `sitemap.xml` e imágenes para redes con direcciones absolutas. |
| `NEXT_PUBLIC_FORMULARIO_URL` | Dirección que recibe las solicitudes de demostración (por ejemplo, un servicio de formularios). Sin ella, el formulario valida pero no envía nada y lo dice. |
| `NEXT_PUBLIC_CORREO` | Correo de contacto, que aparece en Contacto y en los textos legales. |
| `NEXT_PUBLIC_TITULAR`, `NEXT_PUBLIC_NIF`, `NEXT_PUBLIC_DOMICILIO` | Datos del titular para el aviso legal y la privacidad. |
| `NEXT_PUBLIC_PROVEEDOR_FORMULARIO` | Nombre del servicio que recibe el formulario, para la política de privacidad. |

Además:

- **Textos de Quiénes somos:** son provisionales y la página lo indica (`src/i18n/*.ts`, sección `company`).
- **Traducciones:** las hizo Claude. Conviene que una persona nativa revise cada idioma.
- **Textos para buscadores:** títulos, descripciones, guía, preguntas frecuentes y cultivos están en `src/i18n/content/`. La referencia es el español.
- **Textos legales:** son un borrador. Los debe revisar un asesor antes de publicar.
- **Imágenes del piloto:** cuando haya fotogramas sin nada identificable, pueden sustituir o acompañar al contador de ejemplo.
- **Imágenes para redes:** `public/og/*.png`. Si cambian el logo o el titular, se regeneran con `node scripts/og-images.mjs`.
- **Después de publicar:** dar de alta el dominio en Google Search Console y Bing Webmaster Tools y enviar `/sitemap.xml`.

## Diseño

Ver `DESIGN.md`: la cuadrícula de campo con la marca Nave.

## SEO

- Direcciones traducidas por idioma (`src/i18n/config.ts`, `SLUGS` y `CROP_SLUGS`): `/es/producto/`, `/en/product/`, `/fr/produit/`…
- Cada página lleva título y descripción propios, URL canónica, `hreflang` a sus seis versiones más `x-default`, Open Graph y tarjeta de Twitter (`src/seo/metadata.ts`).
- Datos estructurados schema.org (`src/seo/schema.ts`): organización y web en la portada, aplicación en Producto, artículo en la guía y los cultivos, preguntas frecuentes y ruta de navegación.
- `sitemap.xml` y `robots.txt` se generan al compilar (`src/app/sitemap.ts`, `src/app/robots.ts`).
- Las pruebas de `src/i18n/config.test.ts` comprueban que las direcciones no se repiten, que el cambio de idioma conserva la página y que los seis idiomas tienen el mismo contenido.
