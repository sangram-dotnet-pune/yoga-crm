"use client";

import { useRef, useState } from "react";
import { Paperclip } from "lucide-react";
import { ApiError } from "@/lib/api";
import { updateXray, uploadXray } from "@/lib/xrays";
import { todayISO } from "@/lib/format";
import { XRAY_KINDS, type Xray, type XrayKind } from "@/lib/types";
import { Button, Field, Modal, Spinner, inputClass } from "@/components/ui";

type FormState = {
  file: File | null;
  date: string;
  kind: XrayKind;
  bodyArea: string;
  title: string;
  notes: string;
};

function initialState(xray?: Xray): FormState {
  return {
    file: null,
    date: xray?.date ?? todayISO(),
    kind: xray?.kind ?? "Record",
    bodyArea: xray?.bodyArea ?? "",
    title: xray?.title ?? "",
    notes: xray?.notes ?? "",
  };
}

export function XrayForm({
  patientId,
  xray,
  onClose,
  onSaved,
}: {
  patientId: string;
  xray?: Xray;
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = Boolean(xray);
  const [form, setForm] = useState<FormState>(() => initialState(xray));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!editing && !form.file) {
      setError("Choose an image file to upload.");
      return;
    }

    setSubmitting(true);
    try {
      if (editing && xray) {
        await updateXray(xray.id, {
          date: form.date,
          bodyArea: form.bodyArea.trim() || null,
          title: form.title.trim() || null,
          notes: form.notes.trim() || null,
        });
      } else if (form.file) {
        await uploadXray(patientId, form.file, {
          date: form.date,
          kind: form.kind,
          bodyArea: form.bodyArea.trim() || undefined,
          title: form.title.trim() || undefined,
          notes: form.notes.trim() || undefined,
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save the X-ray record.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? "Edit X-ray record" : "Add X-ray record"}
      description="Store images appropriate for your clinic's privacy policy."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="xray-form" disabled={submitting}>
            {submitting ? <Spinner /> : null}
            {editing ? "Save changes" : "Upload"}
          </Button>
        </>
      }
    >
      <form id="xray-form" onSubmit={onSubmit} className="space-y-4" noValidate>
        {error ? (
          <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}

        {!editing ? (
          <Field label="Image (JPEG, PNG or WebP)" htmlFor="xf-file">
            <input
              ref={fileRef}
              id="xf-file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className={inputClass}
              onChange={(e) => set("file", e.target.files?.[0] ?? null)}
            />
          </Field>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date" htmlFor="xf-date">
            <input
              id="xf-date"
              type="date"
              className={inputClass}
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              required
            />
          </Field>
          <Field label="Type" htmlFor="xf-kind">
            <select
              id="xf-kind"
              className={inputClass}
              value={form.kind}
              disabled={editing}
              onChange={(e) => set("kind", e.target.value as XrayKind)}
            >
              {XRAY_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {kind}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Body area" htmlFor="xf-body-area">
            <input
              id="xf-body-area"
              className={inputClass}
              value={form.bodyArea}
              onChange={(e) => set("bodyArea", e.target.value)}
            />
          </Field>
          <Field label="Title" htmlFor="xf-title">
            <input
              id="xf-title"
              className={inputClass}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </Field>
        </div>

        <Field label="Notes" htmlFor="xf-notes">
          <textarea
            id="xf-notes"
            rows={2}
            className={inputClass}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </Field>

        {form.file ? (
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <Paperclip size={13} aria-hidden />
            {form.file.name}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}
