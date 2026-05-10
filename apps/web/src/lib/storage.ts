import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "./env";

let r2Client: S3Client | undefined;

function getR2Client() {
  if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
    throw new Error("R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY are required.");
  }

  if (!r2Client) {
    r2Client = new S3Client({
      region: "auto",
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      requestChecksumCalculation: "WHEN_REQUIRED",
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });
  }

  return r2Client;
}

export async function createOriginalUploadUrl(input: {
  objectKey: string;
  fileType: "image/jpeg" | "image/png";
}) {
  const expiresInSeconds = 15 * 60;
  const command = new PutObjectCommand({
    Bucket: env.R2_ORIGINALS_BUCKET,
    Key: input.objectKey,
    ContentType: input.fileType,
  });

  const uploadUrl = await getSignedUrl(getR2Client(), command, {
    expiresIn: expiresInSeconds,
  });

  return {
    uploadUrl,
    expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
  };
}

export async function createObjectReadUrl(input: {
  bucket: string;
  objectKey: string;
}) {
  const expiresInSeconds = 15 * 60;
  const command = new GetObjectCommand({
    Bucket: input.bucket,
    Key: input.objectKey,
  });

  const url = await getSignedUrl(getR2Client(), command, {
    expiresIn: expiresInSeconds,
  });

  return {
    url,
    expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
  };
}
