from atias.cli import main

CSV = "Fecha;Invernadero;Cultivo;Kilos\n02/11/2026;I1;Pepino;100,5\n02/11/2026;I1;Pepino;100,5\n"


def test_records_prints_the_report(tmp_path, capsys):
    path = tmp_path / "r.csv"
    path.write_text(CSV, encoding="utf-8")
    assert main(["registros", str(path)]) == 0
    assert "duplicadas" in capsys.readouterr().out


def test_records_can_save_the_report(tmp_path, capsys):
    path = tmp_path / "r.csv"
    path.write_text(CSV, encoding="utf-8")
    output = tmp_path / "informe.md"
    assert main(["registros", str(path), "--salida", str(output)]) == 0
    assert "duplicadas" in output.read_text(encoding="utf-8")
    assert "duplicadas" not in capsys.readouterr().out


def test_missing_file_is_a_clear_error(tmp_path, capsys):
    assert main(["registros", str(tmp_path / "no.csv")]) == 1
    assert "Error" in capsys.readouterr().err


def test_unknown_format_is_a_clear_error(tmp_path, capsys):
    path = tmp_path / "r.txt"
    path.write_text("x", encoding="utf-8")
    assert main(["registros", str(path)]) == 1
    assert "Formato no admitido" in capsys.readouterr().err
