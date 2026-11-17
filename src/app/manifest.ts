import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Circlo",
    short_name: "Circlo",
    description: "Bagikan lokasi realtime dengan teman",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#a3e635",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
