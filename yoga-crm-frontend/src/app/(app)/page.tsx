"use client";

import { CalendarDays, Users } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { EmptyState, PageHeader } from "@/components/ui";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={
          user ? `Signed in as ${user.name}` : "Clinic overview"
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="patients-empty">
          <h2 id="patients-empty" className="sr-only">
            Patients
          </h2>
          <EmptyState
            icon={<Users size={28} aria-hidden />}
            title="No patients yet"
            description="Patient registration and records are added in the next implementation phase."
          />
        </section>

        <section aria-labelledby="schedule-empty">
          <h2 id="schedule-empty" className="sr-only">
            Schedule
          </h2>
          <EmptyState
            icon={<CalendarDays size={28} aria-hidden />}
            title="Nothing scheduled"
            description="Appointments and today's schedule will appear here once the module is implemented."
          />
        </section>
      </div>
    </div>
  );
}
