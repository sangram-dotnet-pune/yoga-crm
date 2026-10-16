import { Users } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/ui";

export default function PatientsPage() {
  return (
    <div>
      <PageHeader title="Patients" description="Patient records and treatment history." />
      <EmptyState
        icon={<Users size={28} aria-hidden />}
        title="No patients yet"
        description="Patient registration, search, and detail views are implemented in the next phase."
      />
    </div>
  );
}
