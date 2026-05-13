"use client";

import type {
  GenerationMode,
  GenerationStatusResponse,
} from "@ornava/shared";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { getGenerationProgressPercent } from "@/lib/beta-ui";
import { buildResultPagePath } from "@/lib/result";
import { buildUploadProxyPath } from "@/lib/upload";

const modeLabels: Record<GenerationMode, string> = {
  on_model: "On model",
  studio: "Studio",
  close_up: "Close-up",
};

const karigarSteps = [
  { label: "Roshni set ho rahi hai", desc: "Setting the lights" },
  { label: "Heere chamka rahe hain", desc: "Polishing the stones" },
  { label: "Gold ki safaai", desc: "Cleaning the gold" },
  { label: "Final polish ho rahi hai", desc: "Final touches" },
];

const taglines = [
  "Dikhega sona, toh bikega sona",
  "50 sellers ke beech, aap sabse alag",
  "Jo pehle dikhayega, wahi bechega",
  "Pehli nazar mein trust banta hai",
  "Photo solid, toh price pe no behas",
  "Photographer ka intezaar ab khatam",
  "Woh edit karenge, aap order lenge",
  "Mehnat aapki, chamak hamari",
  "Stock aaya nahi ki share kiya",
  "Sab puchenge — ye photo kahan se li?",
];

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
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    if (!activeGenerationId) return;
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
        if (!isCancelled) setGenerationStatus(null);
      }
    }
    void poll();
    const interval = window.setInterval(() => void poll(), 2500);
    return () => { isCancelled = true; window.clearInterval(interval); };
  }, [activeGenerationId, router]);

  useEffect(() => {
    if (!activeGenerationId) { setElapsedSeconds(0); return; }
    setElapsedSeconds(0);
    const interval = window.setInterval(() => setElapsedSeconds((c) => c + 1), 1000);
    return () => window.clearInterval(interval);
  }, [activeGenerationId]);

  useEffect(() => {
    if (!activeGenerationId) return;
    const interval = window.setInterval(() => setTipIndex((i) => (i + 1) % taglines.length), 6000);
    return () => window.clearInterval(interval);
  }, [activeGenerationId]);

  const visibleStatus = generationStatus?.status ?? (activeGenerationId ? "queued" : undefined);
  const generationProgress = getGenerationProgressPercent(visibleStatus, elapsedSeconds);
  const isGenerationActive = visibleStatus === "queued" || visibleStatus === "processing";

  // Determine which karigar step is active based on progress
  const activeKarigarStep =
    generationProgress >= 90 ? 3 :
    generationProgress >= 60 ? 2 :
    generationProgress >= 30 ? 1 : 0;

  const imageProxyUrl = imageId ? buildUploadProxyPath(imageId) : null;

  return (
    <>
      {generationStatus || activeGenerationId ? (
        <div className="karigar-studio">
          {/* Blurred background of user's jewelry */}
          {imageProxyUrl ? (
            <div className="karigar-bg">
              <img src={imageProxyUrl} alt="" className="karigar-bg-img" />
              <div className="karigar-bg-shimmer" />
            </div>
          ) : null}

          <div className="karigar-content">
            {/* Header */}
            <div className="karigar-header">
              <span className="karigar-eyebrow">
                {generationStatus ? modeLabels[generationStatus.mode] : "Ornava Studio"}
              </span>
              <h1 className="karigar-title">Chamak aa rahi hai...</h1>
            </div>

            {/* Golden thread progress */}
            <div className="karigar-progress">
              <div className="karigar-thread">
                <div
                  className="karigar-thread-fill"
                  style={{ width: `${generationProgress}%` }}
                >
                  <span className="karigar-sparkle" />
                </div>
              </div>
              <span className="karigar-percent">{generationProgress}%</span>
            </div>

            {/* Karigar steps - breathing animation */}
            <div className="karigar-steps">
              {karigarSteps.map((step, i) => (
                <div
                  key={step.label}
                  className={`karigar-step${
                    i < activeKarigarStep ? " done" : i === activeKarigarStep ? " active" : ""
                  }`}
                >
                  <span className="karigar-step-indicator">
                    {i < activeKarigarStep ? (
                      <Icon name="check" size={12} />
                    ) : i === activeKarigarStep ? (
                      <span className="karigar-step-pulse" />
                    ) : (
                      <span className="karigar-step-dot" />
                    )}
                  </span>
                  <span className="karigar-step-label">{step.label}</span>
                </div>
              ))}
            </div>

            {/* Tagline - slides in from right */}
            <div className="karigar-tagline-wrap">
              <p key={tipIndex} className="karigar-tagline">{taglines[tipIndex]}</p>
            </div>

            {/* Error state */}
            {generationStatus?.failureMessage ? (
              <div className="gen-info-card" style={{ borderColor: "var(--danger)" }}>
                <Icon name="x" size={18} style={{ color: "var(--danger)", flexShrink: 0 }} />
                <div>
                  <strong>Generation failed</strong>
                  <p className="copy">{generationStatus.failureMessage}</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
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
          <button
            className="button"
            disabled={!imageId}
            type="button"
            onClick={() => {
              if (imageId) router.push(`/brief?imageId=${imageId}`);
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
          if (generationStatus) router.push(buildResultPagePath(generationStatus.generationId));
        }}
      >
        <Icon name="arrow-right" size={17} />
        {isGenerationActive ? "Aapka karigar kaam pe hai..." : "Dekho result"}
      </button>
    </>
  );
}
