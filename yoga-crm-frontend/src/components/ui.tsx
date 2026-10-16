"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-border bg-surface px-6 py-14 text-center">
      {icon ? <div className="mb-3 text-muted">{icon}</div> : null}
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 max-w-md text-sm text-muted">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-surface ${className}`}>{children}</div>
  );
}

type BadgeTone = "neutral" | "primary" | "success" | "warning" | "danger";

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: "bg-muted/15 text-muted",
  primary: "bg-primary/15 text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  danger: "bg-danger/15 text-danger",
};

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
    />
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-14 text-sm text-muted">
      <Spinner />
      {label}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
      {message}
    </div>
  );
}

const BUTTON_VARIANTS = {
  primary:
    "bg-primary text-white hover:bg-primary-hover disabled:opacity-60",
  secondary:
    "border border-border bg-surface text-foreground hover:bg-background disabled:opacity-60",
  ghost: "text-muted hover:bg-background hover:text-foreground disabled:opacity-60",
  danger: "bg-danger text-white hover:opacity-90 disabled:opacity-60",
} as const;

export function Button({
  variant = "primary",
  type = "button",
  className = "",
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof BUTTON_VARIANTS;
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${BUTTON_VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary disabled:opacity-60";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && !error ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
    </div>
  );
}

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close dialog"
        className="fixed inset-0 bg-black/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative my-8 w-full rounded-2xl border border-border bg-surface shadow-xl ${
          size === "lg" ? "max-w-3xl" : "max-w-xl"
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            {description ? <p className="mt-0.5 text-sm text-muted">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-background hover:text-foreground"
          >
            <X size={16} aria-hidden />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
        {footer ? (
          <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone: BadgeTone =
    status === "Active" ? "success" : status === "Follow-up" ? "warning" : "neutral";
  return <Badge tone={tone}>{status}</Badge>;
}

export function PaymentBadge({ status }: { status: string }) {
  const tone: BadgeTone =
    status === "Done" ? "success" : status === "Partially paid" ? "warning" : "danger";
  return <Badge tone={tone}>{status}</Badge>;
}
