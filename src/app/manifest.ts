import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Circlo",
    short_name: "Circlo",
    description: "Bagikan lokasi realtime dengan teman",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2563eb",
    icons: [
      { src: "/pwa-icon?size=192", sizes: "192x192", type: "image/png" },
      { src: "/pwa-icon?size=512", sizes: "512x512", type: "image/png" },
    ],
  };
}
