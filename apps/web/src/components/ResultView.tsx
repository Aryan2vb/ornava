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
      <div className="soft-panel" style={{ alignItems: "center", textAlign: "center" }}>
        <div
          className="progress-ring is-active"
          style={{ "--progress": 18 } as CSSProperties}
        >
          <div className="progress-ring-label">
            <strong>
              <span className="spinner large" aria-hidden="true" />
            </strong>
            <span>Loading</span>
          </div>
        </div>
        <strong>Opening result...</strong>
        <p className="copy">Fetching signed image links for review.</p>
      </div>
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
  const shareText = `Ornava ${modeLabels[result.mode]} catalog image`;
  // Same-origin proxy for file fetching (avoids R2 CORS for browser fetch).
  const downloadUrl = `/api/generations/${result.generationId}/download`;
  // Direct R2 URL is short-lived but works for WhatsApp preview / desktop fallback.
  const sharedImageUrl = result.assets.generated.url;
  const whatsAppUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${sharedImageUrl}`)}`;

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

  function shareResult() {
    startSharing(async () => {
      const fileName = `ornava-${result.mode}-${result.generationId.slice(0, 8)}.jpg`;

      // Tier 1: Web Share API Level 2 with file attachment (best UX on mobile)
      if (typeof navigator !== "undefined" && navigator.share && navigator.canShare) {
        const file = await fetchImageAsFile(downloadUrl, fileName);

        if (file && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: "Ornava generated image",
              text: shareText,
            });
            return;
          } catch (error) {
            const name = (error as Error).name;
            if (name === "AbortError") return;
            console.warn("[share] file share failed, falling back:", error);
          }
        } else {
          console.info("[share] file attachment not supported — falling back to URL share");
        }

        // Tier 2: Web Share API basic — text + URL (WhatsApp shows preview from URL)
        try {
          await navigator.share({
            title: "Ornava generated image",
            text: shareText,
            url: sharedImageUrl,
          });
          return;
        } catch (error) {
          const name = (error as Error).name;
          if (name === "AbortError") return;
          console.warn("[share] basic share failed, falling back:", error);
        }
      }

      // Tier 3: WhatsApp Web — text + URL combined into wa.me link
      window.open(whatsAppUrl, "_blank", "noopener,noreferrer");
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
          <h1 className="title">Review result</h1>
          <p className="copy">Check product fidelity before sending.</p>
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

      <div className="button-row">
        <a
          className="button secondary"
          download
          href={downloadUrl}
        >
          <Icon name="download" size={17} />
          Save
        </a>
        <button
          className="button whatsapp"
          disabled={isSharing}
          type="button"
          onClick={shareResult}
        >
          {isSharing ? (
            <span className="spinner" aria-hidden="true" />
          ) : (
            <Icon name="phone" size={18} />
          )}
          {isSharing ? "Opening share..." : "Send on WhatsApp"}
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
            disabled={isRetrying}
            type="button"
            onClick={retryGeneration}
          >
            {isRetrying ? (
              <span className="spinner" aria-hidden="true" />
            ) : (
              <Icon name="refresh" size={16} />
            )}
            {isRetrying ? "Retrying..." : "Retry"}
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
