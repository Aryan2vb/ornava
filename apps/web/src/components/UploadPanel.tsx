"use client";

import type {
  UploadCompleteRequest,
  UploadCompleteResponse,
  UploadInitRequest,
  UploadInitResponse,
} from "@ornava/shared";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { useRef, useState, useTransition } from "react";
import { Icon } from "./Icon";
import {
  buildUploadProxyPath,
  isBrowserUploadNetworkError,
} from "@/lib/upload";
import {
  getUploadStepProgress,
  uploadActivitySteps,
  type UploadActivityStep,
} from "@/lib/beta-ui";
import { compressImageForGeneration } from "@/lib/image-compression";

const MAX_UPLOAD_BYTES = 20_000_000;
const SUPPORTED_TYPES = new Set(["image/jpeg", "image/png"]);

type UploadState =
  | { status: "idle" }
  | { status: "uploading"; step: UploadActivityStep }
  | {
      status: "uploaded";
      imageId: string;
      fileName: string;
      compressionApplied: boolean;
    }
  | { status: "error"; message: string };

function getImageDimensions(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read image dimensions."));
    };

    image.src = objectUrl;
  });
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

async function postFormData<TResponse>(url: string, body: FormData) {
  const response = await fetch(url, {
    method: "POST",
    body,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.error ?? "Request failed.");
  }

  return (await response.json()) as TResponse;
}

export function UploadPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [state, setState] = useState<UploadState>({ status: "idle" });
  const [isPending, startTransition] = useTransition();
  const uploadProgress =
    state.status === "uploaded"
      ? getUploadStepProgress("uploaded")
      : state.status === "uploading"
        ? getUploadStepProgress(state.step)
        : 0;
  const uploadStatusLabel =
    state.status === "uploaded"
      ? uploadActivitySteps.uploaded.label
      : state.status === "uploading"
        ? uploadActivitySteps[state.step].label
        : "Waiting for photo";

  async function uploadFile(file: File) {
    if (!SUPPORTED_TYPES.has(file.type)) {
      setState({ status: "error", message: "Use a JPG or PNG image." });
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setState({ status: "error", message: "Use an image up to 20MB." });
      return;
    }

    try {
      setState({ status: "uploading", step: "reading" });
      const dimensions = await getImageDimensions(file);
      setState({ status: "uploading", step: "optimizing" });
      const generationInput = await compressImageForGeneration({
        file,
        dimensions,
      });

      const initRequest: UploadInitRequest = {
        fileName: generationInput.file.name,
        fileType: generationInput.file.type as UploadInitRequest["fileType"],
        fileSizeBytes: generationInput.file.size,
        width: generationInput.dimensions.width,
        height: generationInput.dimensions.height,
      };

      setState({ status: "uploading", step: "preparing" });
      const initResponse = await postJson<UploadInitResponse>(
        "/api/uploads/init",
        initRequest,
      );

      const completeRequest: UploadCompleteRequest = {
        imageId: initResponse.imageId,
        objectKey: initResponse.objectKey,
      };

      let completeResponse: UploadCompleteResponse;

      try {
        setState({ status: "uploading", step: "uploading" });
        const uploadResponse = await fetch(initResponse.uploadUrl, {
          method: "PUT",
          headers: {
            "content-type": generationInput.file.type,
          },
          body: generationInput.file,
        });

        if (!uploadResponse.ok) {
          throw new Error("R2 upload failed.");
        }

        setState({ status: "uploading", step: "saving" });
        completeResponse = await postJson<UploadCompleteResponse>(
          "/api/uploads/complete",
          completeRequest,
        );
      } catch (uploadError) {
        if (!isBrowserUploadNetworkError(uploadError)) {
          throw uploadError;
        }

        setState({ status: "uploading", step: "uploading" });
        const proxyUpload = new FormData();
        proxyUpload.append("file", generationInput.file);
        proxyUpload.append("objectKey", initResponse.objectKey);

        completeResponse = await postFormData<UploadCompleteResponse>(
          buildUploadProxyPath(initResponse.imageId),
          proxyUpload,
        );
      }

      setState({
        status: "uploaded",
        imageId: completeResponse.imageId,
        fileName: file.name,
        compressionApplied: generationInput.compressionApplied,
      });
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Upload failed. Please try again.",
      });
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    startTransition(() => {
      void uploadFile(file);
    });
  }

  return (
    <>
      <div className="asset-slot" aria-label="Upload jewelry photo">
        <span className="icon-tile" style={{ width: 76, height: 76, borderRadius: 20 }}>
          <Icon name="camera" size={34} />
        </span>
        <div>
          <strong style={{ fontSize: 21, lineHeight: "26px" }}>
            Choose or capture photo
          </strong>
          <p className="copy">
            JPG or PNG up to 20MB. Use the real product photo here.
          </p>
        </div>
        <input
          ref={inputRef}
          accept="image/jpeg,image/png"
          className="visually-hidden"
          type="file"
          onChange={handleFileChange}
        />
        <button
          className="button"
          disabled={state.status === "uploading" || isPending}
          type="button"
          onClick={() => inputRef.current?.click()}
        >
          {state.status === "uploading" ? (
            <span className="spinner" aria-hidden="true" />
          ) : (
            <Icon name="download" size={17} />
          )}
          {state.status === "uploading" ? "Working..." : "Select photo"}
        </button>
      </div>
      <div className="panel">
        <div className="screen-header-row">
          <div className="row-card" style={{ border: 0, padding: 0 }}>
            <span className="icon-tile" style={{ width: 34, height: 34 }}>
              <Icon name="clock" size={18} />
            </span>
            <div className="row-card-body">
              <strong>Optimized before upload</strong>
              <p className="copy">Large photos become a smaller generation source.</p>
            </div>
          </div>
          <span className="status-pill">{uploadProgress}%</span>
        </div>
        <div className="progress-bar" aria-hidden="true">
          <div
            className="progress-fill"
            style={{ width: `${uploadProgress}%` } as CSSProperties}
          />
        </div>
        <p className="copy">{uploadStatusLabel}</p>
        {state.status === "uploading" ? (
          <p className="status-text">
            <span className="pulse-dot" aria-hidden="true" />
            {uploadActivitySteps[state.step].label}...
          </p>
        ) : null}
        {state.status === "error" ? (
          <p className="status-text error">{state.message}</p>
        ) : null}
        {state.status === "uploaded" ? (
          <div className="upload-success">
            <strong>{state.fileName}</strong>
            <p className="copy">
              {state.compressionApplied
                ? "Optimized image uploaded and saved."
                : "Image uploaded and saved."}
            </p>
          </div>
        ) : null}
      </div>
      <div className="soft-panel">
        <strong>Best photo checklist</strong>
        {[
          "Full jewelry visible",
          "No text stickers or screenshots",
          "Sharpest available photo",
        ].map((item) => (
          <div className="brand-row" key={item}>
            <Icon name="check" size={15} style={{ color: "var(--success)" }} />
            <span>{item}</span>
          </div>
        ))}
      </div>
      <button
        className="button"
        disabled={state.status !== "uploaded"}
        type="button"
        onClick={() => {
          if (state.status === "uploaded") {
            router.push(`/brief?imageId=${state.imageId}`);
          }
        }}
      >
        <Icon name="arrow-right" size={17} />
        Continue
      </button>
    </>
  );
}
