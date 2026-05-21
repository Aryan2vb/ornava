"use client";

import type { ShowcaseActivityResponse } from "@ornava/shared";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { BottomNav } from "@/components/BottomNav";
import { SidebarNav } from "@/components/SidebarNav";
import { describeShowcaseViewer } from "@/lib/showcase";

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

type ShowcaseActivity = ShowcaseActivityResponse["activities"][number];

export default function DashboardPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [credits, setCredits] = useState<number | null>(null);
  const [activeBatch, setActiveBatch] = useState<ActiveBatch | null>(null);
  const [activity, setActivity] = useState<ShowcaseActivity[]>([]);
  const [activityToast, setActivityToast] = useState<ShowcaseActivity | null>(null);
  const activityReady = useRef(false);
  const latestActivityId = useRef<string | null>(null);

  useEffect(() => {
    fetch("/api/generations/history").then((r) => r.json()).then((d) => setGenerations(d.generations ?? []));
    fetch("/api/profile").then((r) => r.json()).then((d) => setCredits(d.credits ?? 0));
    fetch("/api/batches/active").then((r) => r.json()).then((d) => { if (d.batch) setActiveBatch(d.batch); }).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadActivity(allowToast: boolean) {
      try {
        const response = await fetch("/api/showcases/activity?limit=10");
        if (!response.ok) {
          return;
        }

        const body = (await response.json()) as ShowcaseActivityResponse;
        if (cancelled) {
          return;
        }

        const newest = body.activities[0];
        if (
          allowToast &&
          activityReady.current &&
          newest &&
          newest.id !== latestActivityId.current
        ) {
          setActivityToast(newest);
        }

        latestActivityId.current = newest?.id ?? null;
        activityReady.current = true;
        setActivity(body.activities);
      } catch {
        // Dashboard history remains usable if activity refresh fails.
      }
    }

    void loadActivity(false);
    const interval = window.setInterval(() => {
      void loadActivity(true);
    }, 15_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!activityToast) {
      return;
    }

    const timeout = window.setTimeout(() => setActivityToast(null), 6000);
    return () => window.clearTimeout(timeout);
  }, [activityToast]);

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

          <RecentShowcaseActivity activity={activity} />

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
        {activityToast ? (
          <div className="showcase-activity-toast" role="status">
            <span className="showcase-live-dot" aria-hidden="true" />
            {formatActivityMessage(activityToast)}
          </div>
        ) : null}
        <BottomNav />
      </main>
    </div>
  );
}

function RecentShowcaseActivity({ activity }: { activity: ShowcaseActivity[] }) {
  return (
    <section className="showcase-activity-panel" aria-label="Recent showcase activity">
      <div className="showcase-activity-head">
        <div>
          <p className="eyebrow">Recent activity</p>
          <strong>Buyer showcase views</strong>
        </div>
        <span className="showcase-live-pill">
          <span className="showcase-live-dot" aria-hidden="true" />
          Live
        </span>
      </div>
      {activity.length === 0 ? (
        <p className="copy">Share a showcase link to see buyer views here.</p>
      ) : (
        <div className="showcase-activity-list">
          {activity.map((item) => (
            <article className="showcase-activity-item" key={item.id}>
              <span className="showcase-activity-bell">
                <Icon name="spark" size={15} />
              </span>
              <div>
                <p>{formatActivityMessage(item)}</p>
                <span>{formatRelativeTime(item.viewedAt)}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function formatActivityMessage(item: ShowcaseActivity) {
  const viewer = describeShowcaseViewer({
    deviceInfo: item.deviceInfo,
    viewerLocation: item.viewerLocation,
  });
  const viewedItem = item.jewelryType?.replaceAll("_", " ");

  return viewedItem
    ? `${viewer} viewed ${viewedItem} in your ${item.showcaseTitle} showcase`
    : `${viewer} viewed your ${item.showcaseTitle} showcase`;
}

function formatRelativeTime(date: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 1000));

  if (seconds < 60) {
    return "just now";
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  return `${Math.floor(hours / 24)}d ago`;
}

function StatusBadge({ status, rating }: { status: string; rating: string | null }) {
  if (status === "completed" && rating === "usable") return <span className="status-pill"><Icon name="check" size={12} /> Usable</span>;
  if (status === "completed" && rating === "not_usable") return <span className="status-pill" style={{ background: "#fee", color: "#c33" }}>Not usable</span>;
  if (status === "completed") return <span className="status-pill">Done</span>;
  if (status === "failed") return <span className="status-pill" style={{ background: "#fee", color: "#c33" }}>Failed</span>;
  return <span className="status-text"><span className="pulse-dot" />{status === "queued" ? "Queued" : "Running"}</span>;
}
