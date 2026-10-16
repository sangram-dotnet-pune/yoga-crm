"use client";

import { useEffect, useState } from "react";
import { LineChart } from "lucide-react";
import { ApiError } from "@/lib/api";
import { getOutcomes } from "@/lib/outcomes";
import { formatCurrency, formatDate } from "@/lib/format";
import { OUTCOME_RANGES, type Outcomes, type OutcomeRange } from "@/lib/types";
import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from "@/components/ui";

const RANGE_LABELS: Record<OutcomeRange, string> = {
  day: "Day",
  week: "Week",
  month: "Month",
  quarter: "Quarter",
  year: "Year",
};

function KpiCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </Card>
  );
}

function RevenueChart({ data }: { data: Outcomes["revenue"] }) {
  const max = Math.max(1, ...data.map((item) => item.value));
  return (
    <div className="flex h-44 items-end gap-2">
      {data.map((item, index) => (
        <div key={`${item.label}-${index}`} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
          <span className="text-[10px] text-muted">
            {item.value > 0 ? formatCurrency(item.value) : ""}
          </span>
          <div
            className="w-full rounded-t bg-primary/70"
            style={{ height: `${Math.max(item.value > 0 ? 4 : 0, (item.value / max) * 100)}%` }}
            title={`${item.label}: ${formatCurrency(item.value)}`}
          />
          <span className="truncate text-[10px] text-muted">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function DemandChart({ data }: { data: Outcomes["demand"] }) {
  const max = Math.max(
    1,
    ...data.map((item) => item.newPatients + item.followUps),
  );
  return (
    <div className="flex h-44 items-end gap-2">
      {data.map((item, index) => (
        <div key={`${item.label}-${index}`} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
          <div className="flex h-full w-full flex-col justify-end">
            <div
              className="w-full rounded-t bg-primary/70"
              style={{ height: `${(item.newPatients / max) * 100}%` }}
              title={`${item.label} · new: ${item.newPatients}`}
            />
            <div
              className="w-full bg-amber-500/70"
              style={{ height: `${(item.followUps / max) * 100}%` }}
              title={`${item.label} · follow-ups: ${item.followUps}`}
            />
          </div>
          <span className="truncate text-[10px] text-muted">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function ProgressRow({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="tabular-nums text-muted">
          {value} / {total} ({pct}%)
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-background">
        <div className="h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function OutcomesPage() {
  const [range, setRange] = useState<OutcomeRange>("month");
  const [data, setData] = useState<Outcomes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getOutcomes(range)
      .then((result) => {
        if (!active) return;
        setData(result);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : "Unable to load outcomes.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [range]);

  return (
    <div>
      <PageHeader
        title="Outcomes"
        description="Outcome analytics over a selected period."
        actions={
          <div className="inline-flex rounded-lg border border-border bg-surface p-1">
            {OUTCOME_RANGES.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setRange(option);
                  setLoading(true);
                }}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  range === option ? "bg-primary/10 text-primary" : "text-muted hover:text-foreground"
                }`}
              >
                {RANGE_LABELS[option]}
              </button>
            ))}
          </div>
        }
      />

      {error ? <ErrorState message={error} /> : null}

      {loading && !data ? (
        <LoadingState label="Loading outcomes…" />
      ) : data ? (
        <div className="space-y-6">
          <p className="text-sm text-muted">
            {formatDate(data.from)} – {formatDate(data.to)}
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Collected" value={formatCurrency(data.kpis.collected)} hint="Payments received" />
            <KpiCard label="New patients" value={String(data.kpis.newPatients)} hint="Visits in period" />
            <KpiCard label="Follow-ups" value={String(data.kpis.followUps)} hint="Scheduled in period" />
            <KpiCard
              label="Avg pain reduction"
              value={`${data.kpis.avgPainReduction} pts`}
              hint="Mean (before − after)"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Revenue collected</h2>
              </div>
              <RevenueChart data={data.revenue} />
            </Card>

            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Patient demand</h2>
                <div className="flex items-center gap-3 text-xs text-muted">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-sm bg-primary/70" /> New
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-sm bg-amber-500/70" /> Follow-ups
                  </span>
                </div>
              </div>
              <DemandChart data={data.demand} />
            </Card>
          </div>

          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold">Treatment progress</h2>
            {data.progress.totalPatients === 0 ? (
              <EmptyState
                icon={<LineChart size={28} aria-hidden />}
                title="No patient data yet"
                description="Add patients with before/after outcomes to see progress."
              />
            ) : (
              <div className="space-y-4">
                <ProgressRow
                  label="Pain improved"
                  value={data.progress.painImproved}
                  total={data.progress.totalPatients}
                />
                <ProgressRow
                  label="Mobility improved"
                  value={data.progress.mobilityImproved}
                  total={data.progress.totalPatients}
                />
                <ProgressRow
                  label="Active plans"
                  value={data.progress.activePlans}
                  total={data.progress.totalPatients}
                />
              </div>
            )}
          </Card>
        </div>
      ) : null}
    </div>
  );
}
