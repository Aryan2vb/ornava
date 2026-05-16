"use client";

import { useState, useTransition } from "react";

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
    <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: 600,
        }}
      >
        <span>📋 Weight & Purity</span>
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {saved && <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: 500 }}>✓ Saved</span>}
          <span style={{ fontSize: "12px", transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0)" }}>▼</span>
        </span>
      </button>

      {/* Collapsible body */}
      {open && (
        <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Purity + Weight in one row */}
          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ flex: "0 0 auto" }}>
              <label style={{ fontSize: "11px", fontWeight: 500, color: "#666", marginBottom: "4px", display: "block" }}>Purity</label>
              <select
                value={purity}
                onChange={(e) => { setPurity(e.target.value); setSaved(false); }}
                style={{ padding: "7px 10px", borderRadius: "6px", border: "1px solid #e0e0e0", fontSize: "13px", background: "#fafafa" }}
              >
                {PURITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "11px", fontWeight: 500, color: "#666", marginBottom: "4px", display: "block" }}>Weight (gm)</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="30"
                value={weightGm}
                onChange={(e) => { setWeightGm(e.target.value.replace(/[^0-9.]/g, "")); setSaved(false); }}
                style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #e0e0e0", fontSize: "13px", background: "#fafafa" }}
              />
            </div>
          </div>

          {/* Position + Size in one row */}
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "11px", fontWeight: 500, color: "#666", marginBottom: "4px", display: "block" }}>Position</label>
              <div style={{ display: "flex", gap: "3px" }}>
                {POSITIONS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`button ${position === p.id ? "gold" : "secondary"}`}
                    style={{ padding: "5px 7px", fontSize: "11px", minWidth: "28px" }}
                    onClick={() => { setPosition(p.id); setSaved(false); }}
                    aria-label={p.id}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: "11px", fontWeight: 500, color: "#666", marginBottom: "4px", display: "block" }}>Size</label>
              <div style={{ display: "flex", gap: "3px" }}>
                {SIZES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`button ${size === s.id ? "gold" : "secondary"}`}
                    style={{ padding: "5px 9px", fontSize: "11px", minWidth: "28px" }}
                    onClick={() => { setSize(s.id); setSaved(false); }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            <button
              className="button gold"
              type="button"
              disabled={!hasText || isSaving || saved}
              onClick={save}
              style={{ flex: 1, fontSize: "13px", padding: "8px" }}
            >
              {isSaving ? "Saving..." : saved ? "✓ Applied" : "Apply to image"}
            </button>
            {saved && (
              <button
                className="button secondary"
                type="button"
                onClick={clear}
                disabled={isSaving}
                style={{ fontSize: "12px", padding: "8px 12px" }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
