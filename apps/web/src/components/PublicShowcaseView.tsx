"use client";

import type { PublicShowcaseResponse } from "@ornava/shared";
import { useEffect, useMemo, useRef, useState } from "react";
import { buildShowcaseWhatsappInquiryUrl } from "@/lib/showcase";

type ShowcaseState =
  | { status: "loading" }
  | { status: "ready"; showcase: PublicShowcaseResponse }
  | { status: "failed"; message: string };

export function PublicShowcaseView({ showcaseId }: { showcaseId: string }) {
  const [state, setState] = useState<ShowcaseState>({ status: "loading" });
  const [activeIndex, setActiveIndex] = useState(0);
  const [showcaseUrl, setShowcaseUrl] = useState("");
  const trackRef = useRef<HTMLDivElement | null>(null);
  const requestedDesignIndexRef = useRef<number | null>(null);

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
    const requestedDesign = Number.parseInt(
      new URLSearchParams(window.location.search).get("d") ?? "",
      10,
    );

    if (Number.isInteger(requestedDesign) && requestedDesign > 0) {
      requestedDesignIndexRef.current = requestedDesign - 1;
    }
  }, []);

  useEffect(() => {
    if (state.status !== "ready" || requestedDesignIndexRef.current === null) {
      return;
    }

    const designIndex = Math.min(
      requestedDesignIndexRef.current,
      state.showcase.items.length - 1,
    );
    const track = trackRef.current;

    setActiveIndex(designIndex);
    if (track) {
      track.scrollLeft = track.clientWidth * designIndex;
    }
    requestedDesignIndexRef.current = null;
  }, [state]);

  const activeItem =
    state.status === "ready" ? state.showcase.items[activeIndex] : undefined;
  const activeDesignCount =
    state.status === "ready"
      ? Math.min(activeIndex + 1, state.showcase.items.length)
      : 1;
  const designProgress =
    state.status === "ready"
      ? `${(activeDesignCount / state.showcase.items.length) * 100}%`
      : "0%";
  const inquiryUrl = useMemo(() => {
    if (state.status !== "ready" || !activeItem || !showcaseUrl) {
      return null;
    }

    return buildShowcaseWhatsappInquiryUrl({
      phone: state.showcase.jeweler.phone,
      showcaseUrl,
      designNumber: activeDesignCount,
    });
  }, [activeDesignCount, activeItem, showcaseUrl, state]);

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
        <div className="public-showcase-progress">
          <span>
            Design {activeDesignCount} of {state.showcase.items.length}
          </span>
          <div className="public-showcase-meter" aria-hidden="true">
            <span style={{ width: designProgress }} />
          </div>
        </div>
        {inquiryUrl ? (
          <a className="public-showcase-inquiry" href={inquiryUrl}>
            <img
              alt=""
              className="public-showcase-whatsapp-logo"
              height={26}
              src="/icons/whatsapp.svg"
              width={26}
            />
            Ask on WhatsApp
          </a>
        ) : null}
      </footer>
    </main>
  );
}

function formatJewelryLabel(jewelryType?: string) {
  if (!jewelryType) {
    return "Jewelry design";
  }

  return jewelryType.replaceAll("_", " ");
}
