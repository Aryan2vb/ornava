"use client";

import type {
  GenerationMode,
  GenerationStatusResponse,
} from "@ornava/shared";
import { useRouter, useSearchParams } from "next/navigation";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { getGenerationProgressPercent } from "@/lib/beta-ui";
import { buildResultPagePath } from "@/lib/result";

const modeLabels: Record<GenerationMode, string> = {
  on_model: "On model",
  studio: "Studio",
  close_up: "Close-up",
};

async function getJson<TResponse>(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.error ?? "Request failed.");
  }

  return (await response.json()) as TResponse;
}

export function GenerationPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const imageId = searchParams?.get("imageId") ?? null;
  const [generationStatus, setGenerationStatus] =
    useState<GenerationStatusResponse | null>(null);
  const activeGenerationId = searchParams?.get("generationId") ?? null;
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!activeGenerationId) {
      return;
    }

    let isCancelled = false;

    async function poll() {
      try {
        const response = await getJson<GenerationStatusResponse>(
          `/api/generations/${activeGenerationId}`,
        );

        if (!isCancelled) {
          setGenerationStatus(response);
          if (response.status === "completed") {
            router.replace(buildResultPagePath(response.generationId));
          }
        }
      } catch {
        if (!isCancelled) {
          setGenerationStatus(null);
        }
      }
    }

    void poll();
    const interval = window.setInterval(() => {
      void poll();
    }, 2500);

    return () => {
      isCancelled = true;
      window.clearInterval(interval);
    };
  }, [activeGenerationId, router]);

  useEffect(() => {
    if (!activeGenerationId) {
      setElapsedSeconds(0);
      return;
    }

    setElapsedSeconds(0);
    const interval = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [activeGenerationId]);

  const visibleStatus = generationStatus?.status ?? (activeGenerationId ? "queued" : undefined);
  const generationProgress = getGenerationProgressPercent(
    visibleStatus,
    elapsedSeconds,
  );
  const isGenerationActive =
    visibleStatus === "queued" || visibleStatus === "processing";

  return (
    <>
      {generationStatus || activeGenerationId ? (
        <>
          <div className="screen-header">
            <h1 className="title">Creating image</h1>
            <p className="copy">
              This can take 1-3 minutes while the model preserves product details.
            </p>
          </div>
          <div className="soft-panel" style={{ alignItems: "center", gap: 20 }}>
            <div
              className={`progress-ring${isGenerationActive ? " is-active" : ""}`}
              style={{ "--progress": generationProgress } as CSSProperties}
            >
              <div className="progress-ring-label">
                <strong>{generationProgress}%</strong>
                <span>{generationStatus ? modeLabels[generationStatus.mode] : "Working"}</span>
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <strong style={{ fontSize: 19, lineHeight: "24px" }}>
                <Icon name="diamond" size={18} /> Preserving product identity
              </strong>
              <p className="copy">
                Stones, metal color, shape, and scale stay the priority.
              </p>
            </div>
          </div>
          <div className="row-card">
            <span className="icon-tile" style={{ width: 50, height: 50 }}>
              <Icon name="image" size={23} />
            </span>
            <div className="row-card-body">
              <span className="row-title">Using optimized source photo</span>
              <span className="row-subtitle">Ready for result review when complete</span>
            </div>
          </div>
          <div className="panel">
            <div className="screen-header-row">
              <span className="brand-row">
                <Icon name="check" size={18} style={{ color: "var(--success)" }} />
                <strong>Image optimized</strong>
              </span>
              <span className="status-text" style={{ color: "var(--success)" }}>
                Done
              </span>
            </div>
            <div className="screen-header-row">
              <span className="brand-row">
                <Icon name="spark" size={18} style={{ color: "var(--gold)" }} />
                <strong>Generating catalog image</strong>
              </span>
              <span className="status-text">
                {isGenerationActive ? (
                  <span className="pulse-dot" aria-hidden="true" />
                ) : null}
                {visibleStatus === "completed" ? "Done" : "Now"}
              </span>
            </div>
            <div className="screen-header-row">
              <span className="brand-row" style={{ color: "var(--muted)" }}>
                <Icon name="calendar" size={18} />
                <strong>Preparing result</strong>
              </span>
              <span className="copy">
                {visibleStatus === "completed" ? "Ready" : "Next"}
              </span>
            </div>
            {generationStatus?.failureMessage ? (
              <p className="status-text error">{generationStatus.failureMessage}</p>
            ) : null}
          </div>
          <div className="soft-panel">
            <div className="brand-row">
              <Icon name="info" size={18} />
              <strong>Keep this open</strong>
            </div>
            <p className="copy">
              If it fails, you can retry from the same uploaded photo.
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="screen-header">
            <h1 className="title">Finish brief</h1>
            <p className="copy">Choose product type, view, background, and crop.</p>
          </div>
          <div className="row-card">
            <span className="icon-tile" style={{ width: 58, height: 58 }}>
              <Icon name="image" size={25} />
            </span>
            <div className="row-card-body">
              <span className="row-title">Uploaded product photo</span>
              <span className="row-subtitle">
                {imageId ? "Optimized · ready" : "Upload a photo first"}
              </span>
            </div>
          </div>
          <div className="soft-panel">
            <div className="brand-row">
              <Icon name="spark" size={18} />
              <strong>Guided catalog setup</strong>
            </div>
            <p className="copy">No prompt needed. Select the preset details next.</p>
          </div>
          <button
            className="button"
            disabled={!imageId}
            type="button"
            onClick={() => {
              if (imageId) {
                router.push(`/brief?imageId=${imageId}`);
              }
            }}
          >
            <Icon name="arrow-right" size={17} />
            Continue
          </button>
        </>
      )}
      <button
        className="button secondary"
        disabled={!generationStatus || generationStatus.status !== "completed"}
        type="button"
        onClick={() => {
          if (generationStatus) {
            router.push(buildResultPagePath(generationStatus.generationId));
          }
        }}
      >
        <Icon name="arrow-right" size={17} />
        {isGenerationActive ? "Waiting for result" : "View result"}
      </button>
    </>
  );
}
