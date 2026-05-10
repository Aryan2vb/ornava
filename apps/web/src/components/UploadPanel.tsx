"use client";

import type {
  UploadCompleteRequest,
  UploadCompleteResponse,
  UploadInitRequest,
  UploadInitResponse,
} from "@ornava/shared";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { compressImageForGeneration } from "@/lib/image-compression";

const MAX_UPLOAD_BYTES = 20_000_000;
const SUPPORTED_TYPES = new Set(["image/jpeg", "image/png"]);

type UploadState =
  | { status: "idle" }
  | { status: "uploading"; message: string }
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

export function UploadPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [state, setState] = useState<UploadState>({ status: "idle" });
  const [isPending, startTransition] = useTransition();

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
      setState({ status: "uploading", message: "Reading image..." });
      const dimensions = await getImageDimensions(file);
      setState({ status: "uploading", message: "Optimizing for generation..." });
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

      setState({ status: "uploading", message: "Preparing secure upload..." });
      const initResponse = await postJson<UploadInitResponse>(
        "/api/uploads/init",
        initRequest,
      );

      setState({ status: "uploading", message: "Uploading optimized image..." });
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

      const completeRequest: UploadCompleteRequest = {
        imageId: initResponse.imageId,
        objectKey: initResponse.objectKey,
      };

      setState({ status: "uploading", message: "Saving upload..." });
      const completeResponse = await postJson<UploadCompleteResponse>(
        "/api/uploads/complete",
        completeRequest,
      );

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
      <div className="panel" aria-label="Upload jewelry photo">
        <strong>JPG or PNG, up to 20MB</strong>
        <p className="copy">
          Large images are optimized before upload so beta generations start faster.
        </p>
        <input
          ref={inputRef}
          accept="image/jpeg,image/png"
          className="visually-hidden"
          type="file"
          onChange={handleFileChange}
        />
        <button
          className="button secondary"
          disabled={state.status === "uploading" || isPending}
          type="button"
          onClick={() => inputRef.current?.click()}
        >
          Choose photo
        </button>
        {state.status === "uploading" ? (
          <p className="status-text">{state.message}</p>
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
      <button
        className="button"
        disabled={state.status !== "uploaded"}
        type="button"
        onClick={() => {
          if (state.status === "uploaded") {
            router.push(`/generating?imageId=${state.imageId}`);
          }
        }}
      >
        Continue to generation
      </button>
    </>
  );
}
