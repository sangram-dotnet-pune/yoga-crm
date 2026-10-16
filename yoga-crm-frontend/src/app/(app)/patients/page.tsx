"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Users } from "lucide-react";
import { ApiError } from "@/lib/api";
import { listPatients } from "@/lib/patients";
import { formatCurrency, formatDate } from "@/lib/format";
import { PATIENT_STATUSES, type PatientList, type PatientStatus } from "@/lib/types";
import { PatientForm } from "@/components/patients/PatientForm";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  PaymentBadge,
  StatusBadge,
  inputClass,
} from "@/components/ui";

const PAGE_SIZE = 25;

export default function PatientsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<PatientStatus | "">("");
  const [page, setPage] = useState(1);

  const [data, setData] = useState<PatientList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
      setLoading(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;
    listPatients({
      search: debouncedSearch || undefined,
      status: status || undefined,
      page,
      pageSize: PAGE_SIZE,
    })
      .then((result) => {
        if (!active) return;
        setData(result);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : "Unable to load patients.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [debouncedSearch, status, page, reloadKey]);

  function refresh() {
    setLoading(true);
    setReloadKey((key) => key + 1);
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div>
      <PageHeader
        title="Patients"
        description="Patient records, treatment history, and payment status."
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus size={16} aria-hidden />
            New patient
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            placeholder="Search by name, code, condition, or phone"
            aria-label="Search patients"
            className={`${inputClass} pl-9`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          aria-label="Filter by status"
          className={`${inputClass} sm:w-48`}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as PatientStatus | "");
            setPage(1);
            setLoading(true);
          }}
        >
          <option value="">All statuses</option>
          {PATIENT_STATUSES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {error ? <ErrorState message={error} /> : null}

      {loading && !data ? (
        <LoadingState label="Loading patients…" />
      ) : data && data.items.length === 0 ? (
        <EmptyState
          icon={<Users size={28} aria-hidden />}
          title={debouncedSearch || status ? "No matching patients" : "No patients yet"}
          description={
            debouncedSearch || status
              ? "Try a different search term or clear the status filter."
              : "Register your first patient to start tracking plans and payments."
          }
          action={
            !debouncedSearch && !status ? (
              <Button onClick={() => setFormOpen(true)}>
                <Plus size={16} aria-hidden />
                New patient
              </Button>
            ) : undefined
          }
        />
      ) : data ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b border-border bg-background/60 text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Condition</th>
                  <th className="px-4 py-3 font-medium">Visit date</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 text-right font-medium">Balance</th>
                </tr>
              </thead>
              <tbody className={loading ? "opacity-60" : ""}>
                {data.items.map((patient) => (
                  <tr
                    key={patient.id}
                    className="border-b border-border last:border-0 hover:bg-background/60"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-muted">
                      {patient.patientCode}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/patients/${patient.id}`}
                        className="font-medium text-foreground hover:text-primary"
                      >
                        {patient.name}
                      </Link>
                      <p className="text-xs text-muted">
                        {patient.age ? `${patient.age}y` : "—"}
                        {patient.gender ? ` · ${patient.gender}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3">{patient.condition}</td>
                    <td className="px-4 py-3 text-muted">{formatDate(patient.visitDate)}</td>
                    <td className="px-4 py-3 text-muted">{patient.planMonths} mo</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={patient.status} />
                    </td>
                    <td className="px-4 py-3">
                      <PaymentBadge status={patient.paymentStatus} />
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatCurrency(patient.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm">
            <p className="text-muted">
              {data.total} patient{data.total === 1 ? "" : "s"} · page {data.page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                disabled={page <= 1}
                onClick={() => {
                  setPage((p) => Math.max(1, p - 1));
                  setLoading(true);
                }}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                disabled={page >= totalPages}
                onClick={() => {
                  setPage((p) => Math.min(totalPages, p + 1));
                  setLoading(true);
                }}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {formOpen ? (
        <PatientForm onClose={() => setFormOpen(false)} onSaved={refresh} />
      ) : null}
    </div>
  );
}
