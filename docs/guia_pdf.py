"""Convierte docs/GUIA_GRABACION.md en HTML imprimible (A4) para pasarlo a PDF con Chrome.

    uv run --with markdown python docs/guia_pdf.py docs/GUIA_GRABACION.md guia.html
    chrome --headless=new --no-pdf-header-footer --print-to-pdf=docs/GUIA_GRABACION.pdf guia.html
"""
import sys
from pathlib import Path

import markdown

source, target = Path(sys.argv[1]), Path(sys.argv[2])
body = markdown.markdown(source.read_text(encoding="utf-8"), extensions=["tables"])
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
target.write_text(
    '<!doctype html><html lang="es"><head><meta charset="utf-8">'
    "<title>Guía de grabación</title>"
    f"<style>{css}</style></head><body>{body}</body></html>",
    encoding="utf-8",
)
