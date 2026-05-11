"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { BottomNav } from "@/components/BottomNav";

type Generation = {
  id: string;
  image_id: string;
  mode: string;
  status: string;
  generation_brief: { jewelryType?: string };
  output_object_key: string | null;
  feedback_rating: string | null;
  feedback_reason: string | null;
  generation_duration_ms: number | null;
  created_at: string;
};

export default function DashboardPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/generations/history").then((r) => r.json()).then((d) => setGenerations(d.generations ?? []));
    fetch("/api/profile").then((r) => r.json()).then((d) => setCredits(d.credits ?? 0));
  }, []);

  return (
    <main className="screen">
      <section className="phone-frame">
        <div className="content">
          <div className="screen-header-row">
            <div className="screen-header">
              <h1 className="title">Ornava</h1>
              <p className="copy">WhatsApp-ready catalog images.</p>
            </div>
            <Link href="/profile" className="credit-pill" style={{ textDecoration: "none" }}>
              <Icon name="diamond" size={14} />
              {credits !== null ? `${credits} credits` : "..."}
            </Link>
          </div>

          <div className="soft-panel">
            <div className="screen-header-row">
              <div className="screen-header">
                <h2 className="title" style={{ fontSize: 22, lineHeight: "27px" }}>Create from a phone photo</h2>
                <p className="copy">Upload, choose style, and send the finished image to a buyer.</p>
              </div>
              <span className="icon-tile"><Icon name="camera" size={25} /></span>
            </div>
            <Link className="button" href="/upload">
              <Icon name="plus" size={17} />
              Start new image
            </Link>
          </div>

          <div className="screen-header-row" style={{ marginTop: "16px" }}>
            <strong style={{ fontSize: 17, lineHeight: "23px" }}>Recent work</strong>
            <span className="copy" style={{ fontSize: "13px" }}>{generations.length} generations</span>
          </div>

          {generations.length === 0 && (
            <p className="copy" style={{ textAlign: "center", padding: "24px 0" }}>No generations yet. Start your first one!</p>
          )}

          {generations.map((g) => (
            <Link
              key={g.id}
              href={g.status === "completed" ? `/result?generationId=${g.id}` : "#"}
              className="row-card"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <span className="icon-tile" style={{ width: 58, height: 58 }}>
                <Icon name={g.status === "completed" ? "image" : g.status === "failed" ? "x" : "spark"} size={25} />
              </span>
              <div className="row-card-body">
                <span className="row-title">{g.generation_brief?.jewelryType?.replace("_", " ") || g.mode}</span>
                <span className="row-subtitle">
                  {g.mode.replace("_", " ")}
                  {g.generation_duration_ms ? ` · ${Math.round(g.generation_duration_ms / 1000)}s` : ""}
                  {" · "}{new Date(g.created_at).toLocaleDateString()}
                </span>
              </div>
              <StatusBadge status={g.status} rating={g.feedback_rating} reason={g.feedback_reason} />
            </Link>
          ))}
        </div>
        <BottomNav />
      </section>
    </main>
  );
}

function StatusBadge({ status, rating, reason }: { status: string; rating: string | null; reason: string | null }) {
  if (status === "completed" && rating === "usable") {
    return <span className="status-pill"><Icon name="check" size={13} /> Usable</span>;
  }
  if (status === "completed" && rating === "not_usable") {
    return <span className="status-pill" style={{ background: "#fee", color: "#c33" }}>{reason?.replace(/_/g, " ") || "Not usable"}</span>;
  }
  if (status === "completed") {
    return <span className="status-pill">Done</span>;
  }
  if (status === "failed") {
    return <span className="status-pill" style={{ background: "#fee", color: "#c33" }}>Failed</span>;
  }
  return (
    <span className="status-text">
      <span className="pulse-dot" aria-hidden="true" />
      {status === "queued" ? "Queued" : "Running"}
    </span>
  );
}
