"use client";

import type {
  BatchStatusResponse,
  CreateBatchResponse,
  OverlayText,
  UploadCompleteRequest,
  UploadCompleteResponse,
  UploadInitRequest,
  UploadInitResponse,
} from "@ornava/shared";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Icon } from "./Icon";
import { buildUploadProxyPath, isBrowserUploadNetworkError } from "@/lib/upload";
import { compressImageForGeneration } from "@/lib/image-compression";
import { overlayTextLabel } from "@/lib/overlay";

const MAX_UPLOAD_BYTES = 20_000_000;
const MAX_BATCH_SIZE = 10;
const SUPPORTED_TYPES = new Set(["image/jpeg", "image/png"]);

type ImageEntry = {
  id: string; // local temp id
  file?: File;
  preview: string;
  status: "uploading" | "uploaded" | "failed";
  imageId?: string;
  persisted?: boolean;
  overlayText?: OverlayText | null;
  overlayState?: "idle" | "dirty" | "saving" | "saved" | "failed";
};

function statusCopy(status: ImageEntry["status"]) {
  if (status === "uploaded") return "Ready";
  if (status === "failed") return "Retry";
  return "Uploading";
}

function defaultOverlay(): OverlayText {
  return {
    purity: "22K",
    weightGm: "",
    position: "bottom-left",
    size: "medium",
  };
}

function isValidWeight(weightGm: string) {
  return /^\d+(\.\d{1,2})?$/.test(weightGm);
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

function getImageDimensions(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); resolve({ width: img.naturalWidth, height: img.naturalHeight }); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read image.")); };
    img.src = url;
  });
}

export function UploadPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [removingIds, setRemovingIds] = useState<Set<string>>(() => new Set());
  const [, startTransition] = useTransition();

  const uploadedCount = images.filter((i) => i.status === "uploaded").length;
  const uploadingCount = images.filter((i) => i.status === "uploading").length;
  const failedCount = images.filter((i) => i.status === "failed").length;
  const canContinue = uploadedCount > 0;
  const progressPercent = images.length > 0 ? Math.round((uploadedCount / images.length) * 100) : 0;

  // Check for active batch on mount (resume flow)
  useEffect(() => {
    fetch("/api/batches/active").then((r) => r.json()).then((data) => {
      if (data.batch?.batchId && (data.batch.status === "uploading" || data.batch.status === "ready")) {
        setBatchId(data.batch.batchId);
        void fetch(`/api/batches/${data.batch.batchId}`)
          .then((r) => r.json())
          .then((batch: BatchStatusResponse) => {
            setImages(
              batch.images
                .filter((image) => image.uploadStatus === "uploaded" && image.originalUrl)
                .map((image) => ({
                  id: image.imageId,
                  imageId: image.imageId,
                  preview: image.originalUrl!,
                  status: "uploaded" as const,
                  persisted: true,
                  overlayText: image.overlayText ?? null,
                  overlayState: image.overlayText ? "saved" as const : "idle" as const,
                })),
            );
          })
          .catch(() => {});
      }
    }).catch(() => {});
  }, []);

  async function ensureBatch(): Promise<string> {
    if (batchId) return batchId;
    const res = await postJson<CreateBatchResponse>("/api/batches", {});
    setBatchId(res.batchId);
    return res.batchId;
  }

  async function uploadSingleFile(file: File, localId: string, currentBatchId: string) {
    try {
      const dimensions = await getImageDimensions(file);
      const gen = await compressImageForGeneration({ file, dimensions });

      const init = await postJson<UploadInitResponse>("/api/uploads/init", {
        fileName: gen.file.name,
        fileType: gen.file.type as "image/jpeg" | "image/png",
        fileSizeBytes: gen.file.size,
        width: gen.dimensions.width,
        height: gen.dimensions.height,
        batchId: currentBatchId,
      } satisfies UploadInitRequest);

      let complete: UploadCompleteResponse;
      try {
        const up = await fetch(init.uploadUrl, { method: "PUT", headers: { "content-type": gen.file.type }, body: gen.file });
        if (!up.ok) throw new Error("Upload failed.");
        complete = await postJson<UploadCompleteResponse>("/api/uploads/complete", { imageId: init.imageId, objectKey: init.objectKey } satisfies UploadCompleteRequest);
      } catch (err) {
        if (!isBrowserUploadNetworkError(err)) throw err;
        const fd = new FormData();
        fd.append("file", gen.file);
        fd.append("objectKey", init.objectKey);
        complete = await postFormData<UploadCompleteResponse>(buildUploadProxyPath(init.imageId), fd);
      }

      setImages((prev) => prev.map((img) => img.id === localId ? { ...img, status: "uploaded", imageId: complete.imageId, overlayText: null, overlayState: "idle" } : img));
    } catch {
      setImages((prev) => prev.map((img) => img.id === localId ? { ...img, status: "failed" } : img));
    }
  }

  async function handleFiles(files: FileList) {
    setError(null);
    const validFiles: File[] = [];

    for (const file of Array.from(files)) {
      if (!SUPPORTED_TYPES.has(file.type)) continue;
      if (file.size > MAX_UPLOAD_BYTES) continue;
      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      setError("Use JPG or PNG photos under 20MB.");
      return;
    }

    const remaining = MAX_BATCH_SIZE - images.length;
    const toAdd = validFiles.slice(0, remaining);

    if (remaining <= 0) {
      setError(`This batch already has ${MAX_BATCH_SIZE} images.`);
      return;
    }

    if (validFiles.length > remaining) {
      setError(`Max ${MAX_BATCH_SIZE} images. Added first ${toAdd.length}.`);
    }

    const newEntries: ImageEntry[] = toAdd.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      status: "uploading" as const,
    }));

    setImages((prev) => [...prev, ...newEntries]);

    // Start uploads in parallel
    const currentBatchId = await ensureBatch();
    for (const entry of newEntries) {
      if (entry.file) {
        void uploadSingleFile(entry.file, entry.id, currentBatchId);
      }
    }
  }

  async function removeImage(localId: string) {
    const selectedImage = images.find((i) => i.id === localId);
    if (!selectedImage) return;

    if (selectedImage.persisted && batchId && selectedImage.imageId) {
      setRemovingIds((current) => new Set(current).add(localId));
      try {
        const response = await fetch(`/api/batches/${batchId}/images/${selectedImage.imageId}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.message ?? body?.error ?? "Could not remove image.");
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : "Could not remove image.");
        setRemovingIds((current) => {
          const next = new Set(current);
          next.delete(localId);
          return next;
        });
        return;
      }
    }

    setImages((prev) => {
      const img = prev.find((i) => i.id === localId);
      if (img?.preview.startsWith("blob:")) URL.revokeObjectURL(img.preview);
      return prev.filter((i) => i.id !== localId);
    });
    setRemovingIds((current) => {
      const next = new Set(current);
      next.delete(localId);
      return next;
    });
  }

  function retryImage(localId: string) {
    const img = images.find((i) => i.id === localId);
    if (!img?.file || !batchId) return;
    setImages((prev) => prev.map((i) => i.id === localId ? { ...i, status: "uploading" } : i));
    void uploadSingleFile(img.file, localId, batchId);
  }

  function updateOverlay(localId: string, patch: Partial<OverlayText>) {
    setImages((prev) => prev.map((img) => {
      if (img.id !== localId) return img;
      return {
        ...img,
        overlayText: {
          ...(img.overlayText ?? defaultOverlay()),
          ...patch,
        },
        overlayState: "dirty",
      };
    }));
  }

  async function saveOverlay(localId: string) {
    const img = images.find((i) => i.id === localId);
    const overlay = img?.overlayText;
    if (!img?.imageId || !overlay || !isValidWeight(overlay.weightGm)) return;

    setImages((prev) => prev.map((item) => item.id === localId ? { ...item, overlayState: "saving" } : item));
    try {
      const response = await fetch(`/api/uploads/${img.imageId}/overlay`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(overlay),
      });
      if (!response.ok) throw new Error("Could not save weight and purity.");
      setImages((prev) => prev.map((item) => item.id === localId ? { ...item, overlayState: "saved" } : item));
    } catch {
      setImages((prev) => prev.map((item) => item.id === localId ? { ...item, overlayState: "failed" } : item));
    }
  }

  async function clearOverlay(localId: string) {
    const img = images.find((i) => i.id === localId);
    if (!img?.imageId) return;

    setImages((prev) => prev.map((item) => item.id === localId ? { ...item, overlayState: "saving" } : item));
    try {
      await fetch(`/api/uploads/${img.imageId}/overlay`, { method: "DELETE" });
      setImages((prev) => prev.map((item) => item.id === localId ? { ...item, overlayText: null, overlayState: "idle" } : item));
    } catch {
      setImages((prev) => prev.map((item) => item.id === localId ? { ...item, overlayState: "failed" } : item));
    }
  }

  function applyPurityToAll(purity: OverlayText["purity"]) {
    setImages((prev) => prev.map((img) => {
      if (img.status !== "uploaded") return img;
      return {
        ...img,
        overlayText: {
          ...(img.overlayText ?? defaultOverlay()),
          purity,
        },
        overlayState: "dirty",
      };
    }));
  }

  async function handleContinue() {
    if (!batchId) return;
    const dirtyOverlays = images.filter((img) =>
      img.overlayState === "dirty" &&
      img.overlayText?.weightGm &&
      isValidWeight(img.overlayText.weightGm),
    );
    if (dirtyOverlays.length > 0) {
      await Promise.all(dirtyOverlays.map((img) => saveOverlay(img.id)));
    }
    router.push(`/brief?batchId=${batchId}`);
  }

  return (
    <div className="up-page">
      <div className="up-header">
        <div>
          <p className="up-kicker">Batch upload</p>
          <h1 className="up-title">Choose catalog photos</h1>
          <p className="up-subtitle">Add clear jewelry photos, then use one brief for the full set.</p>
        </div>
        {images.length > 0 ? (
          <button
            className="up-header-add"
            disabled={images.length >= MAX_BATCH_SIZE}
            type="button"
            onClick={() => inputRef.current?.click()}
          >
            <Icon name="plus" size={15} />
            Add
          </button>
        ) : null}
      </div>

      {images.length > 0 ? (
        <div className="up-batch-summary" aria-live="polite">
          <div className="up-summary-main">
            <span className="up-summary-count">{uploadedCount}</span>
            <span className="up-summary-copy">
              ready of {images.length}
              {images.length < MAX_BATCH_SIZE ? ` - ${MAX_BATCH_SIZE - images.length} slots left` : " - batch full"}
            </span>
          </div>
          <div className="up-summary-meter" aria-hidden="true">
            <span style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="up-summary-meta">
            {uploadingCount > 0 ? <span>{uploadingCount} uploading</span> : <span>Ready to continue</span>}
            {failedCount > 0 ? <span>{failedCount} needs retry</span> : null}
          </div>
          <div className="up-purity-actions" aria-label="Apply purity to uploaded photos">
            {(["22K", "18K"] as const).map((purity) => (
              <button key={purity} type="button" onClick={() => applyPurityToAll(purity)}>
                Apply {purity} to all
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Image grid */}
      {images.length > 0 && (
        <div className="up-grid">
          {images.map((img, index) => (
            <div key={img.id} className={`up-grid-item up-grid-${img.status}`}>
              <img src={img.preview} alt="" className="up-grid-thumb" />
              <span className="up-grid-index">{index + 1}</span>
              {img.status === "uploading" && (
                <div className="up-grid-state">
                  <span className="spinner" />
                  <span>{statusCopy(img.status)}</span>
                </div>
              )}
              {img.status === "uploaded" && (
                <div className="up-grid-state up-grid-state-ready">
                  <Icon name="check" size={12} />
                  <span>{statusCopy(img.status)}</span>
                </div>
              )}
              {img.status === "failed" && (
                <button className="up-grid-state up-grid-state-failed" type="button" onClick={() => retryImage(img.id)}>
                  <Icon name="refresh" size={14} />
                  <span>{statusCopy(img.status)}</span>
                </button>
              )}
              <button
                className="up-grid-remove"
                disabled={removingIds.has(img.id)}
                type="button"
                onClick={() => { void removeImage(img.id); }}
                aria-label="Remove"
              >
                {removingIds.has(img.id) ? <span className="spinner" /> : <Icon name="x" size={10} />}
              </button>
              {img.status === "uploaded" ? (
                <div className="up-meta-editor">
                  <div className="up-meta-row">
                    <label>
                      <span>Purity</span>
                      <select
                        value={(img.overlayText ?? defaultOverlay()).purity}
                        onChange={(event) => updateOverlay(img.id, { purity: event.target.value as OverlayText["purity"] })}
                      >
                        <option value="24K">24K</option>
                        <option value="22K">22K</option>
                        <option value="20K">20K</option>
                        <option value="18K">18K</option>
                      </select>
                    </label>
                    <label>
                      <span>Weight</span>
                      <input
                        inputMode="decimal"
                        placeholder="gm"
                        value={img.overlayText?.weightGm ?? ""}
                        onChange={(event) => updateOverlay(img.id, { weightGm: event.target.value.replace(/[^0-9.]/g, "") })}
                      />
                    </label>
                  </div>
                  <div className="up-meta-actions">
                    <span>
                      {img.overlayState === "saved" && img.overlayText
                        ? overlayTextLabel(img.overlayText)
                        : img.overlayState === "failed"
                          ? "Save failed"
                          : img.overlayState === "dirty"
                            ? "Unsaved"
                            : "Optional"}
                    </span>
                    <div>
                      {img.overlayText ? (
                        <button type="button" onClick={() => { void clearOverlay(img.id); }} aria-label="Clear weight and purity">
                          <Icon name="x" size={12} />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        disabled={!img.imageId || !img.overlayText?.weightGm || !isValidWeight(img.overlayText.weightGm) || img.overlayState === "saving" || img.overlayState === "saved"}
                        onClick={() => { void saveOverlay(img.id); }}
                      >
                        {img.overlayState === "saving" ? "Saving" : "Save"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
          {images.length < MAX_BATCH_SIZE && (
            <button className="up-grid-add" type="button" onClick={() => inputRef.current?.click()}>
              <Icon name="plus" size={18} />
              <span>Add more</span>
            </button>
          )}
        </div>
      )}

      {/* Empty state — drop zone */}
      {images.length === 0 && (
        <button
          className="up-zone"
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) startTransition(() => { void handleFiles(e.dataTransfer.files); }); }}
          aria-label="Select jewelry photos"
        >
          <div className="up-zone-inner">
            <div className="up-zone-stack" aria-hidden="true">
              <span />
              <span />
              <span><Icon name="camera" size={24} /></span>
            </div>
            <span className="up-zone-label">Tap to select photos</span>
            <span className="up-zone-hint">JPG or PNG - max 20MB each - up to {MAX_BATCH_SIZE}</span>
          </div>
        </button>
      )}

      <input
        ref={inputRef}
        accept="image/jpeg,image/png"
        className="visually-hidden"
        type="file"
        multiple
        onChange={(e) => { if (e.target.files?.length) startTransition(() => { void handleFiles(e.target.files!); }); e.target.value = ""; }}
      />

      {error && (
        <div className="up-error">
          <Icon name="x" size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* Tips */}
      {images.length === 0 && (
        <div className="up-tips">
          <span><Icon name="check" size={13} /> Full jewelry visible</span>
          <span><Icon name="check" size={13} /> No stickers or text</span>
          <span><Icon name="check" size={13} /> Sharp and well-lit</span>
        </div>
      )}

      {/* CTA */}
      <div className="up-action-bar">
        <div className="up-action-copy">
          <strong>{uploadedCount || images.length || 0}/{MAX_BATCH_SIZE}</strong>
          <span>{canContinue ? "ready for brief" : images.length > 0 ? "uploading photos" : "photos selected"}</span>
        </div>
        <button className="up-cta" disabled={!canContinue} type="button" onClick={() => { void handleContinue(); }}>
          {canContinue
            ? `Continue (${uploadedCount})`
            : images.length > 0
              ? "Uploading"
              : "Select photos"}
          <Icon name="arrow-right" size={17} />
        </button>
      </div>
    </div>
  );
}
