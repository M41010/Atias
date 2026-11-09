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
| `NEXT_PUBLIC_FORMULARIO_URL` | Dirección que recibe las solicitudes de demostración (por ejemplo, un servicio de formularios). Sin ella, el formulario valida pero no envía nada y lo dice. |
| `NEXT_PUBLIC_CORREO` | Correo de contacto, que aparece en Contacto y en los textos legales. |
| `NEXT_PUBLIC_TITULAR`, `NEXT_PUBLIC_NIF`, `NEXT_PUBLIC_DOMICILIO` | Datos del titular para el aviso legal y la privacidad. |
| `NEXT_PUBLIC_PROVEEDOR_FORMULARIO` | Nombre del servicio que recibe el formulario, para la política de privacidad. |

Además:

- **Textos de Quiénes somos:** son provisionales y la página lo indica (`src/i18n/*.ts`, sección `company`).
- **Traducciones:** las hizo Claude. Conviene que una persona nativa revise cada idioma.
- **Textos legales:** son un borrador. Los debe revisar un asesor antes de publicar.
- **Imágenes del piloto:** cuando haya fotogramas sin nada identificable, pueden sustituir o acompañar al contador de ejemplo.
- **Dominio:** al elegirlo, añadir `metadataBase` en `src/app/[lang]/layout.tsx` para que los enlaces entre idiomas sean absolutos.

## Diseño

Ver `DESIGN.md`: la placa cromática de conteo.
