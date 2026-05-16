"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { BottomNav } from "@/components/BottomNav";
import { SidebarNav } from "@/components/SidebarNav";

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

export default function DashboardPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [credits, setCredits] = useState<number | null>(null);
  const [activeBatch, setActiveBatch] = useState<ActiveBatch | null>(null);

  useEffect(() => {
    fetch("/api/generations/history").then((r) => r.json()).then((d) => setGenerations(d.generations ?? []));
    fetch("/api/profile").then((r) => r.json()).then((d) => setCredits(d.credits ?? 0));
    fetch("/api/batches/active").then((r) => r.json()).then((d) => { if (d.batch) setActiveBatch(d.batch); }).catch(() => {});
  }, []);

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
