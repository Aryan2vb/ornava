import type { MetadataRoute } from "next";

export const pwaManifest: MetadataRoute.Manifest = {
  name: "Ornava",
  short_name: "Ornava",
  description: "AI-powered jewelry catalog image generator for Indian jewelers.",
  start_url: "/dashboard",
  scope: "/",
  display: "standalone",
  orientation: "portrait",
  background_color: "#F5F5DC",
  theme_color: "#1A1A1A",
  categories: ["business", "photo", "productivity"],
  icons: [
    {
      src: "/icons/ornava.svg",
      sizes: "any",
      type: "image/svg+xml",
      purpose: "any",
    },
    {
      src: "/icons/ornava.svg",
      sizes: "any",
      type: "image/svg+xml",
      purpose: "maskable",
    },
  ],
};
