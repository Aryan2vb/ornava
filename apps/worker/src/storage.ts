import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  type GetObjectCommandOutput,
} from "@aws-sdk/client-s3";
import type { OutputFormat } from "@ornava/shared";
import { env } from "./env";

type RequiredR2Env = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
};

let r2Client: S3Client | undefined;

function getRequiredR2Env(): RequiredR2Env {
  if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
    throw new Error(
      "R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY are required for worker storage.",
    );
  }

  return {
    accountId: env.R2_ACCOUNT_ID,
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  };
}

export function getR2Client() {
  const r2Env = getRequiredR2Env();

  r2Client ??= new S3Client({
    region: "auto",
    endpoint: `https://${r2Env.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: r2Env.accessKeyId,
      secretAccessKey: r2Env.secretAccessKey,
    },
  });

  return r2Client;
}

async function objectBodyToBytes(body: GetObjectCommandOutput["Body"]) {
  if (!body) {
    throw new Error("R2 object response did not include a body.");
  }

  if ("transformToByteArray" in body) {
    return body.transformToByteArray();
  }

  throw new Error("R2 object body cannot be converted to bytes.");
}

export async function getOriginalImageObject(objectKey: string) {
  const result = await getR2Client().send(
    new GetObjectCommand({
      Bucket: env.R2_ORIGINALS_BUCKET,
      Key: objectKey,
    }),
  );

  return {
    bytes: await objectBodyToBytes(result.Body),
    contentType: result.ContentType,
  };
}

export function contentTypeForOutputFormat(format: OutputFormat) {
  const contentTypes: Record<OutputFormat, string> = {
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  };

  return contentTypes[format];
}

export function extensionForOutputFormat(format: OutputFormat) {
  return format === "jpeg" ? "jpg" : format;
}

export function buildGeneratedObjectKey(input: {
  userId: string;
  generationId: string;
  format: OutputFormat;
}) {
  return `users/${input.userId}/generated/${input.generationId}/output.${extensionForOutputFormat(input.format)}`;
}

export async function putGeneratedImageObject(input: {
  objectKey: string;
  bytes: Uint8Array;
  contentType: string;
}) {
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: env.R2_GENERATED_BUCKET,
      Key: input.objectKey,
      Body: input.bytes,
      ContentType: input.contentType,
    }),
  );
}
