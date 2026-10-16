"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { status, user } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status !== "authenticated" || !user) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted" role="status">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen md:pl-60">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-border bg-surface md:block">
        <Sidebar />
      </aside>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-60 border-r border-border bg-surface">
            <Sidebar onNavigate={() => setSidebarOpen(false)} />
          </aside>
        </div>
      ) : null}

      <Topbar onMenu={() => setSidebarOpen(true)} />
      <main className="mx-auto max-w-[1500px] px-4 py-6 md:px-9 md:py-8">{children}</main>
    </div>
  );
}
