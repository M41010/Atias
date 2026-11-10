"""Convierte un documento de docs/ (p. ej. GUIA_GRABACION.md o GUION_DEMO.md) en HTML imprimible (A4)
para pasarlo a PDF con Chrome.

    uv run --with markdown python docs/guia_pdf.py docs/GUIA_GRABACION.md guia.html
    chrome --headless=new --no-pdf-header-footer --print-to-pdf=docs/GUIA_GRABACION.pdf guia.html

Con --compacto, letra y márgenes algo menores y tablas que pueden partirse entre páginas:

    uv run --with markdown python docs/guia_pdf.py docs/GUION_DEMO.md guion.html --compacto
"""
import sys
from pathlib import Path

import markdown

args = [arg for arg in sys.argv[1:] if not arg.startswith("--")]
compact = "--compacto" in sys.argv
source, target = Path(args[0]), Path(args[1])
text = source.read_text(encoding="utf-8")
body = markdown.markdown(text, extensions=["tables"])
# El título de la pestaña y del PDF sale del primer encabezado del documento.
title = next((line[2:].strip() for line in text.splitlines() if line.startswith("# ")), "Atias")
css = """
@page { size: A4; margin: 16mm 15mm; }
body { font-family: "Segoe UI", Arial, sans-serif; font-size: 10.5pt; line-height: 1.45;
  color: #17201c; }
h1 { font-size: 20pt; margin: 0 0 6pt; color: #0f2b20; }
h2 { font-size: 13pt; margin: 16pt 0 4pt; color: #0f2b20; break-after: avoid; }
p, li { margin: 3pt 0; }
ul, ol { padding-left: 18pt; }
hr { break-after: page; border: 0; }
table { border-collapse: collapse; width: 100%; margin: 6pt 0 10pt; break-inside: avoid; }
th, td { border: 1px solid #555; padding: 7pt 5pt; text-align: left; font-size: 9.5pt;
  vertical-align: top; }
th { background: #eef1ec; }
td { height: 16pt; }
code { font-family: Consolas, monospace; }
"""
if compact:
    css += (
        "@page { margin: 12mm 13mm; } body { font-size: 9.8pt; line-height: 1.35; }"
        " h2 { margin-top: 10pt; } table { break-inside: auto; } tr { break-inside: avoid; }"
        " th, td { padding: 3pt 5pt; height: auto; font-size: 9pt; }"
    )
target.write_text(
    '<!doctype html><html lang="es"><head><meta charset="utf-8">'
    f"<title>{title}</title>"
    f"<style>{css}</style></head><body>{body}</body></html>",
    encoding="utf-8",
)
