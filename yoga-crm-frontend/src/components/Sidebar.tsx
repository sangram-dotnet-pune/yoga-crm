"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  LayoutDashboard,
  LineChart,
  LogOut,
  Receipt,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/payments", label: "Payments", icon: Wallet },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/outcomes", label: "Outcomes", icon: LineChart },
  { href: "/settings", label: "Settings", icon: Settings },
];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-sm font-semibold text-white">
          YC
        </span>
        <span className="font-semibold tracking-tight">YogaCare CRM</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Primary">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted hover:bg-background hover:text-foreground"
              }`}
            >
              <Icon size={18} aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {user ? (
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-white">
              {initials(user.name) || "DR"}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted capitalize">{user.role.toLowerCase()}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-background hover:text-foreground"
          >
            <LogOut size={18} aria-hidden />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
