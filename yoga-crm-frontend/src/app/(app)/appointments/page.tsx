import { CalendarDays } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/ui";

export default function AppointmentsPage() {
  return (
    <div>
      <PageHeader title="Appointments" description="Scheduling and appointment status." />
      <EmptyState
        icon={<CalendarDays size={28} aria-hidden />}
        title="No appointments yet"
        description="Booking, filters, and inline status changes are implemented in a later phase."
      />
    </div>
  );
}
