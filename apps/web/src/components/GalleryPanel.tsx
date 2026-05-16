"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CachedImage } from "./CachedImage";
import { Icon } from "./Icon";

type Generation = {
  id: string;
  status: string;
  generation_brief: { jewelryType?: string };
  output_object_key: string | null;
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
              <span className="gallery-panel-thumb">
                {g.output_object_key ? (
                  <CachedImage
                    alt=""
                    cacheVersion={g.output_object_key}
                    fallback={<Icon name="image" size={18} />}
                    loading="lazy"
                    src={`/api/generations/${g.id}/preview`}
                  />
                ) : (
                  <Icon name="image" size={18} />
                )}
              </span>
              <span className="gallery-panel-copy">
                <span>{g.generation_brief?.jewelryType?.replace("_", " ") ?? "item"}</span>
                <span>{timeAgo(g.created_at)}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </aside>
  );
}
