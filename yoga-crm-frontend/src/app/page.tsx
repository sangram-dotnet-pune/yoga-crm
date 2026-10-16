"use client";

import { useEffect, useState } from "react";
import { getHealth, type Health } from "@/lib/api";

type Status = "loading" | "ok" | "error";

export default function Home() {
  const [status, setStatus] = useState<Status>("loading");
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    let active = true;
    getHealth()
      .then((result) => {
        if (!active) return;
        setHealth(result);
        setStatus("ok");
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, []);

  const badge =
    status === "ok"
      ? "bg-green-100 text-green-800"
      : status === "error"
        ? "bg-red-100 text-red-800"
        : "bg-zinc-100 text-zinc-600";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">YogaCare CRM</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Clinic management for a yoga and rehabilitation practice.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Backend connection</span>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${badge}`} role="status">
            {status === "loading" ? "Checking…" : status === "ok" ? "Connected" : "Unavailable"}
          </span>
        </div>
        {health ? (
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-zinc-600 dark:text-zinc-400">
            <div>
              <dt className="text-xs uppercase tracking-wide text-zinc-400">Service</dt>
              <dd>{health.service}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-zinc-400">Version</dt>
              <dd>{health.version}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-zinc-400">Uptime</dt>
              <dd>{health.uptimeSeconds}s</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-zinc-400">Status</dt>
              <dd>{health.status}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-4 text-sm text-zinc-500">
            {status === "error"
              ? "Could not reach the API. Ensure the backend is running on http://localhost:4000."
              : "Contacting the API…"}
          </p>
        )}
      </div>
    </main>
  );
}
