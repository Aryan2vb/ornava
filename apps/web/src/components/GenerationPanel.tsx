"use client";

import type {
  CreateGenerationRequest,
  CreateGenerationResponse,
  GenerationMode,
  GenerationStatusResponse,
} from "@ornava/shared";
import { GENERATION_MODES } from "@ornava/shared";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { buildResultPagePath } from "@/lib/result";

const modeLabels: Record<GenerationMode, string> = {
  on_model: "On-Model",
  studio: "Studio",
  close_up: "Close-Up",
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
    const generationId =
      state.status === "queued"
        ? state.generationId
        : searchParams.get("generationId");

    if (!generationId) {
      return;
    }

    let isCancelled = false;

    async function poll() {
      try {
        const response = await getJson<GenerationStatusResponse>(
          `/api/generations/${generationId}`,
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
  }, [router, searchParams, state]);

  return (
    <>
      <div className="panel">
        {GENERATION_MODES.map((mode) => (
          <button
            className="button secondary"
            disabled={!imageId || state.status === "creating" || isPending}
            key={mode}
            type="button"
            onClick={() => {
              startTransition(() => {
                void createGeneration(mode);
              });
            }}
          >
            {modeLabels[mode]}
          </button>
        ))}
      </div>
      <div className="panel">
        <strong>Generation job</strong>
        {!imageId ? (
          <p className="copy">Upload an image before choosing a mode.</p>
        ) : null}
        {state.status === "idle" ? (
          <p className="copy">Choose a mode to create a queued job.</p>
        ) : null}
        {state.status === "creating" ? (
          <p className="status-text">{state.message}</p>
        ) : null}
        {state.status === "queued" ? (
          <>
            <p className="status-text">Queued on {state.modelRoute}</p>
            <p className="copy">Generation ID: {state.generationId}</p>
          </>
        ) : null}
        {state.status === "failed" ? (
          <p className="status-text error">{state.message}</p>
        ) : null}
        {generationStatus ? (
          <p className="copy">
            Status: {generationStatus.status}
            {generationStatus.failureMessage
              ? ` - ${generationStatus.failureMessage}`
              : ""}
          </p>
        ) : null}
      </div>
      <button
        className="button"
        disabled={!generationStatus || generationStatus.status !== "completed"}
        type="button"
        onClick={() => {
          if (generationStatus) {
            router.push(buildResultPagePath(generationStatus.generationId));
          }
        }}
      >
        View result
      </button>
    </>
  );
}
