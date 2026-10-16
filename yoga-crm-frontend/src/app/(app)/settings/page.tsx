import { Settings as SettingsIcon } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/ui";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" description="Backups, data import, and preferences." />
      <EmptyState
        icon={<SettingsIcon size={28} aria-hidden />}
        title="Settings coming later"
        description="Backup, restore, and desktop-data migration are implemented in a later phase."
      />
    </div>
  );
}
