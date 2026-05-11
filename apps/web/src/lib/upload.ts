import { z } from "zod";

const MAX_UPLOAD_BYTES = 20_000_000;

const uploadInitSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileType: z.enum(["image/jpeg", "image/png"]),
  fileSizeBytes: z.number().int().positive().max(MAX_UPLOAD_BYTES, {
    message: "File must be 20MB or smaller.",
  }),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export type ValidatedUploadInitRequest = z.infer<typeof uploadInitSchema>;

const extensionByMimeType: Record<ValidatedUploadInitRequest["fileType"], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
};

function slugFileName(fileName: string) {
  const baseName = fileName
    .replace(/\.[^.]+$/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return baseName || "image";
}

export function validateUploadInitRequest(input: unknown) {
  return uploadInitSchema.parse(input);
}

export function buildOriginalObjectKey(input: {
  userId: string;
  imageId: string;
  fileName: string;
  fileType: ValidatedUploadInitRequest["fileType"];
}) {
  const slug = slugFileName(input.fileName);
  const extension = extensionByMimeType[input.fileType];

  return `users/${input.userId}/originals/${input.imageId}/${slug}.${extension}`;
}

export function buildUploadProxyPath(imageId: string) {
  return `/api/uploads/${encodeURIComponent(imageId)}/proxy`;
}

export function isBrowserUploadNetworkError(error: unknown) {
  return error instanceof TypeError;
}
