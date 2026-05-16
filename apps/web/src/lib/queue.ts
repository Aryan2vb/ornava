import { Queue } from "bullmq";
import {
  GENERATION_QUEUE_NAME,
  buildGenerationJobId,
  type GenerationJobData,
} from "@ornava/shared";
import { env } from "./env";

let generationQueue: Queue<GenerationJobData> | undefined;

function redisConnectionOptions() {
  const redisUrl = new URL(env.REDIS_URL ?? "redis://localhost:6379");
  const useTls = redisUrl.protocol === "rediss:";

  return {
    host: redisUrl.hostname,
    port: Number(redisUrl.port || 6379),
    password: redisUrl.password || undefined,
    ...(useTls ? { tls: {} } : {}),
    maxRetriesPerRequest: null,
  };
}

export function getGenerationQueue() {
  generationQueue ??= new Queue<GenerationJobData>(GENERATION_QUEUE_NAME, {
    connection: redisConnectionOptions(),
  });

  return generationQueue;
}

export async function enqueueGenerationJob(data: GenerationJobData) {
  return getGenerationQueue().add("generate-image", data, {
    jobId: buildGenerationJobId(data.generationId),
    priority: data.batchId ? 5 : 1,
    attempts: 1,
    removeOnComplete: {
      age: 60 * 60 * 24,
      count: 1000,
    },
    removeOnFail: {
      age: 60 * 60 * 24 * 7,
      count: 5000,
    },
  });
}
