"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Icon } from "./Icon";

type LogoPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "bottom-center";

type LogoState =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "ready"; logoUrl: string; position: LogoPosition; sizePercent: number; enabled: boolean };

const POSITIONS: { id: LogoPosition; label: string }[] = [
  { id: "top-left", label: "↖" },
  { id: "top-right", label: "↗" },
  { id: "bottom-left", label: "↙" },
  { id: "bottom-right", label: "↘" },
  { id: "bottom-center", label: "↓" },
];

const SAMPLE_IMAGE = "/icons/sample-jewelry.jpg";

function getImageDimensions(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); resolve({ width: img.naturalWidth, height: img.naturalHeight }); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read image.")); };
    img.src = url;
  });
}

function logoPositionStyle(position: LogoPosition, sizePercent: number): React.CSSProperties {
  const size = `${sizePercent}%`;
  const pad = "3%";
  const base: React.CSSProperties = { position: "absolute", width: size, height: "auto", objectFit: "contain" };

  switch (position) {
    case "top-left": return { ...base, top: pad, left: pad };
    case "top-right": return { ...base, top: pad, right: pad };
    case "bottom-left": return { ...base, bottom: pad, left: pad };
    case "bottom-right": return { ...base, bottom: pad, right: pad };
    case "bottom-center": return { ...base, bottom: pad, left: "50%", transform: "translateX(-50%)" };
  }
}

export function LogoSettings() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<LogoState>({ status: "loading" });
  const [localLogoUrl, setLocalLogoUrl] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Load current settings
  useEffect(() => {
    fetch("/api/profile/logo")
      .then((r) => r.json())
      .then((data) => {
        if (data.hasLogo) {
          setState({ status: "ready", logoUrl: data.logoUrl, position: data.position, sizePercent: data.sizePercent, enabled: data.enabled });
          setLocalLogoUrl(data.logoUrl);
        } else {
          setState({ status: "empty" });
        }
      })
      .catch(() => setState({ status: "empty" }));
  }, []);

  async function uploadLogo(file: File) {
    setError(null);
    if (file.type !== "image/png") { setError("Only PNG files supported (for transparency)"); return; }
    if (file.size > 2 * 1024 * 1024) { setError("Logo must be under 2MB"); return; }

    try {
      const dims = await getImageDimensions(file);
      if (dims.width < 100 || dims.height < 100) { setError("Logo must be at least 100×100px"); return; }

      const res = await fetch("/api/profile/logo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fileSizeBytes: file.size, width: dims.width, height: dims.height }),
      });
      if (!res.ok) throw new Error("Failed to get upload URL");
      const { uploadUrl } = await res.json();

      await fetch(uploadUrl, { method: "PUT", headers: { "content-type": "image/png" }, body: file });

      const previewUrl = URL.createObjectURL(file);
      setLocalLogoUrl(previewUrl);
      setState({ status: "ready", logoUrl: previewUrl, position: "bottom-right", sizePercent: 12, enabled: true });
    } catch {
      setError("Upload failed. Try again.");
    }
  }

  function updateSettings(updates: { position?: LogoPosition; sizePercent?: number; enabled?: boolean }) {
    startSaving(async () => {
      const res = await fetch("/api/profile/logo", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok && state.status === "ready") {
        setState({ ...state, ...updates });
      }
    });
  }

  if (state.status === "loading") {
    return <div className="panel"><p className="copy">Loading logo settings...</p></div>;
  }

  return (
    <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong>Shop Logo</strong>
        {state.status === "ready" && (
          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
            <input
              type="checkbox"
              checked={state.enabled}
              onChange={(e) => updateSettings({ enabled: e.target.checked })}
            />
            Enabled
          </label>
        )}
      </div>

      {/* Preview */}
      {state.status === "ready" && localLogoUrl && (
        <div style={{ position: "relative", borderRadius: "8px", overflow: "hidden", aspectRatio: "4/3", background: "#f0f0f0" }}>
          <img src={SAMPLE_IMAGE} alt="Sample" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <img
            src={localLogoUrl}
            alt="Your logo"
            style={logoPositionStyle(state.position, state.sizePercent)}
          />
        </div>
      )}

      {/* Upload button */}
      {state.status === "empty" ? (
        <button
          className="button gold"
          type="button"
          onClick={() => inputRef.current?.click()}
          style={{ width: "100%" }}
        >
          <Icon name="camera" size={16} />
          Upload Logo (PNG)
        </button>
      ) : (
        <button
          className="button secondary"
          type="button"
          onClick={() => inputRef.current?.click()}
          style={{ fontSize: "13px" }}
        >
          Change Logo
        </button>
      )}

      <input
        ref={inputRef}
        accept="image/png"
        type="file"
        className="visually-hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadLogo(f); }}
      />

      {/* Position picker */}
      {state.status === "ready" && (
        <div>
          <label style={{ fontSize: "13px", fontWeight: 500, marginBottom: "8px", display: "block" }}>Position</label>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {POSITIONS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`button ${state.position === p.id ? "gold" : "secondary"}`}
                style={{ padding: "8px 12px", fontSize: "14px", minWidth: "44px" }}
                onClick={() => updateSettings({ position: p.id })}
                disabled={isSaving}
                aria-label={p.id}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Size slider */}
      {state.status === "ready" && (
        <div>
          <label style={{ fontSize: "13px", fontWeight: 500, display: "flex", justifyContent: "space-between" }}>
            <span>Size</span>
            <span>{state.sizePercent}%</span>
          </label>
          <input
            type="range"
            min={8}
            max={25}
            value={state.sizePercent}
            onChange={(e) => setState({ ...state, sizePercent: Number(e.target.value) })}
            onMouseUp={() => updateSettings({ sizePercent: state.sizePercent })}
            onTouchEnd={() => updateSettings({ sizePercent: state.sizePercent })}
            style={{ width: "100%", marginTop: "6px" }}
          />
        </div>
      )}

      {error && (
        <p className="status-text error" style={{ fontSize: "13px" }}>{error}</p>
      )}

      <p className="copy" style={{ fontSize: "12px" }}>
        Your logo will be added to every generated image automatically. PNG with transparent background works best.
      </p>
    </div>
  );
}
