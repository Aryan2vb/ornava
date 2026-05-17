"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import { getCachedObjectUrl } from "@/lib/device-cache";

type CachedImageProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "src" | "onError"
> & {
  src: string;
  cacheKey?: string;
  cacheVersion?: string | null;
  fallback?: React.ReactNode;
  loadWhenVisible?: boolean;
  onLoadError?: (error: Error) => void;
  placeholderClassName?: string;
  rootMargin?: string;
};

export function CachedImage({
  src,
  cacheKey,
  cacheVersion,
  fallback = null,
  loadWhenVisible = true,
  onLoadError,
  placeholderClassName,
  rootMargin = "360px",
  ...imgProps
}: CachedImageProps) {
  const placeholderRef = useRef<HTMLSpanElement | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(!loadWhenVisible);

  useEffect(() => {
    if (!loadWhenVisible) {
      setShouldLoad(true);
      return;
    }

    const node = placeholderRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [loadWhenVisible, rootMargin]);

  useEffect(() => {
    if (!shouldLoad) return;

    const controller = new AbortController();
    let localObjectUrl: string | null = null;
    setObjectUrl(null);
    setFailed(false);

    getCachedObjectUrl({
      sourceUrl: src,
      cacheKey,
      cacheVersion,
      signal: controller.signal,
    })
      .then((url) => {
        if (controller.signal.aborted) {
          URL.revokeObjectURL(url);
          return;
        }
        localObjectUrl = url;
        setObjectUrl(url);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        const normalizedError = error instanceof Error ? error : new Error("Image cache failed");
        setFailed(true);
        onLoadError?.(normalizedError);
      });

    return () => {
      controller.abort();
      if (localObjectUrl) URL.revokeObjectURL(localObjectUrl);
    };
  }, [cacheKey, cacheVersion, onLoadError, shouldLoad, src]);

  function renderFallback() {
    return (
      <span
        aria-hidden={imgProps.alt ? undefined : true}
        className={placeholderClassName}
        ref={placeholderRef}
      >
        {fallback}
      </span>
    );
  }

  if (failed) return renderFallback();
  if (!objectUrl) return renderFallback();

  return <img {...imgProps} src={objectUrl} />;
}
