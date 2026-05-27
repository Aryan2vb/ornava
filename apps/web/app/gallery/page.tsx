"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CreateShowcaseResponse, OverlayText } from "@ornava/shared";
import { CachedImage } from "@/components/CachedImage";
import { Icon } from "@/components/Icon";
import { SidebarNav } from "@/components/SidebarNav";
import { BottomNav } from "@/components/BottomNav";
import { buildResultPagePath } from "@/lib/result";
import {
  buildShowcaseWhatsappShareText,
  MAX_SHOWCASE_ITEMS,
  toggleShowcaseGenerationSelection,
} from "@/lib/showcase";

type Generation = {
  id: string;
  image_id: string;
  mode: string;
  status: string;
  generation_brief: { jewelryType?: string };
  output_object_key: string | null;
  overlay_text: OverlayText | null;
  feedback_rating: string | null;
  generation_duration_ms: number | null;
  completed_at: string | null;
  created_at: string;
};

type DateFilter = "all" | "today" | "week";

const dateFilters: Array<{ value: DateFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "today", label: "Today" },
  { value: "week", label: "7 days" },
];

const jewelryLabels: Record<string, string> = {
  necklace: "Necklace",
  ring: "Ring",
  bracelet: "Bracelet",
  bangle: "Bangle",
  bracelet_bangle: "Bracelet",
  earrings: "Earrings",
  pendant: "Pendant",
  other: "Other",
};

function getGenerationTime(generation: Generation) {
  return new Date(generation.completed_at ?? generation.created_at);
}

function isToday(date: Date) {
  const now = new Date();
  return date.toDateString() === now.toDateString();
}

function isWithinDays(date: Date, days: number) {
  return Date.now() - date.getTime() <= days * 24 * 60 * 60 * 1000;
}

function formatItem(value?: string) {
  if (!value) return "Jewelry";
  return jewelryLabels[value] ?? value.replaceAll("_", " ");
}

function formatMode(value: string) {
  return value.replaceAll("_", " ");
}

function formatShortDate(date: Date) {
  if (isToday(date)) return "Today";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  }).format(date);
}

export default function GalleryPage() {
  const router = useRouter();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [itemFilter, setItemFilter] = useState("all");
  const [selectingShowcase, setSelectingShowcase] = useState(false);
  const [showcaseSelection, setShowcaseSelection] = useState<string[]>([]);
  const [creatingShowcase, setCreatingShowcase] = useState(false);
  const [createdShowcase, setCreatedShowcase] =
    useState<CreateShowcaseResponse | null>(null);
  const [showcaseStatus, setShowcaseStatus] = useState<string | null>(null);
  const [showcaseError, setShowcaseError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/generations/history")
      .then((r) => r.json())
      .then((d) => {
        setGenerations(
          (d.generations ?? []).filter((g: Generation) => g.status === "completed")
        );
        setLoading(false);
      });
  }, []);

  const itemFilters = useMemo(() => {
    const values = new Set(
      generations
        .map((g) => g.generation_brief?.jewelryType)
        .filter((value): value is string => Boolean(value)),
    );

    return Array.from(values).sort((a, b) => formatItem(a).localeCompare(formatItem(b)));
  }, [generations]);

  const filteredGenerations = useMemo(() => {
    return generations.filter((generation) => {
      const generatedAt = getGenerationTime(generation);
      const matchesDate =
        dateFilter === "all" ||
        (dateFilter === "today" && isToday(generatedAt)) ||
        (dateFilter === "week" && isWithinDays(generatedAt, 7));
      const matchesItem =
        itemFilter === "all" ||
        generation.generation_brief?.jewelryType === itemFilter;

      return matchesDate && matchesItem;
    });
  }, [dateFilter, generations, itemFilter]);

  function resetFilters() {
    setDateFilter("all");
    setItemFilter("all");
  }

  function toggleShowcaseSelection(generationId: string) {
    setShowcaseStatus(null);
    setShowcaseSelection((current) =>
      toggleShowcaseGenerationSelection(current, generationId),
    );
  }

  function startGalleryShowcaseSelection() {
    setCreatedShowcase(null);
    setShowcaseError(null);
    setShowcaseStatus(null);
    setSelectingShowcase((current) => !current);
  }

  async function createShowcaseFromGallery() {
    setCreatingShowcase(true);
    setShowcaseError(null);
    setShowcaseStatus(null);

    try {
      const response = await fetch("/api/showcases", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          generationIds: showcaseSelection,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Could not create showcase.");
      }

      setCreatedShowcase((await response.json()) as CreateShowcaseResponse);
    } catch (error) {
      setShowcaseError(
        error instanceof Error ? error.message : "Could not create showcase.",
      );
    } finally {
      setCreatingShowcase(false);
    }
  }

  async function copyShowcaseLink() {
    if (!createdShowcase || typeof window === "undefined") {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        new URL(createdShowcase.publicPath, window.location.origin).toString(),
      );
      setShowcaseStatus("Showcase link copied.");
    } catch {
      setShowcaseError("Could not copy the showcase link.");
    }
  }

  function shareShowcaseToWhatsapp() {
    if (!createdShowcase || typeof window === "undefined") {
      return;
    }

    const showcaseUrl = new URL(
      createdShowcase.publicPath,
      window.location.origin,
    ).toString();
    window.open(
      `https://wa.me/?text=${encodeURIComponent(buildShowcaseWhatsappShareText(showcaseUrl))}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  const createdShowcaseUrl =
    createdShowcase && typeof window !== "undefined"
      ? new URL(createdShowcase.publicPath, window.location.origin).toString()
      : createdShowcase?.publicPath;
  const showcaseWhatsappText = createdShowcaseUrl
    ? buildShowcaseWhatsappShareText(createdShowcaseUrl)
    : null;

  return (
    <div className="app-shell">
      <SidebarNav />
      <main className="app-main">
        <div className="app-content">
          <header className="gallery-header">
            <div className="gallery-heading">
              <h1 className="gallery-title">Gallery</h1>
              <p className="gallery-subtitle">
                {!loading && generations.length > 0
                  ? `${generations.length} catalog image${generations.length === 1 ? "" : "s"} ready`
                  : "Generated catalog images, ready to share."}
              </p>
            </div>
            {!loading && generations.length > 0 ? (
              <div className="gallery-header-actions">
                {filteredGenerations.length !== generations.length ? (
                  <span className="gallery-count">
                    {filteredGenerations.length} shown
                  </span>
                ) : null}
                <button
                  aria-label={selectingShowcase ? "Cancel collection selection" : "Select images for collection"}
                  className={`gallery-showcase-toggle${selectingShowcase ? " active" : ""}`}
                  type="button"
                  onClick={startGalleryShowcaseSelection}
                >
                  <Icon name={selectingShowcase ? "x" : "link"} size={15} />
                  {selectingShowcase ? "Cancel" : "Collection"}
                </button>
              </div>
            ) : null}
          </header>

          {loading && (
            <div className="gallery-skeleton-grid" aria-label="Loading gallery">
              {Array.from({ length: 9 }).map((_, index) => (
                <div className="gallery-skeleton" key={index} />
              ))}
            </div>
          )}

          {!loading && generations.length === 0 && (
            <div className="gallery-empty-state">
              <Icon name="image" size={32} />
              <p>No images yet</p>
              <Link href="/upload" className="gallery-create-btn">
                Create your first
              </Link>
            </div>
          )}

          {!loading && generations.length > 0 && (
            <>
              <section className="gallery-filters" aria-label="Gallery filters">
                <div className="gallery-filter-row gallery-item-filters">
                  <button
                    className={`gallery-filter-chip${itemFilter === "all" ? " active" : ""}`}
                    onClick={() => setItemFilter("all")}
                    type="button"
                  >
                    All items
                  </button>
                  {itemFilters.map((item) => (
                    <button
                      className={`gallery-filter-chip${itemFilter === item ? " active" : ""}`}
                      key={item}
                      onClick={() => setItemFilter(item)}
                      type="button"
                    >
                      {formatItem(item)}
                    </button>
                  ))}
                </div>
                <div className="gallery-filter-toolbar">
                  <span>Date</span>
                  <div className="gallery-date-filters">
                    {dateFilters.map((filter) => (
                      <button
                        className={`gallery-date-chip${dateFilter === filter.value ? " active" : ""}`}
                        key={filter.value}
                        onClick={() => setDateFilter(filter.value)}
                        type="button"
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {filteredGenerations.length === 0 ? (
                <div className="gallery-empty-state gallery-filter-empty">
                  <Icon name="search" size={28} />
                  <p>No images match these filters</p>
                  <button className="gallery-create-btn" onClick={resetFilters} type="button">
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="gallery-grid">
                  {filteredGenerations.map((g) => {
                    const itemLabel = formatItem(g.generation_brief?.jewelryType);
                    const generatedAt = getGenerationTime(g);

                    const selectedForShowcase = showcaseSelection.includes(g.id);
                    const content = (
                      <>
                        <div className="gallery-thumb">
                          {g.output_object_key ? (
                            <CachedImage
                              alt={`${itemLabel} generated image`}
                              cacheVersion={g.output_object_key}
                              className="gallery-thumb-img"
                              fallback={
                                <span className="gallery-thumb-fallback">
                                  <Icon name="image" size={24} />
                                </span>
                              }
                              loading="lazy"
                              src={`/api/generations/${g.id}/preview`}
                            />
                          ) : (
                            <span className="gallery-thumb-fallback">
                              <Icon name="image" size={24} />
                            </span>
                          )}
                          {selectingShowcase ? (
                            <span
                              className={`gallery-showcase-check${selectedForShowcase ? " selected" : ""}`}
                            >
                              {selectedForShowcase ? <Icon name="check" size={15} /> : null}
                            </span>
                          ) : null}
                          {g.overlay_text ? (
                            <span className="gallery-overlay-pill">
                              {g.overlay_text.purity} · {g.overlay_text.weightGm}gm
                            </span>
                          ) : null}
                        </div>
                        <span className="gallery-item-label">{itemLabel}</span>
                        <span className="gallery-item-meta">
                          {formatShortDate(generatedAt)} · {formatMode(g.mode)}
                        </span>
                      </>
                    );

                    return (
                      <button
                        aria-label={
                          selectingShowcase
                            ? `${selectedForShowcase ? "Remove" : "Add"} ${itemLabel} ${formatShortDate(generatedAt)} from collection`
                            : `Open ${itemLabel} result from ${formatShortDate(generatedAt)}`
                        }
                        aria-pressed={selectingShowcase ? selectedForShowcase : undefined}
                        className={`gallery-item gallery-select-item${selectedForShowcase ? " selected" : ""}`}
                        key={g.id}
                        type="button"
                        onClick={() => {
                          if (selectingShowcase) {
                            toggleShowcaseSelection(g.id);
                            return;
                          }

                          router.push(buildResultPagePath(g.id));
                        }}
                      >
                        {content}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
        {selectingShowcase ? (
          <div className="gallery-showcase-bar">
            <div className="gallery-showcase-bar-copy">
              <strong>{showcaseSelection.length} selected</strong>
              <span>Choose up to {MAX_SHOWCASE_ITEMS} designs</span>
            </div>
            <button
              className="button gold"
              disabled={creatingShowcase || showcaseSelection.length === 0}
              type="button"
              onClick={createShowcaseFromGallery}
            >
              {creatingShowcase ? "Creating..." : "Generate link"}
            </button>
          </div>
        ) : null}
        {createdShowcase ? (
          <div className="showcase-modal-backdrop" role="presentation">
            <section
              aria-labelledby="gallery-showcase-title"
              aria-modal="true"
              className="showcase-modal"
              role="dialog"
            >
              <div className="showcase-modal-head">
                <div>
                  <p className="eyebrow">Collection ready</p>
                  <h2 id="gallery-showcase-title">Share your collection</h2>
                </div>
                <button
                  aria-label="Close gallery showcase share"
                  className="showcase-icon-button"
                  type="button"
                  onClick={() => setCreatedShowcase(null)}
                >
                  <Icon name="x" size={18} />
                </button>
              </div>
              <div className="showcase-share-panel">
                <div className="showcase-share-summary">
                  <strong>{createdShowcase.title}</strong>
                  <span>{showcaseSelection.length} selected design{showcaseSelection.length === 1 ? "" : "s"}</span>
                </div>
                <button
                  className="button whatsapp showcase-share-whatsapp"
                  type="button"
                  onClick={shareShowcaseToWhatsapp}
                >
                  <img alt="" className="showcase-whatsapp-logo" src="/icons/whatsapp.svg" />
                  Share on WhatsApp
                </button>
                {showcaseWhatsappText ? (
                  <div className="showcase-message-preview">
                    <span>WhatsApp message</span>
                    <p>{showcaseWhatsappText}</p>
                  </div>
                ) : null}
                <div className="showcase-share-actions">
                  <button
                    className="button secondary"
                    type="button"
                    onClick={copyShowcaseLink}
                  >
                    <Icon name="check" size={16} />
                    Copy link
                  </button>
                  <a
                    className="button gold"
                    href={createdShowcase.publicPath}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <Icon name="arrow-right" size={16} />
                    Open
                  </a>
                </div>
                {showcaseStatus ? <p className="status-text">{showcaseStatus}</p> : null}
              </div>
            </section>
          </div>
        ) : null}
        {showcaseError ? (
          <div className="gallery-showcase-error" role="status">
            {showcaseError}
          </div>
        ) : null}
        <BottomNav />
      </main>
    </div>
  );
}
