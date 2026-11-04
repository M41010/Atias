"""Revisión de estructura y calidad de los registros de cosecha.

No asume ningún formato: detecta por nombre de columna qué papel puede tener cada una y
dictamina para qué sirve el archivo. Las muestras de valores se omiten en columnas que
parecen contener personas, para no copiar datos personales en los informes.
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import asdict, dataclass, field
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd

ROLE_PATTERNS: dict[str, str] = {
    "fecha": r"fecha|date|dia\b|semana|week",
    "invernadero": r"invernadero|inv\b|greenhouse|nave|finca|parcela|sector",
    "hilera": r"hilera|linea|fila|row|calle",
    "planta": r"planta|plant",
    "cultivo": r"cultivo|crop|producto|especie",
    "variedad": r"variedad|variety|cultivar",
    "clase": r"calibre|color|categoria|clase|calidad|grade",
    "kg": r"\bkg\b|kilos?|peso|neto|weight",
    "n_frutos": r"frutos|unidades|piezas|count",
    "persona": r"operari|trabajador|nombre|empleado|recolector|dni|telefono",
}


def _normalize(text: str) -> str:
    text = unicodedata.normalize("NFKD", str(text)).encode("ascii", "ignore").decode()
    return re.sub(r"[\s_\-]+", " ", text).strip().lower()


def guess_role(column: str) -> str | None:
    name = _normalize(column)
    # El orden importa: "peso fruto" y "kg frutos" no son número de frutos.
    if re.search(r"peso.*(fruto|unidad)|g/fruto", name):
        return "peso_por_fruto"
    for role in ("persona", "kg", "n_frutos", "fecha", "invernadero", "hilera", "planta",
                 "variedad", "cultivo", "clase"):
        if re.search(ROLE_PATTERNS[role], name):
            return role
    return None


def to_number(series: pd.Series) -> pd.Series:
    """Convierte a número aceptando coma decimal y punto de millar."""
    if pd.api.types.is_numeric_dtype(series):
        return pd.to_numeric(series, errors="coerce")

    def parse(value: object) -> float:
        if value is None or (isinstance(value, float) and np.isnan(value)):
            return np.nan
        text = str(value).strip().replace(" ", "")
        if "," in text and "." in text:
            text = text.replace(".", "").replace(",", ".")
        elif "," in text:
            text = text.replace(",", ".")
        try:
            return float(text)
        except ValueError:
            return np.nan

    return series.map(parse).astype(float)


DATE_FORMATS = ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%d/%m/%y", "%Y/%m/%d", "%d.%m.%Y")


def parse_dates(series: pd.Series) -> tuple[pd.Series, list[str]]:
    """Interpreta fechas con formatos explícitos (día primero) y devuelve los formatos vistos."""
    if pd.api.types.is_datetime64_any_dtype(series):
        return pd.to_datetime(series), ["fecha nativa"]
    seen: set[str] = set()

    def parse(value: object) -> pd.Timestamp:
        if isinstance(value, datetime | pd.Timestamp):
            seen.add("fecha nativa")
            return pd.Timestamp(value)
        text = str(value).strip()
        for fmt in DATE_FORMATS:
            try:
                parsed = datetime.strptime(text, fmt)
            except ValueError:
                continue
            seen.add(fmt)
            return pd.Timestamp(parsed)
        return pd.NaT

    return series.map(parse), sorted(seen)


@dataclass
class ColumnProfile:
    name: str
    role: str | None
    dtype: str
    missing_pct: float
    n_unique: int
    examples: list[str] = field(default_factory=list)


@dataclass
class Finding:
    severity: str
    message: str


@dataclass
class Usability:
    use: str
    status: str  # "si" | "parcial" | "no"
    reason: str


@dataclass
class RecordsProfile:
    source: str
    sheet: str | None
    n_rows: int
    columns: list[ColumnProfile]
    findings: list[Finding]
    usability: list[Usability]
    stats: dict

    def to_dict(self) -> dict:
        return asdict(self)


def read_table(path: Path, sheet: str | None = None) -> dict[str, pd.DataFrame]:
    if path.suffix.lower() in {".xlsx", ".xlsm"}:
        sheets = pd.read_excel(path, sheet_name=sheet if sheet else None, dtype=object)
        return {sheet: sheets} if sheet else sheets
    if path.suffix.lower() != ".csv":
        raise ValueError(f"Formato no admitido: {path.suffix}. Usa CSV o XLSX.")
    for encoding in ("utf-8-sig", "latin-1"):
        try:
            return {"": pd.read_csv(path, sep=None, engine="python", encoding=encoding,
                                    dtype=str, keep_default_na=True)}
        except UnicodeDecodeError:
            continue
    raise ValueError(f"No se pudo decodificar {path}")


def _profile_sheet(df: pd.DataFrame, source: str, sheet: str | None,
                   today: pd.Timestamp) -> RecordsProfile:
    df = df.dropna(how="all")
    roles: dict[str, str] = {}
    columns = []
    for col in df.columns:
        role = guess_role(col)
        if role and role not in roles:
            roles[role] = col
        series = df[col]
        hide = role == "persona"
        examples = [] if hide else [str(v) for v in series.dropna().unique()[:3]]
        columns.append(
            ColumnProfile(str(col), role, str(series.dtype),
                          round(float(series.isna().mean() * 100), 1),
                          int(series.nunique(dropna=True)), examples)
        )

    findings: list[Finding] = []
    stats: dict = {}

    def add(severity: str, message: str) -> None:
        findings.append(Finding(severity, message))

    duplicates = int(df.duplicated().sum())
    if duplicates:
        add("alta", f"{duplicates} filas duplicadas exactas: inflarían la cosecha real si se "
                    "suman sin revisar.")

    if "persona" in roles:
        add("media", f"La columna «{roles['persona']}» parece contener datos personales. No "
                     "hace falta para el modelo: conviene excluirla al importar.")

    if "fecha" in roles:
        raw = df[roles["fecha"]]
        dates, formats = parse_dates(raw)
        unparsed = int((dates.isna() & raw.notna()).sum())
        stats["fechas"] = {
            "desde": str(dates.min().date()) if dates.notna().any() else None,
            "hasta": str(dates.max().date()) if dates.notna().any() else None,
            "formatos": formats,
            "dias_semana": {str(k): int(v) for k, v in
                            dates.dropna().dt.day_name().value_counts().items()},
        }
        if unparsed:
            add("alta", f"{unparsed} fechas no se pudieron interpretar.")
        if len(formats) > 1:
            add("media", f"Hay varios formatos de fecha mezclados: {', '.join(formats)}.")
        future = int((dates > today).sum())
        if future:
            add("alta", f"{future} fechas están en el futuro.")

    kg = None
    if "kg" in roles:
        kg = to_number(df[roles["kg"]])
        bad = int((kg.isna() & df[roles["kg"]].notna()).sum())
        missing = int(df[roles["kg"]].isna().sum())
        non_positive = int((kg <= 0).sum())
        if bad:
            add("alta", f"{bad} valores de kg no son numéricos.")
        if missing:
            add("alta", f"{missing} filas sin kg.")
        if non_positive:
            add("alta", f"{non_positive} filas con kg cero o negativo.")
        valid = kg[kg > 0]
        if len(valid) >= 4:
            q1, q3 = valid.quantile([0.25, 0.75])
            high = q3 + 3 * (q3 - q1)
            outliers = int((valid > high).sum())
            stats["kg"] = {"min": float(valid.min()), "mediana": float(valid.median()),
                           "max": float(valid.max()), "total": float(valid.sum())}
            if outliers:
                add("media", f"{outliers} valores de kg muy por encima del resto (> {high:.1f}): "
                             "¿errores o agregados mezclados con filas de detalle?")

    if "cultivo" in roles:
        raw = df[roles["cultivo"]].dropna().astype(str)
        spellings = raw.nunique()
        normalized = raw.map(_normalize).nunique()
        stats["cultivos"] = {str(k): int(v) for k, v in raw.value_counts().items()}
        if spellings != normalized:
            add("media", f"El cultivo aparece con {spellings} grafías para {normalized} valores "
                         "distintos: hay que normalizarlo.")

    if "invernadero" in roles:
        stats["n_invernaderos"] = int(df[roles["invernadero"]].nunique())

    if "kg" in roles and "n_frutos" in roles:
        n = to_number(df[roles["n_frutos"]])
        grams = (kg * 1000 / n).replace([np.inf, -np.inf], np.nan).dropna()
        grams = grams[grams > 0]
        coverage = float(n.notna().mean() * 100)
        stats["g_por_fruto"] = {"cobertura_pct": round(coverage, 1), "n": int(len(grams))}
        if len(grams):
            stats["g_por_fruto"]["mediana"] = float(grams.median())

    def has(*wanted: str) -> bool:
        return all(r in roles for r in wanted)

    usability: list[Usability] = []
    if has("fecha", "invernadero", "kg", "cultivo"):
        usability.append(Usability("Comparar con kg reales por invernadero y cultivo", "si",
                                   "Tiene fecha, invernadero, cultivo y kg."))
    elif has("fecha", "invernadero", "kg"):
        usability.append(Usability("Comparar con kg reales por invernadero y cultivo", "parcial",
                                   "Falta cultivo: solo sirve si cada invernadero tiene uno."))
    else:
        usability.append(Usability("Comparar con kg reales por invernadero y cultivo", "no",
                                   "Faltan columnas de fecha, invernadero o kg."))

    if has("kg", "n_frutos") and has("clase"):
        usability.append(Usability("Peso medio por fruto y por clase", "si",
                                   "Tiene kg, número de frutos y clase."))
    elif has("kg", "n_frutos") or "peso_por_fruto" in roles:
        usability.append(Usability("Peso medio por fruto y por clase", "parcial",
                                   "Hay peso por fruto, pero sin color o calibre."))
    else:
        usability.append(Usability("Peso medio por fruto y por clase", "no",
                                   "Sin número de frutos: hay que pesar muestras en el piloto."))

    if has("planta", "kg"):
        usability.append(Usability("Validar por planta", "si", "Hay kg por planta."))
    elif has("hilera", "kg"):
        usability.append(Usability("Validar por planta", "parcial",
                                   "Solo llega a hilera: las plantas exigen conteo de control."))
    else:
        usability.append(Usability("Validar por planta", "no",
                                   "Sin hilera ni planta: exige conteo manual de control."))

    span = stats.get("fechas", {})
    if span.get("desde"):
        days = (pd.Timestamp(span["hasta"]) - pd.Timestamp(span["desde"])).days
        usability.append(Usability(
            "Contexto histórico para la Fase 3", "parcial",
            f"Cubre {days} días de cosecha, pero sin imágenes asociadas no enseña a predecir "
            "maduración por fruto. Sirve como referencia de totales y estacionalidad."))
    else:
        usability.append(Usability("Contexto histórico para la Fase 3", "no", "Sin fechas."))

    return RecordsProfile(source, sheet or None, len(df), columns, findings, usability, stats)


def profile_file(path: str | Path, sheet: str | None = None,
                 today: datetime | None = None) -> list[RecordsProfile]:
    file = Path(path)
    now = pd.Timestamp(today or datetime.now())
    return [_profile_sheet(df, file.name, name, now)
            for name, df in read_table(file, sheet).items()]


def to_markdown(profiles: list[RecordsProfile]) -> str:
    def cell(value: object) -> str:
        return str(value).replace("|", "\\|").replace("\n", " ")

    out: list[str] = []
    for p in profiles:
        title = p.source + (f" · hoja {p.sheet}" if p.sheet else "")
        out += [f"# Revisión de registros: {title}", "", f"Filas: {p.n_rows}", "",
                "## Para qué sirve", "", "| Uso | Estado | Motivo |", "|---|---|---|"]
        out += [f"| {cell(u.use)} | {u.status} | {cell(u.reason)} |" for u in p.usability]
        out += ["", "## Problemas detectados", ""]
        out += [f"- **{f.severity}**: {f.message}" for f in p.findings] or ["- Ninguno detectado."]
        out += ["", "## Columnas", "",
                "| Columna | Papel probable | Vacíos % | Distintos | Ejemplos |",
                "|---|---|---:|---:|---|"]
        out += [f"| {cell(c.name)} | {c.role or '?'} | {c.missing_pct} | {c.n_unique} | "
                f"{cell(', '.join(c.examples))} |" for c in p.columns]
        out += ["", "## Estadísticas", "", "```", str(p.stats), "```", ""]
    return "\n".join(out)
