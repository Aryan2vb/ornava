"use client";

import type { CreateShowcaseResponse } from "@ornava/shared";
import { useEffect, useMemo, useState, useTransition } from "react";
import { shouldLoadShowcaseCandidates } from "@/lib/showcase";
import { Icon } from "./Icon";

type ShowcaseCandidate = {
  id: string;
  status: string;
  output_object_key: string | null;
  mode: string;
  generation_brief: {
    jewelryType?: string;
  };
  created_at: string;
};

async function postJson<TResponse>(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.error ?? "Request failed.");
  }

  return (await response.json()) as TResponse;
}

export function ShowcaseBuilder({ generationId }: { generationId: string }) {
  const [open, setOpen] = useState(false);
  const [candidates, setCandidates] = useState<ShowcaseCandidate[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([generationId]);
  const [created, setCreated] = useState<CreateShowcaseResponse | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [candidatesLoaded, setCandidatesLoaded] = useState(false);
  const [creating, startCreating] = useTransition();

  useEffect(() => {
    setSelectedIds([generationId]);
    setCandidates([]);
    setCandidatesLoaded(false);
    setCreated(null);
  }, [generationId]);

  useEffect(() => {
    if (
      !shouldLoadShowcaseCandidates({
        open,
        loaded: candidatesLoaded,
        loading: loadingCandidates,
      })
    ) {
      return;
    }

    let cancelled = false;
    setLoadingCandidates(true);
    setError(null);

    fetch("/api/generations/history")
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.error ?? "generation_history_unavailable");
        }

        return response.json();
      })
      .then((data) => {
        if (cancelled) {
          return;
        }

        setCandidates(
          ((data.generations ?? []) as ShowcaseCandidate[]).filter(
            (item) => item.status === "completed" && item.output_object_key,
          ),
        );
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load your recent completed images.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingCandidates(false);
          setCandidatesLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [candidatesLoaded, loadingCandidates, open]);

  const publicUrl = useMemo(() => {
    if (!created || typeof window === "undefined") {
      return null;
    }

    return new URL(created.publicPath, window.location.origin).toString();
  }, [created]);

  function toggleSelection(candidateId: string) {
    if (candidateId === generationId) {
      return;
    }

    setSelectedIds((current) =>
      current.includes(candidateId)
        ? current.filter((id) => id !== candidateId)
        : [...current, candidateId],
    );
  }

  function createShowcase() {
    setError(null);
    startCreating(() => {
      void postJson<CreateShowcaseResponse>("/api/showcases", {
        generationIds: selectedIds,
      })
        .then((response) => {
          setCreated(response);
          setShareStatus(null);
        })
        .catch((caught) => {
          setError(
            caught instanceof Error ? caught.message : "Could not create showcase.",
          );
        });
    });
  }

  async function copyLink() {
    if (!publicUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(publicUrl);
      setShareStatus("Showcase link copied.");
    } catch {
      setShareStatus("Copy failed. Open the showcase and share the address.");
    }
  }

  function shareToWhatsapp() {
    if (!publicUrl) {
      return;
    }

    const text = `New jewelry showcase from Ornava: ${publicUrl}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <>
      <button
        className="button gold result-cta-primary showcase-launch"
        type="button"
        onClick={() => setOpen(true)}
      >
        <Icon name="spark" size={20} />
        <span className="result-cta-content">
          <span className="result-cta-label">Create showcase link</span>
          <span className="result-cta-hint">Bundle designs for buyers on WhatsApp</span>
        </span>
      </button>

      {open ? (
        <div className="showcase-modal-backdrop" role="presentation">
          <section
            aria-labelledby="showcase-builder-title"
            aria-modal="true"
            className="showcase-modal"
            role="dialog"
          >
            <div className="showcase-modal-head">
              <div>
                <p className="eyebrow">Public showcase</p>
                <h2 id="showcase-builder-title">Share a buyer-ready collection</h2>
              </div>
              <button
                aria-label="Close showcase builder"
                className="showcase-icon-button"
                type="button"
                onClick={() => setOpen(false)}
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            {!created ? (
              <>
                <p className="copy">
                  This result is included first. Add more completed images before
                  creating the link.
                </p>
                <div className="showcase-picker-list">
                  {loadingCandidates ? (
                    <div className="showcase-picker-loading">
                      <span className="spinner" aria-hidden="true" />
                      Loading images...
                    </div>
                  ) : null}
                  {candidatesLoaded && candidates.length === 0 ? (
                    <div className="showcase-picker-empty">
                      No other completed designs are ready yet. You can still
                      create this showcase with the current result.
                    </div>
                  ) : null}
                  {candidates.map((candidate) => {
                    const selected = selectedIds.includes(candidate.id);
                    const locked = candidate.id === generationId;

                    return (
                      <button
                        aria-pressed={selected}
                        className={`showcase-picker-item ${selected ? "selected" : ""}`}
                        key={candidate.id}
                        type="button"
                        onClick={() => toggleSelection(candidate.id)}
                      >
                        <span className="showcase-picker-thumb">
                          <img
                            alt=""
                            loading="lazy"
                            src={`/api/generations/${candidate.id}/preview`}
                          />
                        </span>
                        <span className="showcase-picker-copy">
                          <strong>
                            {formatJewelryLabel(candidate.generation_brief?.jewelryType)}
                          </strong>
                          <span>{candidate.mode.replace("_", " ")}</span>
                        </span>
                        <span className="showcase-picker-check">
                          {locked ? "First" : selected ? <Icon name="check" size={15} /> : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <button
                  className="button showcase-create-button"
                  disabled={creating || selectedIds.length === 0}
                  type="button"
                  onClick={createShowcase}
                >
                  {creating ? <span className="spinner" aria-hidden="true" /> : <Icon name="spark" size={16} />}
                  {creating
                    ? "Creating showcase..."
                    : `Create link with ${selectedIds.length} design${selectedIds.length === 1 ? "" : "s"}`}
                </button>
              </>
            ) : (
              <div className="showcase-share-panel">
                <div className="showcase-share-link">
                  <span>{created.title}</span>
                  <strong>{publicUrl}</strong>
                </div>
                <button className="button whatsapp" type="button" onClick={shareToWhatsapp}>
                  <Icon name="whatsapp" size={18} />
                  Share showcase to WhatsApp
                </button>
                <div className="showcase-share-actions">
                  <button className="button secondary" type="button" onClick={copyLink}>
                    <Icon name="check" size={16} />
                    Copy link
                  </button>
                  <a
                    className="button gold"
                    href={created.publicPath}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <Icon name="arrow-right" size={16} />
                    Open
                  </a>
                </div>
                {shareStatus ? <p className="status-text">{shareStatus}</p> : null}
              </div>
            )}

            {error ? <p className="status-text error">{error}</p> : null}
          </section>
        </div>
      ) : null}
    </>
  );
}

function formatJewelryLabel(jewelryType?: string) {
  if (!jewelryType) {
    return "Jewelry design";
  }

  return jewelryType.replaceAll("_", " ");
}
