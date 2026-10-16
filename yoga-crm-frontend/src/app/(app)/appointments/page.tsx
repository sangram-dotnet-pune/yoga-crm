"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { ApiError } from "@/lib/api";
import { deleteAppointment, listAppointments, updateAppointment } from "@/lib/appointments";
import { formatDate, formatTime, todayISO } from "@/lib/format";
import {
  APPOINTMENT_STATUSES,
  type Appointment,
  type AppointmentStatus,
} from "@/lib/types";
import { AppointmentForm } from "@/components/appointments/AppointmentForm";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  inputClass,
} from "@/components/ui";

type Scope = "upcoming" | "today" | "past" | "all";

const SCOPE_LABELS: Record<Scope, string> = {
  upcoming: "Upcoming",
  today: "Today",
  past: "Past",
  all: "All",
};

function statusTone(status: AppointmentStatus) {
  switch (status) {
    case "Completed":
      return "success" as const;
    case "Cancelled":
      return "danger" as const;
    case "No Show":
      return "warning" as const;
    default:
      return "primary" as const;
  }
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AppointmentStatus | "">("");
  const [scope, setScope] = useState<Scope>("upcoming");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);

  useEffect(() => {
    let active = true;
    listAppointments()
      .then((rows) => {
        if (!active) return;
        setAppointments(rows);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : "Unable to load appointments.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  function refresh() {
    setLoading(true);
    setReloadKey((key) => key + 1);
  }

  async function onStatusChange(appointment: Appointment, next: AppointmentStatus) {
    const previous = appointment.status;
    setAppointments((rows) =>
      rows ? rows.map((row) => (row.id === appointment.id ? { ...row, status: next } : row)) : rows,
    );
    try {
      await updateAppointment(appointment.id, { status: next });
    } catch (err) {
      setAppointments((rows) =>
        rows
          ? rows.map((row) => (row.id === appointment.id ? { ...row, status: previous } : row))
          : rows,
      );
      setError(err instanceof ApiError ? err.message : "Unable to update status.");
    }
  }

  async function onDelete(appointment: Appointment) {
    if (!window.confirm(`Delete the appointment for ${appointment.patientName}?`)) return;
    try {
      await deleteAppointment(appointment.id);
      setAppointments((rows) => (rows ? rows.filter((row) => row.id !== appointment.id) : rows));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to delete appointment.");
    }
  }

  const today = todayISO();
  const term = search.trim().toLowerCase();
  const visible = (appointments ?? []).filter((appointment) => {
    if (status && appointment.status !== status) return false;
    if (scope === "today" && appointment.date !== today) return false;
    if (scope === "upcoming" && appointment.date < today) return false;
    if (scope === "past" && appointment.date >= today) return false;
    if (term) {
      const haystack = `${appointment.patientName} ${appointment.patientCode} ${appointment.type}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });

  return (
    <div>
      <PageHeader
        title="Appointments"
        description="Scheduling and appointment status."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus size={16} aria-hidden />
            New appointment
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            placeholder="Search by patient or type"
            aria-label="Search appointments"
            className={`${inputClass} pl-9`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          aria-label="Filter by status"
          className={`${inputClass} lg:w-44`}
          value={status}
          onChange={(e) => setStatus(e.target.value as AppointmentStatus | "")}
        >
          <option value="">All statuses</option>
          {APPOINTMENT_STATUSES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <div className="inline-flex rounded-lg border border-border bg-surface p-1">
          {(Object.keys(SCOPE_LABELS) as Scope[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setScope(option)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                scope === option ? "bg-primary/10 text-primary" : "text-muted hover:text-foreground"
              }`}
            >
              {SCOPE_LABELS[option]}
            </button>
          ))}
        </div>
      </div>

      {error ? <ErrorState message={error} /> : null}

      {loading && !appointments ? (
        <LoadingState label="Loading appointments…" />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<CalendarDays size={28} aria-hidden />}
          title={appointments && appointments.length > 0 ? "No matching appointments" : "No appointments yet"}
          description={
            appointments && appointments.length > 0
              ? "Try a different scope, status, or search term."
              : "Book your first appointment to see it on the schedule."
          }
          action={
            !appointments || appointments.length === 0 ? (
              <Button
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <Plus size={16} aria-hidden />
                New appointment
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="border-b border-border bg-background/60 text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Patient</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((appointment) => (
                  <tr
                    key={appointment.id}
                    className="border-b border-border last:border-0 hover:bg-background/60"
                  >
                    <td className="px-4 py-3 text-muted">{formatDate(appointment.date)}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {formatTime(appointment.startTime)} – {formatTime(appointment.endTime)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{appointment.patientName}</p>
                      <p className="font-mono text-xs text-muted">{appointment.patientCode}</p>
                    </td>
                    <td className="px-4 py-3 text-muted">{appointment.type}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Badge tone={statusTone(appointment.status)}>{appointment.status}</Badge>
                        <select
                          aria-label={`Change status for ${appointment.patientName}`}
                          className={`${inputClass} w-32 py-1 text-xs`}
                          value={appointment.status}
                          onChange={(e) =>
                            void onStatusChange(appointment, e.target.value as AppointmentStatus)
                          }
                        >
                          {APPOINTMENT_STATUSES.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          aria-label="Edit appointment"
                          onClick={() => {
                            setEditing(appointment);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil size={16} aria-hidden />
                        </Button>
                        <Button
                          variant="ghost"
                          aria-label="Delete appointment"
                          onClick={() => void onDelete(appointment)}
                        >
                          <Trash2 size={16} aria-hidden />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {formOpen ? (
        <AppointmentForm
          appointment={editing ?? undefined}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSaved={refresh}
        />
      ) : null}
    </div>
  );
}
