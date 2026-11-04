from datetime import datetime

import pandas as pd
import pytest

from atias.records import guess_role, parse_dates, profile_file, to_markdown, to_number

TODAY = datetime(2026, 11, 4)


@pytest.mark.parametrize(("column", "role"), [
    ("Fecha", "fecha"),
    ("Kilos netos", "kg"),
    ("kg_recogidos", "kg"),
    ("Invernadero", "invernadero"),
    ("Nº frutos", "n_frutos"),
    ("Peso por fruto", "peso_por_fruto"),
    ("Hilera", "hilera"),
    ("Calibre", "clase"),
    ("Nombre del operario", "persona"),
    ("Observaciones", None),
])
def test_guess_role(column, role):
    assert guess_role(column) == role


def test_to_number_understands_spanish_formats():
    values = to_number(pd.Series(["12,5", "1.234,5", "7", "n/d", None]))
    assert values[:3].tolist() == [12.5, 1234.5, 7.0]
    assert values[3:].isna().all()


def test_dates_are_day_first_and_mixed_formats_are_reported():
    dates, formats = parse_dates(pd.Series(["03/02/2026", "2026-02-04", "nonsense"]))
    assert dates[0] == pd.Timestamp(2026, 2, 3)
    assert dates[1] == pd.Timestamp(2026, 2, 4)
    assert pd.isna(dates[2])
    assert len(formats) == 2


def write(tmp_path, text, name="r.csv", encoding="utf-8"):
    path = tmp_path / name
    path.write_text(text, encoding=encoding)
    return path


def test_detects_quality_problems(tmp_path):
    path = write(tmp_path, (
        "Fecha;Invernadero;Cultivo;Kilos;Operario\n"
        "02/11/2026;I1;Pepino;100,5;Ana López\n"
        "02/11/2026;I1;Pepino;100,5;Ana López\n"
        "2026-11-03;I2;pepino ;-5;Luis Ruiz\n"
        "2027-01-01;I2;Pepino;;Luis Ruiz\n"
        "ayer;I3;Pepino;abc;Luis Ruiz\n"
    ))
    profile = profile_file(path, today=TODAY)[0]
    text = " ".join(f.message for f in profile.findings)
    assert "1 filas duplicadas" in text
    assert "1 filas con kg cero o negativo" in text
    assert "1 valores de kg no son numéricos" in text
    assert "1 filas sin kg" in text
    assert "1 fechas están en el futuro" in text
    assert "1 fechas no se pudieron interpretar" in text
    assert "varios formatos de fecha" in text
    assert "grafías" in text
    assert "datos personales" in text


def test_personal_data_is_not_copied_into_the_report(tmp_path):
    path = write(tmp_path, "Fecha;Kilos;Operario\n02/11/2026;10;Ana López\n")
    profiles = profile_file(path, today=TODAY)
    assert "Ana López" not in to_markdown(profiles)


def test_usability_for_greenhouse_level_records(tmp_path):
    path = write(tmp_path, "Fecha,Invernadero,Cultivo,Kilos\n02/11/2026,I1,Pepino,10\n")
    usability = {u.use: u.status for u in profile_file(path, today=TODAY)[0].usability}
    assert usability["Comparar con kg reales por invernadero y cultivo"] == "si"
    assert usability["Peso medio por fruto y por clase"] == "no"
    assert usability["Validar por planta"] == "no"


def test_usability_with_fruit_counts_computes_grams_per_fruit(tmp_path):
    path = write(tmp_path, ("Fecha,Invernadero,Cultivo,Calibre,Kilos,Frutos\n"
                            "02/11/2026,I1,Pepino,G,30,100\n"))
    profile = profile_file(path, today=TODAY)[0]
    usability = {u.use: u.status for u in profile.usability}
    assert usability["Peso medio por fruto y por clase"] == "si"
    assert profile.stats["g_por_fruto"]["mediana"] == pytest.approx(300)


def test_reads_xlsx_with_several_sheets(tmp_path):
    path = tmp_path / "r.xlsx"
    with pd.ExcelWriter(path) as writer:
        pd.DataFrame({"Fecha": [datetime(2026, 11, 2)], "Kilos": [10]}).to_excel(
            writer, sheet_name="A", index=False)
        pd.DataFrame({"Invernadero": ["I1"]}).to_excel(writer, sheet_name="B", index=False)
    profiles = profile_file(path, today=TODAY)
    assert [p.sheet for p in profiles] == ["A", "B"]
    assert profiles[0].stats["fechas"]["desde"] == "2026-11-02"


def test_latin1_csv_is_readable(tmp_path):
    path = write(tmp_path, "Año;Kilos\n2026;10\n", encoding="latin-1")
    assert profile_file(path, today=TODAY)[0].n_rows == 1


def test_rejects_unknown_format(tmp_path):
    with pytest.raises(ValueError, match="Formato no admitido"):
        profile_file(write(tmp_path, "x", name="r.txt"))
