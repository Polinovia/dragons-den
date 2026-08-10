import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dragon's Den",
    short_name: "Dragon's Den",
    description: "A cozy, private space for unfinished ideas — sketches, stories, and thoughts shared among friends.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf6ee",
    theme_color: "#b0532e",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
