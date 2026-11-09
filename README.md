# Atias

Estimación semanal de los kilos de fruta en invernaderos a partir de vídeo, para que una cooperativa decida cuántos kilos vender y cuántos temporeros contratar. Cultivos iniciales: tomate cherry, pimiento y pepino.

> **Estado: prototipo.** La subida de vídeos y los datos de la semana son reales. Los kilos y temporeros que muestra la app siguen **simulados**, porque aún no hay un detector entrenado ni se analizan los vídeos. **No hay ninguna medida de precisión real**, y el objetivo de error ≤ 10 % sigue sin validar.

## Arrancarlo

Requiere Docker Desktop.

```powershell
copy .env.example .env   # solo la primera vez: activa los enlaces de prueba en este equipo
docker compose up -d --build
docker compose exec api node dist/usuarios.js crear tu@correo.com "Tu nombre"
```

El segundo comando muestra una contraseña una sola vez. Después:

- **Cooperativa:** http://localhost:3000
- **Agricultor, enlace de prueba:** http://localhost:3000/subir/demo-invernadero-1

Más opciones, como desarrollo o pruebas desde el móvil, en [docs/DOCKER.md](docs/DOCKER.md).

## Estructura

| Carpeta | Qué contiene |
|---|---|
| `web/` | Aplicación Next.js: cooperativa y subida del agricultor |
| `api/` | API con Express: acceso, enlaces, subidas reanudables y datos |
| `src/atias/` | Python: análisis de vídeo, estimación, validación y revisión de registros |
| `docs/` | Diseño, protocolo de validación, captura automática y Docker |

## Pruebas

```powershell
uv run pytest                                                # Python
cd web; npm test                                             # Web
docker compose -f compose.test.yaml run --rm --build api-test  # API, con PostgreSQL real
```

## Revisar registros de cosecha

Es el primer paso con datos reales. Analiza un CSV o Excel, detecta sus defectos y dice para qué sirve:

```powershell
uv run atias registros cosechas.xlsx --salida informe.md
```

## Documentación

- [PRODUCT.md](PRODUCT.md): para quién es y qué debe permitir decidir.
- [docs/DISENO.md](docs/DISENO.md): requisitos, arquitectura, fases y riesgos.
- [docs/VALIDACION.md](docs/VALIDACION.md): cómo se calcula y se comprueba el error del 10 %.
- [docs/DETECTOR.md](docs/DETECTOR.md): cómo cuenta los frutos y cómo entrenar e instalar el modelo.
- [docs/GUIA_GRABACION.md](docs/GUIA_GRABACION.md): cómo grabar un invernadero y contar a mano para medir la precisión, con hoja de campo.
- [docs/CAPTURA.md](docs/CAPTURA.md): raíles, cámaras fijas y otras alternativas.
- [docs/DOCKER.md](docs/DOCKER.md): cómo arrancarlo y qué falta para la nube.
- [DESIGN.md](DESIGN.md): sistema visual.

## Reglas del sistema

- Lo observado en la captura y la previsión experimental nunca se mezclan.
- Cualquier dato simulado impide dar el objetivo por cumplido.
- La visión y el cálculo de kilos no usan modelos de lenguaje. Claude Code se usa solo para desarrollar.
