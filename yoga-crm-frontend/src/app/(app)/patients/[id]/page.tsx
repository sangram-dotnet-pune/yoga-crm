"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { ApiError } from "@/lib/api";
import {
  deletePatient,
  deletePayment,
  deleteVisit,
  getPatient,
  reconcilePayments,
} from "@/lib/patients";
import { listXrays } from "@/lib/xrays";
import { displayValue, formatCurrency, formatDate } from "@/lib/format";
import type { PatientDetail, Payment, Visit, Xray } from "@/lib/types";
import { PatientForm } from "@/components/patients/PatientForm";
import { VisitForm } from "@/components/patients/VisitForm";
import { PaymentForm } from "@/components/patients/PaymentForm";
import { ExerciseEditor } from "@/components/patients/ExerciseEditor";
import { XraysTab } from "@/components/patients/XraysTab";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  PaymentBadge,
  StatusBadge,
} from "@/components/ui";

type Tab = "overview" | "visits" | "exercises" | "xrays" | "payments";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "visits", label: "Visits" },
  { id: "exercises", label: "Exercise plan" },
  { id: "xrays", label: "X-rays" },
  { id: "payments", label: "Payments" },
];

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-b border-border py-2.5 last:border-0">
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm">{value}</dd>
    </div>
  );
}

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params.id;
  const patientId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [detail, setDetail] = useState<PatientDetail | null>(null);
  const [xrays, setXrays] = useState<Xray[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");

  const [editOpen, setEditOpen] = useState(false);
  const [visitOpen, setVisitOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Visit | undefined>(undefined);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const load = useCallback(async () => {
    if (!patientId) return;
    try {
      const fresh = await getPatient(patientId);
      setDetail(fresh);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load patient.");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (!patientId) return;
    let active = true;
    getPatient(patientId)
      .then((fresh) => {
        if (!active) return;
        setDetail(fresh);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : "Unable to load patient.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    listXrays(patientId)
      .then((rows) => {
        if (active) setXrays(rows);
      })
      .catch(() => {
        if (active) setXrays([]);
      });
    return () => {
      active = false;
    };
  }, [patientId]);

  const refreshXrays = useCallback(() => {
    if (!patientId) return;
    listXrays(patientId)
      .then(setXrays)
      .catch(() => setXrays([]));
  }, [patientId]);

  async function runAction(action: () => Promise<unknown>) {
    setBusy(true);
    setActionError(null);
    try {
      await action();
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  async function onDeletePatient() {
    if (!detail) return;
    if (!window.confirm(`Delete ${detail.name}? This cannot be undone.`)) return;
    setBusy(true);
    setActionError(null);
    try {
      await deletePatient(detail.id);
      router.push("/patients");
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Unable to delete patient.");
      setBusy(false);
    }
  }

  if (loading && !detail) return <LoadingState label="Loading patient…" />;
  if (error) return <ErrorState message={error} />;
  if (!detail) return null;

  return (
    <div>
      <Link
        href="/patients"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft size={16} aria-hidden />
        Back to patients
      </Link>

      <PageHeader
        title={detail.name}
        description={`${detail.patientCode} · ${detail.condition}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              <Pencil size={16} aria-hidden />
              Edit
            </Button>
            <Button variant="danger" onClick={() => void onDeletePatient()} disabled={busy}>
              <Trash2 size={16} aria-hidden />
              Delete
            </Button>
          </>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <StatusBadge status={detail.status} />
        <PaymentBadge status={detail.paymentStatus} />
        <span className="text-sm text-muted">
          Balance {formatCurrency(detail.balance)}
          {detail.credit > 0 ? ` · Credit ${formatCurrency(detail.credit)}` : ""}
        </span>
      </div>

      {actionError ? (
        <div className="mb-4">
          <ErrorState message={actionError} />
        </div>
      ) : null}

      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            aria-current={tab === item.id ? "page" : undefined}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === item.id
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "overview" ? <OverviewTab detail={detail} /> : null}

      {tab === "visits" ? (
        <VisitsTab
          detail={detail}
          busy={busy}
          onAdd={() => {
            setEditingVisit(undefined);
            setVisitOpen(true);
          }}
          onEdit={(visit) => {
            setEditingVisit(visit);
            setVisitOpen(true);
          }}
          onDelete={(visit) => {
            if (window.confirm(`Delete the visit on ${formatDate(visit.date)}?`)) {
              void runAction(() => deleteVisit(visit.id));
            }
          }}
        />
      ) : null}

      {tab === "exercises" ? (
        <ExerciseEditor
          patientId={detail.id}
          exercises={detail.exercises}
          onSaved={() => void load()}
        />
      ) : null}

      {tab === "xrays" ? (
        <XraysTab patientId={detail.id} xrays={xrays} onChanged={refreshXrays} />
      ) : null}

      {tab === "payments" ? (
        <PaymentsTab
          detail={detail}
          busy={busy}
          onAdd={() => setPaymentOpen(true)}
          onReconcile={() => void runAction(() => reconcilePayments(detail.id))}
          onDelete={(payment) => {
            if (window.confirm(`Delete the payment of ${formatCurrency(payment.amount)}?`)) {
              void runAction(() => deletePayment(payment.id));
            }
          }}
        />
      ) : null}

      {editOpen ? (
        <PatientForm
          patient={detail}
          onClose={() => setEditOpen(false)}
          onSaved={() => void load()}
        />
      ) : null}
      {visitOpen ? (
        <VisitForm
          patientId={detail.id}
          visit={editingVisit}
          onClose={() => setVisitOpen(false)}
          onSaved={() => void load()}
        />
      ) : null}
      {paymentOpen ? (
        <PaymentForm
          patientId={detail.id}
          onClose={() => setPaymentOpen(false)}
          onSaved={() => void load()}
        />
      ) : null}
    </div>
  );
}

function OverviewTab({ detail }: { detail: PatientDetail }) {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Card className="p-5 lg:col-span-2">
        <h2 className="mb-2 text-sm font-semibold">Patient details</h2>
        <dl className="grid gap-x-8 sm:grid-cols-2">
          <DetailRow label="Age" value={displayValue(detail.age || null)} />
          <DetailRow label="Gender" value={displayValue(detail.gender)} />
          <DetailRow label="Phone" value={displayValue(detail.phone)} />
          <DetailRow label="Visit date" value={formatDate(detail.visitDate)} />
          <DetailRow label="Diagnosis" value={displayValue(detail.diagnosis)} />
          <DetailRow label="Doctor" value={displayValue(detail.doctor)} />
          <DetailRow label="Pain before" value={displayValue(detail.painBefore)} />
          <DetailRow label="Pain after" value={displayValue(detail.painAfter)} />
          <DetailRow label="Mobility before" value={displayValue(detail.mobilityBefore)} />
          <DetailRow label="Mobility after" value={displayValue(detail.mobilityAfter)} />
        </dl>
      </Card>

      <div className="space-y-5">
        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold">Plan</h2>
          <dl>
            <DetailRow label="Plan length" value={`${detail.planMonths} months`} />
            <DetailRow label="Follow-up" value={formatDate(detail.followUpDate)} />
            <DetailRow label="Fee" value={formatCurrency(detail.fee)} />
            <DetailRow label="Paid" value={formatCurrency(detail.paid)} />
            <DetailRow label="Balance" value={formatCurrency(detail.balance)} />
          </dl>
        </Card>

        {detail.planLog.length > 0 ? (
          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold">Plan history</h2>
            <ul className="space-y-1.5 text-sm">
              {detail.planLog.map((log) => (
                <li key={log.id} className="flex justify-between gap-4">
                  <span className="text-muted">{formatDate(log.date)}</span>
                  <span>{log.months} months</span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </div>

      {detail.notes ? (
        <Card className="p-5 lg:col-span-3">
          <h2 className="mb-2 text-sm font-semibold">Notes</h2>
          <p className="whitespace-pre-wrap text-sm text-muted">{detail.notes}</p>
        </Card>
      ) : null}
    </div>
  );
}

function VisitsTab({
  detail,
  busy,
  onAdd,
  onEdit,
  onDelete,
}: {
  detail: PatientDetail;
  busy: boolean;
  onAdd: () => void;
  onEdit: (visit: Visit) => void;
  onDelete: (visit: Visit) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={onAdd}>
          <Plus size={16} aria-hidden />
          New visit
        </Button>
      </div>

      {detail.visits.length === 0 ? (
        <EmptyState
          title="No visits recorded"
          description="Add visits to track pain, mobility, and treatment over time."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="border-b border-border bg-background/60 text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Pain</th>
                  <th className="px-4 py-3 font-medium">Mobility</th>
                  <th className="px-4 py-3 font-medium">Treatment</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {detail.visits.map((visit) => (
                  <tr key={visit.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">{formatDate(visit.date)}</td>
                    <td className="px-4 py-3">{visit.visitType}</td>
                    <td className="px-4 py-3 tabular-nums">{displayValue(visit.painScore)}</td>
                    <td className="px-4 py-3 tabular-nums">{displayValue(visit.mobility)}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-muted">
                      {displayValue(visit.treatment)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(visit)}
                          aria-label="Edit visit"
                          className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-background hover:text-foreground"
                        >
                          <Pencil size={15} aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(visit)}
                          disabled={busy}
                          aria-label="Delete visit"
                          className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger disabled:opacity-40"
                        >
                          <Trash2 size={15} aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function PaymentsTab({
  detail,
  busy,
  onAdd,
  onReconcile,
  onDelete,
}: {
  detail: PatientDetail;
  busy: boolean;
  onAdd: () => void;
  onReconcile: () => void;
  onDelete: (payment: Payment) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-4">
        <SummaryStat label="Fee" value={formatCurrency(detail.fee)} />
        <SummaryStat label="Paid" value={formatCurrency(detail.paid)} />
        <SummaryStat label="Balance" value={formatCurrency(detail.balance)} />
        <SummaryStat label="Credit" value={formatCurrency(detail.credit)} />
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onReconcile} disabled={busy}>
          <RefreshCw size={16} aria-hidden />
          Reconcile
        </Button>
        <Button onClick={onAdd}>
          <Plus size={16} aria-hidden />
          Record payment
        </Button>
      </div>

      {detail.payments.length === 0 ? (
        <EmptyState
          title="No payments recorded"
          description="Record payments to track the patient's balance and payment status."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="border-b border-border bg-background/60 text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Method</th>
                  <th className="px-4 py-3 font-medium">Reference</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {detail.payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">{formatDate(payment.date)}</td>
                    <td className="px-4 py-3">{payment.paymentMethod}</td>
                    <td className="px-4 py-3 text-muted">{displayValue(payment.reference)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => onDelete(payment)}
                          disabled={busy}
                          aria-label="Delete payment"
                          className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger disabled:opacity-40"
                        >
                          <Trash2 size={15} aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </Card>
  );
}
