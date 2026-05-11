"use client";

import type {
  CreateGenerationRequest,
  CreateGenerationResponse,
  GenerationMode,
  GenerationStatusResponse,
} from "@ornava/shared";
import { GENERATION_MODES } from "@ornava/shared";
import { useRouter, useSearchParams } from "next/navigation";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Icon } from "./Icon";
import {
  generationModeCards,
  getGenerationProgressPercent,
} from "@/lib/beta-ui";
import { buildResultPagePath } from "@/lib/result";

const modeLabels: Record<GenerationMode, string> = {
  on_model: "On model",
  studio: "Studio",
  close_up: "Close-up",
};

type PanelState =
  | { status: "idle" }
  | { status: "creating"; message: string }
  | { status: "queued"; generationId: string; modelRoute: string }
  | { status: "failed"; message: string };

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
  const imageId = searchParams.get("imageId");
  const [state, setState] = useState<PanelState>({ status: "idle" });
  const [generationStatus, setGenerationStatus] =
    useState<GenerationStatusResponse | null>(null);
  const activeGenerationId =
    state.status === "queued"
      ? state.generationId
      : searchParams.get("generationId");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPending, startTransition] = useTransition();
  const clientRequestId = useMemo(
    () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
    [],
  );

  async function createGeneration(mode: GenerationMode) {
    if (!imageId) {
      setState({ status: "failed", message: "Upload an image first." });
      return;
    }

    try {
      setState({ status: "creating", message: "Creating generation job..." });

      const request: CreateGenerationRequest = {
        imageId,
        mode,
        clientRequestId,
      };
      const response = await postJson<CreateGenerationResponse>(
        "/api/generations",
        request,
      );

      setState({
        status: "queued",
        generationId: response.generationId,
        modelRoute: response.modelRoute,
      });
      router.replace(
        `/generating?imageId=${imageId}&generationId=${response.generationId}`,
      );
    } catch (error) {
      setState({
        status: "failed",
        message:
          error instanceof Error
            ? error.message
            : "Could not create generation job.",
      });
    }
  }

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
      {generationStatus || state.status === "queued" || activeGenerationId ? (
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
            {state.status === "queued" ? (
              <p className="copy">Queued on {state.modelRoute}</p>
            ) : null}
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
            <h1 className="title">Choose style</h1>
            <p className="copy">Choose the selling context for this product photo.</p>
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
          {GENERATION_MODES.map((mode) => {
            const card = generationModeCards[mode];
            const isFeatured = mode === "on_model";

            return (
              <div className={`mode-card${isFeatured ? " featured" : ""}`} key={mode}>
                <div className="mode-card-header">
                  <div className="mode-card-copy">
                    <span className="icon-tile" style={isFeatured ? {
                      background: "#2a2721",
                      borderColor: "#514739",
                      color: "var(--gold-bright)",
                      height: 44,
                      width: 44,
                    } : { width: 62, height: 62 }}>
                      <Icon name={card.icon} size={isFeatured ? 24 : 27} />
                    </span>
                    <div>
                      <strong style={{ fontSize: isFeatured ? 18 : 17 }}>
                        {card.title}
                      </strong>
                      <p className="copy">{card.description}</p>
                    </div>
                  </div>
                  {isFeatured ? <span className="credit-pill">Popular</span> : null}
                </div>
                {isFeatured ? (
                  <button
                    className="button gold"
                    disabled={!imageId || state.status === "creating" || isPending}
                    type="button"
                    onClick={() => {
                      startTransition(() => {
                        void createGeneration(mode);
                      });
                    }}
                  >
                    {state.status === "creating" || isPending ? (
                      <span className="spinner" aria-hidden="true" />
                    ) : (
                      <Icon name="arrow-right" size={16} />
                    )}
                    {card.cta}
                  </button>
                ) : (
                  <button
                    className="button secondary"
                    disabled={!imageId || state.status === "creating" || isPending}
                    type="button"
                    onClick={() => {
                      startTransition(() => {
                        void createGeneration(mode);
                      });
                    }}
                  >
                    {state.status === "creating" || isPending ? (
                      <span className="spinner" aria-hidden="true" />
                    ) : (
                      <Icon name="arrow-right" size={16} />
                    )}
                    {card.cta}
                  </button>
                )}
              </div>
            );
          })}
          {state.status === "creating" ? (
            <p className="status-text">{state.message}</p>
          ) : null}
          {state.status === "failed" ? (
            <p className="status-text error">{state.message}</p>
          ) : null}
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
