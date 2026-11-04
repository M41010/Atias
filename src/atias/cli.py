"""Línea de órdenes de Atias. Por ahora: revisar registros de cosecha.

    uv run atias registros cosechas.xlsx --salida informe.md
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from . import records


def cmd_records(args: argparse.Namespace) -> int:
    text = records.to_markdown(records.profile_file(args.archivo, args.hoja))
    if args.salida:
        args.salida.write_text(text, encoding="utf-8")
        print(f"Informe guardado en {args.salida}")
    else:
        print(text)
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="atias", description=__doc__)
    sub = parser.add_subparsers(dest="orden", required=True)
    rec = sub.add_parser("registros", help="Revisa la estructura y calidad de registros de cosecha")
    rec.add_argument("archivo", type=Path)
    rec.add_argument("--hoja", help="Hoja concreta de un Excel. Por defecto, todas")
    rec.add_argument("--salida", type=Path, help="Guarda el informe en este archivo Markdown")
    rec.set_defaults(func=cmd_records)
    return parser


def main(argv: list[str] | None = None) -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    args = build_parser().parse_args(argv)
    try:
        return args.func(args)
    except (FileNotFoundError, ValueError) as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
