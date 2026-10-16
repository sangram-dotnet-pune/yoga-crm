import { Wallet } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/ui";

export default function PaymentsPage() {
  return (
    <div>
      <PageHeader title="Payments" description="Fees, payments, and reconciliation." />
      <EmptyState
        icon={<Wallet size={28} aria-hidden />}
        title="No payments yet"
        description="The clinic-wide payment ledger and reconciliation are implemented in a later phase."
      />
    </div>
  );
}
