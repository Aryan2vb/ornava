"use client";

import { useState, useTransition } from "react";
import { Icon } from "./Icon";

type OverlayPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "bottom-center";
type OverlaySize = "small" | "medium" | "large";

const PURITY_OPTIONS = ["24K", "22K", "20K", "18K"] as const;
const SIZES: { id: OverlaySize; label: string }[] = [
  { id: "small", label: "S" },
  { id: "medium", label: "M" },
  { id: "large", label: "L" },
];
const POSITIONS: { id: OverlayPosition; label: string }[] = [
  { id: "top-left", label: "↖" },
  { id: "top-right", label: "↗" },
  { id: "bottom-left", label: "↙" },
  { id: "bottom-right", label: "↘" },
  { id: "bottom-center", label: "↓" },
];

export function OverlayTextPanel({
  generationId,
  initialOverlay,
}: {
  generationId: string;
  imageUrl: string;
  initialOverlay?: { purity: string; weightGm: string; position: string; size?: string } | null;
}) {
  const [open, setOpen] = useState(!!initialOverlay);
  const [purity, setPurity] = useState(initialOverlay?.purity ?? "22K");
  const [weightGm, setWeightGm] = useState(initialOverlay?.weightGm ?? "");
  const [position, setPosition] = useState<OverlayPosition>((initialOverlay?.position as OverlayPosition) ?? "bottom-left");
  const [size, setSize] = useState<OverlaySize>((initialOverlay?.size as OverlaySize) ?? "medium");
  const [saved, setSaved] = useState(!!initialOverlay);
  const [isSaving, startSaving] = useTransition();

  const hasText = purity && weightGm.length > 0;
  const displayText = hasText ? `Purity: ${purity} | Weight: ${weightGm}gm` : null;

  function save() {
    if (!hasText) return;
    startSaving(async () => {
      const res = await fetch(`/api/generations/${generationId}/overlay`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ purity, weightGm, position, size }),
      });
      if (res.ok) setSaved(true);
    });
  }

  function clear() {
    startSaving(async () => {
      await fetch(`/api/generations/${generationId}/overlay`, { method: "DELETE" });
      setWeightGm("");
      setSaved(false);
    });
  }

  return (
    <div className="overlay-panel">
      {/* Collapsible header */}
      <button type="button" className="overlay-header" onClick={() => setOpen(!open)}>
        <span className="overlay-header-left">
          <Icon name="diamond" size={15} />
          <span>Weight & Purity</span>
        </span>
        <span className="overlay-header-right">
          {saved && displayText && (
            <span className="overlay-saved-pill">{displayText}</span>
          )}
          <span className={`overlay-chevron ${open ? "overlay-chevron--open" : ""}`}>
            <Icon name="arrow-left" size={12} style={{ transform: "rotate(-90deg)" }} />
          </span>
        </span>
      </button>

      {/* Body */}
      {open && (
        <div className="overlay-body">
          {/* Inputs row */}
          <div className="overlay-inputs">
            <div className="overlay-field overlay-field--purity">
              <label className="field-label">Purity</label>
              <select
                className="select"
                value={purity}
                onChange={(e) => { setPurity(e.target.value); setSaved(false); }}
              >
                {PURITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="overlay-field overlay-field--weight">
              <label className="field-label">Weight</label>
              <div className="overlay-weight-wrap">
                <input
                  className="input"
                  type="text"
                  inputMode="decimal"
                  placeholder="30"
                  value={weightGm}
                  onChange={(e) => { setWeightGm(e.target.value.replace(/[^0-9.]/g, "")); setSaved(false); }}
                />
                <span className="overlay-weight-unit">gm</span>
              </div>
            </div>
          </div>

          {/* Controls row */}
          <div className="overlay-controls">
            <div className="overlay-control-group">
              <label className="field-label">Position</label>
              <div className="overlay-btn-row">
                {POSITIONS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`overlay-pick ${position === p.id ? "overlay-pick--active" : ""}`}
                    onClick={() => { setPosition(p.id); setSaved(false); }}
                    aria-label={p.id}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="overlay-control-group">
              <label className="field-label">Size</label>
              <div className="overlay-btn-row">
                {SIZES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`overlay-pick ${size === s.id ? "overlay-pick--active" : ""}`}
                    onClick={() => { setSize(s.id); setSaved(false); }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action */}
          <div className="overlay-action">
            <button
              className="button gold"
              type="button"
              disabled={!hasText || isSaving || saved}
              onClick={save}
              style={{ flex: 1 }}
            >
              {isSaving ? "Saving..." : saved ? "✓ Applied" : "Apply to image"}
            </button>
            {saved && (
              <button
                className="button secondary"
                type="button"
                onClick={clear}
                disabled={isSaving}
                aria-label="Clear overlay"
                style={{ minWidth: "46px" }}
              >
                <Icon name="x" size={14} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
