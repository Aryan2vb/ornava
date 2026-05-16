const DEVICE_CACHE_NAME = "ornava-device-assets-v1";
const DEVICE_CACHE_TIMESTAMP_HEADER = "x-ornava-cached-at";
const DEFAULT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_CONCURRENT_CACHE_FETCHES = 3;

let activeCacheFetches = 0;
const pendingCacheFetches: Array<() => void> = [];

function releaseCacheFetchSlot() {
  activeCacheFetches = Math.max(0, activeCacheFetches - 1);
  pendingCacheFetches.shift()?.();
}

async function runLimitedCacheFetch<T>(task: () => Promise<T>, signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new DOMException("Image request cancelled", "AbortError");
  }

  await new Promise<void>((resolve, reject) => {
    const start = () => {
      if (signal?.aborted) {
        reject(new DOMException("Image request cancelled", "AbortError"));
        return;
      }
      activeCacheFetches += 1;
      resolve();
    };

    if (activeCacheFetches < MAX_CONCURRENT_CACHE_FETCHES) {
      start();
    } else {
      pendingCacheFetches.push(start);
    }
  });

  try {
    return await task();
  } finally {
    releaseCacheFetchSlot();
  }
}

export function buildDeviceCacheUrl(
  sourceUrl: string,
  cacheVersion?: string | null,
  baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost",
) {
  const url = new URL(sourceUrl, baseUrl);
  if (cacheVersion) {
    url.searchParams.set("cacheVersion", cacheVersion);
  }
  return url.toString();
}

export function isDeviceCacheEntryFresh(
  cachedAt: string | null,
  nowMs: number,
  maxAgeMs: number,
) {
  if (!cachedAt) return false;
  const cachedAtMs = Number(cachedAt);
  return Number.isFinite(cachedAtMs) && nowMs - cachedAtMs <= maxAgeMs;
}

function canUseDeviceCache() {
  return typeof window !== "undefined" && "caches" in window;
}

async function cacheResponseBlob(request: Request, blob: Blob) {
  if (!canUseDeviceCache()) return;

  const cache = await caches.open(DEVICE_CACHE_NAME);
  const headers = new Headers({
    "content-type": blob.type || "application/octet-stream",
    [DEVICE_CACHE_TIMESTAMP_HEADER]: String(Date.now()),
  });

  await cache.put(request, new Response(blob, { status: 200, headers }));
}

export async function putDeviceCacheBlob(input: {
  sourceUrl: string;
  blob: Blob;
  cacheKey?: string;
  cacheVersion?: string | null;
}) {
  if (!canUseDeviceCache()) return;

  const cacheUrl = buildDeviceCacheUrl(input.cacheKey ?? input.sourceUrl, input.cacheVersion);
  await cacheResponseBlob(new Request(cacheUrl, { credentials: "same-origin" }), input.blob);
}

export async function getCachedObjectUrl(input: {
  sourceUrl: string;
  cacheKey?: string;
  cacheVersion?: string | null;
  maxAgeMs?: number;
  signal?: AbortSignal;
}) {
  const cacheUrl = buildDeviceCacheUrl(input.cacheKey ?? input.sourceUrl, input.cacheVersion);
  const request = new Request(cacheUrl, { credentials: "same-origin" });
  const maxAgeMs = input.maxAgeMs ?? DEFAULT_MAX_AGE_MS;

  if (canUseDeviceCache()) {
    const cache = await caches.open(DEVICE_CACHE_NAME);
    const cached = await cache.match(request);

    if (
      cached &&
      isDeviceCacheEntryFresh(
        cached.headers.get(DEVICE_CACHE_TIMESTAMP_HEADER),
        Date.now(),
        maxAgeMs,
      )
    ) {
      return URL.createObjectURL(await cached.blob());
    }

    if (cached) {
      await cache.delete(request);
    }
  }

  const blob = await runLimitedCacheFetch(async () => {
    const response = await fetch(input.sourceUrl, {
      credentials: "same-origin",
      signal: input.signal,
    });
    if (!response.ok) {
      throw new Error(`Image request failed: HTTP ${response.status}`);
    }

    return response.blob();
  }, input.signal);

  await cacheResponseBlob(request, blob);
  return URL.createObjectURL(blob);
}

export async function deleteDeviceCacheEntry(input: {
  sourceUrl: string;
  cacheKey?: string;
  cacheVersion?: string | null;
}) {
  if (!canUseDeviceCache()) return;

  const cacheUrl = buildDeviceCacheUrl(input.cacheKey ?? input.sourceUrl, input.cacheVersion);
  const cache = await caches.open(DEVICE_CACHE_NAME);
  await cache.delete(new Request(cacheUrl, { credentials: "same-origin" }));
}
