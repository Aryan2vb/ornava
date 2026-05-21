"use client";

import type { PublicShowcaseResponse } from "@ornava/shared";
import { useEffect, useMemo, useRef, useState } from "react";
import { buildShowcaseWhatsappInquiryUrl } from "@/lib/showcase";
import { Icon } from "./Icon";

type ShowcaseState =
  | { status: "loading" }
  | { status: "ready"; showcase: PublicShowcaseResponse }
  | { status: "failed"; message: string };

export function PublicShowcaseView({ showcaseId }: { showcaseId: string }) {
  const [state, setState] = useState<ShowcaseState>({ status: "loading" });
  const [activeIndex, setActiveIndex] = useState(0);
  const [showcaseUrl, setShowcaseUrl] = useState("");
  const trackRef = useRef<HTMLDivElement | null>(null);
  const loggedGenerationIds = useRef(new Set<string>());
  const fingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/showcases/public/${showcaseId}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.error ?? "showcase_unavailable");
        }

        return (await response.json()) as PublicShowcaseResponse;
      })
      .then((showcase) => {
        if (!cancelled) {
          setState({ status: "ready", showcase });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({
            status: "failed",
            message: "This showcase is unavailable right now.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [showcaseId]);

  useEffect(() => {
    setShowcaseUrl(window.location.href.split("#")[0]);
  }, []);

  useEffect(() => {
    if (state.status !== "ready") {
      return;
    }

    const item = state.showcase.items[activeIndex];
    if (!item || loggedGenerationIds.current.has(item.generationId)) {
      return;
    }

    loggedGenerationIds.current.add(item.generationId);
    void logShowcaseView(showcaseId, item.generationId, fingerprintRef);
  }, [activeIndex, showcaseId, state]);

  const activeItem =
    state.status === "ready" ? state.showcase.items[activeIndex] : undefined;
  const inquiryUrl = useMemo(() => {
    if (state.status !== "ready" || !activeItem || !showcaseUrl) {
      return null;
    }

    return buildShowcaseWhatsappInquiryUrl({
      phone: state.showcase.jeweler.phone,
      showcaseUrl,
      imageUrl: activeItem.image.url,
    });
  }, [activeItem, showcaseUrl, state]);

  function updateActiveCard() {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    const slideWidth = track.clientWidth || 1;
    setActiveIndex(Math.round(track.scrollLeft / slideWidth));
  }

  if (state.status === "loading") {
    return (
      <main className="public-showcase public-showcase-state">
        <span className="spinner public-showcase-spinner" aria-hidden="true" />
        <p>Opening showcase...</p>
      </main>
    );
  }

  if (state.status === "failed") {
    return (
      <main className="public-showcase public-showcase-state">
        <p className="eyebrow">Ornava showcase</p>
        <h1>{state.message}</h1>
      </main>
    );
  }

  return (
    <main className="public-showcase">
      <header className="public-showcase-head">
        <div className="public-showcase-brand">
          {state.showcase.jeweler.logo ? (
            <img
              alt=""
              className="public-showcase-logo"
              src={state.showcase.jeweler.logo.url}
            />
          ) : (
            <span className="public-showcase-mark">O</span>
          )}
          <div>
            <p className="eyebrow">Jewelry showcase</p>
            <h1>{state.showcase.title}</h1>
          </div>
        </div>
        <p className="public-showcase-sub">
          {state.showcase.jeweler.name ?? "Shared from Ornava"}
        </p>
      </header>

      <div
        aria-label="Swipe jewelry showcase"
        className="public-showcase-track"
        ref={trackRef}
        onScroll={updateActiveCard}
      >
        {state.showcase.items.map((item, index) => (
          <article className="public-showcase-card" key={item.generationId}>
            <div className="public-showcase-image-frame">
              <img
                alt={`${formatJewelryLabel(item.jewelryType)} showcase design`}
                className="public-showcase-image"
                loading={index === 0 ? "eager" : "lazy"}
                src={item.image.url}
              />
            </div>
            <div className="public-showcase-caption">
              <div>
                <p>{formatJewelryLabel(item.jewelryType)}</p>
                <span>{item.mode.replace("_", " ")}</span>
              </div>
              {item.overlayText ? (
                <div className="public-showcase-tags">
                  <span>{item.overlayText.purity}</span>
                  <span>{item.overlayText.weightGm} gm</span>
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      <footer className="public-showcase-footer">
        <div className="public-showcase-dots" aria-hidden="true">
          {state.showcase.items.map((item, index) => (
            <span
              className={index === activeIndex ? "active" : ""}
              key={item.generationId}
            />
          ))}
        </div>
        {inquiryUrl ? (
          <a className="public-showcase-inquiry" href={inquiryUrl}>
            <Icon name="whatsapp" size={20} />
            Ask about this design
          </a>
        ) : null}
      </footer>
    </main>
  );
}

async function logShowcaseView(
  showcaseId: string,
  generationId: string,
  fingerprintRef: React.MutableRefObject<string | null>,
) {
  try {
    fingerprintRef.current ??= getShowcaseFingerprint();
    await fetch(`/api/showcases/public/${showcaseId}/views`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        generationId,
        fingerprint: fingerprintRef.current,
        deviceInfo: navigator.userAgent,
      }),
    });
  } catch {
    // Buyer browsing should not wait on activity logging.
  }
}

function getShowcaseFingerprint() {
  const storageKey = "ornava-showcase-viewer";
  const existing = window.sessionStorage.getItem(storageKey);

  if (existing) {
    return existing;
  }

  const fingerprint =
    globalThis.crypto?.randomUUID?.() ?? `viewer-${Date.now().toString(36)}`;
  window.sessionStorage.setItem(storageKey, fingerprint);
  return fingerprint;
}

function formatJewelryLabel(jewelryType?: string) {
  if (!jewelryType) {
    return "Jewelry design";
  }

  return jewelryType.replaceAll("_", " ");
}
