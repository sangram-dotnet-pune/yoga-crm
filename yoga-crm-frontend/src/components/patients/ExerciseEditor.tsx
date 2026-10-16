"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { ApiError } from "@/lib/api";
import { replaceExercises } from "@/lib/patients";
import type { Exercise, ExerciseInput } from "@/lib/types";
import { Button, EmptyState, ErrorState, Spinner, inputClass } from "@/components/ui";

type Row = ExerciseInput;

function toRows(exercises: Exercise[]): Row[] {
  return exercises.map((e) => ({
    name: e.name,
    frequency: e.frequency,
    duration: e.duration,
    notes: e.notes,
  }));
}

export function ExerciseEditor({
  patientId,
  exercises,
  onSaved,
}: {
  patientId: string;
  exercises: Exercise[];
  onSaved: () => void;
}) {
  const [rows, setRows] = useState<Row[]>(() => toRows(exercises));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  function update(index: number, key: keyof Row, value: string) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
    setDirty(true);
  }

  function addRow() {
    setRows((prev) => [...prev, { name: "", frequency: "", duration: "", notes: "" }]);
    setDirty(true);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
    setDirty(true);
  }

  function move(index: number, direction: -1 | 1) {
    setRows((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setDirty(true);
  }

  async function onSave() {
    setError(null);
    const payload = rows
      .filter((row) => row.name.trim() !== "")
      .map((row) => ({
        name: row.name.trim(),
        frequency: row.frequency?.trim() || undefined,
        duration: row.duration?.trim() || undefined,
        notes: row.notes?.trim() || undefined,
      }));

    setSaving(true);
    try {
      const saved = await replaceExercises(patientId, payload);
      setRows(toRows(saved));
      setDirty(false);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save exercise plan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {error ? <ErrorState message={error} /> : null}

      {rows.length === 0 ? (
        <EmptyState
          title="No exercises yet"
          description="Build the patient's home exercise plan. Add rows and save to apply."
        />
      ) : (
        <div className="space-y-3">
          {rows.map((row, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-[1.4fr_1fr_1fr_auto]"
            >
              <input
                className={inputClass}
                placeholder="Exercise name"
                aria-label={`Exercise ${index + 1} name`}
                value={row.name}
                onChange={(e) => update(index, "name", e.target.value)}
              />
              <input
                className={inputClass}
                placeholder="Frequency"
                aria-label={`Exercise ${index + 1} frequency`}
                value={row.frequency ?? ""}
                onChange={(e) => update(index, "frequency", e.target.value)}
              />
              <input
                className={inputClass}
                placeholder="Duration / sets"
                aria-label={`Exercise ${index + 1} duration`}
                value={row.duration ?? ""}
                onChange={(e) => update(index, "duration", e.target.value)}
              />
              <div className="flex items-center justify-end gap-1">
                <button
                  type="button"
                  aria-label="Move up"
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-background hover:text-foreground disabled:opacity-40"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                >
                  <ArrowUp size={16} aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-background hover:text-foreground disabled:opacity-40"
                  onClick={() => move(index, 1)}
                  disabled={index === rows.length - 1}
                >
                  <ArrowDown size={16} aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label="Remove exercise"
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger"
                  onClick={() => removeRow(index)}
                >
                  <Trash2 size={16} aria-hidden />
                </button>
              </div>
              <input
                className={`${inputClass} sm:col-span-4`}
                placeholder="Notes"
                aria-label={`Exercise ${index + 1} notes`}
                value={row.notes ?? ""}
                onChange={(e) => update(index, "notes", e.target.value)}
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <Button variant="secondary" onClick={addRow}>
          <Plus size={16} aria-hidden />
          Add exercise
        </Button>
        <Button onClick={() => void onSave()} disabled={saving || !dirty}>
          {saving ? <Spinner /> : null}
          Save plan
        </Button>
      </div>
    </div>
  );
}
