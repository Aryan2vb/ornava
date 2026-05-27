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
import { useEffect, useMemo, useState, useTransition } from "react";
import { Icon } from "./Icon";

const jewelryLabels: Record<JewelryType, string> = {
  necklace: "Necklace",
  ring: "Ring",
  bracelet: "Bracelet",
  bangle: "Bangle / kada",
  earrings: "Earrings",
  pendant: "Pendant",
  other: "Other",
};

const jewelryIcons: Partial<Record<JewelryType, string>> = {
  necklace: "/icons/necklace.svg",
  ring: "/icons/ring.svg",
  bracelet: "/icons/bracelete.svg",
  bangle: "/icons/bangle.svg",
  earrings: "/icons/earings.svg",
  pendant: "/icons/pendent.svg",
};

const jewelryIconSize: Partial<Record<JewelryType, number>> = {
  bangle: 128,
};

const poseThumbnails: Record<string, string> = {
  necklace_front_neck_crop: "/poses/necklace/centre.jpeg",
  necklace_traditional_saree: "/poses/necklace/left.jpeg",
  necklace_left_angle_2: "/poses/necklace/left2.jpeg",
  necklace_left_with_hand: "/poses/necklace/left-with-hand.jpeg",
  necklace_right_with_hand: "/poses/necklace/right-with-hand.jpeg",
  necklace_right_angle: "/poses/necklace/right.jpeg",
  ring_on_finger: "/poses/ring/pose1.jpeg",
  ring_pose_2: "/poses/ring/pose2.jpeg",
  ring_pose_3: "/poses/ring/pose3.jpeg",
  ring_pose_4: "/poses/ring/pose4.jpeg",
  ring_pose_5: "/poses/ring/pose5.jpeg",
  ring_pose_6: "/poses/ring/pose6.jpeg",
  earrings_on_ear_side: "/poses/earring/pose1.jpeg",
  earrings_pose_2: "/poses/earring/pose2.jpeg",
  earrings_pose_3: "/poses/earring/pose3.jpeg",
  earrings_pose_4: "/poses/earring/pose4.jpeg",
  pendant_neck_closeup: "/poses/necklace/centre.jpeg",
  pendant_left_angle: "/poses/necklace/left.jpeg",
  pendant_left_profile: "/poses/necklace/left2.jpeg",
  pendant_left_with_hand: "/poses/necklace/left-with-hand.jpeg",
  pendant_right_with_hand: "/poses/necklace/right-with-hand.jpeg",
  pendant_right_angle: "/poses/necklace/right.jpeg",
  bracelet_straight_wrist: "/poses/bangle/pose5.jpeg",
  bracelet_wrist_touch: "/poses/bangle/pose1.jpeg",
  bracelet_raised_arm: "/poses/bangle/pose3.jpeg",
  bracelet_hand_down: "/poses/bangle/pose2.jpeg",
  bracelet_flat_back: "/poses/bangle/pose4.jpeg",
  bangle_straight_wrist: "/poses/bangle/pose5.jpeg",
  bangle_wrist_touch: "/poses/bangle/pose1.jpeg",
  bangle_raised_arm: "/poses/bangle/pose3.jpeg",
  bangle_hand_down: "/poses/bangle/pose2.jpeg",
  bangle_flat_back: "/poses/bangle/pose4.jpeg",
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
  const batchId = searchParams?.get("batchId") ?? null;
  const [step, setStep] = useState<BriefStep>("type");
  const [brief, setBrief] = useState<GenerationBrief>(() =>
    getDefaultGenerationBrief("necklace"),
  );
  const [state, setState] = useState<BriefState>({ status: "idle" });
  const [isPending, startTransition] = useTransition();
  const [batchImageCount, setBatchImageCount] = useState(0);
  const [credits, setCredits] = useState<number | null>(null);
  const poseOptions = useMemo(
    () => getPosePresetsForJewelryType(brief.jewelryType),
    [brief.jewelryType],
  );
  const selectedPose = getPosePreset(brief.posePresetId);
  const isBusy = state.status === "creating" || isPending;

  // Fetch batch image count and credits for batch mode
  useEffect(() => {
    if (batchId) {
      fetch(`/api/batches/${batchId}`).then((r) => r.json()).then((data) => {
        const uploaded = data.images?.filter((i: { uploadStatus: string }) => i.uploadStatus === "uploaded").length ?? 0;
        setBatchImageCount(uploaded);
      }).catch(() => {});
    }
    fetch("/api/profile").then((r) => r.json()).then((d) => setCredits(d.credits ?? 0)).catch(() => {});
  }, [batchId]);

  const imageCount = batchId ? batchImageCount : 1;
  const hasInsufficientCredits = credits !== null && credits < imageCount;

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
    try {
      setState({ status: "creating" });

      if (batchId) {
        // Batch generation
        const response = await postJson<{ batchId: string }>(`/api/batches/${batchId}/generate`, {
          mode: brief.generationMode,
          generationBrief: brief,
          clientRequestId: clientRequestId(),
        });
        router.replace(`/batch?batchId=${response.batchId}` as import("next").Route);
      } else if (imageId) {
        // Single image generation (existing flow)
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
      } else {
        setState({ status: "failed", message: "No image selected." });
      }
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
        <div className="eyebrow">Ornava Studio</div>
        <h1 className="title">
          {step === "type"
            ? "Kya bech rahe ho?"
            : step === "pose"
              ? "Look choose karo"
              : "Background & finish"}
        </h1>
        {batchId && batchImageCount > 0 ? (
          <p className="copy">Settings for {batchImageCount} image{batchImageCount > 1 ? "s" : ""}</p>
        ) : null}
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
              <span className="icon-tile">
                {jewelryIcons[jewelryType] ? (
                  <img
                    src={jewelryIcons[jewelryType]}
                    alt=""
                    style={jewelryIconSize[jewelryType] ? { width: jewelryIconSize[jewelryType], height: jewelryIconSize[jewelryType] } : undefined}
                  />
                ) : (
                  <Icon name="diamond" size={28} />
                )}
              </span>
              <span className="choice-card-label">{jewelryLabels[jewelryType]}</span>
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
            </div>
          </div>
          <div className="template-grid">
            {poseOptions.map((pose, index) => {
              const preview = getPoseTemplatePreview(pose.id);
              const thumbnail = poseThumbnails[pose.id];

              return (
                <button
                  className={`template-card${
                    brief.posePresetId === pose.id ? " selected" : ""
                  }`}
                  key={pose.id}
                  type="button"
                  onClick={() => selectPose(pose.id)}
                >
                  {thumbnail ? (
                    <span className="template-preview" aria-hidden="true">
                      <img className="template-preview-img" src={thumbnail} alt="" />
                    </span>
                  ) : (
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
                  )}
                  <span className="template-card-copy">
                    <span className="template-card-header">
                      <strong>{preview?.title ?? pose.label}</strong>
                      {index === 0 ? <span className="status-pill">Best</span> : null}
                    </span>
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
            <div className="bg-swatch-grid">
              {BACKGROUND_PRESET_OPTIONS.map((background) => (
                <button
                  className={`bg-swatch-card${
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
                    className="bg-swatch-color"
                    style={{ background: backgroundSwatches[background.id] }}
                  />
                  <span className="bg-swatch-label">{background.label}</span>
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

          {/* Credit warning for batch */}
          {batchId && hasInsufficientCredits && credits !== null ? (
            <div className="up-error" style={{ background: "#fff8e1", borderColor: "#f9a825", color: "#5d4037" }}>
              <Icon name="diamond" size={15} />
              <span>You have {credits} credit{credits !== 1 ? "s" : ""}. Only {credits} of {imageCount} images will generate.</span>
            </div>
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
              disabled={(!imageId && !batchId) || isBusy}
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
              {batchId
                ? `Generate ${hasInsufficientCredits ? credits : imageCount} image${(hasInsufficientCredits ? credits! : imageCount) > 1 ? "s" : ""}`
                : "Generate"}
            </button>
          </div>
        </>
      ) : null}
    </>
  );
}
