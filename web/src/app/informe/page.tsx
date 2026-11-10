"use client";

import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import { type ReactNode, Suspense } from "react";
import { Wordmark } from "@/components/Wordmark";
import type { HarvestReport } from "@/lib/api";
import { fmtBetween, fmtDate, fmtDay, fmtInt, fmtKg, fmtPct } from "@/lib/format";
import { useDocumentTitle, useReport, useSelectedHarvest } from "@/lib/hooks";
import type { Forecaster } from "@/lib/precision";
import { reportDays, weekAccuracy } from "@/lib/weeklyReport";

const WHO: Record<Forecaster, string> = { atias: "Atias", agricultor: "Agricultor", tecnico: "Técnico" };
const kg = (value: number | null) => (value === null ? "—" : fmtKg(value));
const pct = (value: number | null) => (value === null ? "—" : fmtPct(value));
const signed = (value: number | null) => (value === null ? "—" : `${value > 0 ? "+" : value < 0 ? "−" : ""}${fmtPct(Math.abs(value))}`);

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="break-inside-avoid">
      <h2 className="text-lg font-semibold">{title}</h2>
      {note && <p className="text-sm text-muted">{note}</p>}
      <div className="mt-2">{children}</div>
    </section>
  );
}

function Figure({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-md border border-line p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="numeral mt-1 text-4xl">{value}</p>
      <p className="mt-1 text-sm text-muted">{detail}</p>
    </div>
  );
}

function Sheet({ report }: { report: HarvestReport }) {
  const days = reportDays(report);
  const accuracy = weekAccuracy(report);
  const total = (key: "atias" | "tecnico" | "agricultor" | "real") =>
    days.every((d) => d[key] !== null) ? days.reduce((s, d) => s + (d[key] as number), 0) : null;
  const showFarmer = days.some((d) => d.agricultor !== null);
  const showReal = days.some((d) => d.real !== null);

  return (
    <article className="mx-auto grid max-w-[190mm] gap-6 bg-surface p-8 print:max-w-none print:p-0">
      <header className="flex items-start justify-between gap-4 border-b-2 border-ink pb-4">
        <div>
          <p className="text-xl"><Wordmark /></p>
          <h1 className="display mt-3 text-[2.25rem]">Informe semanal · {report.label}</h1>
          <p className="text-sm text-muted">Semana {report.isoWeek} de {report.year} · actualizado el {fmtDate(report.updatedAt)}</p>
        </div>
        {report.simulated && (
          <p className="rounded-md border border-warn-line bg-warn-soft px-3 py-2 text-sm font-semibold text-warn-ink">Datos simulados</p>
        )}
      </header>

      {report.simulated && (
        <p className="text-sm text-warn-ink">Modo demostración: ninguna cifra de este informe procede de un invernadero real ni indica la precisión del sistema.</p>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Figure label="Previsión para la venta (experimental)" value={`${fmtKg(report.forecast.kg)} kg`} detail={fmtBetween(report.forecast)} />
        <Figure
          label="Temporeros necesarios (experimental)"
          value={report.workers === null ? "—" : fmtInt(report.workers)}
          detail={report.workersMax === null ? `${report.days} días` : `Hasta ${report.workersMax} en el extremo alto · ${report.days} días`}
        />
        <Figure label="Fruta madura observada" value={`${fmtKg(report.observed.kg)} kg`} detail={`${fmtInt(report.matureFruits)} frutos contados`} />
      </div>
      {report.partial && (
        <p className="text-sm text-warn-ink">Cifras parciales: faltan {report.missingHileras} de {report.totalHileras} hileras por contar.</p>
      )}

      <Section title="Kilos por día" note="Previsión de Atias frente a la del técnico y lo recogido. Un total solo aparece si están todos los invernaderos.">
        <table className="data-table compact">
          <thead>
            <tr>
              <th scope="col">Día</th>
              <th scope="col" className="num">Atias</th>
              <th scope="col" className="num">Técnico</th>
              {showFarmer && <th scope="col" className="num">Agricultor</th>}
              {showReal && <th scope="col" className="num">Recogido</th>}
            </tr>
          </thead>
          <tbody>
            {days.map((d) => (
              <tr key={d.date}>
                <th scope="row">{fmtDay(d.date)}</th>
                <td className="num">{kg(d.atias)}</td>
                <td className="num">{kg(d.tecnico)}</td>
                {showFarmer && <td className="num">{kg(d.agricultor)}</td>}
                {showReal && <td className="num">{kg(d.real)}</td>}
              </tr>
            ))}
            <tr className="font-semibold">
              <th scope="row">Semana</th>
              <td className="num">{kg(total("atias"))}</td>
              <td className="num">{kg(total("tecnico"))}</td>
              {showFarmer && <td className="num">{kg(total("agricultor"))}</td>}
              {showReal && <td className="num">{kg(total("real"))}</td>}
            </tr>
          </tbody>
        </table>
      </Section>

      <Section title="Por familia">
        <table className="data-table compact">
          <thead>
            <tr>
              <th scope="col">Familia</th>
              <th scope="col" className="num">Previsión (kg)</th>
              <th scope="col" className="num">Rango</th>
              <th scope="col" className="num">Temporeros</th>
            </tr>
          </thead>
          <tbody>
            {report.families.map((f) => (
              <tr key={f.family}>
                <th scope="row">{f.name}{f.partial && <span className="text-xs text-warn-ink"> · parcial</span>}</th>
                <td className="num">{fmtKg(f.forecast.kg)}</td>
                <td className="num">{fmtKg(f.forecast.min)}–{fmtKg(f.forecast.max)}</td>
                <td className="num">{f.workers === null ? "—" : fmtInt(f.workers)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Por invernadero">
        <table className="data-table compact">
          <thead>
            <tr>
              <th scope="col">Invernadero</th>
              <th scope="col">Familia · agricultor</th>
              <th scope="col" className="num">Previsión (kg)</th>
              <th scope="col" className="num">Técnico (kg)</th>
              <th scope="col" className="num">Recogido (kg)</th>
            </tr>
          </thead>
          <tbody>
            {report.greenhouses.map((g) => (
              <tr key={g.info.id}>
                <th scope="row">{g.info.name}</th>
                <td>{g.familyName} · {g.growerName}</td>
                <td className="num">{fmtKg(g.forecast.kg)}{g.partial && <span className="block text-xs text-warn-ink">parcial</span>}</td>
                <td className="num">{kg(g.technicianKg)}</td>
                <td className="num">{kg(g.realKg)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {accuracy && (
        <Section title="Precisión de esta semana" note="Error en kilos de la semana frente a lo recogido, en los invernaderos con cosecha. Signo positivo: estimó de más.">
          <table className="data-table compact">
            <thead>
              <tr>
                <th scope="col">Previsión</th>
                <th scope="col" className="num">Error</th>
                <th scope="col" className="num">Sesgo</th>
              </tr>
            </thead>
            <tbody>
              {(Object.keys(WHO) as Forecaster[]).map((who) => (
                <tr key={who}>
                  <th scope="row">{WHO[who]}</th>
                  <td className="num">{pct(accuracy[who].errorPct)}</td>
                  <td className="num">{signed(accuracy[who].biasPct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-sm text-muted">Una semana orienta, no demuestra: el objetivo del 10 % se afirma con al menos 8 semanas medidas.</p>
        </Section>
      )}

      {report.warnings.length > 0 && (
        <Section title={`Advertencias (${report.warnings.length})`}>
          <ul className="grid gap-1 text-sm">
            {report.warnings.map((w) => (
              <li key={`${w.greenhouseId}-${w.hilera}-${w.message}`}>
                <span className="font-medium">{w.scope}:</span> {w.message} {w.action}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <footer className="border-t border-line pt-3 text-xs text-muted">
        Previsión y temporeros son experimentales: se calculan a partir del conteo de fruta madura en los vídeos y aún se están validando con la cosecha real.
      </footer>
    </article>
  );
}

function Informe() {
  useDocumentTitle("Informe semanal");
  const selected = useSelectedHarvest();
  const report = useReport(selected);
  return (
    <main className="min-h-dvh bg-sunken py-8 print:bg-surface print:py-0">
      <div className="mx-auto mb-4 flex max-w-[190mm] justify-between gap-3 px-4 print:hidden">
        <Link href={`/?recoleccion=${encodeURIComponent(selected)}`} className="btn-secondary">
          <ArrowLeft size={16} aria-hidden />
          Volver
        </Link>
        <button type="button" onClick={() => window.print()} className="btn-primary" disabled={!report.data}>
          <Printer size={16} aria-hidden />
          Imprimir o guardar en PDF
        </button>
      </div>
      {report.isPending ? (
        <p className="text-center text-muted">Cargando…</p>
      ) : report.isError ? (
        <p className="text-center text-bad-ink">{report.error.message}</p>
      ) : !report.data ? (
        <p className="text-center text-muted">No hay datos de esa recolección.</p>
      ) : (
        <Sheet report={report.data} />
      )}
    </main>
  );
}

export default function InformePage() {
  return (
    <Suspense fallback={null}>
      <Informe />
    </Suspense>
  );
}
