"use client";

import { useRef, useState } from "react";
import { Image as ImageIcon, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { ApiError } from "@/lib/api";
import { deleteXray, uploadXray } from "@/lib/xrays";
import { formatDate, todayISO } from "@/lib/format";
import type { Xray } from "@/lib/types";
import { Button, Card, EmptyState, ErrorState, Spinner } from "@/components/ui";
import { XrayForm } from "./XrayForm";
import { XrayViewer } from "./XrayViewer";

type LegacyKind = "Before" | "After";

function LegacyTile({
  label,
  xray,
  busy,
  onView,
  onUpload,
}: {
  label: string;
  xray?: Xray;
  busy: boolean;
  onView: (xray: Xray) => void;
  onUpload: (kind: LegacyKind, file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const kind: LegacyKind = label.startsWith("Before") ? "Before" : "After";

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{label}</p>
        <Button
          variant="secondary"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          <Upload size={15} aria-hidden />
          {xray ? "Replace" : "Upload"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(kind, file);
            e.target.value = "";
          }}
        />
      </div>
      {xray ? (
        <button type="button" onClick={() => onView(xray)} className="block w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={xray.url}
            alt={label}
            className="h-48 w-full rounded-lg border border-border object-cover"
          />
        </button>
      ) : (
        <div className="grid h-48 place-items-center rounded-lg border border-dashed border-border text-sm text-muted">
          No image uploaded
        </div>
      )}
    </Card>
  );
}

export function XraysTab({
  patientId,
  xrays,
  onChanged,
}: {
  patientId: string;
  xrays: Xray[];
  onChanged: () => void;
}) {
  const [viewing, setViewing] = useState<Xray | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Xray | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const legacyBefore = xrays.find((x) => x.kind === "Before");
  const legacyAfter = xrays.find((x) => x.kind === "After");
  const records = xrays.filter((x) => x.kind === "Record");

  async function quickUpload(kind: LegacyKind, file: File) {
    setBusy(true);
    setError(null);
    try {
      await uploadXray(patientId, file, { date: todayISO(), kind });
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to upload the image.");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(xray: Xray) {
    if (!window.confirm("Delete this X-ray record? This cannot be undone.")) return;
    setBusy(true);
    setError(null);
    try {
      await deleteXray(xray.id);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to delete the record.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {error ? <ErrorState message={error} /> : null}

      <section>
        <h2 className="mb-3 text-sm font-semibold">Before / after comparison</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <LegacyTile
            label="Before"
            xray={legacyBefore}
            busy={busy}
            onView={setViewing}
            onUpload={quickUpload}
          />
          <LegacyTile
            label="After"
            xray={legacyAfter}
            busy={busy}
            onView={setViewing}
            onUpload={quickUpload}
          />
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Dated X-ray records</h2>
          <Button
            onClick={() => {
              setEditing(undefined);
              setFormOpen(true);
            }}
          >
            <Plus size={16} aria-hidden />
            Add record
          </Button>
        </div>

        {records.length === 0 ? (
          <EmptyState
            icon={<ImageIcon size={26} aria-hidden />}
            title="No X-ray records"
            description="Upload dated X-ray images with notes and body area for the patient's record."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {records.map((xray) => (
              <Card key={xray.id} className="overflow-hidden">
                <button type="button" onClick={() => setViewing(xray)} className="block w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={xray.url}
                    alt={xray.title || "X-ray record"}
                    className="h-44 w-full bg-background object-cover"
                  />
                </button>
                <div className="p-3">
                  <p className="truncate text-sm font-medium">
                    {xray.title || xray.bodyArea || "X-ray record"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {formatDate(xray.date)}
                    {xray.bodyArea ? ` · ${xray.bodyArea}` : ""}
                  </p>
                  <div className="mt-2 flex justify-end gap-1">
                    <button
                      type="button"
                      aria-label="Edit X-ray"
                      disabled={busy}
                      onClick={() => {
                        setEditing(xray);
                        setFormOpen(true);
                      }}
                      className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-background hover:text-foreground disabled:opacity-40"
                    >
                      <Pencil size={15} aria-hidden />
                    </button>
                    <button
                      type="button"
                      aria-label="Delete X-ray"
                      disabled={busy}
                      onClick={() => void onDelete(xray)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger disabled:opacity-40"
                    >
                      <Trash2 size={15} aria-hidden />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <p className="text-xs text-muted">
        Store only images appropriate for your clinic&apos;s privacy policy. Images are kept in
        private storage and served through short-lived signed URLs; they are not used to diagnose.
      </p>

      {busy ? (
        <div className="flex items-center gap-2 text-sm text-muted">
          <Spinner />
          Working…
        </div>
      ) : null}

      {viewing ? <XrayViewer key={viewing.id} xray={viewing} onClose={() => setViewing(null)} /> : null}

      {formOpen ? (
        <XrayForm
          patientId={patientId}
          xray={editing}
          onClose={() => setFormOpen(false)}
          onSaved={onChanged}
        />
      ) : null}
    </div>
  );
}
