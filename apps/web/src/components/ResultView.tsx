"use client";

import type {
  FeedbackReason,
  GenerationResultResponse,
  RetryGenerationResponse,
  SubmitFeedbackRequest,
  SubmitFeedbackResponse,
} from "@ornava/shared";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { CSSProperties } from "react";
import { useEffect, useState, useTransition } from "react";
import { Icon } from "./Icon";
import {
  feedbackReasonLabels,
} from "@/lib/feedback";
import { buildGeneratingPagePath } from "@/lib/generation";

type ResultState =
  | { status: "loading" }
  | { status: "ready"; result: GenerationResultResponse }
  | { status: "failed"; message: string };

async function getJson<TResponse>(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.error ?? "Request failed.");
  }

  return (await response.json()) as TResponse;
}

async function postJson<TResponse>(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.error ?? "Request failed.");
  }

  return (await response.json()) as TResponse;
}

const modeLabels: Record<GenerationResultResponse["mode"], string> = {
  on_model: "On-model",
  studio: "Studio",
  close_up: "Close-up",
};

const feedbackReasonOptions = Object.entries(feedbackReasonLabels) as Array<
  [FeedbackReason, string]
>;

export function ResultView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const generationId = searchParams?.get("generationId") ?? null;
  const [state, setState] = useState<ResultState>({ status: "loading" });
  const [selectedReason, setSelectedReason] =
    useState<FeedbackReason>("stone_or_detail_changed");
  const [sliderPos, setSliderPos] = useState(50);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [isSharing, startSharing] = useTransition();
  const [isSubmittingFeedback, startFeedbackSubmission] = useTransition();
  const [isRetrying, startRetry] = useTransition();

  useEffect(() => {
    if (!generationId) {
      setState({
        status: "failed",
        message: "Open a completed generation to view its result.",
      });
      return;
    }

    let isCancelled = false;

    async function loadResult() {
      try {
        const result = await getJson<GenerationResultResponse>(
          `/api/generations/${generationId}/result`,
        );

        if (!isCancelled) {
          setState({ status: "ready", result });
        }
      } catch (error) {
        if (!isCancelled) {
          setState({
            status: "failed",
            message:
              error instanceof Error
                ? error.message
                : "Could not load this result.",
          });
        }
      }
    }

    void loadResult();

    return () => {
      isCancelled = true;
    };
  }, [generationId]);

  if (state.status === "loading") {
    return (
      <>
        <div className="screen-header">
          <h1 className="title">Bas ek second...</h1>
          <p className="copy">Aapka before & after ready ho raha hai.</p>
        </div>
        <div className="gen-result-loading">
          <div className="gen-result-loading-preview">
            <div className="gen-result-shimmer" />
            <div className="gen-result-shimmer" />
          </div>
          <div className="gen-result-loading-footer">
            <span className="spinner" aria-hidden="true" />
            <span>Loading high-res images...</span>
          </div>
        </div>
      </>
    );
  }

  if (state.status === "failed") {
    return (
      <>
        <div className="panel">
          <strong>Result unavailable</strong>
          <p className="status-text error">{state.message}</p>
        </div>
        <Link className="button secondary" href="/upload">
          <Icon name="arrow-left" size={16} />
          Upload another image
        </Link>
      </>
    );
  }

  const result = state.result;
  // Same-origin proxy for file fetching (avoids R2 CORS for browser fetch).
  const downloadUrl = `/api/generations/${result.generationId}/download`;
  // Direct R2 URL is short-lived but works for WhatsApp preview / desktop fallback.
  const sharedImageUrl = result.assets.generated.url;

  async function fetchImageAsFile(url: string, fileName: string): Promise<File | null> {
    try {
      const response = await fetch(url, { credentials: "same-origin" });
      if (!response.ok) {
        console.warn(`[share] download fetch failed: HTTP ${response.status}`);
        return null;
      }
      const blob = await response.blob();
      if (blob.size === 0) {
        console.warn("[share] download returned empty blob");
        return null;
      }
      return new File([blob], fileName, { type: blob.type || "image/jpeg" });
    } catch (error) {
      console.warn("[share] download fetch errored:", error);
      return null;
    }
  }

  function downloadResult() {
    startSharing(async () => {
      const fileName = `ornava-${result.mode}-${result.generationId.slice(0, 8)}.jpg`;

      try {
        const response = await fetch(downloadUrl, { credentials: "same-origin" });
        if (!response.ok) throw new Error("Download failed");
        const blob = await response.blob();

        // Create blob URL and trigger download
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      } catch (error) {
        console.warn("[download] failed:", error);
        window.open(downloadUrl, "_blank", "noopener,noreferrer");
      }
    });
  }

  function shareResult() {
    startSharing(async () => {
      const fileName = `ornava-${result.mode}-${result.generationId.slice(0, 8)}.jpg`;
      const waUrl = `https://wa.me/?text=${encodeURIComponent(sharedImageUrl)}`;

      // Always try file share first - it's the only way to actually attach the image
      if (
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function"
      ) {
        const file = await fetchImageAsFile(downloadUrl, fileName);

        if (file && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file] });
            return;
          } catch (error) {
            const name = (error as Error).name;
            if (name === "AbortError") return; // user cancelled, don't fallback
            console.warn("[share] file share failed:", error);
          }
        } else {
          console.info("[share] canShare returned false for files, has navigator.share:", !!navigator.share);
        }
      } else {
        console.info("[share] Web Share API not available, falling back to wa.me URL");
      }

      // Fallback: open WhatsApp with URL (URL won't render as image preview but at least opens WA)
      window.open(waUrl, "_blank", "noopener,noreferrer");
    });
  }

  function submitFeedback(request: SubmitFeedbackRequest) {
    setFeedbackError(null);
    startFeedbackSubmission(() => {
      void postJson<SubmitFeedbackResponse>(
        `/api/generations/${result.generationId}/feedback`,
        request,
      )
        .then(() => {
          setFeedbackMessage(
            request.rating === "usable"
              ? "Marked usable."
              : "Feedback saved. You can retry this image.",
          );
        })
        .catch((error) => {
          setFeedbackError(
            error instanceof Error ? error.message : "Could not save feedback.",
          );
        });
    });
  }

  function retryGeneration() {
    setFeedbackError(null);
    startRetry(() => {
      void postJson<RetryGenerationResponse>(
        `/api/generations/${result.generationId}/retry`,
        {
          clientRequestId:
            globalThis.crypto?.randomUUID?.() ?? `retry-${Date.now()}`,
        },
      )
        .then((response) => {
          router.push(
            buildGeneratingPagePath({
              imageId: result.imageId,
              generationId: response.generationId,
            }),
          );
        })
        .catch((error) => {
          setFeedbackError(
            error instanceof Error ? error.message : "Could not retry generation.",
          );
        });
    });
  }

  return (
    <>
      <div className="screen-header-row">
        <div className="screen-header">
          <h1 className="title">Dekho aur share karo</h1>
        </div>
        <span className="status-pill">
          <Icon name="check" size={14} />
          Ready
        </span>
      </div>

      {/* Before/After Comparison Slider */}
      <div className="compare-slider">
        <div className="compare-slider-container">
          <img
            alt="Generated jewelry catalog output"
            className="compare-img compare-img--generated"
            src={result.assets.generated.url}
          />
          <div
            className="compare-img-clip"
            style={{ "--clip": `${sliderPos}%` } as CSSProperties}
          >
            <img
              alt="Original jewelry upload"
              className="compare-img"
              src={result.assets.original.url}
            />
          </div>
          <div
            className="compare-handle"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="compare-handle-line" />
            <div className="compare-handle-knob">
              <Icon name="arrow-left" size={10} />
              <Icon name="arrow-left" size={10} style={{ transform: "rotate(180deg)" }} />
            </div>
            <div className="compare-handle-line" />
          </div>
          <input
            aria-label="Compare original and generated"
            className="compare-range"
            max="100"
            min="0"
            type="range"
            value={sliderPos}
            onChange={(e) => setSliderPos(Number(e.target.value))}
          />
          <span className="compare-label compare-label--left">Original</span>
          <span className="compare-label compare-label--right">Generated</span>
        </div>
        <figcaption className="result-meta">
          <span className="brand-row">
            <Icon name="calendar" size={14} />
            {modeLabels[result.mode]}
          </span>
          {result.generationDurationMs ? (
            <span>{Math.round(result.generationDurationMs / 1000)}s</span>
          ) : null}
        </figcaption>
      </div>

      <button
        className="button whatsapp"
        disabled={isSharing}
        type="button"
        onClick={shareResult}
        style={{ width: "100%", minHeight: 52, fontSize: 16 }}
      >
        {isSharing ? (
          <span className="spinner" aria-hidden="true" />
        ) : (
          <Icon name="phone" size={20} />
        )}
        {isSharing ? "Opening..." : "WhatsApp pe bhejo"}
      </button>

      <div className="button-row">
        <button
          className="button secondary"
          disabled={isSharing}
          type="button"
          onClick={downloadResult}
        >
          <Icon name="download" size={17} />
          Save
        </button>
        <button
          className="button secondary"
          disabled={isRetrying}
          type="button"
          onClick={retryGeneration}
        >
          {isRetrying ? (
            <span className="spinner" aria-hidden="true" />
          ) : (
            <Icon name="refresh" size={16} />
          )}
          Retry
        </button>
      </div>

      <div className="soft-panel">
        <div className="screen-header-row">
          <strong style={{ fontSize: 16, lineHeight: "21px" }}>
            Good enough to send?
          </strong>
          <span className="copy" style={{ fontSize: 12 }}>
            Beta feedback
          </span>
        </div>
        <div className="button-row">
          <button
            className="button"
            disabled={isSubmittingFeedback}
            type="button"
            onClick={() => submitFeedback({ rating: "usable" })}
          >
            {isSubmittingFeedback ? (
              <span className="spinner" aria-hidden="true" />
            ) : (
              <Icon name="check" size={16} />
            )}
            {isSubmittingFeedback ? "Saving..." : "Usable"}
          </button>
          <button
            className="button secondary"
            disabled={isSubmittingFeedback}
            type="button"
            onClick={() =>
              submitFeedback({
                rating: "not_usable",
                reason: selectedReason,
              })
            }
          >
            Not usable
          </button>
        </div>
        <label className="field-label" htmlFor="feedback-reason">
          Reason if not usable
        </label>
        <select
          className="select"
          id="feedback-reason"
          value={selectedReason}
          onChange={(event) =>
            setSelectedReason(event.target.value as FeedbackReason)
          }
        >
          {feedbackReasonOptions.map(([reason, label]) => (
            <option key={reason} value={reason}>
              {label}
            </option>
          ))}
        </select>
        <button
          className="button secondary"
          disabled={isSubmittingFeedback}
          type="button"
          onClick={() =>
            submitFeedback({
              rating: "not_usable",
              reason: selectedReason,
            })
          }
        >
          Save not-usable feedback
        </button>
        {feedbackMessage ? (
          <p className="status-text">{feedbackMessage}</p>
        ) : null}
        {feedbackError ? (
          <p className="status-text error">{feedbackError}</p>
        ) : null}
      </div>
    </>
  );
}
