"use client";

import type { BatchStatusResponse, GenerationStatus } from "@ornava/shared";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CachedImage } from "./CachedImage";
import { Icon } from "./Icon";

type BatchGeneration = BatchStatusResponse["generations"][number];

function statusLabel(status: GenerationStatus) {
  if (status === "completed") return "Done";
  if (status === "failed") return "Failed";
  if (status === "processing") return "Generating";
  return "Queued";
}

function statusIcon(status: GenerationStatus) {
  if (status === "completed") return <Icon name="check" size={13} />;
  if (status === "failed") return <Icon name="x" size={13} />;
  if (status === "processing") return <span className="spinner" />;
  return <span className="batch-card-dot" />;
}

function formatGenerationDuration(ms?: number) {
  if (!ms) return null;
  const seconds = Math.max(1, Math.round(ms / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
}

function formatCompletedTime(value?: string) {
  if (!value) return null;
  return new Date(value).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function BatchPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const batchId = searchParams?.get("batchId") ?? null;
  const [batch, setBatch] = useState<BatchStatusResponse | null>(null);
  const originalUrlCacheRef = useRef<Map<string, string>>(new Map());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!batchId) return;
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | undefined;
    let hasLoadedOriginals = false;

    async function poll() {
      try {
        const includeOriginals = hasLoadedOriginals ? "false" : "true";
        const r = await fetch(`/api/batches/${batchId}?includeOriginals=${includeOriginals}`);
        if (!r.ok) throw new Error("Failed to fetch batch status");
        const data: BatchStatusResponse = await r.json();
        for (const image of data.images) {
          if (image.originalUrl) {
            originalUrlCacheRef.current.set(image.imageId, image.originalUrl);
          }
        }
        hasLoadedOriginals = true;

        const stableData: BatchStatusResponse = {
          ...data,
          images: data.images.map((image) => ({
            ...image,
            originalUrl: image.originalUrl ?? originalUrlCacheRef.current.get(image.imageId),
          })),
        };

        if (!cancelled) setBatch(stableData);

        const doneCount = data.generations.filter(
          (generation) => generation.status === "completed" || generation.status === "failed",
        ).length;
        if (data.generations.length > 0 && doneCount >= data.generations.length && interval) {
          clearInterval(interval);
        }
      } catch {
        if (!cancelled) setError("Could not load batch status.");
      }
    }

    void poll();
    interval = setInterval(() => void poll(), 3000);
    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [batchId]);

  if (!batchId) return <p className="copy">No batch specified.</p>;
  if (error) return <p className="status-text error">{error}</p>;
  if (!batch) return <p className="copy">Loading batch...</p>;

  const totalJobs = batch.generations.length;
  const completedGens = batch.generations.filter((g) => g.status === "completed");
  const failedGens = batch.generations.filter((g) => g.status === "failed");
  const processingGens = batch.generations.filter((g) => g.status === "processing");
  const queuedGens = batch.generations.filter((g) => g.status === "queued");
  const completedCount = completedGens.length;
  const failedCount = failedGens.length;
  const doneCount = completedCount + failedCount;
  const progressPct = totalJobs > 0 ? Math.round((doneCount / totalJobs) * 100) : 0;
  const isAllDone = batch.status === "completed" || (totalJobs > 0 && doneCount >= totalJobs);
  const hasFailures = failedCount > 0;
  const hasSuccesses = completedCount > 0;
  const isAllFailed = isAllDone && failedCount === totalJobs;
  const imageById = new Map(batch.images.map((image) => [image.imageId, image]));

  function handleViewResult(gen: BatchGeneration) {
    router.push(`/result?generationId=${gen.generationId}` as import("next").Route);
  }

  function handleEditRetry(gen: BatchGeneration) {
    router.push(`/brief?imageId=${gen.imageId}` as import("next").Route);
  }

  const headline = isAllFailed
    ? "All images need retry"
    : isAllDone
      ? hasFailures
        ? "Batch finished with issues"
        : "Results ready"
      : doneCount === 0
        ? "Preparing your images"
        : "Generating batch";

  const subcopy = isAllFailed
    ? "The worker could not fetch the inputs. Retry after checking the worker/R2 connection."
    : isAllDone
      ? `${completedCount} ready${failedCount ? `, ${failedCount} failed` : ""}`
      : `${processingGens.length} processing, ${queuedGens.length} waiting`;

  return (
    <div className="batch-page">
      <div className={`batch-hero${isAllFailed ? " batch-hero-failed" : ""}`}>
        <div className="batch-hero-top">
          <div>
            <div className="eyebrow">Batch Generation</div>
            <h1 className="title">{headline}</h1>
          </div>
          <span className="batch-progress-pill">{progressPct}%</span>
        </div>
        <p className="copy">{subcopy}</p>
        <div className="batch-progress-track" aria-label={`${doneCount} of ${totalJobs} done`}>
          <span style={{ width: `${progressPct}%` }} />
        </div>
        <div className="batch-stat-row">
          <span><strong>{completedCount}</strong> Ready</span>
          <span><strong>{processingGens.length}</strong> Running</span>
          <span><strong>{failedCount}</strong> Failed</span>
        </div>
      </div>

      {hasFailures ? (
        <div className="batch-alert">
          <Icon name="info" size={16} />
          <span>
            {isAllFailed
              ? "Generation failed for every image. You can retry individual photos or return to the dashboard."
              : "Some images failed. Ready images can still be opened; failed ones can be retried."}
          </span>
        </div>
      ) : null}

      {!isAllDone ? (
        <div className="batch-live-strip">
          <span className="spinner" />
          <span>Images appear here as soon as they finish.</span>
        </div>
      ) : null}

      {hasSuccesses ? (
        <div className="batch-section-header">
          <strong>Ready results</strong>
          <span>{completedCount}</span>
        </div>
      ) : null}

      {hasSuccesses ? (
        <div className="batch-grid">
          {completedGens.map((gen) => (
            <div key={gen.generationId} className="batch-card batch-card-completed">
              <button type="button" className="batch-card-thumb" onClick={() => handleViewResult(gen)}>
                <CachedImage
                  alt=""
                  cacheKey={`/api/generations/${gen.generationId}/preview`}
                  cacheVersion={gen.generationId}
                  className="batch-card-img"
                  fallback={<div className="batch-card-empty"><Icon name="image" size={22} /></div>}
                  placeholderClassName="batch-card-cache-placeholder"
                  src={`/api/generations/${gen.generationId}/preview`}
                />
                <span className="batch-card-badge"><Icon name="check" size={12} /></span>
              </button>
              <div className="batch-card-footer">
                <span className="batch-card-status">Ready</span>
                <button type="button" className="batch-card-action" onClick={() => handleEditRetry(gen)}>
                  Edit
                </button>
              </div>
              <div className="batch-card-meta">
                {formatGenerationDuration(gen.generationDurationMs) ? (
                  <span>{formatGenerationDuration(gen.generationDurationMs)}</span>
                ) : null}
                {formatCompletedTime(gen.completedAt) ? (
                  <span>{formatCompletedTime(gen.completedAt)}</span>
                ) : null}
                {gen.overlayText ? (
                  <span>{gen.overlayText.purity} · {gen.overlayText.weightGm}gm</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {batch.generations.some((gen) => gen.status !== "completed") ? (
        <div className="batch-section-header">
          <strong>{hasSuccesses ? "Other images" : "Images"}</strong>
          <span>{totalJobs - completedCount}</span>
        </div>
      ) : null}

      {batch.generations.some((gen) => gen.status !== "completed") ? (
        <div className="batch-grid">
          {batch.generations.filter((gen) => gen.status !== "completed").map((gen) => {
            const image = imageById.get(gen.imageId);
            return (
              <div key={gen.generationId} className={`batch-card batch-card-${gen.status}`}>
                <div className="batch-card-thumb">
                  {image?.originalUrl ? (
                    <CachedImage
                      alt=""
                      cacheKey={`/api/uploads/${image.imageId}/original-preview`}
                      cacheVersion={image.imageId}
                      className="batch-card-img"
                      fallback={<div className="batch-card-empty"><Icon name="image" size={22} /></div>}
                      placeholderClassName="batch-card-cache-placeholder"
                      src={image.originalUrl}
                    />
                  ) : (
                    <div className="batch-card-empty"><Icon name="image" size={22} /></div>
                  )}
                  <span className={`batch-card-badge batch-card-badge-${gen.status}`}>
                    {statusIcon(gen.status)}
                  </span>
                </div>

                <div className="batch-card-footer">
                  <span className="batch-card-status">{statusLabel(gen.status)}</span>
                  {gen.status === "failed" ? (
                    <button type="button" className="batch-card-action" onClick={() => handleEditRetry(gen)}>
                      Retry
                    </button>
                  ) : null}
                </div>
                {gen.status === "failed" && gen.failureMessage ? (
                  <p className="batch-card-error">{gen.failureMessage}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {isAllDone ? (
        <div className="batch-actions">
          {hasSuccesses ? (
            <button
              className="button"
              type="button"
              onClick={() => router.push("/dashboard" as import("next").Route)}
            >
              <Icon name="home" size={17} />
              Done
            </button>
          ) : null}
          <button
            className="button secondary"
            type="button"
            onClick={() => router.push("/upload" as import("next").Route)}
          >
            <Icon name="plus" size={17} />
            New batch
          </button>
        </div>
      ) : null}
    </div>
  );
}
