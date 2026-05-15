"use client";

import type {
  UploadCompleteRequest,
  UploadCompleteResponse,
  UploadInitRequest,
  UploadInitResponse,
} from "@ornava/shared";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Icon } from "./Icon";
import { buildUploadProxyPath, isBrowserUploadNetworkError } from "@/lib/upload";
import { getUploadStepProgress, uploadActivitySteps, type UploadActivityStep } from "@/lib/beta-ui";
import { compressImageForGeneration } from "@/lib/image-compression";

const MAX_UPLOAD_BYTES = 20_000_000;
const SUPPORTED_TYPES = new Set(["image/jpeg", "image/png"]);

type UploadState =
  | { status: "idle" }
  | { status: "uploading"; step: UploadActivityStep }
  | { status: "uploaded"; imageId: string; fileName: string; compressionApplied: boolean }
  | { status: "error"; message: string };

function getImageDimensions(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); resolve({ width: img.naturalWidth, height: img.naturalHeight }); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read image.")); };
    img.src = url;
  });
}

async function postJson<T>(url: string, body: unknown) {
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) { const e = await r.json().catch(() => null); throw new Error(e?.error ?? "Request failed."); }
  return r.json() as Promise<T>;
}

async function postFormData<T>(url: string, body: FormData) {
  const r = await fetch(url, { method: "POST", body });
  if (!r.ok) { const e = await r.json().catch(() => null); throw new Error(e?.error ?? "Request failed."); }
  return r.json() as Promise<T>;
}

export function UploadPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [state, setState] = useState<UploadState>({ status: "idle" });
  const [preview, setPreview] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const progress = state.status === "uploaded" ? 100 : state.status === "uploading" ? getUploadStepProgress(state.step) : 0;
  const isUploading = state.status === "uploading";
  const isDone = state.status === "uploaded";

  async function uploadFile(file: File) {
    if (!SUPPORTED_TYPES.has(file.type)) { setState({ status: "error", message: "Use a JPG or PNG photo." }); return; }
    if (file.size > MAX_UPLOAD_BYTES) { setState({ status: "error", message: "Photo must be under 20MB." }); return; }

    setPreview(URL.createObjectURL(file));

    try {
      setState({ status: "uploading", step: "reading" });
      const dimensions = await getImageDimensions(file);
      setState({ status: "uploading", step: "optimizing" });
      const gen = await compressImageForGeneration({ file, dimensions });

      setState({ status: "uploading", step: "preparing" });
      const init = await postJson<UploadInitResponse>("/api/uploads/init", {
        fileName: gen.file.name,
        fileType: gen.file.type as "image/jpeg" | "image/png",
        fileSizeBytes: gen.file.size,
        width: gen.dimensions.width,
        height: gen.dimensions.height,
      } satisfies UploadInitRequest);

      let complete: UploadCompleteResponse;
      try {
        setState({ status: "uploading", step: "uploading" });
        const up = await fetch(init.uploadUrl, { method: "PUT", headers: { "content-type": gen.file.type }, body: gen.file });
        if (!up.ok) throw new Error("Upload failed.");
        setState({ status: "uploading", step: "saving" });
        complete = await postJson<UploadCompleteResponse>("/api/uploads/complete", { imageId: init.imageId, objectKey: init.objectKey } satisfies UploadCompleteRequest);
      } catch (err) {
        if (!isBrowserUploadNetworkError(err)) throw err;
        setState({ status: "uploading", step: "uploading" });
        const fd = new FormData();
        fd.append("file", gen.file);
        fd.append("objectKey", init.objectKey);
        complete = await postFormData<UploadCompleteResponse>(buildUploadProxyPath(init.imageId), fd);
      }

      setState({ status: "uploaded", imageId: complete.imageId, fileName: file.name, compressionApplied: gen.compressionApplied });
    } catch (err) {
      setState({ status: "error", message: err instanceof Error ? err.message : "Upload failed. Try again." });
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) startTransition(() => { void uploadFile(file); });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) startTransition(() => { void uploadFile(file); });
  }

  return (
    <div className="up-page">
      {/* Header */}
      <div className="up-header">
        <h1 className="up-title">Upload photo</h1>
        <p className="up-subtitle">Use a clear photo of your jewelry</p>
      </div>

      {/* Drop zone */}
      <button
        className={`up-zone ${isDone ? "up-zone-done" : ""} ${isUploading ? "up-zone-loading" : ""}`}
        type="button"
        onClick={() => !isDone && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        aria-label="Select jewelry photo"
      >
        {preview ? (
          <img src={preview} alt="Preview" className="up-preview" />
        ) : (
          <div className="up-zone-inner">
            <div className="up-zone-icon">
              <Icon name="camera" size={28} />
            </div>
            <span className="up-zone-label">Tap to select photo</span>
            <span className="up-zone-hint">JPG or PNG · max 20MB</span>
          </div>
        )}

        {/* Progress overlay */}
        {isUploading && (
          <div className="up-overlay">
            <div className="up-overlay-bar">
              <div className="up-overlay-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="up-overlay-label">{uploadActivitySteps[state.step].label}</span>
          </div>
        )}

        {/* Done checkmark */}
        {isDone && (
          <div className="up-done-badge">
            <Icon name="check" size={14} />
          </div>
        )}
      </button>

      <input ref={inputRef} accept="image/jpeg,image/png" className="visually-hidden" type="file" onChange={handleChange} />

      {/* Error */}
      {state.status === "error" && (
        <div className="up-error">
          <Icon name="x" size={15} />
          <span>{state.message}</span>
        </div>
      )}

      {/* Tips — only when idle */}
      {state.status === "idle" && (
        <div className="up-tips">
          <span>Full jewelry visible</span>
          <span>·</span>
          <span>No stickers or text</span>
          <span>·</span>
          <span>Sharp & well-lit</span>
        </div>
      )}

      {/* CTA */}
      <button
        className="up-cta"
        disabled={!isDone}
        type="button"
        onClick={() => isDone && state.status === "uploaded" && router.push(`/brief?imageId=${state.imageId}`)}
      >
        {isDone ? "Continue →" : isUploading ? `Uploading ${progress}%` : "Select a photo first"}
      </button>
    </div>
  );
}
