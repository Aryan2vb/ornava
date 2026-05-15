"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "./Icon";

type Generation = {
  id: string;
  status: string;
  generation_brief: { jewelryType?: string };
  created_at: string;
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function GalleryPanel() {
  const [items, setItems] = useState<Generation[]>([]);

  useEffect(() => {
    fetch("/api/generations/history")
      .then((r) => r.json())
      .then((d) =>
        setItems((d.generations ?? []).filter((g: Generation) => g.status === "completed"))
      );
  }, []);

  return (
    <aside className="gallery-panel">
      <div className="gallery-panel-header">Recent</div>
      {items.length === 0 ? (
        <div className="gallery-panel-empty">
          <Icon name="image" size={28} />
          <span>No images yet</span>
        </div>
      ) : (
        <div className="gallery-panel-grid">
          {items.map((g) => (
            <Link key={g.id} href={`/result?generationId=${g.id}`} className="gallery-panel-item">
              <Icon name="image" size={20} />
              <span>{g.generation_brief?.jewelryType?.replace("_", " ") ?? "item"}</span>
              <span style={{ fontSize: 10, opacity: 0.6 }}>{timeAgo(g.created_at)}</span>
            </Link>
          ))}
        </div>
      )}
    </aside>
  );
}
