"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  feedback_rating: string | null;
  generation_duration_ms: number | null;
  created_at: string;
};

export default function GalleryPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="app-shell">
      <SidebarNav />
      <main className="app-main">
        <div className="app-content">
          <div className="gallery-header">
            <h1 className="gallery-title">Gallery</h1>
            <span className="gallery-count">{generations.length} images</span>
          </div>

          {loading && (
            <p className="gallery-empty">Loading...</p>
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
            <div className="gallery-grid">
              {generations.map((g) => (
                <Link
                  key={g.id}
                  href={`/result?generationId=${g.id}`}
                  className="gallery-item"
                >
                  <div className="gallery-thumb">
                    <Icon name="image" size={24} />
                  </div>
                  <span className="gallery-item-label">
                    {g.generation_brief?.jewelryType?.replace("_", " ") || g.mode.replace("_", " ")}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
        <BottomNav />
      </main>
    </div>
  );
}
