"use client";

import type {
  ListShowcasesResponse,
  UpdateShowcaseResponse,
} from "@ornava/shared";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CollectionNameDialog } from "@/components/CollectionNameDialog";
import { Icon } from "@/components/Icon";
import { BottomNav } from "@/components/BottomNav";
import { SidebarNav } from "@/components/SidebarNav";
import {
  buildShowcaseWhatsappShareText,
  formatShowcaseSummaryMeta,
} from "@/lib/showcase";

type ActiveBatch = {
  batchId: string;
  status: string;
  imageCount: number;
  completedCount: number;
  generatedCount: number;
};

type CollectionSummary = ListShowcasesResponse["showcases"][number];

export default function DashboardPage() {
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [collectionStatus, setCollectionStatus] = useState<string | null>(null);
  const [collectionActionError, setCollectionActionError] =
    useState<string | null>(null);
  const [renamingCollection, setRenamingCollection] =
    useState<CollectionSummary | null>(null);
  const [savingCollection, setSavingCollection] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletingCollectionId, setDeletingCollectionId] =
    useState<string | null>(null);
  const [collectionsExpanded, setCollectionsExpanded] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [activeBatch, setActiveBatch] = useState<ActiveBatch | null>(null);

  useEffect(() => {
    fetch("/api/showcases").then((r) => r.json()).then((d: ListShowcasesResponse) => setCollections(d.showcases ?? [])).catch(() => {});
    fetch("/api/profile").then((r) => r.json()).then((d) => setCredits(d.credits ?? 0));
    fetch("/api/batches/active").then((r) => r.json()).then((d) => { if (d.batch) setActiveBatch(d.batch); }).catch(() => {});
  }, []);

  function collectionAbsoluteUrl(collection: CollectionSummary) {
    return new URL(collection.publicPath, globalThis.location.origin).toString();
  }

  async function saveCollectionName(title: string) {
    if (!renamingCollection) {
      return;
    }

    if (title === renamingCollection.title) {
      setRenamingCollection(null);
      return;
    }

    setSavingCollection(true);
    setCollectionActionError(null);
    setCollectionStatus(null);

    try {
      const response = await fetch(
        `/api/showcases/${renamingCollection.showcaseId}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ title }),
        },
      );

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Could not rename collection.");
      }

      const updated = (await response.json()) as UpdateShowcaseResponse;
      setCollections((current) =>
        current.map((item) =>
          item.showcaseId === updated.showcaseId ? updated : item,
        ),
      );
      setRenamingCollection(null);
      setCollectionStatus("Collection renamed.");
    } catch (error) {
      setCollectionActionError(
        error instanceof Error ? error.message : "Could not rename collection.",
      );
    } finally {
      setSavingCollection(false);
    }
  }

  async function deleteCollection(collection: CollectionSummary) {
    setDeletingCollectionId(collection.showcaseId);
    setCollectionStatus("Deleting collection...");

    try {
      const response = await fetch(`/api/showcases/${collection.showcaseId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Could not delete collection.");
      }

      setCollections((current) =>
        current.filter((item) => item.showcaseId !== collection.showcaseId),
      );
      setDeleteConfirmId(null);
      setCollectionStatus("Collection deleted.");
    } catch (error) {
      setCollectionStatus(
        error instanceof Error ? error.message : "Could not delete collection.",
      );
    } finally {
      setDeletingCollectionId(null);
    }
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
            <button
              aria-expanded={collectionsExpanded}
              className="dash-collections-toggle"
              type="button"
              onClick={() => setCollectionsExpanded((current) => !current)}
            >
              <div>
                <strong>Collections</strong>
                <span>
                  {collections.length > 0
                    ? `${collections.length} buyer-ready link${
                        collections.length === 1 ? "" : "s"
                      }`
                    : "No saved links yet"}
                </span>
              </div>
              <span className="dash-collections-toggle-meta">
                <span className="dash-count">{collections.length}</span>
                <Icon
                  className={
                    collectionsExpanded
                      ? "dash-collections-chevron open"
                      : "dash-collections-chevron"
                  }
                  name="arrow-right"
                  size={15}
                />
              </span>
            </button>
            {collectionStatus ? (
              <p className="dash-collection-status">{collectionStatus}</p>
            ) : null}
            {collections.length > 0 && collectionsExpanded ? (
              <div className="dash-collection-list">
                {collections.map((collection) => (
                  <article
                    className="dash-collection-card"
                    key={collection.showcaseId}
                  >
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
                      <button
                        aria-label={`Share ${collection.title}`}
                        className="dash-collection-icon-action primary"
                        type="button"
                        onClick={() => shareCollection(collection)}
                      >
                        <Icon name="share" size={15} />
                      </button>
                      <Link
                        aria-label={`Open ${collection.title}`}
                        className="dash-collection-icon-action"
                        href={collection.publicPath as import("next").Route}
                      >
                        <Icon name="arrow-right" size={16} />
                      </Link>
                      <button
                        aria-label={`Rename ${collection.title}`}
                        className="dash-collection-icon-action"
                        type="button"
                        onClick={() => {
                          setCollectionActionError(null);
                          setRenamingCollection(collection);
                        }}
                      >
                        <Icon name="edit" size={16} />
                      </button>
                      <button
                        aria-label={`Delete ${collection.title}`}
                        className="dash-collection-icon-action danger"
                        type="button"
                        onClick={() =>
                          setDeleteConfirmId((current) =>
                            current === collection.showcaseId
                              ? null
                              : collection.showcaseId,
                          )
                        }
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    </span>
                    {deleteConfirmId === collection.showcaseId ? (
                      <span className="dash-collection-confirm">
                        <span>Delete this collection link?</span>
                        <button
                          className="dash-collection-mini"
                          disabled={deletingCollectionId === collection.showcaseId}
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                        >
                          Cancel
                        </button>
                        <button
                          className="dash-collection-mini danger"
                          disabled={deletingCollectionId === collection.showcaseId}
                          type="button"
                          onClick={() => void deleteCollection(collection)}
                        >
                          {deletingCollectionId === collection.showcaseId
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </span>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : null}
            {collections.length === 0 && collectionsExpanded ? (
              <div className="dash-collection-empty">
                Collections you create from Gallery will appear here.
              </div>
            ) : null}
          </section>
        </div>
        <CollectionNameDialog
          description="Keep names short so they scan well on WhatsApp."
          error={collectionActionError}
          eyebrow="Rename"
          initialValue={renamingCollection?.title ?? ""}
          open={Boolean(renamingCollection)}
          submitLabel="Save name"
          submitting={savingCollection}
          title="Rename collection"
          onClose={() => {
            if (!savingCollection) {
              setRenamingCollection(null);
              setCollectionActionError(null);
            }
          }}
          onSubmit={(title) => void saveCollectionName(title)}
        />
        <BottomNav />
      </main>
    </div>
  );
}
