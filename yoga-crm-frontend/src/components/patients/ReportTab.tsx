"use client";

import { FileText } from "lucide-react";
import { displayValue, formatCurrency, formatDate } from "@/lib/format";
import type { PatientDetail, Xray } from "@/lib/types";
import { Button, Card, Spinner } from "@/components/ui";

export const REPORT_DISCLAIMER =
  "This report summarizes recorded clinical information and patient-reported/clinician-entered outcomes. It is not an automated radiological diagnosis.";

function SectionTitle({ num, title }: { num: string; title: string }) {
  return (
    <div className="mb-3 flex items-baseline gap-2 border-b border-border pb-2">
      <span className="text-sm font-semibold text-primary">{num}</span>
      <h3 className="text-sm font-semibold">{title}</h3>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/60 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-0.5 text-sm font-semibold">{value}</p>
      {sub ? <p className="text-[11px] text-muted">{sub}</p> : null}
    </div>
  );
}

export function ReportTab({
  detail,
  xrays,
  exporting,
  onExport,
}: {
  detail: PatientDetail;
  xrays: Xray[];
  exporting: boolean;
  onExport: () => void;
}) {
  const reduction = detail.painBefore - (detail.painAfter ?? detail.painBefore);
  const deltaLabel =
    detail.painAfter === null
      ? "No follow-up score"
      : reduction > 0
        ? `${reduction} point pain reduction`
        : reduction < 0
          ? `${Math.abs(reduction)} point pain increase`
          : "No change";

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={onExport} disabled={exporting}>
          {exporting ? <Spinner /> : <FileText size={16} aria-hidden />}
          Generate PDF
        </Button>
      </div>

      <Card className="space-y-6 p-6">
        <div>
          <h2 className="text-lg font-semibold">Outcome report</h2>
          <p className="text-sm text-muted">
            {detail.name} · {detail.condition} · generated {formatDate(new Date().toISOString().slice(0, 10))}
          </p>
        </div>

        <section>
          <SectionTitle num="01" title="Patient information" />
          <div className="grid gap-4 sm:grid-cols-3">
            <InfoRow label="Code" value={detail.patientCode} />
            <InfoRow label="Name" value={detail.name} />
            <InfoRow label="Age" value={String(detail.age)} />
            <InfoRow label="Gender" value={displayValue(detail.gender)} />
            <InfoRow label="Phone" value={displayValue(detail.phone)} />
            <InfoRow label="Visit date" value={formatDate(detail.visitDate)} />
            <InfoRow label="Condition" value={displayValue(detail.condition)} />
            <InfoRow label="Diagnosis" value={displayValue(detail.diagnosis)} />
            <InfoRow label="Doctor" value={displayValue(detail.doctor)} />
            <InfoRow label="Status" value={detail.status} />
            <InfoRow label="Plan" value={`${detail.planMonths} months`} />
            <InfoRow label="Follow-up" value={formatDate(detail.followUpDate)} />
          </div>
        </section>

        <section>
          <SectionTitle num="02" title="Clinical overview" />
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric
              label="Pain (before → after)"
              value={`${detail.painBefore} → ${displayValue(detail.painAfter)}`}
              sub="scale 0–10"
            />
            <Metric
              label="Mobility"
              value={`${displayValue(detail.mobilityBefore)} → ${displayValue(detail.mobilityAfter)}`}
              sub="recorded values"
            />
            <Metric label="Plan duration" value={`${detail.planMonths} months`} sub={`status ${detail.status}`} />
          </div>
          <p className="mt-3 text-sm text-muted">Outcome (3-month): {deltaLabel}</p>
        </section>

        <section>
          <SectionTitle num="03" title="Visit history" />
          {detail.visits.length === 0 ? (
            <p className="text-sm text-muted">No visits recorded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Date</th>
                    <th className="py-2 pr-4 font-medium">Type</th>
                    <th className="py-2 pr-4 text-right font-medium">Pain</th>
                    <th className="py-2 pr-4 text-right font-medium">Mobility</th>
                    <th className="py-2 font-medium">Treatment</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.visits.map((visit) => (
                    <tr key={visit.id} className="border-b border-border last:border-0">
                      <td className="py-2 pr-4 text-muted">{formatDate(visit.date)}</td>
                      <td className="py-2 pr-4">{visit.visitType}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{displayValue(visit.painScore)}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{displayValue(visit.mobility)}</td>
                      <td className="max-w-xs truncate py-2 text-muted">{displayValue(visit.treatment)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <SectionTitle num="04" title="Progress" />
          <p className="text-sm text-muted">
            Pain {detail.painBefore} → {displayValue(detail.painAfter)} · Mobility{" "}
            {displayValue(detail.mobilityBefore)} → {displayValue(detail.mobilityAfter)}
          </p>
          <p className="mt-1 text-xs text-muted">
            Charts describe recorded scores only and are not a diagnosis.
          </p>
        </section>

        <section>
          <SectionTitle num="05" title="Exercise & home plan" />
          {detail.exercises.length === 0 ? (
            <p className="text-sm text-muted">No exercises prescribed.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {detail.exercises.map((exercise) => (
                <li key={exercise.id} className="flex flex-wrap justify-between gap-2 border-b border-border py-1.5 last:border-0">
                  <span className="font-medium">{exercise.name}</span>
                  <span className="text-muted">
                    {[exercise.frequency, exercise.duration].filter(Boolean).join(" · ") || "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <SectionTitle num="06" title="X-ray records" />
          {xrays.length === 0 ? (
            <p className="text-sm text-muted">No X-ray images recorded.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              {xrays.map((xray) => (
                <figure key={xray.id} className="rounded-lg border border-border p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={xray.url}
                    alt={`${xray.kind} X-ray`}
                    className="h-32 w-full rounded object-contain"
                  />
                  <figcaption className="mt-1 text-center text-xs text-muted">
                    {xray.kind} · {formatDate(xray.date)}
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </section>

        {detail.fee > 0 || detail.payments.length > 0 ? (
          <section>
            <SectionTitle num="07" title="Payment summary" />
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="Fee" value={formatCurrency(detail.fee)} />
              <Metric label="Paid" value={formatCurrency(detail.paid)} />
              <Metric
                label={detail.credit > 0 ? "Credit" : "Balance"}
                value={formatCurrency(detail.credit > 0 ? detail.credit : detail.balance)}
                sub={detail.paymentStatus}
              />
            </div>
          </section>
        ) : null}

        <section className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
            Disclaimer
          </p>
          <p className="mt-1 text-sm">{REPORT_DISCLAIMER}</p>
        </section>
      </Card>
    </div>
  );
}
