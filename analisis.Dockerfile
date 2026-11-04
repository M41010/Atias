FROM python:3.12.13-slim
ENV PYTHONUNBUFFERED=1
ENV UV_LINK_MODE=copy
WORKDIR /app
RUN pip install --no-cache-dir uv==0.13.6

# Primero las dependencias: así un cambio en el código no las vuelve a instalar.
COPY pyproject.toml uv.lock .python-version README.md LICENSE ./
RUN uv sync --frozen --no-dev --no-install-project
COPY src ./src
RUN uv sync --frozen --no-dev

RUN useradd --create-home --uid 1000 atias && chown -R atias /app
USER atias
EXPOSE 8000
CMD [".venv/bin/python", "-m", "atias.worker"]
