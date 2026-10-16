"use client";

import { useEffect, useState } from "react";
import { RefreshCw, RotateCw, X, ZoomIn, ZoomOut } from "lucide-react";
import type { Xray } from "@/lib/types";
import { Button } from "@/components/ui";

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.1;

export function XrayViewer({ xray, onClose }: { xray: Xray; onClose: () => void }) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  function clamp(value: number) {
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(value * 100) / 100));
  }

  const label = xray.title || (xray.kind === "Record" ? "X-ray record" : `${xray.kind} X-ray`);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90">
      <div className="flex items-center justify-between gap-4 px-4 py-3 text-white">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{label}</p>
          <p className="truncate text-xs text-white/60">
            {xray.date}
            {xray.bodyArea ? ` · ${xray.bodyArea}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close viewer"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white"
        >
          <X size={20} aria-hidden />
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-hidden p-4">
        <button
          type="button"
          onClick={() => {
            setZoom(1);
            setRotation(0);
          }}
          aria-label="Reset zoom and rotation"
          className="max-h-full max-w-full cursor-zoom-out"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={xray.url}
            alt={label}
            className="max-h-[78vh] max-w-full object-contain transition-transform"
            style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
          />
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 border-t border-white/10 px-4 py-3">
        <Button
          variant="ghost"
          className="text-white hover:bg-white/10"
          onClick={() => setZoom((z) => clamp(z - ZOOM_STEP))}
          disabled={zoom <= MIN_ZOOM}
          aria-label="Zoom out"
        >
          <ZoomOut size={16} aria-hidden />
        </Button>
        <span className="w-14 text-center text-sm tabular-nums text-white/80">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          variant="ghost"
          className="text-white hover:bg-white/10"
          onClick={() => setZoom((z) => clamp(z + ZOOM_STEP))}
          disabled={zoom >= MAX_ZOOM}
          aria-label="Zoom in"
        >
          <ZoomIn size={16} aria-hidden />
        </Button>
        <Button
          variant="ghost"
          className="text-white hover:bg-white/10"
          onClick={() => setRotation((r) => (r + 90) % 360)}
          aria-label="Rotate 90 degrees"
        >
          <RotateCw size={16} aria-hidden />
          Rotate
        </Button>
        <Button
          variant="ghost"
          className="text-white hover:bg-white/10"
          onClick={() => {
            setZoom(1);
            setRotation(0);
          }}
        >
          <RefreshCw size={16} aria-hidden />
          Reset
        </Button>
      </div>
    </div>
  );
}
