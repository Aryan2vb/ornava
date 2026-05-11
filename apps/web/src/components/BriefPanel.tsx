"use client";

import type {
  AspectRatio,
  CreateGenerationRequest,
  CreateGenerationResponse,
  GenerationBrief,
  JewelryType,
} from "@ornava/shared";
import {
  ASPECT_RATIOS,
  BACKGROUND_PRESET_OPTIONS,
  JEWELRY_TYPES,
  getDefaultGenerationBrief,
  getPosePreset,
  getPosePresetsForJewelryType,
  getPoseTemplatePreview,
} from "@ornava/shared";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Icon } from "./Icon";

const jewelryLabels: Record<JewelryType, string> = {
  necklace: "Necklace",
  ring: "Ring",
  bracelet_bangle: "Bracelet / bangle",
  earrings: "Earrings",
  pendant: "Pendant",
  other: "Other",
};

const aspectRatioLabels: Record<AspectRatio, string> = {
  "1:1": "Square",
  "4:5": "Portrait",
  "3:4": "Catalog",
};

const modeLabels: Record<GenerationBrief["generationMode"], string> = {
  on_model: "On model",
  studio: "Studio",
  close_up: "Close-up",
};

const backgroundSwatches: Record<
  GenerationBrief["backgroundPresetId"],
  string
> = {
  pure_white: "#ffffff",
  warm_ivory: "#f8efd8",
  light_gray: "#e6e3de",
  charcoal_black: "#25221f",
  marble: "#f1eee8",
  deep_red_luxury: "#7c1f2c",
  emerald_luxury: "#0d5d4a",
};

type BriefStep = "type" | "pose" | "finish";

type BriefState =
  | { status: "idle" }
  | { status: "creating" }
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

function clientRequestId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`;
}

export function BriefPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const imageId = searchParams?.get("imageId") ?? null;
  const [step, setStep] = useState<BriefStep>("type");
  const [brief, setBrief] = useState<GenerationBrief>(() =>
    getDefaultGenerationBrief("necklace"),
  );
  const [state, setState] = useState<BriefState>({ status: "idle" });
  const [isPending, startTransition] = useTransition();
  const poseOptions = useMemo(
    () => getPosePresetsForJewelryType(brief.jewelryType),
    [brief.jewelryType],
  );
  const selectedPose = getPosePreset(brief.posePresetId);
  const isBusy = state.status === "creating" || isPending;

  function selectJewelryType(jewelryType: JewelryType) {
    setBrief(getDefaultGenerationBrief(jewelryType));
    setStep("pose");
    setState({ status: "idle" });
  }

  function selectPose(posePresetId: string) {
    const preset = getPosePreset(posePresetId);

    if (!preset) {
      return;
    }

    setBrief((current) => ({
      ...current,
      generationMode: preset.generationMode,
      modelPresetId: preset.modelPresetId,
      posePresetId: preset.id,
      backgroundPresetId: preset.defaultBackgroundPresetId,
      aspectRatio: preset.defaultAspectRatio,
    }));
    setStep("finish");
    setState({ status: "idle" });
  }

  async function createGeneration() {
    if (!imageId) {
      setState({ status: "failed", message: "Upload an image first." });
      return;
    }

    try {
      setState({ status: "creating" });

      const request: CreateGenerationRequest = {
        imageId,
        mode: brief.generationMode,
        generationBrief: brief,
        clientRequestId: clientRequestId(),
      };
      const response = await postJson<CreateGenerationResponse>(
        "/api/generations",
        request,
      );

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

  return (
    <>
      <div className="screen-header">
        <div className="eyebrow">Guided generation</div>
        <h1 className="title">
          {step === "type"
            ? "What are you selling?"
            : step === "pose"
              ? "Choose the look"
              : "Set background"}
        </h1>
        <p className="copy">
          {step === "type"
            ? "Tap the product category."
            : step === "pose"
              ? "Pick where your jewellery should appear."
              : "Choose the final catalog crop."}
        </p>
      </div>

      <div className="brief-progress" aria-label="Brief progress">
        {(["type", "pose", "finish"] as const).map((item) => (
          <span
            className={`brief-progress-step${item === step ? " active" : ""}`}
            key={item}
          />
        ))}
      </div>

      {step === "type" ? (
        <div className="choice-grid">
          {JEWELRY_TYPES.map((jewelryType) => (
            <button
              className={`choice-card${
                brief.jewelryType === jewelryType ? " selected" : ""
              }`}
              key={jewelryType}
              type="button"
              onClick={() => selectJewelryType(jewelryType)}
            >
              <span className="icon-tile" style={{ width: 42, height: 42 }}>
                <Icon name="diamond" size={20} />
              </span>
              <strong>{jewelryLabels[jewelryType]}</strong>
              {brief.jewelryType === jewelryType ? (
                <Icon name="check" size={17} />
              ) : null}
            </button>
          ))}
        </div>
      ) : null}

      {step === "pose" ? (
        <>
          <div className="row-card">
            <span className="icon-tile" style={{ width: 48, height: 48 }}>
              <Icon name="diamond" size={22} />
            </span>
            <div className="row-card-body">
              <span className="row-title">{jewelryLabels[brief.jewelryType]}</span>
              <span className="row-subtitle">Templates show the model or scene empty</span>
            </div>
          </div>
          <div className="template-grid">
            {poseOptions.map((pose, index) => {
              const preview = getPoseTemplatePreview(pose.id);

              return (
                <button
                  className={`template-card${
                    brief.posePresetId === pose.id ? " selected" : ""
                  }`}
                  key={pose.id}
                  type="button"
                  onClick={() => selectPose(pose.id)}
                >
                  <span
                    className={`template-preview scene-${
                      preview?.scene ?? "studio-generic"
                    }`}
                    aria-hidden="true"
                  >
                    <span className="template-skin template-skin-primary" />
                    <span className="template-skin template-skin-secondary" />
                    <span className="placement-guide">{preview?.placement}</span>
                  </span>
                  <span className="template-card-copy">
                    <span className="template-card-header">
                      <strong>{preview?.title ?? pose.label}</strong>
                      {index === 0 ? <span className="status-pill">Best</span> : null}
                    </span>
                    <span>{preview?.subtitle ?? pose.bestFor}</span>
                    <small>{modeLabels[pose.generationMode]}</small>
                  </span>
                </button>
              );
            })}
          </div>
          <button className="button secondary" type="button" onClick={() => setStep("type")}>
            <Icon name="arrow-left" size={17} />
            Back
          </button>
        </>
      ) : null}

      {step === "finish" ? (
        <>
          <div className="panel">
            <div className="screen-header-row">
              <div className="screen-header">
                <strong>{selectedPose?.label ?? "Catalog preset"}</strong>
                <p className="copy">
                  {jewelryLabels[brief.jewelryType]} -{" "}
                  {modeLabels[brief.generationMode]}
                </p>
              </div>
              <span className="status-pill">{brief.aspectRatio}</span>
            </div>
          </div>

          <div className="screen-header">
            <strong>Background</strong>
            <div className="choice-list">
              {BACKGROUND_PRESET_OPTIONS.map((background) => (
                <button
                  className={`choice-card horizontal compact${
                    brief.backgroundPresetId === background.id ? " selected" : ""
                  }`}
                  key={background.id}
                  type="button"
                  onClick={() =>
                    setBrief((current) => ({
                      ...current,
                      backgroundPresetId: background.id,
                    }))
                  }
                >
                  <span
                    className="swatch"
                    style={{ background: backgroundSwatches[background.id] }}
                  />
                  <span className="choice-copy">
                    <strong>{background.label}</strong>
                  </span>
                  {brief.backgroundPresetId === background.id ? (
                    <Icon name="check" size={17} />
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          <div className="screen-header">
            <strong>Crop</strong>
            <div className="segmented-row">
              {ASPECT_RATIOS.map((aspectRatio) => (
                <button
                  className={`segment${
                    brief.aspectRatio === aspectRatio ? " selected" : ""
                  }`}
                  key={aspectRatio}
                  type="button"
                  onClick={() =>
                    setBrief((current) => ({
                      ...current,
                      aspectRatio,
                    }))
                  }
                >
                  <strong>{aspectRatio}</strong>
                  <span>{aspectRatioLabels[aspectRatio]}</span>
                </button>
              ))}
            </div>
          </div>

          {state.status === "failed" ? (
            <p className="status-text error">{state.message}</p>
          ) : null}

          <div className="button-row">
            <button
              className="button secondary"
              disabled={isBusy}
              type="button"
              onClick={() => setStep("pose")}
            >
              <Icon name="arrow-left" size={17} />
              Back
            </button>
            <button
              className="button"
              disabled={!imageId || isBusy}
              type="button"
              onClick={() => {
                startTransition(() => {
                  void createGeneration();
                });
              }}
            >
              {isBusy ? (
                <span className="spinner" aria-hidden="true" />
              ) : (
                <Icon name="spark" size={17} />
              )}
              Generate
            </button>
          </div>
        </>
      ) : null}
    </>
  );
}
