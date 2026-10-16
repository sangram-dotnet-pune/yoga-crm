import { Receipt } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/ui";

export default function ExpensesPage() {
  return (
    <div>
      <PageHeader title="Expenses" description="Clinic expense tracking." />
      <EmptyState
        icon={<Receipt size={28} aria-hidden />}
        title="No expenses yet"
        description="Expense entry, filters, and category breakdown are implemented in a later phase."
      />
    </div>
  );
}
