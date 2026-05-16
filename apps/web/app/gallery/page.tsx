"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { OverlayText } from "@ornava/shared";
import { CachedImage } from "@/components/CachedImage";
import { Icon } from "@/components/Icon";
import { SidebarNav } from "@/components/SidebarNav";
import { BottomNav } from "@/components/BottomNav";

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
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [itemFilter, setItemFilter] = useState("all");

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

  return (
    <div className="app-shell">
      <SidebarNav />
      <main className="app-main">
        <div className="app-content">
          <header className="gallery-header">
            <div>
              <h1 className="gallery-title">Gallery</h1>
              <p className="gallery-subtitle">Generated catalog images, ready to share.</p>
            </div>
            <span className="gallery-count">
              {filteredGenerations.length} of {generations.length}
            </span>
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
                <div className="gallery-filter-row">
                  {dateFilters.map((filter) => (
                    <button
                      className={`gallery-filter-chip${dateFilter === filter.value ? " active" : ""}`}
                      key={filter.value}
                      onClick={() => setDateFilter(filter.value)}
                      type="button"
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
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

                    return (
                      <Link
                        key={g.id}
                        href={`/result?generationId=${g.id}`}
                        className="gallery-item"
                      >
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
                      </Link>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
        <BottomNav />
      </main>
    </div>
  );
}
