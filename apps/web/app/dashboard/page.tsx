"use client";

import type {
  ListShowcasesResponse,
  UpdateShowcaseResponse,
} from "@ornava/shared";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { BottomNav } from "@/components/BottomNav";
import { SidebarNav } from "@/components/SidebarNav";
import {
  buildShowcaseWhatsappShareText,
  formatShowcaseSummaryMeta,
} from "@/lib/showcase";

type Generation = {
  id: string;
  mode: string;
  status: string;
  generation_brief: { jewelryType?: string };
  feedback_rating: string | null;
  feedback_reason: string | null;
  generation_duration_ms: number | null;
  created_at: string;
};

type ActiveBatch = {
  batchId: string;
  status: string;
  imageCount: number;
  completedCount: number;
  generatedCount: number;
};

type CollectionSummary = ListShowcasesResponse["showcases"][number];

export default function DashboardPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [collectionStatus, setCollectionStatus] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [activeBatch, setActiveBatch] = useState<ActiveBatch | null>(null);

  useEffect(() => {
    fetch("/api/generations/history").then((r) => r.json()).then((d) => setGenerations(d.generations ?? []));
    fetch("/api/showcases").then((r) => r.json()).then((d: ListShowcasesResponse) => setCollections(d.showcases ?? [])).catch(() => {});
    fetch("/api/profile").then((r) => r.json()).then((d) => setCredits(d.credits ?? 0));
    fetch("/api/batches/active").then((r) => r.json()).then((d) => { if (d.batch) setActiveBatch(d.batch); }).catch(() => {});
  }, []);

  function collectionAbsoluteUrl(collection: CollectionSummary) {
    return new URL(collection.publicPath, globalThis.location.origin).toString();
  }

  async function renameCollection(collection: CollectionSummary) {
    const title = globalThis.prompt("Collection name", collection.title)?.trim();

    if (!title || title === collection.title) {
      return;
    }

    setCollectionStatus("Saving collection name...");
    const response = await fetch(`/api/showcases/${collection.showcaseId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      setCollectionStatus("Could not rename collection.");
      return;
    }

    const updated = (await response.json()) as UpdateShowcaseResponse;
    setCollections((current) =>
      current.map((item) =>
        item.showcaseId === updated.showcaseId ? updated : item,
      ),
    );
    setCollectionStatus("Collection renamed.");
  }

  async function deleteCollection(collection: CollectionSummary) {
    const confirmed = globalThis.confirm(
      `Delete "${collection.title}"? This will not delete generated images.`,
    );

    if (!confirmed) {
      return;
    }

    setCollectionStatus("Deleting collection...");
    const response = await fetch(`/api/showcases/${collection.showcaseId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setCollectionStatus("Could not delete collection.");
      return;
    }

    setCollections((current) =>
      current.filter((item) => item.showcaseId !== collection.showcaseId),
    );
    setCollectionStatus("Collection deleted.");
  }

  function shareCollection(collection: CollectionSummary) {
    const text = buildShowcaseWhatsappShareText(collectionAbsoluteUrl(collection));
    globalThis.location.href = `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  return (
    <div className="app-shell">
      <SidebarNav />
      <main className="app-main">
        <div className="app-content">
          {/* Header */}
          <div className="dash-header">
            <div>
              <h1 className="dash-title">Dashboard</h1>
              <p className="dash-sub">WhatsApp-ready catalog images</p>
            </div>
            <div className="dash-header-actions">
              <Link href="/profile" className="credit-pill" style={{ textDecoration: "none" }}>
                <Icon name="diamond" size={14} />
                {credits !== null ? `${credits} credits` : "—"}
              </Link>
              <Link href="/upload" className="dash-create-btn">
                <Icon name="plus" size={16} />
                New image
              </Link>
            </div>
          </div>

          {/* Active batch resume card */}
          {activeBatch && (
            <Link
              href={(
                activeBatch.status === "generating"
                  ? `/batch?batchId=${activeBatch.batchId}`
                  : `/upload`
              ) as import("next").Route}
              className="dash-card"
              style={{ background: "#fff8e1", border: "1px solid #f9a825" }}
            >
              <div className="dash-card-thumb">
                <Icon name="image" size={24} />
              </div>
              <div className="dash-card-info">
                <span className="dash-card-title">
                  {activeBatch.status === "generating"
                    ? `Batch generating (${activeBatch.completedCount}/${activeBatch.generatedCount})`
                    : `${activeBatch.imageCount} images ready`}
                </span>
                <span className="dash-card-meta">
                  {activeBatch.status === "generating" ? "Tap to review progress" : "Tap to review, remove, or add"}
                </span>
              </div>
              <span className="status-pill">Resume</span>
            </Link>
          )}

          <section className="dash-collections" aria-label="Collections">
            <div className="dash-section-header">
              <strong>Collections</strong>
              <span className="dash-count">{collections.length}</span>
            </div>
            {collectionStatus ? (
              <p className="dash-collection-status">{collectionStatus}</p>
            ) : null}
            {collections.length > 0 ? (
              <div className="dash-collection-list">
                {collections.map((collection) => (
                  <article
                    className="dash-collection-card"
                    key={collection.showcaseId}
                  >
                    <span className="dash-collection-mark">
                      <Icon name="image" size={18} />
                    </span>
                    <span className="dash-collection-copy">
                      <strong>{collection.title}</strong>
                      <span>
                        {formatShowcaseSummaryMeta({
                          itemCount: collection.itemCount,
                          createdAt: collection.createdAt,
                        })}
                      </span>
                    </span>
                    <span className="dash-collection-actions">
                      <Link
                        className="dash-collection-action"
                        href={collection.publicPath as import("next").Route}
                      >
                        Open
                      </Link>
                      <button
                        className="dash-collection-action"
                        type="button"
                        onClick={() => shareCollection(collection)}
                      >
                        Share
                      </button>
                      <button
                        className="dash-collection-action"
                        type="button"
                        onClick={() => void renameCollection(collection)}
                      >
                        Rename
                      </button>
                      <button
                        className="dash-collection-action danger"
                        type="button"
                        onClick={() => void deleteCollection(collection)}
                      >
                        Delete
                      </button>
                    </span>
                  </article>
                ))}
              </div>
            ) : (
              <div className="dash-collection-empty">
                Collections you create from Gallery will appear here.
              </div>
            )}
          </section>

          {/* Create CTA — shown when no generations */}
          {generations.length === 0 && (
            <div className="dash-empty">
              <Icon name="camera" size={32} />
              <p>No images yet</p>
              <Link href="/upload" className="dash-create-btn">
                <Icon name="plus" size={16} />
                Create your first image
              </Link>
            </div>
          )}

          {/* Generations grid */}
          {generations.length > 0 && (
            <>
              <div className="dash-section-header">
                <strong>Recent</strong>
                <span className="dash-count">{generations.length}</span>
              </div>
              <div className="dash-grid">
                {generations.map((g) => (
                  <Link
                    key={g.id}
                    href={g.status === "completed" ? `/result?generationId=${g.id}` : "#"}
                    className="dash-card"
                  >
                    <div className="dash-card-thumb">
                      <Icon
                        name={g.status === "completed" ? "image" : g.status === "failed" ? "x" : "spark"}
                        size={24}
                      />
                    </div>
                    <div className="dash-card-info">
                      <span className="dash-card-title">
                        {g.generation_brief?.jewelryType?.replace("_", " ") || g.mode.replace("_", " ")}
                      </span>
                      <span className="dash-card-meta">
                        {g.mode.replace("_", " ")} · {new Date(g.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <StatusBadge status={g.status} rating={g.feedback_rating} />
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
        <BottomNav />
      </main>
    </div>
  );
}

function StatusBadge({ status, rating }: { status: string; rating: string | null }) {
  if (status === "completed" && rating === "usable") return <span className="status-pill"><Icon name="check" size={12} /> Usable</span>;
  if (status === "completed" && rating === "not_usable") return <span className="status-pill" style={{ background: "#fee", color: "#c33" }}>Not usable</span>;
  if (status === "completed") return <span className="status-pill">Done</span>;
  if (status === "failed") return <span className="status-pill" style={{ background: "#fee", color: "#c33" }}>Failed</span>;
  return <span className="status-text"><span className="pulse-dot" />{status === "queued" ? "Queued" : "Running"}</span>;
}
