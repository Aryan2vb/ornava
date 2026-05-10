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
import { useEffect, useState, useTransition } from "react";
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
  on_model: "On-Model",
  studio: "Studio",
  close_up: "Close-Up",
};

const feedbackReasonOptions = Object.entries(feedbackReasonLabels) as Array<
  [FeedbackReason, string]
>;

export function ResultView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const generationId = searchParams.get("generationId");
  const [state, setState] = useState<ResultState>({ status: "loading" });
  const [selectedReason, setSelectedReason] =
    useState<FeedbackReason>("stone_or_detail_changed");
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
    return <p className="copy">Loading result...</p>;
  }

  if (state.status === "failed") {
    return (
      <>
        <div className="panel">
          <strong>Result unavailable</strong>
          <p className="status-text error">{state.message}</p>
        </div>
        <Link className="button secondary" href="/upload">
          Upload another image
        </Link>
      </>
    );
  }

  const result = state.result;
  const shareText = `Ornava ${modeLabels[result.mode]} result: ${result.assets.generated.url}`;
  const whatsAppUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  function shareResult() {
    startSharing(() => {
      if (!navigator.share) {
        window.open(whatsAppUrl, "_blank", "noopener,noreferrer");
        return;
      }

      void navigator.share({
        title: "Ornava generated image",
        text: shareText,
        url: result.assets.generated.url,
      });
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
      <div className="result-meta">
        <span>{modeLabels[result.mode]}</span>
        {result.generationDurationMs ? (
          <span>{Math.round(result.generationDurationMs / 1000)}s</span>
        ) : null}
      </div>

      <div className="image-stack">
        <figure className="image-card">
          <figcaption>Original</figcaption>
          <img alt="Original jewelry upload" src={result.assets.original.url} />
        </figure>
        <figure className="image-card">
          <figcaption>Generated</figcaption>
          <img alt="Generated jewelry catalog output" src={result.assets.generated.url} />
        </figure>
      </div>

      <div className="panel compact-panel">
        <a
          className="button"
          download
          href={result.assets.generated.url}
          target="_blank"
          rel="noreferrer"
        >
          Download
        </a>
        <button
          className="button secondary"
          disabled={isSharing}
          type="button"
          onClick={shareResult}
        >
          Share to WhatsApp
        </button>
      </div>

      <div className="panel compact-panel">
        <strong>Is this usable?</strong>
        <div className="button-row">
          <button
            className="button"
            disabled={isSubmittingFeedback}
            type="button"
            onClick={() => submitFeedback({ rating: "usable" })}
          >
            Usable
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
          className="input"
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
        {feedbackMessage ? (
          <p className="status-text">{feedbackMessage}</p>
        ) : null}
        {feedbackError ? (
          <p className="status-text error">{feedbackError}</p>
        ) : null}
        <button
          className="button secondary"
          disabled={isRetrying}
          type="button"
          onClick={retryGeneration}
        >
          Try again
        </button>
      </div>
    </>
  );
}
