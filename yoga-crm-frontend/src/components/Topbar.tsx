"use client";

import { Menu } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ThemeToggle } from "@/components/ThemeToggle";

function greeting(name: string): string {
  return `Welcome back, ${name}`;
}

function todayLabel(): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur md:px-9">
      <button
        type="button"
        onClick={onMenu}
        aria-label="Open navigation"
        className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted md:hidden"
      >
        <Menu size={18} aria-hidden />
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {user ? greeting(user.name) : "YogaCare CRM"}
        </p>
        <p className="truncate text-xs text-muted">{todayLabel()}</p>
      </div>

      <ThemeToggle />
    </header>
  );
}
