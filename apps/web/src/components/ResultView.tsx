"use client";

import type { GenerationResultResponse } from "@ornava/shared";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

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

const modeLabels: Record<GenerationResultResponse["mode"], string> = {
  on_model: "On-Model",
  studio: "Studio",
  close_up: "Close-Up",
};

export function ResultView() {
  const searchParams = useSearchParams();
  const generationId = searchParams.get("generationId");
  const [state, setState] = useState<ResultState>({ status: "loading" });
  const [isSharing, startSharing] = useTransition();

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
    </>
  );
}
