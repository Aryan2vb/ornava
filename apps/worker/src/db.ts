import { Pool } from "pg";
import { env } from "./env";

let pool: Pool | undefined;

export function getPool() {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for the worker database layer.");
  }

  pool ??= new Pool({
    connectionString: env.DATABASE_URL,
  });

  return pool;
}

export async function markGenerationProcessing(generationId: string) {
  await getPool().query(
    `
      update generations
      set
        status = 'processing',
        started_at = coalesce(started_at, now()),
        attempt_count = attempt_count + 1,
        updated_at = now()
      where id = $1
        and status in ('queued', 'failed')
    `,
    [generationId],
  );
}

export async function markGenerationFailed(input: {
  generationId: string;
  failureCode: string;
  failureMessageSafe: string;
}) {
  await getPool().query(
    `
      update generations
      set
        status = 'failed',
        failure_code = $2,
        failure_message_safe = $3,
        completed_at = now(),
        updated_at = now()
      where id = $1
    `,
    [input.generationId, input.failureCode, input.failureMessageSafe],
  );
}

export async function closePool() {
  await pool?.end();
  pool = undefined;
}
