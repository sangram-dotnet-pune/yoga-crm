import { LineChart } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/ui";

export default function OutcomesPage() {
  return (
    <div>
      <PageHeader title="Outcomes" description="Outcome analytics over a selected period." />
      <EmptyState
        icon={<LineChart size={28} aria-hidden />}
        title="No outcome data yet"
        description="Range selection, KPIs, and charts are implemented once patient data exists."
      />
    </div>
  );
}
