import { Pool } from "pg";
import { env } from "./env";
import { normalizeEmail } from "./identity";

declare global {
  // eslint-disable-next-line no-var
  var __ornavaPool: Pool | undefined;
}

let pool: Pool | undefined;

export function getPool() {
  const connectionString = env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required for the web app database layer.");
  }

  if (!pool) {
    pool =
      globalThis.__ornavaPool ??
      new Pool({
        connectionString,
      });

    if (process.env.NODE_ENV !== "production") {
      globalThis.__ornavaPool = pool;
    }
  }

  return pool;
}

export type AppUserRow = {
  id: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  beta_cohort: string | null;
};

export type ImageRow = {
  id: string;
  user_id: string;
  original_object_key: string;
  status: "created" | "uploaded" | "failed" | "deleted";
};

export async function upsertUserFromOAuthProfile(input: {
  email: string;
  name?: string | null;
  image?: string | null;
}) {
  const email = normalizeEmail(input.email);

  if (!email) {
    throw new Error("A non-empty email is required to upsert an app user.");
  }

  const result = await getPool().query<AppUserRow>(
    `
      insert into app_users (email, name, avatar_url, last_seen_at)
      values ($1, $2, $3, now())
      on conflict (email)
      do update set
        name = coalesce(excluded.name, app_users.name),
        avatar_url = coalesce(excluded.avatar_url, app_users.avatar_url),
        last_seen_at = now(),
        updated_at = now()
      returning id, email, name, avatar_url, beta_cohort
    `,
    [email, input.name ?? null, input.image ?? null],
  );

  return result.rows[0];
}

export async function createImageUpload(input: {
  imageId: string;
  userId: string;
  objectKey: string;
  fileType: "image/jpeg" | "image/png";
  fileSizeBytes: number;
  width?: number;
  height?: number;
}) {
  const result = await getPool().query<ImageRow>(
    `
      insert into images (
        id,
        user_id,
        original_object_key,
        status,
        file_type,
        file_size_bytes,
        width,
        height
      )
      values ($1, $2, $3, 'created', $4, $5, $6, $7)
      returning id, user_id, original_object_key, status
    `,
    [
      input.imageId,
      input.userId,
      input.objectKey,
      input.fileType,
      input.fileSizeBytes,
      input.width ?? null,
      input.height ?? null,
    ],
  );

  return result.rows[0];
}

export async function markImageUploaded(input: {
  userId: string;
  imageId: string;
  objectKey: string;
}) {
  const result = await getPool().query<ImageRow>(
    `
      update images
      set status = 'uploaded'
      where id = $1
        and user_id = $2
        and original_object_key = $3
        and status = 'created'
      returning id, user_id, original_object_key, status
    `,
    [input.imageId, input.userId, input.objectKey],
  );

  return result.rows[0] ?? null;
}
