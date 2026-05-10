export const GENERATION_INPUT_POLICY = {
  maxEdgePixels: 1600,
  jpegQuality: 0.86,
  recompressAboveBytes: 4_000_000,
  outputType: "image/jpeg",
} as const;

type SupportedUploadType = "image/jpeg" | "image/png";

export type ImageDimensions = {
  width: number;
  height: number;
};

export type GenerationInputCompressionPlan = {
  shouldCompress: boolean;
  targetWidth: number;
  targetHeight: number;
  outputType: typeof GENERATION_INPUT_POLICY.outputType;
  quality: typeof GENERATION_INPUT_POLICY.jpegQuality;
};

export function planGenerationInputCompression(input: {
  fileName: string;
  fileType: SupportedUploadType;
  fileSizeBytes: number;
  width: number;
  height: number;
}): GenerationInputCompressionPlan {
  const scale = Math.min(
    1,
    GENERATION_INPUT_POLICY.maxEdgePixels / Math.max(input.width, input.height),
  );
  const targetWidth = Math.max(1, Math.round(input.width * scale));
  const targetHeight = Math.max(1, Math.round(input.height * scale));
  const shouldResize = targetWidth !== input.width || targetHeight !== input.height;
  const shouldConvertToJpeg = input.fileType !== GENERATION_INPUT_POLICY.outputType;
  const shouldRecompress = input.fileSizeBytes > GENERATION_INPUT_POLICY.recompressAboveBytes;

  return {
    shouldCompress: shouldResize || shouldConvertToJpeg || shouldRecompress,
    targetWidth,
    targetHeight,
    outputType: GENERATION_INPUT_POLICY.outputType,
    quality: GENERATION_INPUT_POLICY.jpegQuality,
  };
}

export function buildCompressedFileName(fileName: string) {
  const withoutExtension = fileName.replace(/\.[^.]+$/, "");
  return `${withoutExtension || "image"}.jpg`;
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not prepare image for generation."));
    };

    image.src = objectUrl;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: typeof GENERATION_INPUT_POLICY.outputType,
  quality: number,
) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not compress image for generation."));
          return;
        }

        resolve(blob);
      },
      type,
      quality,
    );
  });
}

export async function compressImageForGeneration(input: {
  file: File;
  dimensions: ImageDimensions;
}) {
  const plan = planGenerationInputCompression({
    fileName: input.file.name,
    fileType: input.file.type as SupportedUploadType,
    fileSizeBytes: input.file.size,
    width: input.dimensions.width,
    height: input.dimensions.height,
  });

  if (!plan.shouldCompress) {
    return {
      file: input.file,
      dimensions: input.dimensions,
      compressionApplied: false,
      originalSizeBytes: input.file.size,
    };
  }

  const image = await loadImage(input.file);
  const canvas = document.createElement("canvas");
  canvas.width = plan.targetWidth;
  canvas.height = plan.targetHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not compress image for generation.");
  }

  context.drawImage(image, 0, 0, plan.targetWidth, plan.targetHeight);
  const blob = await canvasToBlob(canvas, plan.outputType, plan.quality);
  const compressedFile = new File([blob], buildCompressedFileName(input.file.name), {
    type: plan.outputType,
    lastModified: input.file.lastModified,
  });

  return {
    file: compressedFile,
    dimensions: {
      width: plan.targetWidth,
      height: plan.targetHeight,
    },
    compressionApplied: true,
    originalSizeBytes: input.file.size,
  };
}
